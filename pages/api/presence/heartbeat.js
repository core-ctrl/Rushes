import { getUserFromRequest } from "../../../lib/auth";
import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let user = getUserFromRequest(req);
  if (!user) {
    const session = await getServerSession(req, res, authOptions);
    if (session && session.user) user = session.user;
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await connectDB();
    await User.findByIdAndUpdate(user.id || user._id, {
      isOnline: true,
      lastSeen: new Date()
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
