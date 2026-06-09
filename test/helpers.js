"use strict";

// Test helpers for the Redis Tools SC module.
//
// redis_tools.js is a Wappler Server Connect module. It is not a normal
// importable library: it (1) requires framework-internal paths that only exist
// inside a Wappler install ("../../../lib/core/path" and
// "../../../app/config/pii-fields.json"), and (2) binds its Redis client at
// require() time from either ioredis (when REDIS_HOST is set) or
// global.redisClient. Its action functions are then invoked with a `this`
// context that provides a `parse()` method.
//
// These helpers reproduce that runtime so the module can be tested in
// isolation, with no real Redis server and no Wappler framework on disk.

const Module = require("module");
const path = require("path");

const MODULE_PATH = path.resolve(__dirname, "../server_connect/redis_tools.js");

// The pii-fields.json config the module should see for the *next* load.
// `undefined` simulates the file being absent (require throws -> config null).
let piiConfigMock = undefined;

function setPiiConfig(cfg) {
  piiConfigMock = cfg;
}

// Intercept the framework-internal requires so the module loads off-Wappler.
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "../../../lib/core/path") {
    // Only toSystemPath is imported; it is unused by the tested actions.
    return { toSystemPath: (p) => p };
  }
  if (request === "../../../app/config/pii-fields.json") {
    if (piiConfigMock === undefined) {
      const err = new Error(
        "Cannot find module '../../../app/config/pii-fields.json'"
      );
      err.code = "MODULE_NOT_FOUND";
      throw err;
    }
    return piiConfigMock;
  }
  return originalLoad.apply(this, arguments);
};

// Load a fresh copy of the module with a given Redis client bound via the
// global.redisClient code path (REDIS_HOST unset). Clears the require cache so
// the module-level client binding re-runs on every load.
function loadModule({ redisClient } = {}) {
  delete process.env.REDIS_HOST;
  global.redisClient = redisClient;
  delete require.cache[MODULE_PATH];
  return require(MODULE_PATH);
}

// A `this` context mimicking Wappler's. By default parse() is identity, which
// is the realistic behavior for plain string/number inputs.
function makeContext(parse) {
  return { parse: parse || ((v) => v) };
}

// An in-memory fake of the subset of the ioredis API the module uses. Records
// every call in `.calls` for assertions. ioredis methods return promises and
// also accept an optional Node-style callback; this fake honors both, matching
// how redis_insert / redis_log_insert call set()/rpush() with a callback while
// also awaiting the result.
function createFakeRedis(overrides = {}) {
  const store = new Map(); // string keys
  const lists = new Map(); // list keys -> array
  const calls = [];

  const fake = {
    store,
    lists,
    calls,

    async get(key) {
      calls.push(["get", key]);
      return store.has(key) ? store.get(key) : null;
    },

    async set(key, value, cb) {
      calls.push(["set", key, value]);
      store.set(key, value);
      if (typeof cb === "function") cb(null, "OK");
      return "OK";
    },

    async del(...keys) {
      // ioredis del returns the number of keys removed.
      let cb;
      if (typeof keys[keys.length - 1] === "function") cb = keys.pop();
      calls.push(["del", ...keys]);
      let removed = 0;
      for (const k of keys) {
        if (store.delete(k)) removed++;
        if (lists.delete(k)) removed++;
      }
      if (typeof cb === "function") cb(null, removed);
      return removed;
    },

    async ping() {
      calls.push(["ping"]);
      return "PONG";
    },

    async rpush(key, value, cb) {
      calls.push(["rpush", key, value]);
      if (!lists.has(key)) lists.set(key, []);
      lists.get(key).push(value);
      const len = lists.get(key).length;
      if (typeof cb === "function") cb(null, len);
      return len;
    },
  };

  return Object.assign(fake, overrides);
}

// Silences console.log/console.error for the duration of a test. The module
// under test logs on its error-handling branches (e.g. redis_query's catch,
// loadPiiConfig's missing-config path); tests that deliberately exercise those
// branches use this to keep the runner output clean. Returns a restore fn.
function silenceConsole() {
  const origLog = console.log;
  const origError = console.error;
  console.log = () => {};
  console.error = () => {};
  return () => {
    console.log = origLog;
    console.error = origError;
  };
}

module.exports = {
  MODULE_PATH,
  loadModule,
  makeContext,
  createFakeRedis,
  setPiiConfig,
  silenceConsole,
};
