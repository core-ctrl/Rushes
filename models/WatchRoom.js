import mongoose from "mongoose";

const WatchRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  hostId: { type: String, default: 'anonymous' },
  hostUsername: { type: String, default: 'Anonymous' },
  mediaId: { type: String },
  mediaType: { type: String, default: 'movie' },
  streamingUrl: { type: String },
  members: { type: Number, default: 1 },
  maxMembers: { type: Number, default: 100 },
  privacy: { type: String, enum: ['public', 'followers', 'private', 'custom'], default: 'public' },
  password: { type: String },
  allowedUsers: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

WatchRoomSchema.index({ isActive: 1, privacy: 1, createdAt: -1 });

export default mongoose.models.WatchRoom || mongoose.model("WatchRoom", WatchRoomSchema);
