// pages/api/user/list.js
// GET: fetch wishlist | POST: add to wishlist | DELETE: remove from wishlist
import { connectDB } from "@/lib/mongodb";
// pages/api/user/list.js
import { requireAuth } from "@/middleware/requireAuth";
import { validate, watchlistSchema } from "@/middleware/validate";
import * as WatchlistService from "@/services/watchlistService";

export default async function handler(req, res) {
  const decoded = await requireAuth(req, res);
  if (!decoded) return res.status(401).json({ error: "Not authenticated" });

  if (req.method === "GET") {
    const list = await WatchlistService.getWatchlist(decoded.id);
    return res.status(200).json({ list });
  }

  if (req.method === "POST") {
    const { success, data, error } = validate(watchlistSchema, req.body);
    if (!success) return res.status(400).json({ error });
    await WatchlistService.addToWatchlist(decoded.id, data);
    return res.status(200).json({ message: "Added" });
  }

  if (req.method === "DELETE") {
    const { mediaId, mediaType } = req.query;
    await WatchlistService.removeFromWatchlist(decoded.id, mediaId, mediaType);
    return res.status(200).json({ message: "Removed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}


