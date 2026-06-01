import { connectDB } from '../../../../lib/mongodb';
import Take from '../../../../models/Take';
import { getUserFromRequest } from '../../../../lib/auth';
import { sanitizeText } from '../../../../lib/security';

export default async function handler(req, res) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing take ID' });

    const take = await Take.findById(id);
    if (!take) return res.status(404).json({ error: 'Take not found' });

    // Check ownership
    if (take.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'DELETE') {
      await Take.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
      // 15-minute time limit for edits
      const now = new Date();
      const createdAt = new Date(take.createdAt);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins > 15) {
        return res.status(403).json({ error: 'You can only edit a Take within 15 minutes of posting it.' });
      }

      const { content } = req.body;
      take.content = sanitizeText(content || '', { maxLength: 280, preserveNewLines: true });
      take.isEdited = true;
      await take.save();

      return res.status(200).json({ take: take.toJSON() });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Take id API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
