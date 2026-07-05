import { connectDB } from "../../../lib/mongodb";
import List from "../../../models/List";
import User from "../../../models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  await connectDB();
  const session = await getServerSession(req, res, authOptions);
  const decoded = getUserFromRequest(req);
  const currentUserId = session?.user?.id || decoded?.id;

  if (req.method === "GET") {
    try {
      const { userId } = req.query;
      
      let query = {};
      if (userId) {
        query.userId = userId;
        // If not fetching own lists, only show public
        if (String(currentUserId) !== String(userId)) {
          query.privacy = "public";
        }
      } else {
        query.privacy = "public";
      }

      const lists = await List.find(query).sort({ createdAt: -1 }).populate("userId", "username displayName avatar");
      return res.status(200).json({ lists });
    } catch (error) {
      console.error("Fetch lists error:", error);
      return res.status(500).json({ error: "Failed to fetch lists" });
    }
  }

  if (req.method === "POST") {
    if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { title, description, privacy, coverImage } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const list = await List.create({
        userId: currentUserId,
        title,
        description,
        privacy,
        coverImage
      });

      return res.status(201).json({ list });
    } catch (error) {
      console.error("Create list error:", error);
      return res.status(500).json({ error: "Failed to create list" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
