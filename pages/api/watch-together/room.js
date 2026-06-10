import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: 'Room ID is required' });

  try {
    // Extract the token cookie on the server-side
    const token = req.cookies?.token;

    // Call the custom backend to get room details
    const backendRes = await axios.get(
      `http://localhost:3002/api/rooms/${roomId}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );

    return res.json(backendRes.data);
  } catch (error) {
    console.error('Error fetching room from socket backend:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch room details' });
  }
}
