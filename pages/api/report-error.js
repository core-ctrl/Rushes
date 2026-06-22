import dbConnect from '../../lib/mongodb';
import ErrorEvent from '../../models/ErrorEvent';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    const { message, stack, file, url, source, userId } = req.body;

    const newError = new ErrorEvent({
      message,
      stack,
      file,
      url,
      source: source || 'client',
      userId: userId || null
    });

    await newError.save();

    return res.status(201).json({ success: true, id: newError._id });
  } catch (error) {
    console.error('Failed to report error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
