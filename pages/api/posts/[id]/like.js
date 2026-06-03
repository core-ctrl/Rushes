import { connectDB } from '@/lib/mongodb';
import { requireApiAuth } from '@/lib/apiAuth';
import Post from '@/models/Post';
import Notification from '@/models/Notification';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: 'Post not found' });

    const isLiked = (post.likes || []).includes(user.id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(uid => uid !== user.id);
      post.stats.likes = Math.max(0, (post.stats.likes || 0) - 1);
    } else {
      // Like
      post.likes.push(user.id);
      post.stats.likes = (post.stats.likes || 0) + 1;

      // Create notification (don't notify self)
      if (post.authorId !== user.id) {
        await Notification.create({
          userId: post.authorId,
          fromUserId: user.id,
          fromUsername: user.username || user.name,
          fromAvatar: user.avatar,
          type: 'like',
          category: 'social',
          content: `liked your post`,
          referenceId: post._id.toString(),
          referenceType: 'post',
          groupKey: `like:${post._id}`,
        });
      }
    }

    // Update trending score
    post.trendingScore = (post.stats.likes || 0) + ((post.stats.replies || 0) * 2) + ((post.stats.reposts || 0) * 3);
    await post.save();

    res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error('[Like Post Error]', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
}
