import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  authorId: { type: String, required: true, index: true },
  
  // Post Types: 'text', 'media', 'poll', 'quote', 'repost'
  postType: { type: String, enum: ['text', 'media', 'poll', 'quote', 'repost'], default: 'text' },
  
  content: { type: String, maxLength: 2800 },
  
  // Rich Media Attachments (Images, Video, Voice)
  media: [{
    type: { type: String, enum: ['image', 'video', 'voice'] },
    url: String,
    metadata: mongoose.Schema.Types.Mixed // aspect ratio, waveform data, duration
  }],

  // Movie/Series Integration
  tmdbRef: {
    id: Number,
    mediaType: { type: String, enum: ['movie', 'tv'] },
    title: String,
    poster: String,
    rating: Number // user's rating
  },

  // Social Features
  isSpoiler: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }, // Soft Delete
  isEdited: { type: Boolean, default: false },
  editHistory: [{ content: String, editedAt: Date }],

  // Repost & Quote Logic
  parentPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  
  // Denormalized Counters (for O(1) read performance)
  stats: {
    likes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 },
    quotes: { type: Number, default: 0 }
  },

  hashtags: [{ type: String, index: true }],
  mentions: [{ type: String }],
  
  // Poll support
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{ type: String }] // userIds
    }],
    expiresAt: Date,
    totalVotes: { type: Number, default: 0 }
  },

  // Extended social features
  likes: [{ type: String }], // userId array for quick lookup
  savedBy: [{ type: String }], // userId array
  shareCount: { type: Number, default: 0 },
  saveCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },

  visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  trendingScore: { type: Number, default: 0, index: true },

  // Mood & Spoiler
  mood: { type: String, default: null },
  
  // Basic author cache for quick renders
  authorCache: {
    username: String,
    displayName: String,
    avatar: String
  }
}, { timestamps: true });

// Compound Indexes for Feed Generation
PostSchema.index({ createdAt: -1, authorId: 1 });
PostSchema.index({ 'stats.likes': -1, createdAt: -1 }); // Trending
PostSchema.index({ trendingScore: -1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
PostSchema.index({ 'likes': 1 });

PostSchema.virtual("id").get(function () {
  return this._id.toString();
});

PostSchema.set("toJSON", { virtuals: true });
PostSchema.set("toObject", { virtuals: true });

delete mongoose.models.Post;
export default mongoose.models.Post || mongoose.model("Post", PostSchema);
