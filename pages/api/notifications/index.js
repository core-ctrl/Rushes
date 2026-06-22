import { connectDB } from '../../../lib/mongodb';
import Notification from '../../../models/Notification';
import { getUserFromRequest } from '../../../lib/auth';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await connectDB();
    
    let userId = null;
    const decoded = getUserFromRequest(req);
    if (decoded && decoded.id) {
      userId = decoded.id;
    } else {
      const session = await getServerSession(req, res, authOptions);
      if (session && session.user && session.user.id) {
        userId = session.user.id;
      }
    }

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const notifications = await Notification.find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();
      
      return res.json({ notifications: notifications.map(n => ({ ...n, id: n._id.toString() })) });
    }

    if (req.method === 'PUT') {
      await Notification.updateMany({ userId: userId }, { $set: { read: true } });
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notifications API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
