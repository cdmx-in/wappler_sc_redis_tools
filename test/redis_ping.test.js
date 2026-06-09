"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadModule, makeContext, createFakeRedis } = require("./helpers");

test("redis_ping returns PONG from a healthy server", async () => {
  const redis = createFakeRedis();
  const mod = loadModule({ redisClient: redis });

  const result = await mod.redis_ping.call(makeContext(), { timeout: 1000 });

  assert.equal(result, "PONG");
  assert.deepEqual(redis.calls, [["ping"]]);
});

test("redis_ping rejects when the ping outlives the timeout", async () => {
  const redis = createFakeRedis({
    // Never resolves -> the timeout branch of Promise.race must win.
    ping() {
      return new Promise(() => {});
    },
  });
  const mod = loadModule({ redisClient: redis });

  await assert.rejects(
    () => mod.redis_ping.call(makeContext(), { timeout: 20 }),
    /timed out/
  );
});

test("redis_ping propagates an underlying ping failure", async () => {
  const redis = createFakeRedis({
    async ping() {
      throw new Error("connection refused");
    },
  });
  const mod = loadModule({ redisClient: redis });

  await assert.rejects(
    () => mod.redis_ping.call(makeContext(), { timeout: 1000 }),
    /connection refused/
  );
});

test("redis_ping throws when no Redis client is available", async () => {
  const mod = loadModule({ redisClient: undefined });

  await assert.rejects(
    () => mod.redis_ping.call(makeContext(), { timeout: 1000 }),
    /Redis client is not available/
  );
});

test("redis_ping falls back to the 5000ms default when timeout is absent", async () => {
  // A fast PONG should resolve well within the default window, proving the
  // default does not break the happy path.
  const redis = createFakeRedis();
  const mod = loadModule({ redisClient: redis });

  const result = await mod.redis_ping.call(makeContext(), {});

  assert.equal(result, "PONG");
});
