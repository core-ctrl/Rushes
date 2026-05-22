import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";

export default async function handler(req, res) {
  await connectDB();
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ users: [] });
  }

  const users = await User.find({
    $or: [
      { username: { $regex: q.trim(), $options: "i" } },
      { displayName: { $regex: q.trim(), $options: "i" } },
      { email: { $regex: q.trim(), $options: "i" } },
    ],
  })
    .select("_id username displayName avatar bio followers following")
    .limit(20)
    .lean();

  console.log(`Search "${q}" found ${users.length} users`);

  res.json({ users });
}
