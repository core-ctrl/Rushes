// pages/api/auth/logout.js

import cookie from "cookie";

export default function handler(req, res) {
  try {
    // ✅ Allow only POST (important for security)
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ✅ Clear cookie properly
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0), // stronger than maxAge: 0
        path: "/",
      })
    );

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
}
