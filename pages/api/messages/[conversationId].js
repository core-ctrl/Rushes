import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getConversationMessages,
  getOrCreateConversation,
  markAsRead,
  sendMessage,
  clearConversationMessages,
} from "../../../services/messagingService.js";
import { getUserFromRequest } from "../../../lib/auth";

function parseParticipantIds(conversationId) {
  return String(conversationId || "").split("_").filter(Boolean);
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const decoded = getUserFromRequest(req);
  const currentUserId = session?.user?.id || decoded?.id;
  if (!currentUserId) return res.status(401).end();

  const { conversationId } = req.query;
  const participantIds = parseParticipantIds(conversationId);
  const otherUserId = req.body?.receiverId || participantIds.find((id) => id !== currentUserId);

  if (!otherUserId) {
    return res.status(400).json({ error: "Missing receiver" });
  }

  const conversation = await getOrCreateConversation(currentUserId, otherUserId);

  if (req.method === "GET") {
    const messages = await getConversationMessages(conversation._id);
    await markAsRead(conversation._id, currentUserId);
    return res.json({ messages, conversationId: conversation._id.toString() });
  }

  if (req.method === "POST") {
    const { content = "", movieCard = null, voiceUrl = null } = req.body;
    const message = await sendMessage(conversation._id, currentUserId, otherUserId, content, movieCard, voiceUrl);
    return res.json({ message, conversationId: conversation._id.toString() });
  }

  if (req.method === "DELETE") {
    await clearConversationMessages(conversation._id);
    return res.json({ success: true });
  }

  return res.status(405).end();
}
