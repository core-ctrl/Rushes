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

  let conversation;
  let otherUserId;

  // If conversationId is a 24-character hex string, it could be a Conversation ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
    // Import Conversation locally to avoid top-level import issues if not already there
    const Conversation = require("../../../models/Conversation.js").default || require("../../../models/Conversation.js");
    const { connectDB } = require("../../../lib/mongodb.js");
    await connectDB();
    
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      // Fallback: it might be a single user ID
      const participantIds = parseParticipantIds(conversationId);
      otherUserId = req.body?.receiverId || participantIds.find((id) => id !== currentUserId) || participantIds[0];
      if (!otherUserId) return res.status(400).json({ error: "Missing receiver" });
      conversation = await getOrCreateConversation(currentUserId, otherUserId);
    } else {
      // Found the actual conversation in the DB!
      otherUserId = req.body?.receiverId || conversation.participants.find(id => id.toString() !== currentUserId)?.toString();
    }
  } else {
    // Normal case: "userId1_userId2"
    const participantIds = parseParticipantIds(conversationId);
    otherUserId = req.body?.receiverId || participantIds.find((id) => id !== currentUserId);

    if (!otherUserId) {
      return res.status(400).json({ error: "Missing receiver" });
    }

    conversation = await getOrCreateConversation(currentUserId, otherUserId);
  }

  // Double check conversation exists
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

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
