import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema({
  blocker: { type: String, required: true, index: true },
  blocked: { type: String, required: true, index: true },
  reason: { type: String, default: '' },
}, { timestamps: true });

BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
BlockSchema.index({ blocked: 1, blocker: 1 });

delete mongoose.models.Block;
export default mongoose.models.Block || mongoose.model("Block", BlockSchema);
