const express = require("express");
const router = express.Router();
const { fetchDetails, fetchMovieReleaseDates, fetchWatchProviders } = require("../lib/tmdb");
const { setPublicCache } = require("../lib/security");
const { withDecisionMetadata } = require("../lib/decisionEngine");

// GET /:type/:id
// Fetches full movie or TV details including trailer, cast, providers
router.get("/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const region = typeof req.query.region === "string" ? req.query.region.toUpperCase() : "IN";

  if (!["movie", "tv"].includes(type)) {
    return res.status(400).json({ error: "Type must be 'movie' or 'tv'" });
  }

  try {
    const [details, providers, releaseDates] = await Promise.all([
      fetchDetails(id, type),
      fetchWatchProviders(id, type, region),
      type === "movie" ? fetchMovieReleaseDates(id) : Promise.resolve([]),
    ]);

    if (!details || !details.id) {
      return res.status(404).json({ error: "Not found" });
    }

    if (typeof setPublicCache === "function") {
      setPublicCache(res, "public, s-maxage=1800, stale-while-revalidate=86400");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    }

    const payload = {
      ...details,
      providers,
      availability: providers,
      region,
      releaseDates,
    };

    const responseData = typeof withDecisionMetadata === "function"
      ? withDecisionMetadata(payload)
      : payload;

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("MEDIA_DETAIL_ERROR:", err.message);
    return res.status(500).json({ error: "Failed to fetch details" });
  }
});

module.exports = router;
