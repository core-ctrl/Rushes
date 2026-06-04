import { requireAuth } from "@/middleware/requireAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { decideForMe } from "@/services/recommendationService";
import { sanitizeSearchQuery } from "@/lib/security";

function parseGuestProfile(query) {
  const genres = String(query.genres || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
  const languages = String(query.languages || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const regions = String(query.regions || "IN")
    .split(",")
    .map((item) => sanitizeSearchQuery(item).toUpperCase())
    .filter(Boolean);

  return {
    preferredGenres: genres,
    preferredLanguages: languages,
    preferredRegions: regions.length ? regions : ["IN"],
    watchHistory: [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const decoded = await requireAuth(req, res);
    let user = null;

    if (decoded) {
      await connectDB();
      user = await User.findById(decoded.id).select(
        "preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations watchHistory wishlist"
      );
    }

    const picks = await decideForMe(user || parseGuestProfile(req.query), {
      provider: typeof req.query.provider === "string" ? sanitizeSearchQuery(req.query.provider) : "",
    });

    res.setHeader("Cache-Control", "private, s-maxage=180");
    return res.status(200).json({ picks });
  } catch (err) {
    console.error("DECIDE_ERROR:", err);
    return res.status(500).json({ error: "Failed to decide what to watch" });
  }
}
