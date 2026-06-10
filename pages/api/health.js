import connectDB from '../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req, res) {
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

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({ status: 'OK' });
  } catch (error) {
    if (req.method === 'HEAD') {
      return res.status(503).end();
    }
    return res.status(503).json({ status: 'Service unavailable' });
  }
}
