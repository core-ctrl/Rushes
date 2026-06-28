import connectDB from "../../../lib/mongodb";
import WatchRoom from "../../../models/WatchRoom";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();
    
    // Fetch all active rooms so they appear on the hub
    const rooms = await WatchRoom.find({ isActive: true })
      .select('-password') // Don't send passwords to client
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Failed to fetch active rooms:", error);
    return res.status(500).json({ error: "Failed to fetch active rooms" });
  }
}
