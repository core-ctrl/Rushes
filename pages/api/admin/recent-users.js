// pages/api/admin/recent-users.js
import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAdmin } from '../../../middleware/requireAdmin';

export default requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  await connectDB();

  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select('username name email avatar createdAt isAdmin')
    .lean();

  res.json({
    users: users.map((u) => ({
      _id: u._id.toString(),
      username: u.username || u.name,
      email: u.email,
      avatar: u.avatar || null,
      createdAt: u.createdAt,
      isAdmin: u.isAdmin || false,
    })),
  });
});
