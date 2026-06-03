import { connectDB } from '@/lib/mongodb';
import { getApiAuthUser } from '@/lib/apiAuth';
import Post from '@/models/Post';
import User from '@/models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();
  const user = await getApiAuthUser(req, res);

  const { cursor, limit = 20, type = 'foryou' } = req.query;
  const pageLimit = Math.min(parseInt(limit) || 20, 50);

  try {
    let query = { isDeleted: { $ne: true }, visibility: 'public' };

    // Cursor-based pagination
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Feed type filtering
    if (type === 'following' && user) {
      const currentUser = await User.findById(user.id).select('following blockedUsers').lean();
      const following = currentUser?.following || [];
      const blockedIds = (currentUser?.blockedUsers || []).map(b => typeof b === 'string' ? b : b.userId);
      
      if (following.length === 0) {
        return res.status(200).json({ posts: [], nextCursor: null, hasMore: false });
      }
      query.authorId = { $in: following, $nin: blockedIds };
    } else if (type === 'trending') {
      // Trending: high engagement posts from last 7 days
      query.createdAt = { ...query.createdAt, $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    // Block filtering
    if (user) {
      const currentUser = await User.findById(user.id).select('blockedUsers').lean();
      const blockedIds = (currentUser?.blockedUsers || []).map(b => typeof b === 'string' ? b : b.userId);
      if (blockedIds.length > 0 && !query.authorId) {
        query.authorId = { $nin: blockedIds };
      }
    }

    const sortField = type === 'trending' ? { trendingScore: -1, createdAt: -1 } : { createdAt: -1 };

    const posts = await Post.find(query)
      .sort(sortField)
      .limit(pageLimit + 1)
      .lean();

    const hasMore = posts.length > pageLimit;
    const results = hasMore ? posts.slice(0, pageLimit) : posts;

    // Add user-specific data
    const enrichedPosts = results.map(post => ({
      ...post,
      id: post._id.toString(),
      isLiked: user ? (post.likes || []).includes(user.id) : false,
      isSaved: user ? (post.savedBy || []).includes(user.id) : false,
      likeCount: (post.likes || []).length,
      commentCount: post.stats?.replies || 0,
    }));

    const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

    res.status(200).json({ posts: enrichedPosts, nextCursor, hasMore });
  } catch (error) {
    console.error('[Feed API Error]', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
}
