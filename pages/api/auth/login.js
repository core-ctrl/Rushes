// pages/api/auth/login.js

import { validate, loginSchema } from "@/middleware/validate";
import { rateLimit } from "@/lib/rateLimit";
import * as AuthService from "@/services/authService";
import cookie from "cookie";
import { getClientIp } from "@/lib/security";
import { checkAuthEnabled } from "@/middleware/systemCheck";

export default async function handler(req, res) {
  try {
    // Check emergency operations first
    const authStatus = await checkAuthEnabled("login");
    if (!authStatus.allowed) {
      return res.status(403).json({ error: authStatus.message });
    }

    // ✅ Only POST allowed
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate limiting — 5 attempts per 15 minutes per email
    const email = req.body?.email || getClientIp(req) || 'unknown';
    try {
      await rateLimit(`login:${email}`, 5, 900);
    } catch (limitErr) {
      return res.status(429).json({ error: limitErr.message });
    }

    // ✅ Check body exists
    if (!req.body) {
      return res.status(400).json({ error: "Request body missing" });
    }

    // ✅ Validate input
    const { success, data, error } = validate(loginSchema, req.body);
    if (!success) {
      return res.status(400).json({ error });
    }

    // ✅ Login user
    const { token, user } = await AuthService.loginUser(data);

    // ✅ Set cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    );

    // ✅ Success
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Login Error:", err);
    const message = err.message || "Login failed";

    // Map specific errors
    let status = 500;
    let userMessage = "An unexpected error occurred";

    if (message.includes("No account") || message.includes("not found")) {
      status = 404;
      userMessage = "No account found with this email";
    } else if (message.includes("password") || message.includes("credentials")) {
      status = 401;
      userMessage = "Invalid email or password";
    } else if (message.includes("verify")) {
      status = 401;
      userMessage = "Please verify your email before logging in.";
      return res.status(status).json({ success: false, error: userMessage, requiresVerification: true, email: req.body?.email });
    }

    return res.status(status).json({ success: false, error: userMessage });
  }
}
