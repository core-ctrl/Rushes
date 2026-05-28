import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export default async function handler(req, res) {
    await dbConnect();
    const { username } = req.query;

    try {
        const user = await User.findOne({ username })
            .select('username avatar bio following followers likedMovies watchedMovies tasteProfile createdAt ottPlatforms isVerified isAdmin')
            .lean();

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Count followers/following
        user.followersCount = user.followers?.length || 0;
        user.followingCount = user.following?.length || 0;

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
