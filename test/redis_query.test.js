"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  loadModule,
  makeContext,
  createFakeRedis,
  silenceConsole,
} = require("./helpers");

let restoreConsole;
test.beforeEach(() => {
  restoreConsole = silenceConsole();
});
test.afterEach(() => restoreConsole());

test("redis_query parses and returns JSON-stored values", async () => {
  const redis = createFakeRedis();
  redis.store.set("user:1", JSON.stringify({ id: 1, name: "Ada" }));
  const mod = loadModule({ redisClient: redis });

  const result = await mod.redis_query.call(makeContext(), { key: "user:1" });

  assert.deepEqual(result, { id: 1, name: "Ada" });
  assert.deepEqual(redis.calls, [["get", "user:1"]]);
});

test("redis_query returns null untouched when the key is missing", async () => {
  const redis = createFakeRedis();
  const mod = loadModule({ redisClient: redis });

  // get() resolves to null; null is not a string, so it is returned as-is
  // (JSON.parse is skipped).
  const result = await mod.redis_query.call(makeContext(), { key: "absent" });

  assert.equal(result, null);
});

test("redis_query throws when the stored value is not valid JSON", async () => {
  const redis = createFakeRedis();
  redis.store.set("raw", "not-json");
  const mod = loadModule({ redisClient: redis });

  await assert.rejects(
    () => mod.redis_query.call(makeContext(), { key: "raw" }),
    /JSON/i
  );
});

test("redis_query throws on a missing/empty key", async () => {
  const redis = createFakeRedis();
  const mod = loadModule({ redisClient: redis });

  await assert.rejects(
    () => mod.redis_query.call(makeContext(), { key: "" }),
    /Invalid key/
  );
  // No Redis call should have been made for an invalid key.
  assert.equal(redis.calls.length, 0);
});

test("redis_query throws when no Redis client is available", async () => {
  const mod = loadModule({ redisClient: undefined });

  await assert.rejects(
    () => mod.redis_query.call(makeContext(), { key: "user:1" }),
    /Redis client is not available/
  );
});

test("redis_query uses this.parse to resolve the key binding", async () => {
  const redis = createFakeRedis();
  redis.store.set("resolved:key", JSON.stringify({ ok: true }));
  const mod = loadModule({ redisClient: redis });

  // Simulate a Wappler binding that parse() expands to the real key.
  const ctx = makeContext((v) => (v === "{{binding}}" ? "resolved:key" : v));
  const result = await mod.redis_query.call(ctx, { key: "{{binding}}" });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(redis.calls, [["get", "resolved:key"]]);
});
