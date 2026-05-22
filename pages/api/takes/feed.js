import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import Take from '../../../models/Take';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    let allowedUserIds = [];

    if (user) {
      const currentUser = await User.findById(user.id).select('following');
      const followingIds = (currentUser?.following || []).map(String);
      allowedUserIds = [...new Set([user.id, ...followingIds].filter(Boolean))];
    }

    let filter = { privacy: 'public' };

    if (allowedUserIds.length > 0) {
      filter = {
        $or: [
          { privacy: 'public' },
          { privacy: 'followers', userId: { $in: allowedUserIds } }
        ]
      };
    }

    const takes = await Take.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ takes: takes.map(t => ({ ...t, id: t._id.toString() })) });
  } catch (err) {
    console.error('Unhandled error in /api/takes/feed:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

