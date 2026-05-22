// pages/api/admin/reports.js
import { connectDB } from '../../../lib/mongodb';
import Report from '../../../models/Report';
import User from '../../../models/User';
import { requireAdmin } from '../../../middleware/requireAdmin';

export default requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  await connectDB();

  const reports = await Report.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Enrich with reporter info
  const enriched = await Promise.all(
    reports.map(async (r) => {
      let reporterEmail = 'anonymous';
      let targetUsername = r.targetId || 'unknown';

      if (r.reportedBy) {
        const reporter = await User.findById(r.reportedBy).select('email').lean();
        if (reporter) reporterEmail = reporter.email;
      }

      return {
        _id: r._id.toString(),
        type: r.targetType || 'user',
        targetUsername,
        description: r.reason || 'No description provided',
        reporterEmail,
        createdAt: r.createdAt,
      };
    })
  );

  res.json({ reports: enriched });
});
