import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    unreadCounts: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      },
    ],
    blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // GROUP / CHANNEL SUPPORT
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true, default: '' },
    groupAvatar: { type: String, default: '' },
    groupDescription: { type: String, default: '' },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupModerators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // CHANNEL SUPPORT (public groups)
    isChannel: { type: Boolean, default: false },
    channelSlug: { type: String, lowercase: true, trim: true, sparse: true, unique: true },

    // Message management
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    mutedBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      mutedUntil: Date
    }],
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ isGroup: 1 });
ConversationSchema.index({ channelSlug: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
export default Conversation;
