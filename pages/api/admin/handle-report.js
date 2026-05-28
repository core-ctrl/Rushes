// pages/api/admin/handle-report.js
import { connectDB } from '../../../lib/mongodb';
import Report from '../../../models/Report';
import User from '../../../models/User';
import { requireAdmin } from '../../../middleware/requireAdmin';
import { sendDecisionAlertEmail } from '../../../lib/sendEmail';

export default requireAdmin(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await connectDB();

  const { reportId, action } = req.body;

  if (!reportId || !action) {
    return res.status(400).json({ error: 'reportId and action are required' });
  }

  if (!['dismiss', 'warn', 'ban'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Use: dismiss, warn, or ban' });
  }

  const report = await Report.findById(reportId);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.status = action === 'dismiss' ? 'dismissed' : action === 'warn' ? 'warned' : 'banned';
  report.resolvedAt = new Date();
  report.resolvedBy = req.adminUser._id;
  await report.save();

  if (action === 'ban' && report.targetId) {
    // Ban the target user
    await User.findByIdAndUpdate(report.targetId, {
      isBanned: true,
      bannedAt: new Date(),
      bannedReason: report.reason,
    });

    const bannedUser = await User.findById(report.targetId).select('email username name').lean();
    if (bannedUser?.email) {
      await sendDecisionAlertEmail(
        bannedUser.email,
        bannedUser.username || bannedUser.name,
        'Your account has been banned due to a violation of our community guidelines. Please contact support if you believe this is an error.',
        'Your MovieFinder account has been suspended'
      ).catch(() => {});
    }
  } else if (action === 'warn' && report.targetId) {
    const warnedUser = await User.findById(report.targetId).select('email username name').lean();
    if (warnedUser?.email) {
      await sendDecisionAlertEmail(
        warnedUser.email,
        warnedUser.username || warnedUser.name,
        'You have received a warning for violating our community guidelines. Repeated violations may result in account suspension.',
        'Warning from MovieFinder'
      ).catch(() => {});
    }
  }

  res.json({ success: true, action, reportId });
});
