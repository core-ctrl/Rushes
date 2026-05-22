// pages/api/auth/me.js
// Returns current user from JWT cookie
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import { avatarOrDefault } from "@/lib/avatar";

export default async function handler(req, res) {
  const decoded = getUserFromRequest(req);

  if (!decoded) {
    return res.status(401).json({ user: null });
  }

  try {
    await connectDB();
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName || user.username || user.name,
        email: user.email,
        username: user.username || "",
        avatar: avatarOrDefault(user.avatar, user.username || user.email),
        bio: user.bio || "",
        authProviders: user.authProviders || [],
        preferredGenres: user.preferredGenres || [],
        preferredLanguages: user.preferredLanguages || [],
        preferredRegions: user.preferredRegions || [],
        preferredRegionGroup: user.preferredRegionGroup || "",
        preferredPlatforms: user.preferredPlatforms || [],
        ottPlatforms: user.ottPlatforms || user.preferredPlatforms || [],
        allowLocationRecommendations: Boolean(user.allowLocationRecommendations),
        hasCompletedOnboarding: user.hasCompletedOnboarding === true,
        wishlist: user.wishlist || [],
        watchHistory: user.watchHistory || [],
        following: user.following || [],
        followers: user.followers || [],
      },
    });
  } catch (err) {
    console.error("Auth/me error:", err);
    return res.status(200).json({ user: null, error: "Failed to fetch user" });
  }
}
