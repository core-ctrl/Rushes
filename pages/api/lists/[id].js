import { connectDB } from "../../../lib/mongodb";
import List from "../../../models/List";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  await connectDB();
  const session = await getServerSession(req, res, authOptions);
  const decoded = getUserFromRequest(req);
  const currentUserId = session?.user?.id || decoded?.id;

  const { id } = req.query;

  if (req.method === "GET") {
    try {
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
  }

  // Require auth for modifications
  if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "PUT") {
    try {
      const list = await List.findById(id);
      if (!list) return res.status(404).json({ error: "List not found" });
      if (String(list.userId) !== String(currentUserId)) return res.status(403).json({ error: "Access denied" });

      const { action, movie, title, description, privacy, coverImage } = req.body;

      if (action === "add_movie") {
        if (!list.movies.some(m => String(m.tmdbId) === String(movie.tmdbId))) {
          list.movies.push(movie);
          list.markModified('movies');
          if (!list.coverImage && movie.posterPath) {
            list.coverImage = movie.posterPath;
            list.markModified('coverImage');
          }
        }
      } else if (action === "remove_movie") {
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
  }

  if (req.method === "DELETE") {
    try {
      const list = await List.findById(id);
      if (!list) return res.status(404).json({ error: "List not found" });
      if (String(list.userId) !== String(currentUserId)) return res.status(403).json({ error: "Access denied" });

      await List.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Delete list error:", error);
      return res.status(500).json({ error: "Failed to delete list" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
