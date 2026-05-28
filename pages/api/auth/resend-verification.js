// pages/api/auth/resend-verification.js
import { connectDB } from '@/lib/mongodb.js';
import User from '../../../models/User';
import { sendVerificationEmail } from '@/lib/sendEmail.js';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/security';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Rate limit: 3 resends per hour per email
  try {
    await rateLimit(`resend-verify:${email.toLowerCase()}`, 3, 3600);
  } catch (err) {
    return res.status(429).json({ error: err.message });
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+verificationToken');

    // Always return success (don't reveal if email exists)
    if (!user) return res.json({ message: 'If that email exists, a new verification link has been sent.' });

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'This email is already verified. Please sign in.' });
    }

    // Generate a fresh 6-digit verification code
    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = newToken;
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send the email (non-blocking)
    sendVerificationEmail(
      user.email,
      newToken,
      user.username || user.displayName || user.name || 'there'
    ).catch(e => console.warn('Resend verify email failed:', e.message));

    return res.json({ message: 'New verification email sent! Check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Failed to resend. Please try again.' });
  }
}
