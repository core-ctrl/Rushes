import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'User ID is required' });

  await connectDB();

  try {
    const user = await User.findById(id).select('username displayName avatar wishlist');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.json({
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      items: (user.wishlist || []).map(item => ({
        mediaId: item.mediaId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        addedAt: item.addedAt,
      })),
      totalItems: user.wishlist?.length || 0,
    });
  } catch (error) {
    console.error('Shared list error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
