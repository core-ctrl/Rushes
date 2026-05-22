import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import Take from '../../../models/Take';
import Notification from '../../../models/Notification';
import { getUserFromRequest } from '../../../lib/auth';
import { sanitizeText } from '../../../lib/security';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      content,
      tmdbId,
      mediaType,
      movieTitle,
      moviePoster,
      movieBackdrop,
      rating,
      mood,
      spoiler,
      privacy,
      mentions,
    } = req.body;

    const newTake = await Take.create({
      userId: user.id,
      username: user.username || user.name || 'Anonymous',
      displayName: user.displayName || user.name || user.username || 'Anonymous',
      avatar: user.avatar || null,
      content: sanitizeText(content || '', { maxLength: 280, preserveNewLines: true }),
      tmdbId: tmdbId ? Number(tmdbId) : null,
      mediaType: mediaType || 'movie',
      movieTitle: movieTitle || null,
      moviePoster: moviePoster || null,
      movieBackdrop: movieBackdrop || null,
      rating: rating || null,
      mood: mood || null,
      spoiler: !!spoiler,
      privacy: privacy === 'followers' ? 'followers' : 'public',
      mentions: Array.isArray(mentions) ? mentions : [],
      likes: [],
    });

    if (Array.isArray(mentions) && mentions.length > 0) {
      try {
        const mentionedUsers = await User.find({ username: { $in: mentions } }).select('_id username');
        for (const mentionedUser of mentionedUsers) {
          await Notification.create({
            userId: mentionedUser._id.toString(),
            fromUserId: user.id,
            fromUsername: user.username || user.name,
            fromAvatar: user.avatar || null,
            type: 'mention',
            content: `@${user.username || user.name} mentioned you in a take`,
            referenceId: newTake._id.toString(),
          });
        }
      } catch (mentionError) {
        console.error('Mention notification error:', mentionError);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in';
    const takeObj = newTake.toJSON();
    res.status(200).json({
      take: takeObj,
      shareUrl: `${appUrl}/take/${takeObj.id}`,
    });
  } catch (err) {
    console.error('Unhandled error in /api/takes/create:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

