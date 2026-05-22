// pages/api/report/abuse.js
import { connectDB } from '../../../lib/mongodb';
import Report from '../../../models/Report';
import { getUserFromRequest } from '../../../lib/auth';
import { rateLimit } from '../../../lib/rateLimit';
import { getClientIp } from '../../../lib/security';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getClientIp(req) || 'unknown';
  try {
    await rateLimit(`report:${ip}`, 5, 3600);
  } catch (limitErr) {
    return res.status(429).json({ error: limitErr.message });
  }

  const { reporterEmail, targetUsername, type, description } = req.body;

  if (!targetUsername?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Target username and description are required' });
  }

  await connectDB();

  const decoded = getUserFromRequest(req);

  const report = await Report.create({
    reportedBy: decoded?.id || null,
    reporterEmail: reporterEmail?.trim() || null,
    targetUsername: targetUsername.replace('@', '').trim(),
    reason: type || 'Other',
    description: description.trim(),
    targetType: 'user',
    status: 'pending',
  });

  // Notify admin via email
  const adminEmail = process.env.SMTP_USER || process.env.GMAIL_USER;
  if (adminEmail) {
    transporter.sendMail({
      from: `"Rushes Reports" <${adminEmail}>`,
      to: adminEmail,
      subject: `🚨 New Abuse Report — @${targetUsername}`,
      html: `
        <h2>New Abuse Report</h2>
        <p><strong>Target:</strong> @${targetUsername}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Reporter:</strong> ${reporterEmail || 'anonymous'}</p>
        <hr />
        <p><strong>Description:</strong></p>
        <p>${description}</p>
        <hr />
        <p><small>Report ID: ${report._id}</small></p>
      `,
    }).catch(() => {});
  }

  res.json({ success: true, reportId: report._id.toString() });
}
