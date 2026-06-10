import { getUserFromRequest } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Return the token from the HttpOnly cookie so the client can use it
  // for cross-origin WebSocket authentication.
  const token = req.cookies?.token;
  res.status(200).json({ token });
}
