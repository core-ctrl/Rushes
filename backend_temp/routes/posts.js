const express = require("express");
const router = express.Router();
const { connectDB } = require("../lib/mongodb");
const { getApiAuthUser, requireApiAuth } = require("../middleware/requireAuth");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sanitizeText } = require("../lib/security");

// POST /create
router.post("/create", async (req, res) => {
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const { content, postType = "text", media, tmdbRef, poll, isSpoiler, visibility, mentions, hashtags, mood, parentPostId } = req.body;

    if (!content && !media?.length && !poll) {
      return res.status(400).json({ error: "Post must have content, media, or a poll" });
    }

    const postData = {
      authorId: user.id,
      postType,
      content: content ? sanitizeText(content, { maxLength: 2800, preserveNewLines: true }) : "",
      media: media || [],
      tmdbRef: tmdbRef || null,
      isSpoiler: !!isSpoiler,
      visibility: visibility || "public",
      mentions: mentions || [],
      hashtags: hashtags || [],
      mood: mood || null,
      authorCache: {
        username: user.username,
        displayName: user.displayName || user.name,
        avatar: user.avatar
      },
    };

    if (postType === "poll" && poll) {
      postData.poll = {
        question: sanitizeText(poll.question, { maxLength: 280 }),
        options: (poll.options || []).slice(0, 6).map(opt => ({
          text: sanitizeText(opt, { maxLength: 100 }),
          votes: []
        })),
        expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalVotes: 0
      };
    }

    if ((postType === "repost" || postType === "quote") && parentPostId) {
      postData.parentPostId = parentPostId;
      await Post.findByIdAndUpdate(parentPostId, {
        $inc: { [`stats.${postType === "repost" ? "reposts" : "quotes"}`]: 1 }
      });
    }

    const post = await Post.create(postData);

    res.status(201).json({
      success: true,
      post: { ...post.toObject(), id: post._id.toString(), isLiked: false, isSaved: false, likeCount: 0, commentCount: 0 }
    });
  } catch (error) {
    console.error("[Create Post Error]", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// GET /feed
router.get("/feed", async (req, res) => {
  await connectDB();
  const user = await getApiAuthUser(req, res);

  const { cursor, limit = 20, type = "foryou" } = req.query;
  const pageLimit = Math.min(parseInt(limit) || 20, 50);

  try {
    let query = { isDeleted: { $ne: true }, visibility: "public" };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    if (type === "following" && user) {
      const currentUser = await User.findById(user.id).select("following blockedUsers").lean();
      const following = currentUser?.following || [];
      const blockedIds = (currentUser?.blockedUsers || []).map(b => typeof b === "string" ? b : b.userId);
      
      if (following.length === 0) {
        return res.status(200).json({ posts: [], nextCursor: null, hasMore: false });
      }
      query.authorId = { $in: following, $nin: blockedIds };
    } else if (type === "trending") {
      query.createdAt = { ...query.createdAt, $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    if (user) {
      const currentUser = await User.findById(user.id).select("blockedUsers").lean();
      const blockedIds = (currentUser?.blockedUsers || []).map(b => typeof b === "string" ? b : b.userId);
      if (blockedIds.length > 0 && !query.authorId) {
        query.authorId = { $nin: blockedIds };
      }
    }

    const sortField = type === "trending" ? { trendingScore: -1, createdAt: -1 } : { createdAt: -1 };

    const posts = await Post.find(query)
      .sort(sortField)
      .limit(pageLimit + 1)
      .lean();

    const hasMore = posts.length > pageLimit;
    const results = hasMore ? posts.slice(0, pageLimit) : posts;

    const enrichedPosts = results.map(post => ({
      ...post,
      id: post._id.toString(),
      isLiked: user ? (post.likes || []).includes(user.id) : false,
      isSaved: user ? (post.savedBy || []).includes(user.id) : false,
      likeCount: (post.likes || []).length,
      commentCount: post.stats?.replies || 0,
    }));

    const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

    res.status(200).json({ posts: enrichedPosts, nextCursor, hasMore });
  } catch (error) {
    console.error("[Feed API Error]", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

// GET /trending
router.get("/trending", async (req, res) => {
  await connectDB();
  const user = await getApiAuthUser(req, res);

  const { period = "7d", limit = 10 } = req.query;
  const pageLimit = Math.min(parseInt(limit) || 10, 30);

  const periodMap = { "24h": 1, "7d": 7, "30d": 30 };
  const days = periodMap[period] || 7;

  try {
    const posts = await Post.find({
      isDeleted: { $ne: true },
      visibility: "public",
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    })
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(pageLimit)
      .lean();

    const enriched = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      isLiked: user ? (post.likes || []).includes(user.id) : false,
      isSaved: user ? (post.savedBy || []).includes(user.id) : false,
      likeCount: (post.likes || []).length,
      commentCount: post.stats?.replies || 0,
    }));

    res.status(200).json({ posts: enriched });
  } catch (error) {
    console.error("[Trending API Error]", error);
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

// GET /:id/comments
router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await getApiAuthUser(req, res);
  const { cursor, limit = 20, parentId = null } = req.query;
  const pageLimit = Math.min(parseInt(limit) || 20, 50);

  try {
    let query = { postId: id, isDeleted: { $ne: true } };
    
    if (parentId && parentId !== "null") {
      query.parentId = parentId;
    } else {
      query.parentId = null;
    }
    
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(pageLimit + 1)
      .lean();

    const hasMore = comments.length > pageLimit;
    const results = hasMore ? comments.slice(0, pageLimit) : comments;

    const enrichedComments = results.map(c => ({
      ...c,
      id: c._id.toString(),
      isLiked: user ? (c.likes || []).includes(user.id) : false,
      likeCount: (c.likes || []).length,
    }));

    const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

    res.status(200).json({ comments: enrichedComments, nextCursor, hasMore });
  } catch (error) {
    console.error("[Get Comments Error]", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /:id/comments
router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const { content, parentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Comment cannot be empty" });

    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });

    let path = "";
    if (parentId) {
      const parent = await Comment.findById(parentId).lean();
      if (parent) {
        path = parent.path ? `${parent.path}.${parentId}` : parentId;
      }
    }

    const comment = await Comment.create({
      postId: id,
      authorId: user.id,
      parentId: parentId || null,
      path,
      content: sanitizeText(content, { maxLength: 2000, preserveNewLines: true }),
      authorCache: {
        username: user.username || user.name,
        displayName: user.displayName || user.name,
        avatar: user.avatar
      },
    });

    await Post.findByIdAndUpdate(id, { $inc: { "stats.replies": 1 } });

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $inc: { "stats.replies": 1 } });
    }

    if (post.authorId !== user.id) {
      await Notification.create({
        userId: post.authorId,
        fromUserId: user.id,
        fromUsername: user.username || user.name,
        fromAvatar: user.avatar,
        type: parentId ? "reply" : "comment",
        category: "social",
        content: parentId ? "replied to a comment on your post" : "commented on your post",
        referenceId: post._id.toString(),
        referenceType: "post",
        groupKey: `comment:${post._id}`,
      });
    }

    res.status(201).json({
      success: true,
      comment: { ...comment.toObject(), id: comment._id.toString(), isLiked: false, likeCount: 0 }
    });
  } catch (error) {
    console.error("[Create Comment Error]", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await getApiAuthUser(req, res);
  
  try {
    const post = await Post.findById(id).lean();
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });

    let parentPost = null;
    if (post.parentPostId) {
      parentPost = await Post.findById(post.parentPostId).lean();
      if (parentPost) parentPost.id = parentPost._id.toString();
    }

    const recentComments = await Comment.find({ postId: id, parentId: null, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    res.status(200).json({
      post: {
        ...post,
        id: post._id.toString(),
        isLiked: user ? (post.likes || []).includes(user.id) : false,
        isSaved: user ? (post.savedBy || []).includes(user.id) : false,
        likeCount: (post.likes || []).length,
        commentCount: post.stats?.replies || 0,
        parentPost,
      },
      recentComments: recentComments.map(c => ({
        ...c,
        id: c._id.toString(),
        isLiked: user ? (c.likes || []).includes(user.id) : false,
        likeCount: (c.likes || []).length,
      })),
    });
  } catch (error) {
    console.error("[Get Post Error]", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// DELETE /:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== user.id) return res.status(403).json({ error: "Not authorized" });

    post.isDeleted = true;
    await post.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Delete Post Error]", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// PUT /:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== user.id) return res.status(403).json({ error: "Not authorized" });

    const { content } = req.body;
    if (content !== undefined) {
      post.editHistory.push({ content: post.content, editedAt: new Date() });
      post.content = sanitizeText(content, { maxLength: 2800, preserveNewLines: true });
      post.isEdited = true;
    }

    await post.save();
    res.status(200).json({ success: true, post: { ...post.toObject(), id: post._id.toString() } });
  } catch (error) {
    console.error("[Edit Post Error]", error);
    res.status(500).json({ error: "Failed to edit post" });
  }
});

// POST /:id/like
router.post("/:id/like", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });

    const isLiked = (post.likes || []).includes(user.id);

    if (isLiked) {
      post.likes = post.likes.filter(uid => uid !== user.id);
      post.stats.likes = Math.max(0, (post.stats.likes || 0) - 1);
    } else {
      post.likes.push(user.id);
      post.stats.likes = (post.stats.likes || 0) + 1;

      if (post.authorId !== user.id) {
        await Notification.create({
          userId: post.authorId,
          fromUserId: user.id,
          fromUsername: user.username || user.name,
          fromAvatar: user.avatar,
          type: "like",
          category: "social",
          content: `liked your post`,
          referenceId: post._id.toString(),
          referenceType: "post",
          groupKey: `like:${post._id}`,
        });
      }
    }

    post.trendingScore = (post.stats.likes || 0) + ((post.stats.replies || 0) * 2) + ((post.stats.reposts || 0) * 3);
    await post.save();

    res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error("[Like Post Error]", error);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// POST /:id/save
router.post("/:id/save", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });

    const isSaved = (post.savedBy || []).includes(user.id);

    if (isSaved) {
      post.savedBy = post.savedBy.filter(uid => uid !== user.id);
      post.saveCount = Math.max(0, (post.saveCount || 0) - 1);
    } else {
      post.savedBy = [...(post.savedBy || []), user.id];
      post.saveCount = (post.saveCount || 0) + 1;
    }

    await post.save();

    res.status(200).json({ success: true, isSaved: !isSaved, saveCount: post.saveCount });
  } catch (error) {
    console.error("[Save Post Error]", error);
    res.status(500).json({ error: "Failed to save post" });
  }
});

// POST /:id/vote
router.post("/:id/vote", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  const { optionIndex } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted || post.postType !== "poll") {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (post.poll.expiresAt && new Date(post.poll.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Poll has expired" });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ error: "Invalid option" });
    }

    post.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v !== user.id);
    });

    post.poll.options[optionIndex].votes.push(user.id);
    post.poll.totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    await post.save();

    res.status(200).json({
      success: true,
      poll: {
        options: post.poll.options.map(opt => ({
          text: opt.text,
          voteCount: opt.votes.length,
          percentage: post.poll.totalVotes > 0 ? Math.round((opt.votes.length / post.poll.totalVotes) * 100) : 0,
          voted: opt.votes.includes(user.id),
        })),
        totalVotes: post.poll.totalVotes,
        expiresAt: post.poll.expiresAt,
        hasVoted: true,
      }
    });
  } catch (error) {
    console.error("[Vote Error]", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

module.exports = router;
