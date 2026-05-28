import { connectDB } from '../../lib/mongodb';

// Simple health check — can be extended to check DB, cache, etc.
export default async function handler(req, res) {
  // Check for maintenance mode via env variable
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      status: 'maintenance',
      message: process.env.MAINTENANCE_MESSAGE || 'We\'re making MovieFinder even better. Back soon!',
      estimatedTime: process.env.MAINTENANCE_ETA || null,
    });
  }

  try {
    await connectDB();
    res.json({
      status: 'ok',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      message: 'Some services are experiencing issues. We\'re on it.',
    });
  }
}
