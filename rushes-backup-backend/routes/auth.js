const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookie = require("cookie");
const crypto = require("crypto");

// Imports mapping from @/lib and @/models and @/services
const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");
const { getUserFromRequest, signToken } = require("../lib/auth");
const { avatarOrDefault } = require("../lib/avatar");
const { rateLimit } = require("../lib/rateLimit");
const { getClientIp } = require("../lib/security");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../lib/sendEmail");
const { sendPasswordChangedEmail, sendWelcomeEmail } = require("../lib/mailer");
const { validate, loginSchema, registerSchema } = require("../middleware/validate");
const AuthService = require("../services/authService");
const {
  getOAuthConfig,
  oauthConfigured,
  createOAuthState,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchSocialProfile,
} = require("../lib/oauth");

// Custom RequireAuth inline helper or from middleware
const { requireAuth } = require("../middleware/auth");

// Configure passport for Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }
          const socialProfile = {
            provider: "google",
            providerId: profile.id,
            email: email,
            name: profile.displayName || profile.name?.givenName || "Google User",
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
          };
          const result = await AuthService.loginOrCreateSocialUser(socialProfile);
          return done(null, result);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// Helper for redirects in OAuth
function redirectWithError(req, res, provider, message) {
  const base = process.env.NEXT_PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
  return res.redirect(`${base}/?authMode=login&authError=${encodeURIComponent(message)}&provider=${provider}`);
}

