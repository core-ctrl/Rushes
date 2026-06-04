const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    deactivatedAt: {
      type: Date,
    },
    authProviders: {
      type: [String],
      default: ["credentials"],
    },
    googleId: {
      type: String,
      sparse: true,
    },
    githubId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
      default: "/avatar.svg",
    },
    bio: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
    blockedUsers: [{
      userId: { type: String, required: true },
      blockedAt: { type: Date, default: Date.now }
    }],
    preferredGenres: {
      type: [Number],
      default: [],
    },
    preferredLanguages: {
      type: [String],
      default: [],
    },
    preferredRegions: {
      type: [String],
      default: [],
    },
    preferredRegionGroup: {
      type: String,
      default: "",
    },
    allowLocationRecommendations: {
      type: Boolean,
      default: false,
    },
    preferredPlatforms: {
      type: [String],
      default: [],
    },
    ottPlatforms: {
      type: [String],
      default: [],
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
    location: {
      city: String,
      district: String,
      state: String,
      country: String,
      lat: Number,
      lng: Number,
    },
    wishlist: [
      {
        mediaId: Number,
        mediaType: { type: String, enum: ["movie", "tv"] },
        title: String,
        posterPath: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    watchHistory: [
      {
        mediaId: Number,
        mediaType: { type: String, enum: ["movie", "tv"] },
        title: String,
        posterPath: String,
        watchedAt: { type: Date, default: Date.now },
      },
    ],
    notificationInbox: [
      {
        type: {
          type: String,
          enum: ["taste", "watchlist", "theater_to_ott", "trend_spike"],
        },
        mediaId: Number,
        mediaType: { type: String, enum: ["movie", "tv"] },
        title: String,
        message: String,
        providerNames: { type: [String], default: [] },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    availabilitySnapshots: [
      {
        mediaId: Number,
        mediaType: { type: String, enum: ["movie", "tv"] },
        statusKey: String,
        providerNames: { type: [String], default: [] },
        checkedAt: { type: Date, default: Date.now },
      },
    ],
    notificationSettings: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    // SOCIAL FIELDS
    following: [{ type: String }],       // userIds
    followers: [{ type: String }],       // userIds
    feedPrivacy: {
      type: String,
      enum: ["public", "followers"],
      default: "public",
    },
    likedMovies: [{
      tmdbId: Number,
      mediaType: String,
      title: String,
      poster: String,
      likedAt: Date
    }],
    watchedMovies: [{
      tmdbId: Number,
      mediaType: String,
      title: String,
      poster: String,
      watchedAt: Date,
      rating: Number
    }],
    tasteProfile: {
      topGenres: [Number],
      topLanguages: [String],
      avgRating: Number,
      totalWatched: Number
    },
    // MODERATION
    reportCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    suspensionHistory: [{
      reason: String,
      duration: String,
      suspendedAt: Date,
      expiresAt: Date,
      suspendedBy: String
    }],
    // NOTIFICATION PREFERENCES
    notificationPreferences: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      calls: { type: Boolean, default: true }
    },
    lastNotificationRead: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ "blockedUsers.userId": 1 });
UserSchema.index({ following: 1 });
UserSchema.index({ followers: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

UserSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
