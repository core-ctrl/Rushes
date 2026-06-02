import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import cloudinary from '../../../lib/cloudinary';
import { requireApiAuth } from '../../../lib/apiAuth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireApiAuth(req, res, { fromDb: true });
  if (!user) return;

  const { image } = req.body;

  if (!image) return res.status(400).json({ error: 'No image provided' });

  // Validate base64 image
  if (!image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image format. Only images are allowed.' });
  }

  // Check size (~5MB base64 = ~6.6MB string)
  if (image.length > 7 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large. Max 5MB.' });
  }

  await connectDB();

  try {
    // Upload to Cloudinary with transformations
    const result = await cloudinary.uploader.upload(image, {
      folder: 'moviefinder/avatars',
      public_id: `user_${user.id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update user avatar in DB
    await User.findByIdAndUpdate(user.id, { avatar: result.secure_url });

    return res.json({
      success: true,
      avatar: result.secure_url,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: 'Failed to upload avatar. Please try again.' });
  }
}
