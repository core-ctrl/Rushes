import mongoose from "mongoose";

const takeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    avatar: { type: String, default: null },
    content: { type: String, default: "" },
    tmdbId: { type: Number, default: null },
    mediaType: { type: String, enum: ["movie", "tv", "image", "video", "none"], default: "movie" },
    tmdbMediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
    movieTitle: { type: String, default: null },
    moviePoster: { type: String, default: null },
    movieBackdrop: { type: String, default: null },
    rating: { type: Number, default: null },
    mood: { type: String, default: null },
    spoiler: { type: Boolean, default: false },
    privacy: { type: String, enum: ["public", "followers"], default: "public" },
    mentions: { type: [String], default: [] },
    likes: { type: [String], default: [] },
    mediaUrl: { type: String, default: null },
    attachmentType: { type: String, enum: ["image", "video", "none"], default: "none" },
    isEdited: { type: Boolean, default: false },
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

takeSchema.virtual("id").get(function () {
  return this._id.toString();
});

takeSchema.set("toJSON", { virtuals: true });
takeSchema.set("toObject", { virtuals: true });

delete mongoose.models.Take;
export default mongoose.models.Take || mongoose.model("Take", takeSchema);

