import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import { avatarOrDefault } from "../../../lib/avatar";
import { requireApiAuth } from "../../../lib/apiAuth";

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const authUser = await requireApiAuth(req, res, { fromDb: true });
    if (!authUser) return;

    const { avatar, username, displayName, bio } = req.body;
    const update = {};

    if (typeof avatar === "string") {
      update.avatar = avatarOrDefault(avatar, authUser.email || authUser.username || authUser.id);
    }

    if (typeof displayName === "string") {
      update.displayName = displayName.trim().slice(0, 60);
      if (update.displayName) update.name = update.displayName;
    }

    if (typeof bio === "string") {
      update.bio = bio.trim().slice(0, 180);
    }

    if (typeof username === "string" && username.trim()) {
      const nextUsername = normalizeUsername(username);
      if (nextUsername.length < 3 || nextUsername.length > 20) {
        return res.status(400).json({ error: "Username must be 3-20 letters, numbers, or underscores." });
      }

      const taken = await User.findOne({ username: nextUsername, _id: { $ne: authUser.id } });
      if (taken) return res.status(409).json({ error: "Username is already taken." });
      update.username = nextUsername;
    }

    const user = await User.findByIdAndUpdate(
      authUser.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpiry -verificationToken -verificationTokenExpiry");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        ...user.toObject(),
        id: user._id,
        avatar: avatarOrDefault(user.avatar, user.username || user.email),
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
