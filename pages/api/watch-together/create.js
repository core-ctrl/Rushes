import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, mediaId, mediaType, streamingUrl } = req.body;

  if (!title) return res.status(400).json({ error: 'Movie title is required' });

  const roomId = uuidv4().slice(0, 8);

  const roomUrl = `/watch-together/${roomId}?title=${encodeURIComponent(title)}&mediaId=${mediaId || ''}&mediaType=${mediaType || 'movie'}${streamingUrl ? `&url=${encodeURIComponent(streamingUrl)}` : ''}`;

  res.json({ success: true, roomId, roomUrl });
}
