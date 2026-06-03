import { connectDB } from '../lib/mongodb';
import Block from '../models/Block';

/**
 * Check if there's a block relationship between two users.
 * Returns true if either user has blocked the other.
 */
export async function isBlocked(userId1, userId2) {
  if (!userId1 || !userId2 || userId1 === userId2) return false;
  
  await connectDB();
  
  const block = await Block.findOne({
    $or: [
      { blocker: userId1, blocked: userId2 },
      { blocker: userId2, blocked: userId1 }
    ]
  }).lean();
  
  return !!block;
}

/**
 * Check if userId1 has blocked userId2 specifically.
 */
export async function hasBlocked(blockerId, blockedId) {
  if (!blockerId || !blockedId) return false;
  
  await connectDB();
  
  const block = await Block.findOne({
    blocker: blockerId,
    blocked: blockedId
  }).lean();
  
  return !!block;
}

/**
 * Get all user IDs blocked by a given user.
 */
export async function getBlockedUserIds(userId) {
  if (!userId) return [];
  
  await connectDB();
  
  const blocks = await Block.find({ blocker: userId }).select('blocked').lean();
  return blocks.map(b => b.blocked);
}

/**
 * Get all user IDs who have blocked a given user.
 */
export async function getBlockedByUserIds(userId) {
  if (!userId) return [];
  
  await connectDB();
  
  const blocks = await Block.find({ blocked: userId }).select('blocker').lean();
  return blocks.map(b => b.blocker);
}

/**
 * Get all blocked user IDs in both directions for feed/search filtering.
 */
export async function getAllBlockRelations(userId) {
  if (!userId) return [];
  
  await connectDB();
  
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }]
  }).select('blocker blocked').lean();
  
  const ids = new Set();
  blocks.forEach(b => {
    if (b.blocker !== userId) ids.add(b.blocker);
    if (b.blocked !== userId) ids.add(b.blocked);
  });
  
  return Array.from(ids);
}

/**
 * Middleware wrapper for API routes that require block checking.
 * Adds req.blockCheck with helper methods.
 */
export function withBlockCheck(handler) {
  return async (req, res) => {
    req.blockCheck = {
      isBlocked: (id1, id2) => isBlocked(id1, id2),
      hasBlocked: (blockerId, blockedId) => hasBlocked(blockerId, blockedId),
      getBlockedUserIds: (userId) => getBlockedUserIds(userId),
      getAllBlockRelations: (userId) => getAllBlockRelations(userId),
    };
    return handler(req, res);
  };
}
