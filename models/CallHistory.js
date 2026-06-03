import mongoose from "mongoose";

const CallHistorySchema = new mongoose.Schema({
  callerId: { type: String, required: true, index: true },
  callerName: String,
  callerAvatar: String,
  receiverId: { type: String, required: true, index: true },
  receiverName: String,
  receiverAvatar: String,
  type: { type: String, enum: ['voice', 'video'], required: true },
  status: { 
    type: String, 
    enum: ['missed', 'answered', 'rejected', 'cancelled', 'busy'], 
    default: 'missed' 
  },
  duration: { type: Number, default: 0 },
  roomId: String,
  startedAt: Date,
  endedAt: Date,
}, { timestamps: true });

CallHistorySchema.index({ callerId: 1, createdAt: -1 });
CallHistorySchema.index({ receiverId: 1, createdAt: -1 });

delete mongoose.models.CallHistory;
export default mongoose.models.CallHistory || mongoose.model("CallHistory", CallHistorySchema);
