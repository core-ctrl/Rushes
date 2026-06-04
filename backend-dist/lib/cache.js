const cache = new Map();
const TTL_MAP = {
  trending: 5 * 60 * 1000,   // 5 min  — changes frequently
  details: 30 * 60 * 1000,   // 30 min — stable
  default: 15 * 60 * 1000,   // 15 min
};
const MAX_SIZE = 500;          // Max cached entries

function ttlFor(key) {
  if (key.includes("trending")) return TTL_MAP.trending;
  if (key.includes("/movie/") || key.includes("/tv/")) return TTL_MAP.details;
  return TTL_MAP.default;
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.value;
}

function setCache(key, value) {
  // Evict oldest entry if full
  if (cache.size >= MAX_SIZE) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlFor(key) });
}

function clearCache(pattern) {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

function getCacheStats() {
  const now = Date.now();
  let alive = 0, expired = 0;
  for (const [, v] of cache) {
    if (now < v.expiresAt) alive++; else expired++;
  }
  return { total: cache.size, alive, expired, maxSize: MAX_SIZE };
}

module.exports = {
  getCache,
  setCache,
  clearCache,
  getCacheStats
};
