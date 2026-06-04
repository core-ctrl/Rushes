const { getUserFromRequest } = require("../lib/auth");
const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  if (typeof next === "function") {
    const decoded = getUserFromRequest(req);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = decoded;
    return next();
  }

  const decoded = getUserFromRequest(req);
  if (decoded && decoded.id) return decoded;
  return null;
}

async function requireAuthFull(req, res, next) {
  if (typeof next === "function") {
    const decoded = getUserFromRequest(req);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await connectDB();
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    return next();
  }

  const decoded = await requireAuth(req, res);
  if (!decoded) return null;
  await connectDB();
  return User.findById(decoded.id).select("-password");
}

async function requireAdmin(req, res, next) {
  if (typeof next === "function") {
    const decoded = getUserFromRequest(req);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await connectDB();
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = user;
    return next();
  }

  const user = await requireAuthFull(req, res);
  if (!user?.isAdmin) return null;
  return user;
}

module.exports = {
  requireAuth,
  requireAuthFull,
  requireAdmin
};
