import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await dbConnect();
    const { targetUserId, action } = req.body; // action: 'follow' | 'unfollow'

    try {
        if (action === 'follow') {
            await User.findByIdAndUpdate(user.id, {
                $addToSet: { following: targetUserId }
            });
            await User.findByIdAndUpdate(targetUserId, {
                $addToSet: { followers: user.id }
            });

            // Send notification via Supabase
            const targetUser = await User.findById(targetUserId).select('username');
            await supabase.from('notifications').insert({
                user_id: targetUserId,
                from_user_id: user.id,
                from_username: user.username || user.name,
                from_avatar: user.avatar,
                type: 'follow',
                content: `${user.name || user.username} started following you`
            });
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
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
