const mongoose = require("mongoose");

const MovieCardSchema = new mongoose.Schema({
  tmdbId: Number,
  title: String,
  poster: String,
  mediaType: String,
  year: String,
  rating: String,
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, default: "" },
  
  // Message type
  messageType: { type: String, enum: ['text', 'image', 'video', 'voice', 'movie_card', 'system'], default: 'text' },
  
  // Media
  movieCard: { type: MovieCardSchema, default: null },
  voiceUrl: { type: String, default: null },
  mediaUrl: { type: String, default: null },
  mediaThumbnail: { type: String, default: null },
  mediaDuration: { type: Number, default: null },
  
  // Reactions
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Edit support
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  editHistory: [{ content: String, editedAt: Date }],
  
  // Delete support
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // Reply thread
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  
  // Read tracking
  status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    readAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
module.exports = Message;
