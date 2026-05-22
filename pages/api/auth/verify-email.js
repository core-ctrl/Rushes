import { connectDB } from '@/lib/mongodb.js';
import User from '../../../models/User';
import { sendWelcomeEmail } from '@/lib/mailer.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await connectDB();

    const { token } = req.body;
    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.username || user.displayName || user.name);

    res.json({ message: 'Email verified successfully. You can now login.' });
}
