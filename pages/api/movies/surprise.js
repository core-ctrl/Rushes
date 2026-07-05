import { discoverContent } from "../../../lib/tmdb";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { genre, platform, type = "movie" } = req.query;

  try {
    const TMDB_PROVIDERS = {
      netflix: 8,
      primevideo: 119,
      hotstar: 122,
      zee5: 232,
      sonyliv: 237,
      jiocinema: 220,
    };

    // Pick a random page between 1 and 10 to ensure variety
    const randomPage = Math.floor(Math.random() * 10) + 1;
    
    const params = {
      page: randomPage,
      "vote_average.gte": 6.5,
      "vote_count.gte": 100,
    };

    if (genre) params.with_genres = genre;
    if (platform && TMDB_PROVIDERS[platform]) {
      params.with_watch_providers = TMDB_PROVIDERS[platform];
      params.watch_region = "IN"; // Regional context for India-specific OTTs
    }

    const results = await discoverContent(params, type);

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No matches found for that vibe." });
    }

    const randomItem = results[Math.floor(Math.random() * results.length)];

    return res.status(200).json({
      id: randomItem.id,
      media_type: randomItem.media_type || type,
    });
  } catch (error) {
    console.error("SURPRISE_API_ERROR:", error);
    return res.status(500).json({ error: "Failed to roll the dice" });
  }
}
