import { connectDB } from "../../lib/mongodb";
import List from "../../models/List";

export default async function handler(req, res) {
  try {
    await connectDB();
    const result = await List.deleteMany({
      title: { $in: ["luv", "luvv", "luvvvvvv", "looveeeeeeeeeeeeeeeeeeeeeeeeeec"] }
    });
    res.status(200).json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
