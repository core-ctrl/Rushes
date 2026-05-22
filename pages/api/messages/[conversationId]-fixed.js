import { connectDB } from '../../../lib/mongodb.js';
import { getOrCreateConversation, sendMessage, getConversationMessages, markAsRead } from '../../../services/messagingService.js';
import User from '../../../models/User.js';

export default async function handler(req, res) {
    await connectDB();

    const { conversationId } = req.query;

    if (req.method === 'GET') {
        try {
            const messages = await getConversationMessages(conversationId);
            return res.json({ messages });
        } catch (err) {
            console.error('Get messages error:', err);
            return res.status(500).json({ error: 'Failed to get messages' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { content, movieCard, receiverId } = req.body;
            const senderId = req.headers['x-user-id'] || req.query.userId; // Assume middleware sets this

            if (!senderId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const conv = await getOrCreateConversation(senderId, receiverId);
            const message = await sendMessage(conv._id, senderId, receiverId, content, movieCard);
            return res.json({ message });
        } catch (err) {
            console.error('Send message error:', err);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

    return res.status(405).end();
}
