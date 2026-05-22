import mongoose from "mongoose";

const MovieCardSchema = new mongoose.Schema(
  {
    tmdbId: Number,
    title: String,
    poster: String,
    mediaType: String,
    year: String,
    rating: String,
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    movieCard: { type: MovieCardSchema, default: null },
    voiceUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
