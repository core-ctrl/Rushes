import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import { avatarOrDefault } from "../../../lib/avatar";
import { sendLoginThankYouEmail } from "../../../lib/sendEmail";

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function githubClientId() {
  return process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
}

function fallbackUsername(email = "") {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
  return `${base}${Math.floor(Math.random() * 999)}`;
}

function hasCustomAvatar(avatar = "") {
  return Boolean(
    avatar &&
    avatar !== "/avatar.svg" &&
    !String(avatar).includes("api.dicebear.com")
  );
}

async function migrateMissingEmailVerification(user) {
  const storedUser = await User.collection.findOne(
    { _id: user._id },
    { projection: { isEmailVerified: 1 } }
  );

  const hasEmailVerificationField = Object.prototype.hasOwnProperty.call(
    storedUser || {},
    "isEmailVerified"
  );

  if (!hasEmailVerificationField || storedUser.isEmailVerified === undefined || storedUser.isEmailVerified === null) {
    user.isEmailVerified = true;
    await user.save();
    return true;
  }

  return storedUser.isEmailVerified;
}

export const authOptions = {
  providers: [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      await connectDB();

      const email = credentials?.email?.trim().toLowerCase();
      const user = await User.findOne({ email }).select("+password +verificationToken");

      if (!user) throw new Error("No account found with this email");

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) throw new Error("Incorrect password");

      if (user.isEmailVerified === false && user.verificationToken) {
        throw new Error("Please verify your email first");
      }

      if (user.isEmailVerified === undefined || user.isEmailVerified === null) {
        user.isEmailVerified = true;
        await user.save();
      }

      return {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName || user.username || user.name,
        avatar: avatarOrDefault(user.avatar, user.username || user.email),
        hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      };
    },
  }),
],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        await connectDB();

        const email = user.email?.trim().toLowerCase();
        if (!email) return false;

        let existingUser = await User.findOne({ email });
        const providerIdField = account.provider === "google" ? "googleId" : "githubId";

        if (!existingUser) {
          const username = fallbackUsername(email);
          existingUser = await User.create({
            email,
            name: user.name || username,
            displayName: user.name || username,
            username,
            password: `OAuth${crypto.randomBytes(24).toString("hex")}A1`,
            avatar: avatarOrDefault(user.image, email),
            isEmailVerified: true,
            hasCompletedOnboarding: false,
            authProviders: [account.provider],
            provider: account.provider,
            [providerIdField]: account.providerAccountId,
          });
        } else {
          existingUser.isEmailVerified = true;
          existingUser.avatar = hasCustomAvatar(existingUser.avatar)
            ? existingUser.avatar
            : avatarOrDefault(user.image || existingUser.avatar, existingUser.username || email);
          existingUser.displayName = existingUser.displayName || user.name || existingUser.username || existingUser.name;
          existingUser.name = existingUser.name || user.name || existingUser.username || email.split("@")[0];
          existingUser[providerIdField] = account.providerAccountId;

          const providersForUser = new Set(existingUser.authProviders || []);
          providersForUser.add(account.provider);
          existingUser.authProviders = Array.from(providersForUser);

          await existingUser.save();
        }
        
        sendLoginThankYouEmail(existingUser.email, existingUser.name).catch(() => {});

        user.id = existingUser._id.toString();
        user.username = existingUser.username;
        user.displayName = existingUser.displayName || existingUser.username || existingUser.name;
        user.avatar = avatarOrDefault(existingUser.avatar, existingUser.username || email);
        user.hasCompletedOnboarding = existingUser.hasCompletedOnboarding ?? false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.displayName = user.displayName;
        token.hasCompletedOnboarding = user.hasCompletedOnboarding;
        token.avatar = user.avatar;
      }
      return token;
    },

    async session({ session, token }) {
      if (!token?.id) return session;

      await connectDB();
      const dbUser = await User.findById(token.id).select(
        "username displayName avatar hasCompletedOnboarding preferredGenres preferredLanguages preferredPlatforms isEmailVerified"
      );

      if (dbUser) {
        session.user.id = token.id;
        session.user.username = dbUser.username;
        session.user.displayName = dbUser.displayName;
        session.user.avatar = avatarOrDefault(dbUser.avatar, dbUser.username || session.user.email);
        session.user.hasCompletedOnboarding = dbUser.hasCompletedOnboarding ?? false;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

if (hasValue(process.env.GOOGLE_CLIENT_ID) && hasValue(process.env.GOOGLE_CLIENT_SECRET)) {
  authOptions.providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (hasValue(githubClientId()) && hasValue(process.env.GITHUB_CLIENT_SECRET)) {
  authOptions.providers.push(
    GitHubProvider({
      clientId: githubClientId(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export default async function auth(req, res) {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const customAuthOptions = {
    ...authOptions,
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          await connectDB();
          const email = credentials?.email?.trim().toLowerCase();
          const user = await User.findOne({ email }).select("+password +verificationToken");

          if (!user) {
            throw new Error("No account found with this email");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            user.loginHistory.push({ status: 'failed', ipAddress, userAgent, reason: 'Incorrect password' });
            await user.save();
            throw new Error("Incorrect password");
          }

          if (user.isEmailVerified === false && user.verificationToken) {
            user.loginHistory.push({ status: 'failed', ipAddress, userAgent, reason: 'Unverified email' });
            await user.save();
            throw new Error("Please verify your email first");
          }

          if (user.isEmailVerified === undefined || user.isEmailVerified === null) {
            user.isEmailVerified = true;
          }

          user.lastIpAddress = ipAddress;
          user.loginHistory.push({ status: 'success', ipAddress, userAgent });
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            displayName: user.displayName || user.username || user.name,
            avatar: avatarOrDefault(user.avatar, user.username || user.email),
            hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
          };
        },
      }),
      ...authOptions.providers.filter(p => p.id !== 'credentials')
    ],
    callbacks: {
      ...authOptions.callbacks,
      async signIn({ user, account, profile }) {
        const isAllowed = await authOptions.callbacks.signIn({ user, account });
        if (isAllowed && user?.email && account?.provider !== 'credentials') {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            dbUser.lastIpAddress = ipAddress;
            dbUser.loginHistory.push({ status: 'success', ipAddress, userAgent, reason: `OAuth: ${account.provider}` });
            await dbUser.save();
          }
        }
        return isAllowed;
      }
    }
  };

  return await NextAuth(req, res, customAuthOptions);
}
