// pages/api/auth/me.js
// Returns current user from JWT cookie
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import { avatarOrDefault } from "@/lib/avatar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  let userId = null;

  // 1. Try Custom JWT Cookie
  const decoded = getUserFromRequest(req);
  if (decoded && decoded.id) {
    userId = decoded.id;
  } else {
    // 2. Try NextAuth Session
    const session = await getServerSession(req, res, authOptions);
    if (session && session.user && session.user.id) {
      userId = session.user.id;
    }
  }

  if (!userId) {
    return res.status(401).json({ user: null });
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("-password");

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
