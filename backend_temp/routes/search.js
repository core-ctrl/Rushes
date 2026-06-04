const express = require("express");
const router = express.Router();
const { searchLimiter } = require("../lib/rateLimit");
const { getCache, setCache } = require("../lib/cache");
const { searchMulti } = require("../lib/tmdb");
const { correctTypo, detectIntent, scoreResults } = require("../services/searchService");
const { optionalAuth } = require("../middleware/requireAuth");
const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");
const { getClientIp, sanitizeSearchQuery, setPublicCache } = require("../lib/security");

// GET /advanced
router.get("/advanced", optionalAuth, async (req, res) => {
  const ip = getClientIp(req);
  
  let limit = { allowed: true };
  if (typeof searchLimiter === "function") {
    limit = searchLimiter(ip);
  }
  if (!limit.allowed) return res.status(429).json({ error: "Too many searches. Slow down." });

  const page = Math.max(1, Number(req.query.page || 1));
  const sanitized = sanitizeSearchQuery(req.query.q || "");
  if (!sanitized) return res.status(400).json({ results: [], suggestions: [], intent: null });

  const corrected = correctTypo(sanitized);
  const intent = detectIntent(corrected);
  const cacheKey = `search:${corrected}:${page}`;
  
  let cached = null;
  if (typeof getCache === "function") {
    cached = getCache(cacheKey);
  }

  if (cached) {
    if (typeof setPublicCache === "function") {
      setPublicCache(res, "public, s-maxage=120, stale-while-revalidate=300");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    }
    return res.status(200).json({ ...cached, cached: true });
  }

  let userGenres = [];
  try {
    if (req.user) {
      await connectDB();
      const user = await User.findById(req.user.id).select("preferredGenres");
      userGenres = user?.preferredGenres || [];
    }
  } catch {
    // Guest searches remain allowed.
  }

  const raw = await searchMulti(corrected, page);
  const results = scoreResults(raw, corrected, userGenres);

  const payload = {
    results: results.slice(0, 20),
    intent,
    corrected: corrected !== sanitized ? corrected : null,
    originalQuery: sanitized,
    total: results.length,
  };

  if (typeof setCache === "function") {
    setCache(cacheKey, payload);
  }
  if (typeof setPublicCache === "function") {
    setPublicCache(res, "public, s-maxage=120, stale-while-revalidate=300");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
  }
  return res.status(200).json(payload);
});

// GET /autocomplete
router.get("/autocomplete", async (req, res) => {
  const query = sanitizeSearchQuery(req.query.q || "");
  if (!query || query.length < 2) return res.status(200).json({ suggestions: [] });

  const ip = getClientIp(req);
  let limit = { allowed: true };
  if (typeof searchLimiter === "function") {
    limit = searchLimiter(ip);
  }
  if (!limit.allowed) return res.status(429).json({ suggestions: [] });

  const cacheKey = `ac:${query.toLowerCase().slice(0, 20)}`;
  
  let cached = null;
  if (typeof getCache === "function") {
    cached = getCache(cacheKey);
  }
  if (cached) {
    if (typeof setPublicCache === "function") {
      setPublicCache(res, "public, s-maxage=300, stale-while-revalidate=900");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    }
    return res.status(200).json({ suggestions: cached });
  }

  const results = await searchMulti(query, 1);
  const suggestions = results
    .filter((result) => result.media_type !== "person" && (result.title || result.name))
    .slice(0, 6)
    .map((result) => ({
      id: result.id,
      title: result.title || result.name,
      year: (result.release_date || result.first_air_date || "").slice(0, 4),
      type: result.media_type || (result.title ? "movie" : "tv"),
      poster: result.poster_path,
      rating: result.vote_average?.toFixed(1),
    }));

  if (typeof setCache === "function") {
    setCache(cacheKey, suggestions);
  }
  if (typeof setPublicCache === "function") {
    setPublicCache(res, "public, s-maxage=300, stale-while-revalidate=900");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
  }
  return res.status(200).json({ suggestions });
});

module.exports = router;
