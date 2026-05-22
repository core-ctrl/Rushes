import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getUserConversations } from '../../../services/messagingService.js';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const decoded = getUserFromRequest(req);
    const userId = session?.user?.id || decoded?.id;
    if (!userId) return res.status(401).end();

    try {
        const conversations = await getUserConversations(userId);
        res.json({ conversations });
    } catch (err) {
        console.error('Conversations error:', err);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
}
