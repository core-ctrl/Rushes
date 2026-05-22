import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../lib/sendEmail";
import { rateLimit } from "../../../lib/rateLimit";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // Rate limit: 3 attempts per hour per email
  try {
    await rateLimit(`forgot-pw:${email.toLowerCase()}`, 3, 3600);
  } catch (limitErr) {
    return res.status(429).json({ error: limitErr.message });
  }

  await connectDB();

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    return res.json({ message: "If that email exists a reset link has been sent." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetEmail(email, resetToken, user.username || user.displayName || user.name);
    console.log("Password reset email sent to", email);
  } catch (e) {
    console.error("Failed to send reset email:", e.message);
  }

  res.json({ message: "If that email exists a reset link has been sent." });
}
