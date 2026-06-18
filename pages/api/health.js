import connectDB from '../../lib/mongodb';
import mongoose from 'mongoose';
import SystemSettings from '../../models/SystemSettings';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end();
  }

  try {
    await connectDB();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      if (req.method === 'HEAD') {
        return res.status(503).end();
      }
      return res.status(503).json({ status: 'Database unavailable' });
    }

    // Check system settings for maintenance mode
    const settings = await SystemSettings.findOne().lean();
    if (settings && settings.maintenanceMode) {
      if (req.method === 'HEAD') {
        return res.status(503).end();
      }
      return res.status(200).json({ status: 'maintenance' });
    }

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Health check error:', error);
    if (req.method === 'HEAD') {
      return res.status(503).end();
    }
    return res.status(503).json({ status: 'Service unavailable' });
  }
}

