// models/Report.js
import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    reportedBy: String,        // userId of reporter (optional)
    reporterEmail: String,     // email of reporter (optional)
    targetId: String,          // userId or takeId being reported
    targetUsername: String,    // @username being reported
    targetType: { type: String, enum: ['user', 'take', 'message'], default: 'user' },
    reason: String,            // type/category of report
    description: String,       // detailed description
    status: { type: String, enum: ['pending', 'dismissed', 'warned', 'banned'], default: 'pending' },
    resolvedAt: Date,
    resolvedBy: String,        // admin userId who resolved
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
