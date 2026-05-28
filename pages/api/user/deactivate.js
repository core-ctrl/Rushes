import cookie from 'cookie';
import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await connectDB();

  try {
    await User.findByIdAndUpdate(user.id, {
      isDeactivated: true,
      deactivatedAt: new Date(),
      isOnline: false,
    });

    // Clear JWT cookie
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
      })
    );

    return res.status(200).json({ success: true, message: 'Account deactivated. You can reactivate by logging in again.' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    return res.status(500).json({ error: 'Failed to deactivate account' });
  }
}
