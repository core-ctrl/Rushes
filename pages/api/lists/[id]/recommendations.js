import { connectDB } from "../../../../lib/mongodb";
import List from "../../../../models/List";
import axios from "axios";
import { getCached } from "../../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    await connectDB();
    const list = await List.findById(id);
    if (!list) return res.status(404).json({ error: "List not found" });

    let endpoint = "";
    let cacheKey = "";

    // If there are movies, find recommendations based on the last added movie
    if (list.movies && list.movies.length > 0) {
      // Get the last added movie
      const lastMovie = list.movies[list.movies.length - 1];
      const tmdbId = lastMovie.tmdbId;
      const mediaType = lastMovie.mediaType || "movie";
      
      endpoint = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/recommendations?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`;
      cacheKey = `list_recs:${mediaType}:${tmdbId}`;
    } else {
      // Fallback to trending if list is empty
      endpoint = `https://api.themoviedb.org/3/trending/all/day?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
      cacheKey = `list_recs:trending:all`;
    }

    const results = await getCached(
      cacheKey,
      async () => {
        const { data } = await axios.get(endpoint);
        return data.results?.slice(0, 20) || [];
      },
      3600 // 1 hour
    );

    // Filter out movies that are already in the list
    const existingIds = new Set(list.movies?.map(m => String(m.tmdbId)) || []);
    const filteredResults = results.filter(item => !existingIds.has(String(item.id)));

    return res.status(200).json({ results: filteredResults.slice(0, 10) }); // Send top 10 fresh recommendations
  } catch (error) {
    console.error("List recommendations error:", error);
    return res.status(500).json({ error: "Failed to fetch recommendations", results: [] });
  }
}
