import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

// ✅ Admin check
async function checkAdmin(req) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) return false;

    await connectDB();

    const user = await User.findById(decoded.id).select("isAdmin");
    return user?.isAdmin === true;
  } catch (err) {
    console.error("Admin check error:", err);
    return false;
  }
}

export default async function handler(req, res) {
  try {
    // ✅ Connect DB once
    await connectDB();

    // ✅ Check admin
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // =========================
    // GET → List users
    // =========================
    if (req.method === "GET") {
      const users = await User.find({})
        .sort({ createdAt: -1 })
        .select("name email createdAt wishlist isAdmin")
        .limit(100); // safer limit

      return res.status(200).json({ users });
    }

    // =========================
    // DELETE → Delete user
    // =========================
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      await User.findByIdAndDelete(id);

      return res.status(200).json({ message: "User deleted" });
    }

    // =========================
    // PATCH → Update admin role
    // =========================
    if (req.method === "PATCH") {
      const { id, isAdmin } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (typeof isAdmin !== "boolean") {
        return res.status(400).json({ error: "isAdmin must be boolean" });
      }

      await User.findByIdAndUpdate(id, { isAdmin });

      return res.status(200).json({ message: "User updated" });
    }

    // =========================
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
