import { connectDB } from '../../../lib/mongodb';
import Take from '../../../models/Take';
import Notification from '../../../models/Notification';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await connectDB();
        const user = getUserFromRequest(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { takeId, action } = req.body;

        const take = await Take.findById(takeId);
        if (!take) return res.status(404).json({ error: 'Take not found' });

        const likes = take.likes || [];
        const updatedLikes = action === 'like'
            ? [...new Set([...likes, user.id])]
            : likes.filter(id => id !== user.id);

        take.likes = updatedLikes;
        await take.save();

        if (action === 'like' && take.userId !== user.id) {
            await Notification.create({
                userId: take.userId,
                fromUserId: user.id,
                fromUsername: user.username || user.name,
                fromAvatar: user.avatar,
                type: 'like',
                content: `${user.username || user.name} liked your take on ${take.movieTitle}`,
                referenceId: takeId
            });
        }

        res.json({ likes: updatedLikes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
