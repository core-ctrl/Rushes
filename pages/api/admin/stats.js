import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import Report from '../../../models/Report';
import { requireAdmin } from '../../../middleware/requireAdmin';

import Take from '../../../models/Take';

export default requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  await connectDB();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalUsers, pendingReports, dau, signups, totalTakes] = await Promise.all([
    User.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    User.countDocuments({ lastSeen: { $gte: yesterday } }),
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%m/%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Take.countDocuments()
  ]);

  // Recent users for the overview tab
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email createdAt wishlist isAdmin avatar username')
    .lean();

  res.json({
    totalUsers,
    dau,
    pendingReports,
    totalTakes,
    signupsChart: signups.map((s) => ({ date: s._id, count: s.count })),
    recentUsers,
    totalWishlists: recentUsers.reduce((acc, u) => acc + (u.wishlist?.length || 0), 0),
  });
});
