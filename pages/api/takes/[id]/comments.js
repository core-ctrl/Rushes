import { connectDB } from '../../../../lib/mongodb';
import Take from '../../../../models/Take';
import Comment from '../../../../models/Comment';
import Notification from '../../../../models/Notification';
import { requireApiAuth } from '../../../../lib/apiAuth';
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
      const user = await requireApiAuth(req, res, { fromDb: true });
      if (!user) return;

      const { content, parentId } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
      }

      const take = await Take.findById(id);
      if (!take) return res.status(404).json({ error: 'Take not found' });

      let parentComment = null;
      if (parentId) {
        parentComment = await Comment.findOne({ _id: parentId, postId: id, isDeleted: false });
        if (!parentComment) return res.status(404).json({ error: 'Parent reply not found' });
      }

      const comment = await Comment.create({
        postId: id,
        authorId: user.id,
        parentId: parentComment ? parentComment._id.toString() : null,
        path: parentComment
          ? [parentComment.path, parentComment._id.toString()].filter(Boolean).join('.')
          : '',
        content: sanitizeText(content, { maxLength: 280, preserveNewLines: true }),
        authorCache: {
          username: user.username || user.name || 'Anonymous',
          displayName: user.displayName || user.name || user.username || 'Anonymous',
          avatar: user.avatar || null,
        },
      });

      await Take.findByIdAndUpdate(id, { $inc: { replyCount: 1 } });
      if (parentComment) {
        await Comment.findByIdAndUpdate(parentComment._id, { $inc: { 'stats.replies': 1 } });
      }

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
      const user = await requireApiAuth(req, res);
      if (!user) return;

      const { commentId } = req.body;
      if (!commentId) return res.status(400).json({ error: 'Missing commentId' });

      const [take, comment] = await Promise.all([
        Take.findById(id).select('userId'),
        Comment.findOne({ _id: commentId, postId: id }),
      ]);
      if (!take) return res.status(404).json({ error: 'Take not found' });
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      if (String(comment.authorId) !== String(user.id) && String(take.userId) !== String(user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const descendantPattern = new RegExp(`(^|\\.)${comment._id.toString()}(\\.|$)`);
      const deleteFilter = {
        postId: id,
        $or: [
          { _id: comment._id },
          { path: { $regex: descendantPattern } },
        ],
      };
      const deleteResult = await Comment.deleteMany(deleteFilter);
      const deletedCount = Math.max(1, deleteResult.deletedCount || 0);

      await Take.findByIdAndUpdate(id, { $inc: { replyCount: -deletedCount } });
      if (comment.parentId) {
        await Comment.findByIdAndUpdate(comment.parentId, { $inc: { 'stats.replies': -1 } });
      }

      return res.status(200).json({ success: true, deletedCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Take comments API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
