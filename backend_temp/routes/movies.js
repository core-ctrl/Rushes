const express = require("express");
const router = express.Router();
const { fetchByGenre, fetchTopRatedMovies, fetchNowPlaying } = require("../lib/tmdb");
const { getCached } = require("../lib/redis");
const axios = require("axios");

// GET /now-playing
router.get("/now-playing", async (req, res) => {
  const { region = "US", page = 1 } = req.query;

  try {
    const results = await fetchNowPlaying(region, Number(page) || 1);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ results });
  } catch (error) {
    console.error("NOW_PLAYING_API_ERROR:", error.message);
    return res.status(500).json({ error: "Failed to fetch now playing" });
  }
});

// GET /recommendations
router.get("/recommendations", async (req, res) => {
  try {
    const genres = String(req.query.genres || "").split(",").filter(Boolean).slice(0, 3).join(",");
    const endpoint = genres
      ? `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN&sort_by=popularity.desc&with_genres=${genres}`
      : `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`;

    const movies = await getCached(
      `recs:movies:IN:${genres || "popular"}`,
      async () => {
        const { data } = await axios.get(endpoint);
        return data.results?.slice(0, 20) || [];
      },
      3600 // 1 hour cache
    );

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.json({ movies });
  } catch (error) {
    console.error("Movies recommendations error:", error.message);
    res.status(500).json({ movies: [], error: "Failed to fetch movie recommendations" });
  }
});

// GET /trending
router.get("/trending", async (req, res) => {
  try {
    const movies = await getCached(
      "trending:movies:IN",
      async () => {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`
        );
        return data.results?.slice(0, 20) || [];
      },
      1800 // 30 minutes
    );
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    res.json({ movies });
  } catch (error) {
    console.error("Movies trending error:", error.message);
    res.status(500).json({ movies: [], error: "Failed to fetch trending movies" });
  }
});

// GET /
router.get("/", async (req, res) => {
  const { page = 1, genre } = req.query;

  try {
    const results = genre
      ? await fetchByGenre(genre, page, "movie")
      : await fetchTopRatedMovies(page);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch movies" });
  }
});

module.exports = router;
