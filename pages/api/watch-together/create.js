import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, mediaId, mediaType, streamingUrl } = req.body;

  if (!title) return res.status(400).json({ error: 'Movie title is required' });

  try {
    // Extract the authentication token cookie from the request
    const token = req.cookies?.token;

    // Call the custom Watch Together backend to create the room
    const backendRes = await axios.post(
      'http://localhost:3002/api/rooms',
      {
        roomType: 'WATCH_TOGETHER'
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      }
    );

    const { roomId } = backendRes.data;

    // Construct the watch-together room redirect URL
    const roomUrl = `/watch-together/${roomId}?title=${encodeURIComponent(title)}&mediaId=${mediaId || ''}&mediaType=${mediaType || 'movie'}${streamingUrl ? `&url=${encodeURIComponent(streamingUrl)}` : ''}`;

    return res.json({ success: true, roomId, roomUrl });
  } catch (error) {
    console.error('Error creating room in socket backend:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create watch room. Make sure the socket backend is running.' });
  }
}
