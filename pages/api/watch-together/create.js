import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, mediaId, mediaType, streamingUrl, privacy = 'public', customRoomId } = req.body;

  if (!title) return res.status(400).json({ error: 'Movie title is required' });

  try {
    // Extract the authentication token cookie from the request
    const token = req.cookies?.token;

    const BACKEND_URL = process.env.NEXT_PUBLIC_WATCH_TOGETHER_URL || 'http://localhost:3002';
    // Call the custom Watch Together backend to create the room
    const backendRes = await axios.post(
      `${BACKEND_URL}/api/rooms`,
      {
        roomType: 'WATCH_TOGETHER',
        ...(customRoomId && { roomId: customRoomId })
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      }
    );

    const { roomId } = backendRes.data;

    // Save room to MongoDB for discovery
    const { getSession } = require("next-auth/react");
    const connectDB = require("../../../lib/mongodb").default;
    const WatchRoom = require("../../../models/WatchRoom").default;
    
    await connectDB();
    const session = await getSession({ req });
    
    await WatchRoom.create({
      roomId,
      title,
      mediaId,
      mediaType,
      streamingUrl,
      hostId: session?.user?.id || 'anonymous',
      hostUsername: session?.user?.name || 'Anonymous',
      privacy,
      password: req.body.password,
      allowedUsers: req.body.allowedUsers || []
    });

    // Construct the watch-party room redirect URL
    const roomUrl = `/watch-party/${roomId}?title=${encodeURIComponent(title)}&mediaId=${mediaId || ''}&mediaType=${mediaType || 'movie'}${streamingUrl ? `&url=${encodeURIComponent(streamingUrl)}` : ''}`;

    return res.json({ success: true, roomId, roomUrl });
  } catch (error) {
    console.error('Error creating room in socket backend:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create watch room. Make sure the socket backend is running.' });
  }
}
