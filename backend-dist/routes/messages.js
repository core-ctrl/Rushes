const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const {
  getUserConversations,
  getConversationMessages,
  markAsRead,
  sendMessage,
  clearConversationMessages,
  getOrCreateConversation
} = require('../services/messagingService');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

function parseParticipantIds(conversationId) {
  return String(conversationId || "").split("_").filter(Boolean);
}

// GET /api/messages/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const conversations = await getUserConversations(userId);
    res.json({ conversations });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/messages/unread
router.get('/unread', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const conversations = await getUserConversations(userId);
    const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    res.json({ totalUnread });
  } catch (err) {
    console.error("Unread messages error:", err);
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
});

// GET /api/messages/:conversationId
router.get('/:conversationId', requireAuth, async (req, res) => {
  const currentUserId = req.user.id;
  const { conversationId } = req.params;

  try {
    let conversation;
    if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        const participantIds = parseParticipantIds(conversationId);
        const otherUserId = req.body?.receiverId || participantIds.find((id) => id !== currentUserId) || participantIds[0];
        if (!otherUserId) return res.status(400).json({ error: "Missing receiver" });
        conversation = await getOrCreateConversation(currentUserId, otherUserId);
      }
    } else {
      const participantIds = parseParticipantIds(conversationId);
      const otherUserId = req.body?.receiverId || participantIds.find((id) => id !== currentUserId);
      if (!otherUserId) {
        return res.status(400).json({ error: "Missing receiver" });
      }
      conversation = await getOrCreateConversation(currentUserId, otherUserId);
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await getConversationMessages(conversation._id);
    await markAsRead(conversation._id, currentUserId);
    res.json({ messages, conversationId: conversation._id.toString() });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// POST /api/messages/:conversationId
router.post('/:conversationId', requireAuth, async (req, res) => {
  const currentUserId = req.user.id;
  const { conversationId } = req.params;
  const { content = "", movieCard = null, voiceUrl = null, receiverId } = req.body;

  try {
    let conversation;
    let otherUserId = receiverId;

    if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        const participantIds = parseParticipantIds(conversationId);
        otherUserId = otherUserId || participantIds.find((id) => id !== currentUserId) || participantIds[0];
        if (!otherUserId) return res.status(400).json({ error: "Missing receiver" });
        conversation = await getOrCreateConversation(currentUserId, otherUserId);
      } else {
        otherUserId = otherUserId || conversation.participants.find(id => id.toString() !== currentUserId)?.toString();
      }
    } else {
      const participantIds = parseParticipantIds(conversationId);
      otherUserId = otherUserId || participantIds.find((id) => id !== currentUserId);
      if (!otherUserId) {
        return res.status(400).json({ error: "Missing receiver" });
      }
      conversation = await getOrCreateConversation(currentUserId, otherUserId);
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const message = await sendMessage(conversation._id, currentUserId, otherUserId, content, movieCard, voiceUrl);
    res.json({ message, conversationId: conversation._id.toString() });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// PATCH /api/messages/:conversationId
router.patch('/:conversationId', requireAuth, async (req, res) => {
  const currentUserId = req.user.id;
  const { conversationId } = req.params;
  const { action, messageId, content, emoji } = req.body;

  try {
    let conversation;
    if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
      const participantIds = parseParticipantIds(conversationId);
      const otherUserId = req.body?.receiverId || participantIds.find((id) => id !== currentUserId);
      if (otherUserId) {
        conversation = await getOrCreateConversation(currentUserId, otherUserId);
      }
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (action === 'markRead') {
      await markAsRead(conversation._id, currentUserId);
      return res.json({ success: true });
    }

    if (action === 'react' && messageId && emoji) {
      const msg = await Message.findById(messageId);
      if (msg) {
        msg.reactions = msg.reactions || [];
        const existingIdx = msg.reactions.findIndex(r => r.userId.toString() === currentUserId.toString() && r.emoji === emoji);
        if (existingIdx >= 0) msg.reactions.splice(existingIdx, 1);
        else msg.reactions.push({ userId: currentUserId, emoji, createdAt: new Date() });
        await msg.save();
        return res.json({ success: true, message: msg });
      }
    }

    if (action === 'edit' && messageId && content) {
      const msg = await Message.findOne({ _id: messageId, senderId: currentUserId });
      if (msg) {
        msg.editHistory = msg.editHistory || [];
        msg.editHistory.push({ content: msg.content, editedAt: new Date() });
        msg.content = content;
        msg.editedAt = new Date();
        msg.isEdited = true;
        await msg.save();
        return res.json({ success: true, message: msg });
      }
    }

    if (action === 'delete' && messageId) {
      const msg = await Message.findOne({ _id: messageId, senderId: currentUserId });
      if (msg) {
        msg.isDeleted = true;
        msg.deletedAt = new Date();
        msg.content = "This message was deleted";
        msg.movieCard = null;
        msg.mediaUrl = null;
        await msg.save();
        return res.json({ success: true, message: msg });
      }
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Patch message error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// DELETE /api/messages/:conversationId
router.delete('/:conversationId', requireAuth, async (req, res) => {
  const currentUserId = req.user.id;
  const { conversationId } = req.params;

  try {
    let conversation;
    if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
      const participantIds = parseParticipantIds(conversationId);
      const otherUserId = participantIds.find((id) => id !== currentUserId);
      if (otherUserId) {
        conversation = await Conversation.findOne({ participants: { $all: [currentUserId, otherUserId].sort() } });
      }
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await clearConversationMessages(conversation._id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

module.exports = router;
