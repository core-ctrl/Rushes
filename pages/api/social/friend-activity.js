import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ activity: {} });

    await dbConnect();
    const { tmdbIds } = req.body;

    try {
        const currentUser = await User.findById(user.id).select('following');
        if (!currentUser?.following?.length) return res.json({ activity: {} });

        const friends = await User.find({
            _id: { $in: currentUser.following }
        }).select('username avatar likedMovies watchedMovies');

        const activity = {};
        for (const friend of friends) {
            const allInteracted = [
                ...(friend.likedMovies || []),
                ...(friend.watchedMovies || [])
            ];
            for (const item of allInteracted) {
                if (tmdbIds.includes(item.tmdbId)) {
                    if (!activity[item.tmdbId]) activity[item.tmdbId] = [];
                    activity[item.tmdbId].push({
                        username: friend.username || friend.name,
                        avatar: friend.avatar
                    });
                }
            }
        }

        res.json({ activity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
