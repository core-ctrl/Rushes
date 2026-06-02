import { getUserFromRequest } from '../../../lib/auth';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let user = getUserFromRequest(req);
  
  if (!user) {
    const session = await getServerSession(req, res, authOptions);
    if (session && session.user) {
      user = session.user;
    }
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { roomID } = req.body;
  if (!roomID) return res.status(400).json({ error: 'Room ID is required' });

  let appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID, 10);
  let serverSecret = process.env.ZEGO_SERVER_SECRET;

  // Fallback to Watch Together keys if regular call keys are missing
  if (!appID || !serverSecret) {
    appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_WT_APP_ID, 10);
    serverSecret = process.env.ZEGO_WT_SERVER_SECRET;
  }

  if (!appID || !serverSecret) {
    return res.status(500).json({ error: 'ZEGOCLOUD not configured' });
  }

  const userID = String(user.id || user._id);
  const userName = user.username || user.name || 'User';

  // Return the raw credentials so the frontend can securely use generateKitTokenForTest
  res.json({ appID, serverSecret, userID, userName, roomID });
}
