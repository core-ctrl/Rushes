const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  reportedBy: { type: String, index: true },
  reporterEmail: String,
  reporterUsername: String,
  targetId: { type: String, required: true, index: true },
  targetUsername: String,
  targetType: { 
    type: String, 
    enum: ['user', 'post', 'comment', 'message', 'review', 'take'], 
    default: 'user',
    index: true 
  },
  category: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'nsfw', 'fake_info', 'copyright', 'scam', 'other'],
    required: true
  },
  reason: { type: String, required: true },
  description: { type: String, maxLength: 2000 },
  evidence: [{
    type: { type: String, enum: ['url', 'screenshot', 'text'] },
    value: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'resolved', 'rejected', 'dismissed', 'warned', 'banned'], 
    default: 'pending',
    index: true 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: { type: String, default: null },
  adminNotes: [{
    adminId: String,
    adminName: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
  }],
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  appealMessage: String,
  resolvedAt: Date,
  resolvedBy: String,
}, { timestamps: true });

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetId: 1, targetType: 1 });
ReportSchema.index({ reportedBy: 1, createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
module.exports = Report;
