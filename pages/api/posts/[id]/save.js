import { connectDB } from '@/lib/mongodb';
import { requireApiAuth } from '@/lib/apiAuth';
import Post from '@/models/Post';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: 'Post not found' });

    const isSaved = (post.savedBy || []).includes(user.id);

    if (isSaved) {
      post.savedBy = post.savedBy.filter(uid => uid !== user.id);
      post.saveCount = Math.max(0, (post.saveCount || 0) - 1);
    } else {
      post.savedBy = [...(post.savedBy || []), user.id];
      post.saveCount = (post.saveCount || 0) + 1;
    }

    await post.save();

    res.status(200).json({ success: true, isSaved: !isSaved, saveCount: post.saveCount });
  } catch (error) {
    console.error('[Save Post Error]', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
}
