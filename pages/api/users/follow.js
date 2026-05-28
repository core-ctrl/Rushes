import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();
  const { targetUserId, action } = req.body;

  if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required' });

  try {
    // Check if either user has blocked the other
    const [currentUser, targetUser] = await Promise.all([
      User.findById(user.id).select('blockedUsers'),
      User.findById(targetUserId).select('blockedUsers username'),
    ]);

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const currentBlocked = (currentUser?.blockedUsers || []).map(String);
    const targetBlocked = (targetUser?.blockedUsers || []).map(String);

    if (action === 'follow') {
      // Prevent following if either user has blocked the other
      if (currentBlocked.includes(targetUserId)) {
        return res.status(403).json({ error: 'You have blocked this user. Unblock them first.' });
      }
      if (targetBlocked.includes(user.id)) {
        return res.status(403).json({ error: 'Unable to follow this user.' });
      }

      await User.findByIdAndUpdate(user.id, {
        $addToSet: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: user.id }
      });

      // Send notification via Supabase
      try {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          from_user_id: user.id,
          from_username: user.username || user.name,
          from_avatar: user.avatar,
          type: 'follow',
          content: `${user.name || user.username} started following you`
        });
      } catch (e) {
        // Don't fail the follow if notification fails
      }
    } else {
      await User.findByIdAndUpdate(user.id, {
        $pull: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: user.id }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Follow API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
