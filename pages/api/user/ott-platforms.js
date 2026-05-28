import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';

const SUPPORTED_PLATFORMS = [
  'netflix', 'prime', 'hotstar', 'jiocinema', 'zee5', 'sonyliv',
  'mubi', 'apple_tv', 'hbo_max', 'disney_plus', 'hulu', 'peacock',
  'paramount_plus', 'crunchyroll', 'curiosity_stream'
];

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  if (req.method === 'GET') {
    const dbUser = await User.findById(user.id).select('ottPlatforms');
    return res.json({ platforms: dbUser?.ottPlatforms || [], supported: SUPPORTED_PLATFORMS });
  }

  if (req.method === 'PUT') {
    const { platforms } = req.body;
    if (!Array.isArray(platforms)) return res.status(400).json({ error: 'Platforms must be an array' });

    const valid = platforms.filter(p => SUPPORTED_PLATFORMS.includes(p));
    await User.findByIdAndUpdate(user.id, { ottPlatforms: valid });
    return res.json({ success: true, platforms: valid });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
