import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId, action } = req.body;

  if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required' });
  if (!['block', 'unblock'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  await connectDB();

  try {
    if (action === 'block') {
      await User.findByIdAndUpdate(user.id, {
        $addToSet: { blockedUsers: targetUserId },
        $pull: { following: targetUserId, followers: targetUserId },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { following: user.id, followers: user.id },
      });
    } else {
      await User.findByIdAndUpdate(user.id, {
        $pull: { blockedUsers: targetUserId },
      });
    }

    res.json({ success: true, action });
  } catch (error) {
    console.error('Block API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
