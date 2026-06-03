import { connectDB } from '@/lib/mongodb';
import { getApiAuthUser } from '@/lib/apiAuth';
import Post from '@/models/Post';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();
  const user = await getApiAuthUser(req, res);

  const { period = '7d', limit = 10 } = req.query;
  const pageLimit = Math.min(parseInt(limit) || 10, 30);

  const periodMap = { '24h': 1, '7d': 7, '30d': 30 };
  const days = periodMap[period] || 7;

  try {
    const posts = await Post.find({
      isDeleted: { $ne: true },
      visibility: 'public',
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    })
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(pageLimit)
      .lean();

    const enriched = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      isLiked: user ? (post.likes || []).includes(user.id) : false,
      isSaved: user ? (post.savedBy || []).includes(user.id) : false,
      likeCount: (post.likes || []).length,
      commentCount: post.stats?.replies || 0,
    }));

    res.status(200).json({ posts: enriched });
  } catch (error) {
    console.error('[Trending API Error]', error);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
}
