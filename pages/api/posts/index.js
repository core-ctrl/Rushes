import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectDB } from "../../../lib/mongodb";
import Post from "../../../models/Post";
import User from "../../../models/User";

export default async function handler(req, res) {
  await connectDB();
  const session = await getServerSession(req, res, authOptions);

  if (req.method === "GET") {
    try {
      // Basic infinite scroll logic
      const { cursor, limit = 20, feedType = "global" } = req.query;
      
      let query = { isDeleted: false, parentPostId: null };
      if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
      }

      if (feedType === "following" && session?.user) {
        // Find users the current user follows (mocked for now)
        const currentUser = await User.findById(session.user.id);
        const following = currentUser?.following || [];
        query.authorId = { $in: following };
      }

      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        posts,
        nextCursor: posts.length === Number(limit) ? posts[posts.length - 1].createdAt : null
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch feed" });
    }
  }

  if (req.method === "POST") {
    if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { content, media, tmdbRef, postType = "text", isSpoiler = false } = req.body;

      // Rate limit check could go here using Redis

      const post = await Post.create({
        authorId: session.user.id,
        content,
        media,
        tmdbRef,
        postType,
        isSpoiler,
        authorCache: {
          username: session.user.username,
          displayName: session.user.name,
          avatar: session.user.image
        }
      });

      // Broadcast to Socket.IO if configured
      // io.emit('feed:post_created', post);

      return res.status(201).json(post);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create post" });
    }
  }

  return res.status(405).end();
}
