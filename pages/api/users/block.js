import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();
    await dbConnect();

    const { targetUserId, action } = req.body;

    if (action === 'block') {
        await User.findByIdAndUpdate(session.user.id, {
            $addToSet: { blockedUsers: targetUserId },
            $pull: { following: targetUserId, followers: targetUserId },
        });
        await User.findByIdAndUpdate(targetUserId, {
            $pull: { following: session.user.id, followers: session.user.id },
        });
    } else {
        await User.findByIdAndUpdate(session.user.id, {
            $pull: { blockedUsers: targetUserId },
        });
    }

    res.json({ success: true });
}
