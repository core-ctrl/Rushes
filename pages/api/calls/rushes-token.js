import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import jwt from 'jsonwebtoken';
import { getUserFromRequest } from '../../../lib/auth';

/**
 * POST /api/calls/rushes-token
 * Issues a short-lived JWT for the Rushes-Call Mediasoup backend.
 * The secret must match RUSHES_CALL_JWT_SECRET on the backend.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userPayload = null;

  const decoded = getUserFromRequest(req);
  if (decoded && decoded.id) {
    userPayload = decoded;
  } else {
    const session = await getServerSession(req, res, authOptions);
    if (session && session.user) {
      userPayload = session.user;
    }
  }

  if (!userPayload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const secret = process.env.RUSHES_CALL_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Call service not configured' });
  }

  const payload = {
    id: userPayload.id || userPayload._id,
    userId: userPayload.id || userPayload._id,
    username: userPayload.username || userPayload.name,
    avatar: userPayload.avatar || userPayload.image,
  };

  const token = jwt.sign(payload, secret, { expiresIn: '4h' });

  return res.status(200).json({ token });
}
