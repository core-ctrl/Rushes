const express = require('express');
const router = express.Router();
const List = require('../models/List');
const { requireAuth } = require('../middleware/requireAuth');
const { connectDB } = require('../lib/mongodb');

// Optional auth helper for GET routes
const getUserIdFromReq = (req) => {
  const jwt = require("jsonwebtoken");
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.id;
    } catch (e) {}
  }
  return null;
};

// GET /api/lists
router.get('/', async (req, res) => {
  try {
    await connectDB();
    const currentUserId = getUserIdFromReq(req);
    const { userId } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
      if (String(currentUserId) !== String(userId)) {
        query.privacy = "public";
      }
    }

    const lists = await List.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "username displayName avatar");

    return res.status(200).json({ lists });
  } catch (error) {
    console.error("Fetch lists error:", error);
    return res.status(500).json({ error: "Failed to fetch lists" });
  }
});

// POST /api/lists
router.post('/', requireAuth, async (req, res) => {
  try {
    await connectDB();
    const currentUserId = req.user.id;
    const { title, description, privacy, coverImage } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const list = await List.create({
      userId: currentUserId,
      title,
      description,
      privacy,
      coverImage
    });

    return res.status(201).json({ list });
  } catch (error) {
    console.error("Create list error:", error);
    return res.status(500).json({ error: "Failed to create list" });
  }
});

// GET /api/lists/:id
router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    const currentUserId = getUserIdFromReq(req);
    const { id } = req.params;

    const list = await List.findById(id).populate("userId", "username displayName avatar");
    if (!list) return res.status(404).json({ error: "List not found" });

    if (list.privacy === "private" && String(list.userId._id) !== String(currentUserId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({ list });
  } catch (error) {
    console.error("Fetch list error:", error);
    return res.status(500).json({ error: "Failed to fetch list" });
  }
});

// PUT /api/lists/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    await connectDB();
    const currentUserId = req.user.id;
    const { id } = req.params;

    const list = await List.findById(id);
    if (!list) return res.status(404).json({ error: "List not found" });
    if (String(list.userId) !== String(currentUserId)) return res.status(403).json({ error: "Access denied" });

    const { action, movie, title, description, privacy, coverImage } = req.body;

    if (action === "add_movie") {
      if (!movie || !movie.tmdbId) {
        return res.status(400).json({ error: "Movie tmdbId is required" });
      }
      if (!list.movies.some(m => m.tmdbId === movie.tmdbId)) {
        list.movies.push(movie);
        if (!list.coverImage && movie.posterPath) {
          list.coverImage = movie.posterPath;
        }
      }
    } else if (action === "remove_movie") {
      if (!movie || !movie.tmdbId) {
        return res.status(400).json({ error: "Movie tmdbId is required" });
      }
      list.movies = list.movies.filter(m => m.tmdbId !== movie.tmdbId);
    } else {
      if (title !== undefined) list.title = title;
      if (description !== undefined) list.description = description;
      if (privacy !== undefined) list.privacy = privacy;
      if (coverImage !== undefined) list.coverImage = coverImage;
    }

    await list.save();
    return res.status(200).json({ list });
  } catch (error) {
    console.error("Update list error:", error);
    return res.status(500).json({ error: "Failed to update list" });
  }
});

// DELETE /api/lists/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await connectDB();
    const currentUserId = req.user.id;
    const { id } = req.params;

    const list = await List.findById(id);
    if (!list) return res.status(404).json({ error: "List not found" });
    if (String(list.userId) !== String(currentUserId)) return res.status(403).json({ error: "Access denied" });

    await List.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete list error:", error);
    return res.status(500).json({ error: "Failed to delete list" });
  }
});

module.exports = router;
