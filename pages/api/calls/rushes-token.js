import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import jwt from 'jsonwebtoken';

/**
 * POST /api/calls/rushes-token
 * Issues a short-lived JWT for the Rushes-Call Mediasoup backend.
 * The secret must match RUSHES_CALL_JWT_SECRET on the backend.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const secret = process.env.RUSHES_CALL_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Call service not configured' });
  }

  const payload = {
    id: session.user.id || session.user._id,
    userId: session.user.id || session.user._id,
    username: session.user.username || session.user.name,
    avatar: session.user.avatar || session.user.image,
  };

  const token = jwt.sign(payload, secret, { expiresIn: '4h' });

  return res.status(200).json({ token });
}
