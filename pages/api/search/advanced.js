import { searchLimiter } from "@/lib/rateLimit";
import { getCache, setCache } from "@/lib/cache";
import { searchMulti } from "@/lib/tmdb";
import { correctTypo, detectIntent, scoreResults } from "@/services/searchService";
import { requireAuth } from "@/middleware/requireAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getClientIp, sanitizeSearchQuery, setPublicCache } from "@/lib/security";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIp(req);
  const limit = searchLimiter(ip);
  if (!limit.allowed) return res.status(429).json({ error: "Too many searches. Slow down." });

  const page = Math.max(1, Number(req.query.page || 1));
  const sanitized = sanitizeSearchQuery(req.query.q || "");
  if (!sanitized) return res.status(400).json({ results: [], suggestions: [], intent: null });

  const corrected = correctTypo(sanitized);
  const intent = detectIntent(corrected);
  const cacheKey = `search:${corrected}:${page}`;
  const cached = getCache(cacheKey);

  if (cached) {
    setPublicCache(res, "public, s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({ ...cached, cached: true });
  }

  let userGenres = [];
  try {
    const decoded = await requireAuth(req, res);
    if (decoded) {
      await connectDB();
      const user = await User.findById(decoded.id).select("preferredGenres");
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

  setCache(cacheKey, payload);
  setPublicCache(res, "public, s-maxage=120, stale-while-revalidate=300");
  return res.status(200).json(payload);
}
