import connectDB from "../../../lib/mongodb";
import WatchRoom from "../../../models/WatchRoom";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { roomId, password } = req.body;
    
    if (!roomId || !password) {
      return res.status(400).json({ error: "Room ID and password are required" });
    }

    await connectDB();
    
    const room = await WatchRoom.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Generate a temporary invite token for URL params (can just be a simple hash/string for this demo)
    const inviteToken = Buffer.from(`${roomId}:${password}`).toString('base64');

    return res.status(200).json({ success: true, inviteToken });
  } catch (error) {
    console.error("Failed to verify password:", error);
    return res.status(500).json({ error: "Failed to verify password" });
  }
}
