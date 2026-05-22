// pages/api/feedback.js
import { connectDB } from '../../lib/mongodb';
import Feedback from '../../models/Feedback';
import { rateLimit } from '../../lib/rateLimit';
import { getClientIp } from '../../lib/security';
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
    await rateLimit(`feedback:${ip}`, 10, 3600);
  } catch (limitErr) {
    return res.status(429).json({ error: limitErr.message });
  }

  const { type = 'other', message, userId, userEmail } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!['bug', 'idea', 'other'].includes(type)) {
    return res.status(400).json({ error: 'Invalid feedback type' });
  }

  try {
    await connectDB();

    const feedback = await Feedback.create({
      type,
      message: message.trim(),
      userId: userId || null,
      userEmail: userEmail || null,
      createdAt: new Date(),
      status: 'new',
    });

    // Notify admin
    const adminEmail = process.env.SMTP_USER || process.env.GMAIL_USER;
    if (adminEmail) {
      const typeEmoji = type === 'bug' ? '🐛' : type === 'idea' ? '💡' : '💬';
      transporter.sendMail({
        from: `"Rushes Feedback" <${adminEmail}>`,
        to: adminEmail,
        subject: `${typeEmoji} New ${type} feedback on Rushes`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;">
            <h2 style="color:#E63946;">${typeEmoji} New ${type.charAt(0).toUpperCase() + type.slice(1)} Feedback</h2>
            <p>${message}</p>
            <hr style="border-color:#eee;" />
            <p style="color:#999;font-size:12px;">
              User: ${userId || 'anonymous'}<br/>
              Email: ${userEmail || 'not provided'}
            </p>
          </div>
        `,
      }).catch(() => {});
    }

    res.json({ success: true, id: feedback._id.toString() });
  } catch (err) {
    console.error('Feedback API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
