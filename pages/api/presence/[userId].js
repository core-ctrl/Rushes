import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    await connectDB();
    const user = await User.findById(userId).select('lastSeen isOnline');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Consider online if lastSeen was within the last 60 seconds
    const isActuallyOnline = user.lastSeen && (new Date() - new Date(user.lastSeen)) < 60000;

    return res.status(200).json({ 
      isOnline: isActuallyOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
