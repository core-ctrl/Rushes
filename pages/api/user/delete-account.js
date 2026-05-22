import cookie from 'cookie';
import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import Message from '../../../models/Message';
import Take from '../../../models/Take';
import Notification from '../../../models/Notification';
import { getUserFromRequest } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectDB();

    try {
        await Message.deleteMany({ $or: [{ senderId: user.id }, { receiverId: user.id }] });
        await Take.deleteMany({ userId: user.id });
        await Notification.deleteMany({ userId: user.id });

        await User.findByIdAndDelete(user.id);

        res.setHeader(
            'Set-Cookie',
            cookie.serialize('token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: new Date(0),
                path: '/',
            })
        );

        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({ error: 'Failed to delete account' });
    }
}
