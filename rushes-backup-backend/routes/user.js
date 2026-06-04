const express = require("express");
const router = express.Router();
const multer = require("multer");
const cookie = require("cookie");

const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");
const Message = require("../models/Message");
const Take = require("../models/Take");
const Notification = require("../models/Notification");
const WatchlistService = require("../services/watchlistService");
const { avatarOrDefault } = require("../lib/avatar");
const cloudinary = require("../lib/cloudinary");
const { validate, watchlistSchema } = require("../middleware/validate");

// Custom RequireAuth middleware
const { requireAuth } = require("../middleware/auth");

// Set up Multer for avatar uploads (Memory storage, max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper to normalize username
function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

const SUPPORTED_PLATFORMS = [
  "netflix", "prime", "hotstar", "jiocinema", "zee5", "sonyliv",
  "mubi", "apple_tv", "hbo_max", "disney_plus", "hulu", "peacock",
  "paramount_plus", "crunchyroll", "curiosity_stream"
];

// 1. /list (GET, POST, DELETE)
router.get("/list", requireAuth, async (req, res) => {
  try {
    const list = await WatchlistService.getWatchlist(req.user.id);
    return res.status(200).json({ list });
  } catch (error) {
    console.error("GET /list error:", error);
    return res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.post("/list", requireAuth, async (req, res) => {
  try {
    const { success, data, error } = validate(watchlistSchema, req.body);
    if (!success) return res.status(400).json({ error });
    await WatchlistService.addToWatchlist(req.user.id, data);
    return res.status(200).json({ message: "Added" });
  } catch (error) {
    console.error("POST /list error:", error);
    return res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

router.delete("/list", requireAuth, async (req, res) => {
  try {
    const { mediaId, mediaType } = req.query;
    await WatchlistService.removeFromWatchlist(req.user.id, mediaId, mediaType);
    return res.status(200).json({ message: "Removed" });
  } catch (error) {
    console.error("DELETE /list error:", error);
    return res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

// 2. /history (GET, POST)
router.get("/history", requireAuth, async (req, res) => {
  try {
    const history = await WatchlistService.getHistory(req.user.id);
    return res.status(200).json({ history });
  } catch (error) {
    console.error("GET /history error:", error);
    return res.status(500).json({ error: "Failed to fetch watch history" });
  }
});

router.post("/history", requireAuth, async (req, res) => {
  try {
    const { mediaId, mediaType, title, posterPath } = req.body;
    await WatchlistService.addToHistory(req.user.id, { mediaId, mediaType, title, posterPath });
    return res.status(200).json({ message: "Added to history" });
  } catch (error) {
    console.error("POST /history error:", error);
    return res.status(500).json({ error: "Failed to add to watch history" });
  }
});

// 3. /preferences (GET, POST)
router.get("/preferences", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.user.id).select(
      "preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations preferredPlatforms ottPlatforms hasCompletedOnboarding"
    );
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("GET /preferences error:", error);
    return res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.post("/preferences", async (req, res) => {
  // Support guest preferences (requireAuth optional)
  let userId = null;
  const decoded = require("../lib/auth").getUserFromRequest(req);
  if (decoded && decoded.id) {
    userId = decoded.id;
  }

  try {
    await connectDB();

    const incomingGenres = req.body.genres || req.body.preferredGenres || [];
    const incomingLanguages = req.body.languages || req.body.preferredLanguages || [];
    const incomingPlatforms = req.body.platforms || req.body.preferredPlatforms || req.body.ottPlatforms || [];

    const updateData = {
      preferredGenres: incomingGenres,
      preferredLanguages: incomingLanguages,
      preferredRegions: req.body.regions || [],
      preferredRegionGroup: req.body.regionGroup || "",
      allowLocationRecommendations: Boolean(req.body.allowLocationRecommendations),
      preferredPlatforms: incomingPlatforms,
      ottPlatforms: incomingPlatforms,
    };

    if (typeof req.body.hasCompletedOnboarding === "boolean") {
      updateData.hasCompletedOnboarding = req.body.hasCompletedOnboarding;
    } else if (req.body.completed === true) {
      updateData.hasCompletedOnboarding = true;
    }

    if (userId) {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations preferredPlatforms ottPlatforms hasCompletedOnboarding");

      return res.status(200).json({
        message: "Preferences updated",
        data: user
      });
    } else {
      return res.status(201).json({ message: "Guest preferences saved locally", data: updateData });
    }
  } catch (error) {
    console.error("POST /preferences error:", error);
    return res.status(500).json({ error: "Failed to save preferences" });
  }
});

// 4. /profile (GET, POST, PUT)
router.get("/profile", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpiry -verificationToken -verificationTokenExpiry"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      user: {
        ...user.toObject(),
        id: user._id,
        avatar: avatarOrDefault(user.avatar, user.username || user.email),
      },
    });
  } catch (error) {
    console.error("GET /profile error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

const profileUpdateHandler = async (req, res) => {
  try {
    await connectDB();

    const { avatar, username, displayName, bio } = req.body;
    const update = {};

    if (typeof avatar === "string") {
      update.avatar = avatarOrDefault(avatar, req.user.email || req.user.username || req.user.id);
    }

    if (typeof displayName === "string") {
      update.displayName = displayName.trim().slice(0, 60);
      if (update.displayName) update.name = update.displayName;
    }

    if (typeof bio === "string") {
      update.bio = bio.trim().slice(0, 180);
    }

    if (typeof username === "string" && username.trim()) {
      const nextUsername = normalizeUsername(username);
      if (nextUsername.length < 3 || nextUsername.length > 20) {
        return res.status(400).json({ error: "Username must be 3-20 letters, numbers, or underscores." });
      }

      const taken = await User.findOne({ username: nextUsername, _id: { $ne: req.user.id } });
      if (taken) return res.status(409).json({ error: "Username is already taken." });
      update.username = nextUsername;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpiry -verificationToken -verificationTokenExpiry");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        ...user.toObject(),
        id: user._id,
        avatar: avatarOrDefault(user.avatar, user.username || user.email),
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
router.post("/profile", requireAuth, profileUpdateHandler);
router.put("/profile", requireAuth, profileUpdateHandler);

// 5. /notifications (GET, POST)
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.user.id).select("notificationInbox");
    return res.status(200).json({ notifications: user?.notificationInbox || [] });
  } catch (error) {
    console.error("GET /notifications error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/notifications", requireAuth, async (req, res) => {
  try {
    await connectDB();
    await User.findByIdAndUpdate(req.user.id, {
      $set: { "notificationInbox.$[].read": true },
    });
    return res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    console.error("POST /notifications error:", error);
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// 6. /deactivate (POST)
router.post("/deactivate", requireAuth, async (req, res) => {
  try {
    await connectDB();
    await User.findByIdAndUpdate(req.user.id, {
      isDeactivated: true,
      deactivatedAt: new Date(),
      isOnline: false,
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({ success: true, message: "Account deactivated. You can reactivate by logging in again." });
  } catch (error) {
    console.error("Deactivate account error:", error);
    return res.status(500).json({ error: "Failed to deactivate account" });
  }
});

// 7. /delete-account (POST, DELETE)
const deleteAccountHandler = async (req, res) => {
  try {
    await connectDB();

    await Message.deleteMany({ $or: [{ senderId: req.user.id }, { receiverId: req.user.id }] });
    await Take.deleteMany({ userId: req.user.id });
    await Notification.deleteMany({ userId: req.user.id });

    // Clean up dangling references in other users' documents
    await User.updateMany({ following: req.user.id }, { $pull: { following: req.user.id } });
    await User.updateMany({ followers: req.user.id }, { $pull: { followers: req.user.id } });
    await User.updateMany({ blockedUsers: req.user.id }, { $pull: { blockedUsers: req.user.id } });

    await User.findByIdAndDelete(req.user.id);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ error: "Failed to delete account" });
  }
};
router.post("/delete-account", requireAuth, deleteAccountHandler);
router.delete("/delete-account", requireAuth, deleteAccountHandler);

// 8. /ott-platforms (GET, POST, PUT)
router.get("/ott-platforms", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const dbUser = await User.findById(req.user.id).select("ottPlatforms");
    return res.json({ platforms: dbUser?.ottPlatforms || [], supported: SUPPORTED_PLATFORMS });
  } catch (error) {
    console.error("GET /ott-platforms error:", error);
    return res.status(500).json({ error: "Failed to fetch OTT platforms" });
  }
});

const ottPlatformsUpdateHandler = async (req, res) => {
  const { platforms } = req.body;
  if (!Array.isArray(platforms)) return res.status(400).json({ error: "Platforms must be an array" });

  try {
    await connectDB();
    const valid = platforms.filter(p => SUPPORTED_PLATFORMS.includes(p));
    await User.findByIdAndUpdate(req.user.id, { ottPlatforms: valid });
    return res.json({ success: true, platforms: valid });
  } catch (error) {
    console.error("Update OTT platforms error:", error);
    return res.status(500).json({ error: "Failed to update OTT platforms" });
  }
};
router.post("/ott-platforms", requireAuth, ottPlatformsUpdateHandler);
router.put("/ott-platforms", requireAuth, ottPlatformsUpdateHandler);

// 9. /status (GET)
router.get("/status", async (req, res) => {
  const decoded = require("../lib/auth").getUserFromRequest(req);
  if (!decoded) return res.status(200).json({ loggedIn: false, user: null });

  try {
    await connectDB();
    const user = await User.findById(decoded.id).select("name email preferredGenres wishlist isAdmin");
    if (!user) return res.status(200).json({ loggedIn: false, user: null });
    return res.status(200).json({ loggedIn: true, user });
  } catch {
    return res.status(200).json({ loggedIn: false, user: null });
  }
});

// 10. /update-location (POST)
router.post("/update-location", requireAuth, async (req, res) => {
  try {
    await connectDB();
    await User.findByIdAndUpdate(req.user.id, {
      location: req.body.location,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Update location error:", error);
    return res.status(500).json({ error: "Failed to update location" });
  }
});

// 11. /upload-avatar (POST, using multer/cloudinary)
router.post("/upload-avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    let imageStr = null;
    if (req.file) {
      imageStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (req.body && req.body.image) {
      imageStr = req.body.image;
    }

    if (!imageStr) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!imageStr.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format. Only images are allowed." });
    }

    if (imageStr.length > 7 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max 5MB." });
    }

    await connectDB();

    const result = await cloudinary.uploader.upload(imageStr, {
      folder: "moviefinder/avatars",
      public_id: `user_${req.user.id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    await User.findByIdAndUpdate(req.user.id, { avatar: result.secure_url });

    return res.json({
      success: true,
      avatar: result.secure_url,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ error: "Failed to upload avatar. Please try again." });
  }
});

module.exports = router;
