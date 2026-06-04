const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { requireAdmin } = require('../middleware/requireAuth');
const User = require('../models/User');
const Report = require('../models/Report');
const Take = require('../models/Take');
const Feedback = require('../models/Feedback');
const { sendDecisionAlertEmail } = require('../lib/sendEmail');
const { getCacheStats, clearCache } = require('../lib/cache');

// Setup transporter for broadcast email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
  },
});

function buildAnnouncementHtml(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#0a0a0a;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:28px 32px;text-align:center;border-bottom:1px solid #1a1a1a;">
                  <h1 style="margin:0;color:#E63946;font-size:28px;font-weight:900;">Rushes</h1>
                  <p style="margin:4px 0 0;color:#666;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Where movie people connect</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:700;">📢 Announcement</h2>
                  <p style="margin:0;color:#aaa;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px;border-top:1px solid #1a1a1a;text-align:center;">
                  <p style="margin:0;color:#555;font-size:11px;">
                    You received this because you have a Rushes account.<br>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in'}" style="color:#E63946;">Visit Rushes</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// All admin routes require admin privileges
router.use(requireAdmin);

// POST /api/admin/broadcast
router.post('/broadcast', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get all verified users with emails
    const users = await User.find({ $or: [{ isEmailVerified: true }, { emailVerified: true }] }).select('email').lean();
    const emails = users.map((u) => u.email).filter(Boolean);

    if (emails.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No verified users to email' });
    }

    const BATCH_SIZE = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      try {
        await transporter.sendMail({
          from: `"Rushes" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          bcc: batch.join(','),
          subject: '📢 Announcement from Rushes',
          html: buildAnnouncementHtml(message.trim()),
        });
        sent += batch.length;
      } catch (err) {
        console.error(`Broadcast batch ${i / BATCH_SIZE + 1} failed:`, err.message);
        failed += batch.length;
      }
    }

    res.json({ success: true, total: emails.length, sent, failed });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

// GET /api/admin/cache
router.get('/cache', (req, res) => {
  res.status(200).json(getCacheStats());
});

// DELETE /api/admin/cache
router.delete('/cache', (req, res) => {
  const pattern = req.body?.pattern || req.query?.pattern;
  clearCache(pattern);
  res.status(200).json({ message: "Cache cleared" });
});

// GET /api/admin/feedback
router.get('/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json({ feedback });
  } catch (err) {
    console.error("Admin feedback API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/feedback
router.delete('/feedback', async (req, res) => {
  const id = req.body?.id || req.query?.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid feedback ID" });
  }
  try {
    await Feedback.findByIdAndDelete(id);
    res.status(200).json({ message: "Feedback deleted" });
  } catch (err) {
    console.error("Delete feedback error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/handle-report
router.post('/handle-report', async (req, res) => {
  const { reportId, action } = req.body;

  if (!reportId || !action) {
    return res.status(400).json({ error: 'reportId and action are required' });
  }

  if (!['dismiss', 'warn', 'ban'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Use: dismiss, warn, or ban' });
  }

  try {
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.status = action === 'dismiss' ? 'dismissed' : action === 'warn' ? 'warned' : 'banned';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    await report.save();

    if (action === 'ban' && report.targetId) {
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
  } catch (err) {
    console.error('Handle report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/recent-users
router.get('/recent-users', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Recent users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

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
  } catch (err) {
    console.error('Reports list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("name email createdAt wishlist isAdmin")
      .limit(100);

    res.status(200).json({ users });
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users
router.delete('/users', async (req, res) => {
  const { id } = req.query;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users
router.patch('/users', async (req, res) => {
  const { id, isAdmin } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (typeof isAdmin !== "boolean") {
    return res.status(400).json({ error: "isAdmin must be boolean" });
  }

  try {
    await User.findByIdAndUpdate(id, { isAdmin });
    res.status(200).json({ message: "User updated" });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
