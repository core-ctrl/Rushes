// services/authService.js
import { connectDB } from "../lib/mongodb.js";
import User from "../models/User.js";
import { signToken } from "../lib/auth.js";
import { sendLoginThankYouEmail, sendVerificationEmail } from "../lib/sendEmail.js";
import { avatarOrDefault } from "../lib/avatar.js";
import crypto from "crypto";

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function providerLabel(provider) {
    return provider === "google" ? "Google" : provider === "github" ? "GitHub" : "email and password";
}

function hasCustomAvatar(avatar = "") {
    return Boolean(
        avatar &&
        avatar !== "/avatar.svg" &&
        !String(avatar).includes("api.dicebear.com")
    );
}

function credentialsEnabled(user) {
    return Array.isArray(user.authProviders) && user.authProviders.includes("credentials");
}

async function migrateOldEmailVerification(user) {
    const storedUser = await User.collection.findOne(
        { _id: user._id },
        { projection: { isEmailVerified: 1 } }
    );

    const hasStoredEmailVerification = Object.prototype.hasOwnProperty.call(
        storedUser || {},
        "isEmailVerified"
    );

    if (!hasStoredEmailVerification || storedUser.isEmailVerified === undefined || storedUser.isEmailVerified === null) {
        user.isEmailVerified = true;
        await user.save();
        return true;
    }

    return storedUser.isEmailVerified;
}

// Validate password strength
export function validatePassword(pw) {
    if (!pw || pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Must contain an uppercase letter";
    if (!/[0-9]/.test(pw)) return "Must contain a number";
    return null;
}

// Generate verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
}

// Username validation
export function validateUsername(username) {
    if (!username || username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be at most 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
    return null;
}

// Check username availability
export async function checkUsernameAvailability(username) {
    await connectDB();
    const existing = await User.findOne({ username: username.toLowerCase() });
    return !existing;
}

// Check email availability
export async function checkEmailAvailability(email) {
    await connectDB();
    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    return !existing;
}

export async function registerUser({ name, email, password, username }) {
    const err = validatePassword(password);
    if (err) throw new Error(err);

    // Validate username if provided
    if (username) {
        const usernameError = validateUsername(username);
        if (usernameError) throw new Error(usernameError);

        const usernameAvailable = await checkUsernameAvailability(username);
        if (!usernameAvailable) throw new Error("Username already taken");
    }

    await connectDB();

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        if (!credentialsEnabled(existing)) {
            const providers = existing.authProviders.filter((provider) => provider !== "credentials").map(providerLabel).join(" or ");
            throw new Error(`An account with this email already exists. Please continue with ${providers}.`);
        }
        throw new Error("An account with this email already exists. Please sign in instead.");
    }

    // Generate 6-digit verification code
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await User.create({
        name: name.trim(),
        username: username ? username.toLowerCase() : undefined,
        displayName: username || name.trim(),
        email: normalizedEmail,
        password,
        avatar: avatarOrDefault("", username || name || normalizedEmail),
        authProviders: ["credentials"],
        verificationToken,
        verificationTokenExpiry,
        isEmailVerified: false,
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(normalizedEmail, verificationToken, username || name.trim()).catch((e) => console.warn("Verification email failed:", e.message));

    // Return response without token - user must verify first
    return {
        message: "Account created. Please check your email to verify your account.",
        requiresVerification: true,
    };
}

export async function loginUser({ email, password }) {
    await connectDB();
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select("+password +verificationToken");
    if (!user) throw new Error("No account found with this email. Please create an account first.");

    if (!credentialsEnabled(user)) {
        const providers = user.authProviders.filter((provider) => provider !== "credentials").map(providerLabel).join(" or ");
        throw new Error(`This email is registered with ${providers}. Please use that sign-in option.`);
    }

    const valid = await user.comparePassword(password);
    if (!valid) throw new Error("Incorrect password. Please try again.");

    // Case 1: Account explicitly marked as not verified = block
    if (user.isEmailVerified === false && user.verificationToken) {
        throw new Error("Please verify your email before logging in.");
    }

    // Case 2: Old account with no isEmailVerified field = migrate silently, allow login
    if (user.isEmailVerified === undefined || user.isEmailVerified === null) {
        await User.findByIdAndUpdate(user._id, { isEmailVerified: true });
    }

    // Case 3: isEmailVerified === true = allow login normally

    sendLoginThankYouEmail(user.email, user.name).catch(() => { });

    const token = signToken({ id: user._id, email: user.email, name: user.name });
    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            username: user.username || "",
            displayName: user.displayName || user.username || user.name,
            email: user.email,
            avatar: avatarOrDefault(user.avatar, user.username || user.email),
            authProviders: user.authProviders,
            hasCompletedOnboarding: user.hasCompletedOnboarding === true,
        },
    };
}

export async function loginOrCreateSocialUser({
    provider,
    providerId,
    email,
    name,
    avatar = "",
}) {
    await connectDB();

    const normalizedEmail = normalizeEmail(email);
    const providerIdField = provider === "google" ? "googleId" : "githubId";
    const providerMatch = { [providerIdField]: providerId };
    let user = await User.findOne({ $or: [providerMatch, { email: normalizedEmail }] }).select("+password");
    let created = false;
    const fallbackUsername = normalizedEmail
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 16) || "viewer";

    if (!user) {
        created = true;
        let username = fallbackUsername;
        let suffix = 0;
        while (await User.exists({ username })) {
            suffix += 1;
            username = `${fallbackUsername}${suffix}`;
        }
        user = await User.create({
            name: name?.trim() || normalizedEmail.split("@")[0],
            username,
            displayName: name?.trim() || username,
            email: normalizedEmail,
            password: `SocialAuth${Math.random().toString(36).slice(2)}A1`,
            authProviders: [provider],
            [providerIdField]: providerId,
            avatar: avatarOrDefault(avatar, normalizedEmail),
            hasCompletedOnboarding: false,
        });
    } else {
        user.name = user.name || name?.trim() || normalizedEmail.split("@")[0];
        user.avatar = hasCustomAvatar(user.avatar)
            ? user.avatar
            : avatarOrDefault(avatar || user.avatar, user.username || normalizedEmail);
        user.email = normalizedEmail;
        user.displayName = user.displayName || user.username || user.name;
        user[providerIdField] = providerId;

        const providers = new Set(user.authProviders || []);
        providers.add(provider);
        user.authProviders = Array.from(providers);
        await user.save();
    }

    sendLoginThankYouEmail(user.email, user.name).catch(() => { });

    const token = signToken({ id: user._id, email: user.email, name: user.name });
    return {
        token,
        isNewUser: created,
        user: {
            id: user._id,
            name: user.name,
            username: user.username || "",
            displayName: user.displayName || user.username || user.name,
            email: user.email,
            avatar: avatarOrDefault(user.avatar, user.username || user.email),
            authProviders: user.authProviders,
            hasCompletedOnboarding: user.hasCompletedOnboarding === true,
        },
    };
}

export async function getUserById(id) {
    await connectDB();
    return User.findById(id).select("-password");
}
