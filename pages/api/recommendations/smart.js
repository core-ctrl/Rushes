import axios from "axios";
import { getCached } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tmdbId, mediaType = "movie" } = req.query;

  try {
    let endpoint = "";
    let cacheKey = "";

    if (tmdbId && tmdbId !== "undefined") {
      endpoint = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/recommendations?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`;
      cacheKey = `smart_recs:${mediaType}:${tmdbId}`;
    } else {
      endpoint = `https://api.themoviedb.org/3/trending/all/day?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
      cacheKey = `smart_recs:trending:all`;
    }

    const results = await getCached(
      cacheKey,
      async () => {
        const { data } = await axios.get(endpoint);
        return data.results?.slice(0, 20) || [];
      },
      3600 // 1 hour
    );

    return res.status(200).json({ results: results.slice(0, 15) });
  } catch (error) {
    console.error("Smart recommendations error:", error);
    return res.status(500).json({ error: "Failed to fetch smart recommendations", results: [] });
  }
}
