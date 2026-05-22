import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    fromUserId: { type: String, required: true },
    fromUsername: { type: String, required: true },
    fromAvatar: { type: String, default: null },
    type: { type: String, required: true }, // 'mention', 'like', etc.
    content: { type: String, required: true },
    referenceId: { type: String, required: true }, // take ID, etc.
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.virtual("id").get(function () {
  return this._id.toString();
});

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

delete mongoose.models.Notification;
export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
