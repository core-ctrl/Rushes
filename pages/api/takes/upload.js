import { connectDB } from '../../../lib/mongodb';
import { getUserFromRequest } from '../../../lib/auth';
import cloudinary from '../../../lib/cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // allow up to 10mb for memes/short clips
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { file, fileType } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });

    // Resource type must be set properly for videos
    const resource_type = fileType === 'video' ? 'video' : 'image';

    const result = await cloudinary.uploader.upload(file, {
      folder: 'rushes_takes',
      resource_type,
    });

    res.status(200).json({
      url: result.secure_url,
      type: resource_type,
    });
  } catch (err) {
    console.error('Take media upload error:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
}
