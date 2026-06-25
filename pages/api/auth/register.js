// pages/api/auth/register.js

import { validate, registerSchema } from "@/middleware/validate";
import { rateLimit } from "@/lib/rateLimit";
import * as AuthService from "@/services/authService";
import cookie from "cookie";
import { getClientIp } from "@/lib/security";
import { checkAuthEnabled } from "@/middleware/systemCheck";

export default async function handler(req, res) {
  try {
    // Check emergency operations first
    const authStatus = await checkAuthEnabled("register");
    if (!authStatus.allowed) {
      return res.status(403).json({ error: authStatus.message });
    }

    // ✅ Allow only POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate limiting — 3 attempts per hour per IP
    const ip = getClientIp(req) || 'unknown';
    try {
      await rateLimit(`register:${ip}`, 3, 3600);
    } catch (limitErr) {
      return res.status(429).json({ error: limitErr.message });
    }

    // ✅ Ensure body exists
    if (!req.body) {
      return res.status(400).json({ error: "Request body missing" });
    }

    // ✅ Validate input
    const { success, data, error } = validate(registerSchema, req.body);
    if (!success) {
      return res.status(400).json({ error });
    }

    // ✅ Register user
    const result = await AuthService.registerUser(data);

    if (result.token) {
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })
      );
    }

    // ✅ Success response
    // Fire analytics event fire-and-forget (non-blocking)
    setImmediate(() => {
      try {
        const origin = req.headers.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        fetch(`${origin}/api/analytics/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'signup_completed', userId: result.user?.id || null }),
      }).catch(() => {});
      } catch {}
    });
    return res.status(201).json(result);
  } catch (err) {
    console.error("Register Error:", err);

    const message = err.message || "Something went wrong";

    const status =
      message.includes("already exists") ||
        message.includes("Please continue")
        ? 409
        : 500;

    return res.status(status).json({ error: message });
  }
}
