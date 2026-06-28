import connectDB from "../../../lib/mongodb";
import WatchRoom from "../../../models/WatchRoom";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { roomId, isLocked } = req.body;
  if (!roomId) return res.status(400).json({ error: 'Room ID is required' });

  try {
    await connectDB();
    const room = await WatchRoom.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== (session.user.id || session.user._id)) {
      return res.status(403).json({ error: 'Only the host can lock the room' });
    }

    room.isLocked = isLocked;
    await room.save();

    return res.status(200).json({ success: true, isLocked: room.isLocked });
  } catch (error) {
    console.error('Error locking room:', error);
    return res.status(500).json({ error: 'Failed to update room lock status' });
  }
}
