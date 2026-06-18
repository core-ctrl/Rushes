import connectDB from "../../../lib/mongodb";
import WatchRoom from "../../../models/WatchRoom";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();
    
    // Fetch active public rooms, sorted by newest
    const rooms = await WatchRoom.find({ isActive: true, privacy: 'public' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Failed to fetch active rooms:", error);
    return res.status(500).json({ error: "Failed to fetch active rooms" });
  }
}
