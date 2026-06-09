"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadModule, makeContext, createFakeRedis } = require("./helpers");

// `redis_delete` is declared in server_connect/redis_tools.hjson, documented in
// the README ("Redis Delete Data" -> { success: true, deleted }) and
// implemented in redis_tools.js. These tests pin that documented contract.

test("redis_delete returns the number of keys removed", async () => {
  const redis = createFakeRedis();
  redis.store.set("doomed", "x");
  const mod = loadModule({ redisClient: redis });

  const result = await mod.redis_delete.call(makeContext(), { key: "doomed" });

  assert.deepEqual(result, { success: true, deleted: 1 });
  assert.equal(redis.store.has("doomed"), false);
});

test("redis_delete reports deleted: 0 for a missing key", async () => {
  const redis = createFakeRedis();
  const mod = loadModule({ redisClient: redis });

  const result = await mod.redis_delete.call(makeContext(), { key: "absent" });

  assert.deepEqual(result, { success: true, deleted: 0 });
});

test("redis_delete throws on a missing key", async () => {
  const redis = createFakeRedis();
  const mod = loadModule({ redisClient: redis });

  await assert.rejects(
    () => mod.redis_delete.call(makeContext(), { key: "" }),
    /Invalid key/
  );
});

test("redis_delete throws when no Redis client is available", async () => {
  const mod = loadModule({ redisClient: undefined });

  await assert.rejects(
    () => mod.redis_delete.call(makeContext(), { key: "k" }),
    /Redis client is not available/
  );
});
