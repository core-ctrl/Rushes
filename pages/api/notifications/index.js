import { connectDB } from '../../../lib/mongodb';
import Notification from '../../../models/Notification';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const notifications = await Notification.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();
      
      return res.json({ notifications: notifications.map(n => ({ ...n, id: n._id.toString() })) });
    }

    if (req.method === 'PUT') {
      await Notification.updateMany({ userId: user.id }, { $set: { read: true } });
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notifications API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
