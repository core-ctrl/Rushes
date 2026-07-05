import { discoverContent } from "../../../lib/tmdb";
import { getCache, setCache } from "../../../lib/cache";
import { setPublicCache } from "../../../lib/security";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const lang = req.query.lang || "en";
  const type = req.query.type || "movie";
  
  const cacheKey = `localized_trending:${lang}:${type}`;
  const cached = getCache(cacheKey);

  if (cached) {
    setPublicCache(res, "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(cached);
  }

  try {
    // Fetch top popular content for the language (which effectively is trending)
    const raw = await discoverContent({
      with_original_language: lang,
      sort_by: "popularity.desc",
      "vote_count.gte": 10 // Lower vote count for regional content
    }, type);

    setCache(cacheKey, raw);
    setPublicCache(res, "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(raw);
  } catch (error) {
    console.error("LOCALIZED_TRENDING_ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch localized trending" });
  }
}
