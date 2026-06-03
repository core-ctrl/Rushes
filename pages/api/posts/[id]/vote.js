import { connectDB } from '@/lib/mongodb';
import { requireApiAuth } from '@/lib/apiAuth';
import Post from '@/models/Post';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();
  const user = await requireApiAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const { optionIndex } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted || post.postType !== 'poll') {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (post.poll.expiresAt && new Date(post.poll.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Poll has expired' });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // Check if user already voted
    const hasVoted = post.poll.options.some(opt => opt.votes.includes(user.id));
    if (hasVoted) {
      return res.status(400).json({ error: 'Already voted' });
    }

    post.poll.options[optionIndex].votes.push(user.id);
    post.poll.totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    await post.save();

    res.status(200).json({
      success: true,
      poll: {
        options: post.poll.options.map(opt => ({
          text: opt.text,
          voteCount: opt.votes.length,
          percentage: post.poll.totalVotes > 0 ? Math.round((opt.votes.length / post.poll.totalVotes) * 100) : 0,
          voted: opt.votes.includes(user.id),
        })),
        totalVotes: post.poll.totalVotes,
        expiresAt: post.poll.expiresAt,
        hasVoted: true,
      }
    });
  } catch (error) {
    console.error('[Vote Error]', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
}
