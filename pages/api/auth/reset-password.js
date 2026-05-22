import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordChangedEmail } from "@/lib/mailer";

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    await connectDB();
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    sendPasswordChangedEmail(user.email, user.name).catch(() => {});

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return res.status(500).json({ error: "Server error." });
  }
}
