import crypto from 'crypto';
import { getUserFromRequest } from '../../../lib/auth';

// ZEGOCLOUD token generator (Kittoken algorithm)
function generateKitToken(appID, serverSecret, roomID, userID, userName, effectiveTimeInSeconds = 3600) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomInt(2147483647);

  const payload = {
    app_id: appID,
    user_id: userID,
    nonce,
    ctime: timestamp,
    expire: timestamp + effectiveTimeInSeconds,
    payload: JSON.stringify({
      room_id: roomID,
      privilege: { 1: 1, 2: 1 }, // login + publish
      stream_id_list: null,
    }),
  };

  const plaintext = JSON.stringify(payload);
  const iv = crypto.randomBytes(16);
  const key = serverSecret.substring(0, 32).padEnd(32, '0');

  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const outputBuf = Buffer.alloc(encrypted.length + 28);
  outputBuf.writeBigUInt64BE(BigInt(timestamp), 0);
  iv.copy(outputBuf, 8);
  outputBuf.writeUInt32BE(encrypted.length, 24);
  encrypted.copy(outputBuf, 28);

  const token = '04' + Buffer.from(outputBuf).toString('base64');
  return token;
}

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

  const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID, 10);
  const serverSecret = process.env.ZEGO_SERVER_SECRET;

  if (!appID || !serverSecret) {
    return res.status(500).json({ error: 'ZEGOCLOUD not configured' });
  }

  const userID = String(user.id || user._id);
  const userName = user.username || user.name || 'User';

  const token = generateKitToken(appID, serverSecret, roomID, userID, userName);

  res.json({ token, appID, userID, userName, roomID });
}
