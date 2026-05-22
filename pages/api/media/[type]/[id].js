// pages/api/media/[type]/[id].js
// Fetches full movie or TV details including trailer, cast, providers
import { fetchDetails, fetchMovieReleaseDates, fetchWatchProviders } from "@/lib/tmdb";
import { setPublicCache } from "@/lib/security";
import { withDecisionMetadata } from "@/lib/decisionEngine";

export default async function handler(req, res) {
  const { type, id } = req.query;
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

    setPublicCache(res, "public, s-maxage=1800, stale-while-revalidate=86400");
    return res.status(200).json(withDecisionMetadata({
      ...details,
      providers,
      availability: providers,
      region,
      releaseDates,
    }));
  } catch (err) {
    console.error("MEDIA_DETAIL_ERROR:", err.message);
    return res.status(500).json({ error: "Failed to fetch details" });
  }
}
