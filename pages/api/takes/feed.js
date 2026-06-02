import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import Take from '../../../models/Take';
import { getApiAuthUser } from '../../../lib/apiAuth';

export default async function handler(req, res) {
  try {
    await connectDB();
    const user = await getApiAuthUser(req, res);
    let allowedUserIds = [];
    let blockedIds = [];

    if (user) {
      const currentUser = await User.findById(user.id).select('following blockedUsers');
      const followingIds = (currentUser?.following || []).map(String);
      blockedIds = (currentUser?.blockedUsers || []).map(String);
      allowedUserIds = [...new Set([user.id, ...followingIds].filter(Boolean))];
    }

    const type = req.query.type || 'foryou';
    let filter = { privacy: 'public' };

    // Filter out blocked users
    if (blockedIds.length > 0) {
      filter.userId = { $nin: blockedIds };
    }

    if (type === 'following') {
      // Only show takes from users the current user follows
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      filter = { userId: { $in: allowedUserIds } };
    } else {
      // For You feed: public takes + followers takes
      if (allowedUserIds.length > 0) {
        const blockFilter = blockedIds.length > 0 ? { userId: { $nin: blockedIds } } : {};
        filter = {
          $or: [
            { privacy: 'public', ...blockFilter },
            { privacy: 'followers', userId: { $in: allowedUserIds.filter(id => !blockedIds.includes(id)) } }
          ]
        };
      }
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
