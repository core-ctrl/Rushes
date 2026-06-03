import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fromUserId: { type: String, required: true },
  fromUsername: { type: String, required: true },
  fromAvatar: { type: String, default: null },
  type: { 
    type: String, 
    required: true,
    enum: ['like', 'comment', 'reply', 'follow', 'mention', 'message', 'call', 'report', 'watchlist', 'repost', 'system']
  },
  category: {
    type: String,
    enum: ['social', 'messaging', 'calls', 'moderation', 'system'],
    default: 'social'
  },
  content: { type: String, required: true },
  referenceId: { type: String, default: null },
  referenceType: { type: String, enum: ['post', 'comment', 'message', 'call', 'user', null], default: null },
  read: { type: Boolean, default: false, index: true },
  groupKey: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

notificationSchema.virtual("id").get(function () {
  return this._id.toString();
});

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

delete mongoose.models.Notification;
export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
