import { connectDB } from "@/lib/mongodb.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export async function getOrCreateConversation(userId1, userId2) {
  await connectDB();
  const participants = [userId1, userId2].map(String).sort();
  let conversation = await Conversation.findOne({ participants: { $all: participants, $size: 2 } });

  if (!conversation) {
    conversation = await Conversation.create({ participants });
  }

  return conversation.populate("participants", "username displayName avatar");
}

export async function getUserConversations(userId) {
  await connectDB();
  const conversations = await Conversation.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .populate("participants", "username displayName avatar")
    .populate("lastMessage")
    .lean();

  return conversations.map((conversation) => {
    const otherUser = conversation.participants.find((participant) => participant._id.toString() !== userId.toString());
    const unreadCount = conversation.unreadCounts?.find((entry) => entry.userId?.toString() === userId.toString())?.count || 0;

    return {
      _id: conversation._id.toString(),
      id: conversation._id.toString(),
      otherUser,
      lastMessage: conversation.lastMessage,
      unreadCount,
      updatedAt: conversation.updatedAt,
    };
  });
}

export async function sendMessage(conversationId, senderId, receiverId, content = "", movieCard = null, voiceUrl = null) {
  await connectDB();

  const message = await Message.create({
    conversationId,
    senderId,
    receiverId,
    content,
    movieCard,
    voiceUrl,
    status: "sent",
  });

  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();

    const receiverUnread = conversation.unreadCounts.find((entry) => entry.userId.toString() === receiverId.toString());
    if (receiverUnread) {
      receiverUnread.count += 1;
    } else {
      conversation.unreadCounts.push({ userId: receiverId, count: 1 });
    }

    await conversation.save();
  }

  message.status = "delivered";
  await message.save();

  return message.toObject();
}

export async function markAsRead(conversationId, userId) {
  await connectDB();
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return;

  const unreadEntry = conversation.unreadCounts.find((entry) => entry.userId.toString() === userId.toString());
  if (unreadEntry) {
    unreadEntry.count = 0;
    await conversation.save();
  }

  await Message.updateMany(
    { conversationId, receiverId: userId, status: { $ne: "read" } },
    { status: "read" }
  );
}

export async function getConversationMessages(conversationId, limit = 100) {
  await connectDB();
  return Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
}

export async function clearConversationMessages(conversationId) {
  await connectDB();
  await Message.deleteMany({ conversationId });
  await Conversation.findByIdAndDelete(conversationId);
}
