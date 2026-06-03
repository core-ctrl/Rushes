import { connectDB } from '@/lib/mongodb';
import { getApiAuthUser, requireApiAuth } from '@/lib/apiAuth';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Notification from '@/models/Notification';
import { sanitizeText } from '@/lib/security';

export default async function handler(req, res) {
  const { id } = req.query;
  await connectDB();

  if (req.method === 'GET') {
    const user = await getApiAuthUser(req, res);
    const { cursor, limit = 20, parentId = null } = req.query;
    const pageLimit = Math.min(parseInt(limit) || 20, 50);

    try {
      let query = { postId: id, isDeleted: { $ne: true } };
      
      if (parentId && parentId !== 'null') {
        query.parentId = parentId;
      } else {
        query.parentId = null;
      }
      
      if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
      }

      const comments = await Comment.find(query)
        .sort({ createdAt: -1 })
        .limit(pageLimit + 1)
        .lean();

      const hasMore = comments.length > pageLimit;
      const results = hasMore ? comments.slice(0, pageLimit) : comments;

      const enrichedComments = results.map(c => ({
        ...c,
        id: c._id.toString(),
        isLiked: user ? (c.likes || []).includes(user.id) : false,
        likeCount: (c.likes || []).length,
      }));

      const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

      res.status(200).json({ comments: enrichedComments, nextCursor, hasMore });
    } catch (error) {
      console.error('[Get Comments Error]', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  } else if (req.method === 'POST') {
    const user = await requireApiAuth(req, res);
    if (!user) return;

    try {
      const { content, parentId } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

      const post = await Post.findById(id);
      if (!post || post.isDeleted) return res.status(404).json({ error: 'Post not found' });

      // Build materialized path
      let path = '';
      if (parentId) {
        const parent = await Comment.findById(parentId).lean();
        if (parent) {
          path = parent.path ? `${parent.path}.${parentId}` : parentId;
        }
      }

      const comment = await Comment.create({
        postId: id,
        authorId: user.id,
        parentId: parentId || null,
        path,
        content: sanitizeText(content, { maxLength: 2000, preserveNewLines: true }),
        authorCache: {
          username: user.username || user.name,
          displayName: user.displayName || user.name,
          avatar: user.avatar
        },
      });

      // Update post reply count
      await Post.findByIdAndUpdate(id, { $inc: { 'stats.replies': 1 } });

      // Update parent comment reply count
      if (parentId) {
        await Comment.findByIdAndUpdate(parentId, { $inc: { 'stats.replies': 1 } });
      }

      // Notification
      if (post.authorId !== user.id) {
        await Notification.create({
          userId: post.authorId,
          fromUserId: user.id,
          fromUsername: user.username || user.name,
          fromAvatar: user.avatar,
          type: parentId ? 'reply' : 'comment',
          category: 'social',
          content: parentId ? 'replied to a comment on your post' : 'commented on your post',
          referenceId: post._id.toString(),
          referenceType: 'post',
          groupKey: `comment:${post._id}`,
        });
      }

      res.status(201).json({
        success: true,
        comment: { ...comment.toObject(), id: comment._id.toString(), isLiked: false, likeCount: 0 }
      });
    } catch (error) {
      console.error('[Create Comment Error]', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
