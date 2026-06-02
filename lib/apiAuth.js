import { getServerSession } from "next-auth/next";
import { getUserFromRequest } from "./auth";
import { connectDB } from "./mongodb";
import { avatarOrDefault } from "./avatar";
import User from "../models/User";
import { authOptions } from "../pages/api/auth/[...nextauth]";

function normalizeAuthUser(user) {
  if (!user) return null;

  const id = user.id || user._id?.toString?.() || user._id;
  if (!id) return null;

  return {
    id: String(id),
    _id: String(id),
    email: user.email || "",
    name: user.name || user.displayName || user.username || "User",
    username: user.username || "",
    displayName: user.displayName || user.name || user.username || "User",
    avatar: avatarOrDefault(user.avatar, user.username || user.email || user.name || id),
    authProviders: user.authProviders || [],
    hasCompletedOnboarding: user.hasCompletedOnboarding === true,
  };
}

export async function getApiAuthUser(req, res, { fromDb = false } = {}) {
  const jwtUser = getUserFromRequest(req);
  let authUser = jwtUser?.id ? jwtUser : null;

  if (!authUser) {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      authUser = session.user;
    }
  }

  if (!authUser?.id) return null;

  if (!fromDb) {
    return normalizeAuthUser(authUser);
  }

  await connectDB();
  const user = await User.findById(authUser.id)
    .select("-password -resetPasswordToken -resetPasswordExpiry -verificationToken -verificationTokenExpiry")
    .lean();

  return normalizeAuthUser(user || authUser);
}

export async function requireApiAuth(req, res, options) {
  const user = await getApiAuthUser(req, res, options);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}
