import mongoose from "mongoose";

const ListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    coverImage: { type: String, default: '' },
    privacy: { type: String, enum: ['public', 'private'], default: 'public' },
    movies: [
      {
        tmdbId: Number,
        mediaType: { type: String, enum: ['movie', 'tv'], default: 'movie' },
        title: String,
        posterPath: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

ListSchema.index({ userId: 1 });
ListSchema.index({ privacy: 1 });

const List = mongoose.models.List || mongoose.model("List", ListSchema);
export default List;
