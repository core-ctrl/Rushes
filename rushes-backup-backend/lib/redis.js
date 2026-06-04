let redis = null;

function getRedis() {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.warn("Redis initialisation failed — caching disabled:", e.message);
    redis = null;
  }
  return redis;
}

async function getCached(key, fetcher, ttlSeconds = 3600) {
  const client = getRedis();

  if (!client) return fetcher();

  try {
    const cached = await client.get(key);
    if (cached !== null) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }
  } catch (e) {
    console.warn("Redis GET error — falling back to fetcher:", e.message);
    return fetcher();
  }

  const fresh = await fetcher();

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(fresh));
  } catch (e) {
    console.warn("Redis SETEX error:", e.message);
  }

  return fresh;
}

async function invalidateCache(key) {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch (e) {
    console.warn("Redis DEL error:", e.message);
  }
}

module.exports = getRedis;
module.exports.getCached = getCached;
module.exports.invalidateCache = invalidateCache;
