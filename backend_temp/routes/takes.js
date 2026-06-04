const express = require("express");
const router = express.Router();
const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");
const Take = require("../models/Take");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { requireApiAuth, getApiAuthUser } = require("../middleware/requireAuth");
const { sanitizeText } = require("../lib/security");
const cloudinary = require("../lib/cloudinary");

// POST /create
router.post("/create", async (req, res) => {
  try {
    await connectDB();
    const user = await requireApiAuth(req, res, { fromDb: true });
    if (!user) return;

    const {
      content,
      tmdbId,
      mediaType,
      tmdbMediaType,
      movieTitle,
      moviePoster,
      movieBackdrop,
      rating,
      mood,
      spoiler,
      privacy,
      mentions,
      mediaUrl,
      attachmentType,
    } = req.body;

    const normalizedTmdbMediaType = (tmdbMediaType || mediaType) === "tv" ? "tv" : "movie";
    const normalizedAttachmentType = ["image", "video"].includes(attachmentType) ? attachmentType : "none";

    const newTake = await Take.create({
      userId: user.id,
      username: user.username || user.name || "Anonymous",
      displayName: user.displayName || user.name || user.username || "Anonymous",
      avatar: user.avatar || null,
      content: sanitizeText(content || "", { maxLength: 280, preserveNewLines: true }),
      tmdbId: tmdbId ? Number(tmdbId) : null,
      mediaType: normalizedTmdbMediaType,
      tmdbMediaType: normalizedTmdbMediaType,
      movieTitle: movieTitle || null,
      moviePoster: moviePoster || null,
      movieBackdrop: movieBackdrop || null,
      rating: rating || null,
      mood: mood || null,
      spoiler: !!spoiler,
      privacy: privacy === "followers" ? "followers" : "public",
      mentions: Array.isArray(mentions) ? mentions : [],
      likes: [],
      mediaUrl: mediaUrl || null,
      attachmentType: normalizedAttachmentType,
    });

    if (Array.isArray(mentions) && mentions.length > 0) {
      try {
        const mentionedUsers = await User.find({ username: { $in: mentions } }).select("_id username");
        for (const mentionedUser of mentionedUsers) {
          await Notification.create({
            userId: mentionedUser._id.toString(),
            fromUserId: user.id,
            fromUsername: user.username || user.name,
            fromAvatar: user.avatar || null,
            type: "mention",
            content: `@${user.username || user.name} mentioned you in a take`,
            referenceId: newTake._id.toString(),
          });
        }
      } catch (mentionError) {
        console.error("Mention notification error:", mentionError);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rushes.in";
    const takeObj = newTake.toJSON();
    res.status(200).json({
      take: takeObj,
      shareUrl: `${appUrl}/take/${takeObj.id || takeObj._id?.toString()}`,
    });
  } catch (err) {
    console.error("Unhandled error in /api/takes/create:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// GET /feed
router.get("/feed", async (req, res) => {
  try {
    await connectDB();
    const user = await getApiAuthUser(req, res);
    let allowedUserIds = [];
    let blockedIds = [];

    if (user) {
      const currentUser = await User.findById(user.id).select("following blockedUsers");
      const followingIds = (currentUser?.following || []).map(String);
      blockedIds = (currentUser?.blockedUsers || []).map(String);
      allowedUserIds = [...new Set([user.id, ...followingIds].filter(Boolean))];
    }

    const type = req.query.type || "foryou";
    let filter = { privacy: "public" };

    if (blockedIds.length > 0) {
      filter.userId = { $nin: blockedIds };
    }

    if (type === "following") {
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      filter = { userId: { $in: allowedUserIds } };
    } else {
      if (allowedUserIds.length > 0) {
        const blockFilter = blockedIds.length > 0 ? { userId: { $nin: blockedIds } } : {};
        filter = {
          $or: [
            { privacy: "public", ...blockFilter },
            { privacy: "followers", userId: { $in: allowedUserIds.filter(id => !blockedIds.includes(id)) } }
          ]
        };
      }
    }

    const takes = await Take.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ takes: takes.map(t => ({ ...t, id: t._id.toString() })) });
  } catch (err) {
    console.error("Unhandled error in /api/takes/feed:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// POST /like
router.post("/like", async (req, res) => {
  try {
    await connectDB();
    const user = await requireApiAuth(req, res, { fromDb: true });
    if (!user) return;

    const { takeId, action } = req.body;

    const take = await Take.findById(takeId);
    if (!take) return res.status(404).json({ error: "Take not found" });

    const likes = take.likes || [];
    const updatedLikes = action === "like"
        ? [...new Set([...likes.map(String), String(user.id)])]
        : likes.map(String).filter(id => id !== String(user.id));

    take.likes = updatedLikes;
    await take.save();

    if (action === "like" && String(take.userId) !== String(user.id)) {
        await Notification.create({
            userId: take.userId,
            fromUserId: user.id,
            fromUsername: user.username || user.name,
            fromAvatar: user.avatar,
            type: "like",
            content: `${user.username || user.name} liked your take on ${take.movieTitle}`,
            referenceId: takeId
        });
    }

    res.json({ likes: updatedLikes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /upload
router.post("/upload", async (req, res) => {
  try {
    await connectDB();
    const user = await requireApiAuth(req, res);
    if (!user) return;

    const { file, fileType } = req.body;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const resource_type = fileType === "video" ? "video" : "image";

    const result = await cloudinary.uploader.upload(file, {
      folder: "rushes_takes",
      resource_type,
    });

    res.status(200).json({
      url: result.secure_url,
      type: resource_type,
    });
  } catch (err) {
    console.error("Take media upload error:", err);
    res.status(500).json({ error: "Failed to upload media" });
  }
});

// GET /:id/comments
router.get("/:id/comments", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const comments = await Comment.find({ postId: id, isDeleted: false })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      comments: comments.map(c => ({ ...c, id: c._id.toString() }))
    });
  } catch (err) {
    console.error("Take comments GET error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /:id/comments
router.post("/:id/comments", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const user = await requireApiAuth(req, res, { fromDb: true });
    if (!user) return;

    const { content, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    const take = await Take.findById(id);
    if (!take) return res.status(404).json({ error: "Take not found" });

    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findOne({ _id: parentId, postId: id, isDeleted: false });
      if (!parentComment) return res.status(404).json({ error: "Parent reply not found" });
    }

    const comment = await Comment.create({
      postId: id,
      authorId: user.id,
      parentId: parentComment ? parentComment._id.toString() : null,
      path: parentComment
        ? [parentComment.path, parentComment._id.toString()].filter(Boolean).join(".")
        : "",
      content: sanitizeText(content, { maxLength: 280, preserveNewLines: true }),
      authorCache: {
        username: user.username || user.name || "Anonymous",
        displayName: user.displayName || user.name || user.username || "Anonymous",
        avatar: user.avatar || null,
      },
    });

    await Take.findByIdAndUpdate(id, { $inc: { replyCount: 1 } });
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment._id, { $inc: { "stats.replies": 1 } });
    }

    if (String(take.userId) !== String(user.id)) {
      try {
        await Notification.create({
          userId: take.userId,
          fromUserId: user.id,
          fromUsername: user.username || user.name,
          fromAvatar: user.avatar || null,
          type: "reply",
          content: `@${user.username || user.name} replied to your take`,
          referenceId: id,
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
    }

    const savedComment = comment.toJSON();
    return res.status(200).json({
      comment: { ...savedComment, id: savedComment.id || savedComment._id?.toString() },
    });
  } catch (err) {
    console.error("Take comments POST error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /:id/comments
router.delete("/:id/comments", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const user = await requireApiAuth(req, res);
    if (!user) return;

    const { commentId } = req.body;
    if (!commentId) return res.status(400).json({ error: "Missing commentId" });

    const [take, comment] = await Promise.all([
      Take.findById(id).select("userId"),
      Comment.findOne({ _id: commentId, postId: id }),
    ]);
    if (!take) return res.status(404).json({ error: "Take not found" });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (String(comment.authorId) !== String(user.id) && String(take.userId) !== String(user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const descendantPattern = new RegExp(`(^|\\.)${comment._id.toString()}(\\.|$)`);
    const deleteFilter = {
      postId: id,
      $or: [
        { _id: comment._id },
        { path: { $regex: descendantPattern } },
      ],
    };
    const deleteResult = await Comment.deleteMany(deleteFilter);
    const deletedCount = Math.max(1, deleteResult.deletedCount || 0);

    await Take.findByIdAndUpdate(id, { $inc: { replyCount: -deletedCount } });
    if (comment.parentId) {
      await Comment.findByIdAndUpdate(comment.parentId, { $inc: { "stats.replies": -1 } });
    }

    return res.status(200).json({ success: true, deletedCount });
  } catch (err) {
    console.error("Take comments DELETE error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const take = await Take.findById(id).lean();
    if (!take) return res.status(404).json({ error: "Take not found" });
    res.status(200).json({ take: { ...take, id: take._id.toString() } });
  } catch (err) {
    console.error("Take GET error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /:id
router.delete("/:id", async (req, res) => {
  try {
    await connectDB();
    const user = await requireApiAuth(req, res);
    if (!user) return;

    const { id } = req.params;
    const take = await Take.findById(id);
    if (!take) return res.status(404).json({ error: "Take not found" });

    if (String(take.userId) !== String(user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Take.findByIdAndDelete(id);
    await Comment.deleteMany({ postId: id });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Take DELETE error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
