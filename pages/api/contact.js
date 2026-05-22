// pages/api/contact.js
import nodemailer from 'nodemailer';
import { rateLimit } from '../../lib/rateLimit';
import { getClientIp } from '../../lib/security';

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
    await rateLimit(`contact:${ip}`, 5, 3600);
  } catch (limitErr) {
    return res.status(429).json({ error: limitErr.message });
  }

  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    await transporter.sendMail({
      from: `"Rushes Contact" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: process.env.SMTP_USER || process.env.GMAIL_USER,
      replyTo: email,
      subject: `[Rushes Contact] ${subject || 'General Enquiry'} — from ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <h2 style="color:#E63946;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border-color:#eee;" />
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;">${message}</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
