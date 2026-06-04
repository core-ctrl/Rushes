const express = require("express");
const router = express.Router();
const { fetchByGenre, fetchTopRatedTV } = require("../lib/tmdb");
const { getCached } = require("../lib/redis");
const axios = require("axios");

// GET /recommendations
router.get("/recommendations", async (req, res) => {
  try {
    const genres = String(req.query.genres || "").split(",").filter(Boolean).slice(0, 3).join(",");
    const endpoint = genres
      ? `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN&sort_by=popularity.desc&with_genres=${genres}`
      : `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`;

    const series = await getCached(
      `recs:series:IN:${genres || "popular"}`,
      async () => {
        const { data } = await axios.get(endpoint);
        return data.results?.slice(0, 20) || [];
      },
      3600 // 1 hour cache
    );

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({ series });
  } catch (error) {
    console.error("Series recommendations error:", error.message);
    res.status(500).json({ series: [], error: "Failed to fetch series recommendations" });
  }
});

// GET /trending
router.get("/trending", async (req, res) => {
  try {
    const series = await getCached(
      "trending:series:IN",
      async () => {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`
        );
        return data.results?.slice(0, 20) || [];
      },
      1800 // 30 minutes
    );
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    res.json({ series });
  } catch (error) {
    console.error("Series trending error:", error.message);
    res.status(500).json({ series: [], error: "Failed to fetch trending series" });
  }
});

// GET /
router.get("/", async (req, res) => {
  const { page = 1, genre } = req.query;

  try {
    const results = genre
      ? await fetchByGenre(genre, page, "tv")
      : await fetchTopRatedTV(page);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch series" });
  }
});

module.exports = router;
