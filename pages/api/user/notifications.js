import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/middleware/requireAuth";
import User from "@/models/User";

export default async function handler(req, res) {
  const decoded = await requireAuth(req, res);
  if (!decoded) return res.status(401).json({ error: "Not authenticated" });

  await connectDB();

  if (req.method === "GET") {
    const user = await User.findById(decoded.id).select("notificationInbox");
    return res.status(200).json({ notifications: user?.notificationInbox || [] });
  }

  if (req.method === "POST") {
    await User.findByIdAndUpdate(decoded.id, {
      $set: { "notificationInbox.$[].read": true },
    });
    return res.status(200).json({ message: "Marked as read" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
