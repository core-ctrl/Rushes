
// pages/api/user/history.js
import { requireAuth } from "@/middleware/requireAuth";
import * as WatchlistService from "@/services/watchlistService";

export default async function handler(req, res) {
  const decoded = await requireAuth(req, res);
  if (!decoded) return res.status(401).json({ error: "Not authenticated" });

  if (req.method === "GET") {
    const history = await WatchlistService.getHistory(decoded.id);
    return res.status(200).json({ history });
  }

  if (req.method === "POST") {
    const { mediaId, mediaType, title, posterPath } = req.body;
    await WatchlistService.addToHistory(decoded.id, { mediaId, mediaType, title, posterPath });
    return res.status(200).json({ message: "Added to history" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
