// lib/redis.js
let redis = null;

// Lazy initialise only when first used (avoids build-time errors)
function getRedis() {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.warn('Redis initialisation failed — caching disabled:', e.message);
    redis = null;
  }
  return redis;
}

/**
 * Get a value from cache or fetch fresh data.
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function that returns fresh data
 * @param {number} ttlSeconds - Time-to-live in seconds (default 1 hour)
 */
export async function getCached(key, fetcher, ttlSeconds = 3600) {
  const client = getRedis();

  if (!client) return fetcher();

  try {
    const cached = await client.get(key);
    if (cached !== null) {
      // Upstash returns parsed JSON automatically when storing with JSON.stringify
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (e) {
    console.warn('Redis GET error — falling back to fetcher:', e.message);
    return fetcher();
  }

  const fresh = await fetcher();

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(fresh));
  } catch (e) {
    console.warn('Redis SETEX error:', e.message);
  }

  return fresh;
}

/**
 * Delete a cache key.
 */
export async function invalidateCache(key) {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch (e) {
    console.warn('Redis DEL error:', e.message);
  }
}

export default getRedis;
