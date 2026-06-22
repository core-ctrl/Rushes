import mongoose from 'mongoose';

const ErrorEventSchema = new mongoose.Schema({
  message: { type: String, required: true },
  stack: { type: String },
  file: { type: String },
  url: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'processing', 'fixed', 'dismissed'], default: 'open' },
  timestamp: { type: Date, default: Date.now },
  source: { type: String, enum: ['client', 'server'], default: 'client' }
});

export default mongoose.models.ErrorEvent || mongoose.model('ErrorEvent', ErrorEventSchema);
