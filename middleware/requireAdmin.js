// middleware/requireAdmin.js
import { getUserFromRequest } from '../lib/auth';
import { connectDB } from '../lib/mongodb';
import User from '../models/User';

export function requireAdmin(handler) {
  return async function (req, res) {
    try {
      const decoded = getUserFromRequest(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await connectDB();
      const user = await User.findById(decoded.id).lean();

      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden — admin access required' });
      }

      // Attach user to request for downstream use
      req.adminUser = user;
      return handler(req, res);
    } catch (err) {
      console.error('requireAdmin error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
