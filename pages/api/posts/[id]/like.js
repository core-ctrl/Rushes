import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { connectDB } from "../../../../lib/mongodb";
import Post from "../../../../models/Post";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  await connectDB();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;

  try {
    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });

    // In a production app, we would have a 'Like' collection to track who liked what.
    // For this architecture demo, we are doing a denormalized toggle using MongoDB $inc
    
    // Toggle logic (pseudo):
    // const existingLike = await Like.findOne({ postId: id, userId: session.user.id });
    // if (existingLike) {
    //   await existingLike.deleteOne();
    //   await Post.findByIdAndUpdate(id, { $inc: { "stats.likes": -1 } });
    // } else {
    //   await Like.create({ postId: id, userId: session.user.id });
    //   await Post.findByIdAndUpdate(id, { $inc: { "stats.likes": 1 } });
    // }

    // Mocking increment for now
    await Post.findByIdAndUpdate(id, { $inc: { "stats.likes": 1 } });

    // Emit realtime event for live counter ticking
    // io.to(`feed`).emit('feed:stat_update', { postId: id, type: 'like', delta: 1 });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to like post" });
  }
}
