import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true },
  authorId: { type: String, required: true },
  parentId: { type: String, default: null, index: true },
  
  // Materialized Path pattern for infinite nesting: "ancestorId.parentId"
  // e.g. "60d...123.60d...456"
  path: { type: String, default: "" }, 
  
  content: { type: String, required: true, maxLength: 2000 },
  
  isDeleted: { type: Boolean, default: false },
  
  stats: { 
    likes: { type: Number, default: 0 }, 
    replies: { type: Number, default: 0 } 
  },
  
  likes: [{ type: String }], // userId array
  reportCount: { type: Number, default: 0 },
  
  // Basic author cache for quick renders
  authorCache: {
    username: String,
    displayName: String,
    avatar: String
  }
}, { timestamps: true });

// For fetching thread replies easily
CommentSchema.index({ postId: 1, path: 1 });

CommentSchema.virtual("id").get(function () {
  return this._id.toString();
});

CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

delete mongoose.models.Comment;
export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
