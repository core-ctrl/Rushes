import { requireAuth } from "@/middleware/requireAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  buildUserProfile,
  getRecommendations,
  getBecauseYouWatched,
  getHiddenGems,
} from "@/services/recommendationService";
import { sanitizeSearchQuery } from "@/lib/security";

function parseNumberList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function parseStringList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => sanitizeSearchQuery(item).toUpperCase())
    .filter(Boolean);
}

function parseOttFilters(query) {
  return {
    availableOnly: query.availableOnly === "true",
    access: ["all", "free", "paid"].includes(query.access) ? query.access : "all",
    provider: typeof query.provider === "string" ? sanitizeSearchQuery(query.provider) : "",
  };
}

function limitDailyPicks(recs) {
  return {
    ...recs,
    movies: [...(recs.movies || [])]
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 5),
    series: [...(recs.series || [])]
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 5),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const decoded = await requireAuth(req, res);

  if (!decoded) {
    return res.status(401).json({
      error: "Login required",
      locked: true,
      message: "Sign in to unlock personalized recommendations.",
    });
  }

  try {
    await connectDB();
    const user = await User.findById(decoded.id).select(
      "preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations watchHistory wishlist"
    );

    const isDaily = req.query.daily === "true";

    let recs;
    if (isDaily) {
      recs = await getRecommendations(user, { daily: true, ott: parseOttFilters(req.query) });
      res.setHeader("Cache-Control", "private, s-maxage=900");
      return res.status(200).json(limitDailyPicks(recs));
    }

    const [recsRegular, byw, gems] = await Promise.all([
      getRecommendations(user, { ott: parseOttFilters(req.query) }),
      getBecauseYouWatched(user),
      getHiddenGems(user.preferredGenres),
    ]);

    res.setHeader("Cache-Control", "private, s-maxage=300");
    return res.status(200).json({
      type: recsRegular.source,
      movies: recsRegular.movies,
      tv: recsRegular.tv,
      becauseYouWatched: byw,
      hiddenGems: gems,
    });
  } catch (err) {
    console.error("RECS_ERROR:", err);
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
}
