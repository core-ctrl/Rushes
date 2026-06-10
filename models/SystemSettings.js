import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  disableSignups: { type: Boolean, default: false },
  disableLogins: { type: Boolean, default: false },
  readOnlyMode: { type: Boolean, default: false },
  featureFlags: {
    heroVideo: { type: Boolean, default: true },
    trailers: { type: Boolean, default: true },
    search: { type: Boolean, default: true },
    recommendations: { type: Boolean, default: true },
    trending: { type: Boolean, default: true },
    ottAvailability: { type: Boolean, default: true },
    aiFeatures: { type: Boolean, default: false },
    watchlists: { type: Boolean, default: true }
  },
  updatedBy: { type: String }
}, { timestamps: true });

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
