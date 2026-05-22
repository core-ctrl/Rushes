import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getUserConversations } from "../../../services/messagingService.js";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const decoded = getUserFromRequest(req);
  const userId = session?.user?.id || decoded?.id;
  if (!userId) return res.status(401).end();

  try {
    const conversations = await getUserConversations(userId);
    const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    res.json({ totalUnread });
  } catch (err) {
    console.error("Unread messages error:", err);
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
}
