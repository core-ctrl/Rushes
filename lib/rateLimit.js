// lib/rateLimit.js — Redis-backed with in-memory fallback
import getRedis from './redis';

const inMemory = new Map();

/**
 * Rate limit an identifier using Redis (when available) or in-memory.
 *
 * @param {string} identifier - Unique key (e.g. email, IP, userId)
 * @param {number} maxAttempts - Max allowed requests per window
 * @param {number} windowSecs - Window size in seconds
 * @throws {Error} when limit is exceeded
 */
export async function rateLimit(identifier, maxAttempts = 5, windowSecs = 900) {
  const key = `rl:${identifier}`;
  const redis = getRedis();

  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSecs);
      }
      if (current > maxAttempts) {
        const ttl = await redis.ttl(key);
        throw new Error(
          `Too many attempts. Try again in ${Math.ceil(Math.max(ttl, 0) / 60)} minutes.`
        );
      }
      return;
    } catch (err) {
      // If it's our own rate-limit error, re-throw
      if (err.message.startsWith('Too many')) throw err;
      // Otherwise Redis failed — fall through to in-memory
      console.warn('Redis rate-limit error, using in-memory fallback:', err.message);
    }
  }

  // ── In-memory fallback ──
  const now = Date.now();
  const record = inMemory.get(key) || { count: 0, resetAt: now + windowSecs * 1000 };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowSecs * 1000;
  }

  record.count += 1;
  inMemory.set(key, record);

  if (record.count > maxAttempts) {
    const waitMins = Math.ceil((record.resetAt - now) / 60000);
    throw new Error(`Too many attempts. Try again in ${waitMins} minutes.`);
  }
}

// ── Legacy API (return-based, for backwards compat) ──────────────────────────

const attempts = new Map();

export function rateLimit_legacy({ maxAttempts = 10, windowMs = 60 * 1000 }) {
  return function check(identifier = 'anonymous') {
    const now = Date.now();
    const key = identifier;
    const record = attempts.get(key);

    if (!record || now - record.start > windowMs) {
      attempts.set(key, { count: 1, start: now });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
      const retryAfter = Math.ceil((record.start + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    record.count += 1;
    attempts.set(key, record);
    return { allowed: true, remaining: maxAttempts - record.count };
  };
}

export const authLimiter = rateLimit_legacy({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });
export const searchLimiter = rateLimit_legacy({ maxAttempts: 40, windowMs: 60 * 1000 });
export const formLimiter = rateLimit_legacy({ maxAttempts: 8, windowMs: 10 * 60 * 1000 });

// Tiered rate limiters for different route types
export const apiReadLimiter = rateLimit_legacy({ maxAttempts: 100, windowMs: 60 * 1000 });
export const apiWriteLimiter = rateLimit_legacy({ maxAttempts: 30, windowMs: 60 * 1000 });
export const uploadLimiter = rateLimit_legacy({ maxAttempts: 10, windowMs: 60 * 1000 });
export const callLimiter = rateLimit_legacy({ maxAttempts: 20, windowMs: 60 * 1000 });
export const reportLimiter = rateLimit_legacy({ maxAttempts: 5, windowMs: 60 * 60 * 1000 }); // 5 per hour
