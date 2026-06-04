const express = require("express");
const router = express.Router();
const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");
const { optionalAuth } = require("../middleware/requireAuth");

// friend-activity
router.all("/friend-activity", optionalAuth, async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!req.user) {
    return res.status(401).json({ activity: {} });
  }

  await connectDB();
  const rawIds = req.method === "POST"
    ? (req.body.tmdbIds || [])
    : (req.query.tmdbIds ? req.query.tmdbIds.split(",") : []);

  const tmdbIds = rawIds.map(id => Number(id)).filter(id => !isNaN(id));

  try {
    const currentUser = await User.findById(req.user.id).select("following");
    if (!currentUser?.following?.length) return res.json({ activity: {} });

    const friends = await User.find({
      _id: { $in: currentUser.following }
    }).select("username avatar likedMovies watchedMovies");

    const activity = {};
    for (const friend of friends) {
      const allInteracted = [
        ...(friend.likedMovies || []),
        ...(friend.watchedMovies || [])
      ];
      for (const item of allInteracted) {
        if (tmdbIds.includes(item.tmdbId)) {
          if (!activity[item.tmdbId]) activity[item.tmdbId] = [];
          activity[item.tmdbId].push({
            username: friend.username || friend.name,
            avatar: friend.avatar
          });
        }
      }
    }

    res.json({ activity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
