import { connectDB } from '../../../../lib/mongodb';
import Take from '../../../../models/Take';
import Comment from '../../../../models/Comment';
import Notification from '../../../../models/Notification';
import { getUserFromRequest } from '../../../../lib/auth';
import { sanitizeText } from '../../../../lib/security';

export default async function handler(req, res) {
  try {
    await connectDB();
    const { id } = req.query;

    if (req.method === 'GET') {
      const comments = await Comment.find({ postId: id, isDeleted: false })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      return res.status(200).json({
        comments: comments.map(c => ({ ...c, id: c._id.toString() }))
      });
    }

    if (req.method === 'POST') {
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
      }

      const take = await Take.findById(id);
      if (!take) return res.status(404).json({ error: 'Take not found' });

      const comment = await Comment.create({
        postId: id,
        authorId: user.id,
        content: sanitizeText(content, { maxLength: 280, preserveNewLines: true }),
        authorCache: {
          username: user.username || user.name || 'Anonymous',
          displayName: user.displayName || user.name || user.username || 'Anonymous',
          avatar: user.avatar || null,
        },
      });

      await Take.findByIdAndUpdate(id, { $inc: { replyCount: 1 } });

      if (String(take.userId) !== String(user.id)) {
        try {
          await Notification.create({
            userId: take.userId,
            fromUserId: user.id,
            fromUsername: user.username || user.name,
            fromAvatar: user.avatar || null,
            type: 'reply',
            content: `@${user.username || user.name} replied to your take`,
            referenceId: id,
          });
        } catch (e) {
          console.error('Notification error:', e);
        }
      }

      const savedComment = comment.toJSON();
      return res.status(200).json({
        comment: { ...savedComment, id: savedComment.id || savedComment._id?.toString() },
      });
    }

    if (req.method === 'DELETE') {
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { commentId } = req.body;
      if (!commentId) return res.status(400).json({ error: 'Missing commentId' });

      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      if (String(comment.authorId) !== String(user.id)) return res.status(403).json({ error: 'Forbidden' });

      await Comment.findByIdAndDelete(commentId);
      await Take.findByIdAndUpdate(id, { $inc: { replyCount: -1 } });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Take comments API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
