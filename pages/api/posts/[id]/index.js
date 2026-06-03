import { connectDB } from '@/lib/mongodb';
import { getApiAuthUser, requireApiAuth } from '@/lib/apiAuth';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { sanitizeText } from '@/lib/security';

export default async function handler(req, res) {
  const { id } = req.query;
  await connectDB();

  if (req.method === 'GET') {
    const user = await getApiAuthUser(req, res);
    
    try {
      const post = await Post.findById(id).lean();
      if (!post || post.isDeleted) return res.status(404).json({ error: 'Post not found' });

      // Get parent post if repost/quote
      let parentPost = null;
      if (post.parentPostId) {
        parentPost = await Post.findById(post.parentPostId).lean();
        if (parentPost) parentPost.id = parentPost._id.toString();
      }

      // Get top-level comments (first 3)
      const recentComments = await Comment.find({ postId: id, parentId: null, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      res.status(200).json({
        post: {
          ...post,
          id: post._id.toString(),
          isLiked: user ? (post.likes || []).includes(user.id) : false,
          isSaved: user ? (post.savedBy || []).includes(user.id) : false,
          likeCount: (post.likes || []).length,
          commentCount: post.stats?.replies || 0,
          parentPost,
        },
        recentComments: recentComments.map(c => ({
          ...c,
          id: c._id.toString(),
          isLiked: user ? (c.likes || []).includes(user.id) : false,
          likeCount: (c.likes || []).length,
        })),
      });
    } catch (error) {
      console.error('[Get Post Error]', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  } else if (req.method === 'PUT') {
    const user = await requireApiAuth(req, res);
    if (!user) return;

    try {
      const post = await Post.findById(id);
      if (!post || post.isDeleted) return res.status(404).json({ error: 'Post not found' });
      if (post.authorId !== user.id) return res.status(403).json({ error: 'Not authorized' });

      const { content } = req.body;
      if (content !== undefined) {
        post.editHistory.push({ content: post.content, editedAt: new Date() });
        post.content = sanitizeText(content, { maxLength: 2800, preserveNewLines: true });
        post.isEdited = true;
      }

      await post.save();
      res.status(200).json({ success: true, post: { ...post.toObject(), id: post._id.toString() } });
    } catch (error) {
      console.error('[Edit Post Error]', error);
      res.status(500).json({ error: 'Failed to edit post' });
    }
  } else if (req.method === 'DELETE') {
    const user = await requireApiAuth(req, res);
    if (!user) return;

    try {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.authorId !== user.id) return res.status(403).json({ error: 'Not authorized' });

      post.isDeleted = true;
      await post.save();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Delete Post Error]', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
