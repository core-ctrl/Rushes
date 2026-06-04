const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { connectDB } = require("../lib/mongodb");

const JWT_SECRET = process.env.JWT_SECRET;

function defaultAvatarForUser(seed = "") {
  const value = String(seed || "").trim();
  if (!value) return "/avatar.svg";

  const initials = value
    .replace(/[^a-zA-Z0-9\s._-]/g, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (!initials) return "/avatar.svg";

  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(value)}&backgroundColor=111827,7f1d1d,312e81&textColor=ffffff&radius=50`;
}

function avatarOrDefault(avatar, seed = "") {
  return typeof avatar === "string" && avatar.trim() ? avatar.trim() : defaultAvatarForUser(seed);
}

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

// Extract JWT token from req cookies or Authorization header
function getJwtUser(req) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Express-specific middleware to populate req.user and block if unauthorized
const requireAuth = async (req, res, next) => {
  const decoded = getJwtUser(req);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = decoded;
  next();
};

// Express-specific middleware to optionally populate req.user (guest searches, feeds)
const optionalAuth = async (req, res, next) => {
  const decoded = getJwtUser(req);
  if (decoded && decoded.id) {
    req.user = decoded;
  }
  next();
};

// Next.js equivalent for api route compatibility: returns normalized user or null
async function getApiAuthUser(req, res, { fromDb = false } = {}) {
  const decoded = getJwtUser(req);
  if (!decoded || !decoded.id) return null;

  if (!fromDb) {
    return normalizeAuthUser(decoded);
  }

  await connectDB();
  const user = await User.findById(decoded.id)
    .select("-password -resetPasswordToken -resetPasswordExpiry -verificationToken -verificationTokenExpiry")
    .lean();

  return normalizeAuthUser(user || decoded);
}

// Next.js equivalent for api route compatibility: returns normalized user or sends 401
async function requireApiAuth(req, res, options) {
  const user = await getApiAuthUser(req, res, options);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

module.exports = {
  requireAuth,
  optionalAuth,
  getApiAuthUser,
  requireApiAuth,
};
