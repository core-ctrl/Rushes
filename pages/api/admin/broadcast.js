// pages/api/admin/broadcast.js
import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAdmin } from '../../../middleware/requireAdmin';
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

export default requireAdmin(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  await connectDB();

  // Get all verified users with emails
  const users = await User.find({ emailVerified: true }).select('email').lean();
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
});
