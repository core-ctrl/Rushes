import axios from "axios";
import { getCached } from "../../../lib/redis";

export default async function handler(req, res) {
  try {
    const genres = String(req.query.genres || "").split(",").filter(Boolean).slice(0, 3).join(",");
    const endpoint = genres
      ? `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN&sort_by=popularity.desc&with_genres=${genres}`
      : `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`;

    const series = await getCached(
      `recs:series:IN:${genres || 'popular'}`,
      async () => {
        const { data } = await axios.get(endpoint);
        return data.results?.slice(0, 20) || [];
      },
      3600 // 1 hour cache
    );

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.json({ series });
  } catch (error) {
    console.error("Series recommendations error:", error.message);
    res.status(500).json({ series: [], error: "Failed to fetch series recommendations" });
  }
}
