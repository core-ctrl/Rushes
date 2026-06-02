import { connectDB } from '../../../lib/mongodb';
import Take from '../../../models/Take';
import Notification from '../../../models/Notification';
import { requireApiAuth } from '../../../lib/apiAuth';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await connectDB();
        const user = await requireApiAuth(req, res, { fromDb: true });
        if (!user) return;

        const { takeId, action } = req.body;

        const take = await Take.findById(takeId);
        if (!take) return res.status(404).json({ error: 'Take not found' });

        const likes = take.likes || [];
        const updatedLikes = action === 'like'
            ? [...new Set([...likes.map(String), String(user.id)])]
            : likes.map(String).filter(id => id !== String(user.id));

        take.likes = updatedLikes;
        await take.save();

        if (action === 'like' && String(take.userId) !== String(user.id)) {
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
