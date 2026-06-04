const express = require("express");
const router = express.Router();

const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");
const Report = require("../models/Report");
const { supabase } = require("../lib/supabase");
const { getUserFromRequest } = require("../lib/auth");

// Custom RequireAuth middleware
const { requireAuth } = require("../middleware/auth");

// 1. POST /block
router.post("/block", requireAuth, async (req, res) => {
  const { targetUserId, action } = req.body;

  if (!targetUserId) return res.status(400).json({ error: "Target user ID is required" });
  if (!["block", "unblock"].includes(action)) return res.status(400).json({ error: "Invalid action" });

  await connectDB();

  try {
    if (action === "block") {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { blockedUsers: { userId: targetUserId } },
        $pull: { following: targetUserId, followers: targetUserId },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { following: req.user.id, followers: req.user.id },
      });
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { blockedUsers: { userId: targetUserId } },
      });
    }

    return res.json({ success: true, action });
  } catch (error) {
    console.error("Block API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// 2. GET /check-username
router.get("/check-username", async (req, res) => {
  await connectDB();

  const { u } = req.query;
  if (!u || u.length < 3) return res.json({ available: false });

  const decoded = getUserFromRequest(req);
  const exists = await User.findOne({
    username: String(u).toLowerCase(),
    ...(decoded?.id ? { _id: { $ne: decoded.id } } : {}),
  });
  return res.json({ available: !exists });
});

// 3. POST /follow
router.post("/follow", requireAuth, async (req, res) => {
  await connectDB();
  const { targetUserId, action } = req.body;

  if (!targetUserId) return res.status(400).json({ error: "Target user ID is required" });

  try {
    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user.id).select("blockedUsers"),
      User.findById(targetUserId).select("blockedUsers username avatar name"),
    ]);

    if (!targetUser) return res.status(404).json({ error: "User not found" });

    // Map blockedUsers list to array of string IDs for easy checking
    const currentBlocked = (currentUser?.blockedUsers || []).map(b => b.userId || String(b));
    const targetBlocked = (targetUser?.blockedUsers || []).map(b => b.userId || String(b));

    if (action === "follow") {
      if (currentBlocked.includes(targetUserId)) {
        return res.status(403).json({ error: "You have blocked this user. Unblock them first." });
      }
      if (targetBlocked.includes(req.user.id)) {
        return res.status(403).json({ error: "Unable to follow this user." });
      }

      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: req.user.id }
      });

      // Send notification via Supabase
      try {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          from_user_id: req.user.id,
          from_username: req.user.username || req.user.name,
          from_avatar: req.user.avatar,
          type: "follow",
          content: `${req.user.name || req.user.username} started following you`
        });
      } catch (e) {
        // Don't fail the follow if notification fails
      }
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: req.user.id }
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Follow API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// 4. POST /report
router.post("/report", requireAuth, async (req, res) => {
  await connectDB();
  const { targetId, targetType, reason } = req.body;

  try {
    await Report.create({
      reportedBy: req.user.id,
      targetId,
      targetType,
      reason,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Report API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// 5. GET /search
router.get("/search", async (req, res) => {
  await connectDB();
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ users: [] });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: q.trim(), $options: "i" } },
        { displayName: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
      ],
    })
      .select("_id username displayName avatar bio followers following")
      .limit(20)
      .lean();

    console.log(`Search "${q}" found ${users.length} users`);
    return res.json({ users });
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// 6. GET /:username/profile
router.get("/:username/profile", async (req, res) => {
  await connectDB();
  const { username } = req.params;

  try {
    const user = await User.findOne({ username })
      .select("username avatar bio following followers likedMovies watchedMovies tasteProfile createdAt ottPlatforms isVerified isAdmin")
      .lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    user.followersCount = user.followers?.length || 0;
    user.followingCount = user.following?.length || 0;

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
