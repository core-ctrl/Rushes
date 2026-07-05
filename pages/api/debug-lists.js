import { connectDB } from "../../lib/mongodb";
import List from "../../models/List";
import User from "../../models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  await connectDB();
  const session = await getServerSession(req, res, authOptions);
  const decoded = getUserFromRequest(req);
  const currentUserId = session?.user?.id || decoded?.id;

  const lists = await List.find({}).populate("userId", "username displayName avatar");
  const users = await User.find({});

  res.status(200).json({
    currentUserId,
    typeOfCurrentUserId: typeof currentUserId,
    lists: lists.map(l => ({
      title: l.title,
      userIdObj: l.userId,
      userIdId: l.userId?._id,
      typeOfUserIdId: typeof l.userId?._id
    })),
    users: users.map(u => ({
      id: u._id,
      typeOfId: typeof u._id,
      name: u.name
    }))
  });
}