function authRedirect(req, query) {
  const base = process.env.NEXT_PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/?${new URLSearchParams(query).toString()}`;
}

// 1. POST /login
router.post("/login", async (req, res) => {
  try {
    const email = req.body?.email || getClientIp(req) || "unknown";
    try {
      await rateLimit(`login:${email}`, 5, 900);
    } catch (limitErr) {
      return res.status(429).json({ error: limitErr.message });
    }

    if (!req.body) {
      return res.status(400).json({ error: "Request body missing" });
    }

    const { success, data, error } = validate(loginSchema, req.body);
    if (!success) {
      return res.status(400).json({ error });
    }

    const { token, user } = await AuthService.loginUser(data);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res.status(200).json({ user });
  } catch (err) {
    console.error("Login Error:", err);
    const message = err.message || "Login failed";

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
});

// 2. POST /register
router.post("/register", async (req, res) => {
  try {
    const ip = getClientIp(req) || "unknown";
    try {
      await rateLimit(`register:${ip}`, 3, 3600);
    } catch (limitErr) {
      return res.status(429).json({ error: limitErr.message });
    }

    if (!req.body) {
      return res.status(400).json({ error: "Request body missing" });
    }

    const { success, data, error } = validate(registerSchema, req.body);
    if (!success) {
      return res.status(400).json({ error });
    }

    const result = await AuthService.registerUser(data);

    if (result.token) {
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // Fire analytics event fire-and-forget
    setImmediate(() => {
      try {
        const origin = req.headers.origin || process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 4000}`;
        fetch(`${origin}/api/analytics/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "signup_completed", userId: result.user?.id || null }),
        }).catch(() => {});
      } catch {}
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error("Register Error:", err);
    const message = err.message || "Something went wrong";
    const status = message.includes("already exists") || message.includes("Please continue") ? 409 : 500;
    return res.status(status).json({ error: message });
  }
});

// 3. GET /me
router.get("/me", async (req, res) => {
  let userId = null;

  const decoded = getUserFromRequest(req);
  if (decoded && decoded.id) {
    userId = decoded.id;
  }

  if (!userId) {
    return res.status(401).json({ user: null });
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        displayName: user.displayName || user.username || user.name,
        email: user.email,
        username: user.username || "",
        avatar: avatarOrDefault(user.avatar, user.username || user.email),
        bio: user.bio || "",
        authProviders: user.authProviders || [],
        preferredGenres: user.preferredGenres || [],
        preferredLanguages: user.preferredLanguages || [],
        preferredRegions: user.preferredRegions || [],
        preferredRegionGroup: user.preferredRegionGroup || "",
        preferredPlatforms: user.preferredPlatforms || [],
        ottPlatforms: user.ottPlatforms || user.preferredPlatforms || [],
        allowLocationRecommendations: Boolean(user.allowLocationRecommendations),
        hasCompletedOnboarding: user.hasCompletedOnboarding === true,
        wishlist: user.wishlist || [],
        watchHistory: user.watchHistory || [],
        following: user.following || [],
        followers: user.followers || [],
      },
    });
  } catch (err) {
    console.error("Auth/me error:", err);
    return res.status(200).json({ user: null, error: "Failed to fetch user" });
  }
});

// 4. POST /logout
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
});

// 5. POST /forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

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
});

// 6. POST /reset-password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one number" });
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
});

// 7. POST /change-password
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain an uppercase letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain a number" });
    }

    await connectDB();

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hasCredentials = user.authProviders && user.authProviders.includes("credentials");
    if (!hasCredentials) {
      return res.status(400).json({ error: "Password change not available for social login accounts" });
    }

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error.message);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

// 8. GET /verify-email (Supports POST as well for compatibility)
const verifyEmailHandler = async (req, res) => {
  await connectDB();
  const email = req.query.email || req.body.email;
  const code = req.query.code || req.body.code;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and verification code are required" });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      verificationToken: code,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.username || user.displayName || user.name);

    return res.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ error: "Verification failed." });
  }
};
router.get("/verify-email", verifyEmailHandler);
router.post("/verify-email", verifyEmailHandler);

// 9. POST /resend-verification
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    await rateLimit(`resend-verify:${email.toLowerCase()}`, 3, 3600);
  } catch (err) {
    return res.status(429).json({ error: err.message });
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+verificationToken");

    if (!user) return res.json({ message: "If that email exists, a new verification link has been sent." });

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "This email is already verified. Please sign in." });
    }

    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = newToken;
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendVerificationEmail(
      user.email,
      newToken,
      user.username || user.displayName || user.name || "there"
    ).catch(e => console.warn("Resend verify email failed:", e.message));

    return res.json({ message: "New verification email sent! Check your inbox." });
  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json({ error: "Failed to resend. Please try again." });
  }
});

// 10. Passport.js Google OAuth Routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/?authMode=login&authError=Google%20sign-in%20failed." }),
    (req, res) => {
      const { token, isNewUser } = req.user;

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/",
      });

      const base = process.env.NEXT_PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
      const message = isNewUser
        ? `Thanks for joining Movie Finder with Google.`
        : `Thanks for signing in with Google.`;

      res.redirect(`${base}/?authSuccess=${encodeURIComponent(message)}&authMode=login`);
    }
  );
}

// 11. Manual OAuth routes mimicking Next.js
router.get("/oauth/:provider", async (req, res) => {
  const provider = String(req.params.provider || "");
  const config = getOAuthConfig(provider, req);

  if (!config) {
    return redirectWithError(req, res, provider, "Unsupported sign-in provider.");
  }

  if (!oauthConfigured(config)) {
    return redirectWithError(req, res, provider, `${config.label} sign-in is not configured yet.`);
  }

  const state = createOAuthState();
  res.cookie(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10 * 1000,
    path: "/",
  });

  return res.redirect(buildAuthorizeUrl(config, state));
});

router.get("/oauth/callback/:provider", async (req, res) => {
  const provider = String(req.params.provider || "");
  const { code, state } = req.query;
  const config = getOAuthConfig(provider, req);

  if (!config || !oauthConfigured(config)) {
    return res.redirect(authRedirect(req, { authMode: "login", authError: "Social sign-in is not configured." }));
  }

  const expectedState = req.cookies[`oauth_state_${provider}`];
  res.clearCookie(`oauth_state_${provider}`);

  if (!code || !state || state !== expectedState) {
    return res.redirect(authRedirect(req, { authMode: "login", authError: "Could not verify the social sign-in request." }));
  }

  try {
    const accessToken = await exchangeCodeForToken(config, String(code));
    const profile = await fetchSocialProfile(config, accessToken);
    const { token, isNewUser } = await AuthService.loginOrCreateSocialUser(profile);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    return res.redirect(authRedirect(req, {
      authSuccess: isNewUser
        ? `Thanks for joining Movie Finder with ${config.label}.`
        : `Thanks for signing in with ${config.label}.`,
      authMode: "login",
    }));
  } catch (error) {
    return res.redirect(authRedirect(req, {
      authMode: "login",
      authError: error.message || "Social sign-in failed.",
    }));
  }
});

module.exports = router;
