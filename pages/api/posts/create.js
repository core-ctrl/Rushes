import { connectDB } from '@/lib/mongodb';
import { requireApiAuth } from '@/lib/apiAuth';
import Post from '@/models/Post';
import { sanitizeText } from '@/lib/security';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  try {
    const { content, postType = 'text', media, tmdbRef, poll, isSpoiler, visibility, mentions, hashtags, mood, parentPostId } = req.body;

    if (!content && !media?.length && !poll) {
      return res.status(400).json({ error: 'Post must have content, media, or a poll' });
    }

    const postData = {
      authorId: user.id,
      postType,
      content: content ? sanitizeText(content, { maxLength: 2800, preserveNewLines: true }) : '',
      media: media || [],
      tmdbRef: tmdbRef || null,
      isSpoiler: !!isSpoiler,
      visibility: visibility || 'public',
      mentions: mentions || [],
      hashtags: hashtags || [],
      mood: mood || null,
      authorCache: {
        username: user.username,
        displayName: user.displayName || user.name,
        avatar: user.avatar
      },
    };

    // Poll creation
    if (postType === 'poll' && poll) {
      postData.poll = {
        question: sanitizeText(poll.question, { maxLength: 280 }),
        options: (poll.options || []).slice(0, 6).map(opt => ({
          text: sanitizeText(opt, { maxLength: 100 }),
          votes: []
        })),
        expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalVotes: 0
      };
    }

    // Repost/Quote
    if ((postType === 'repost' || postType === 'quote') && parentPostId) {
      postData.parentPostId = parentPostId;
      // Increment parent's repost/quote count
      await Post.findByIdAndUpdate(parentPostId, {
        $inc: { [`stats.${postType === 'repost' ? 'reposts' : 'quotes'}`]: 1 }
      });
    }

    const post = await Post.create(postData);

    res.status(201).json({
      success: true,
      post: { ...post.toObject(), id: post._id.toString(), isLiked: false, isSaved: false, likeCount: 0, commentCount: 0 }
    });
  } catch (error) {
    console.error('[Create Post Error]', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
}
