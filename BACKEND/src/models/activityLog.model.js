import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    refType: {
      type: String,
      default: '',
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'activityLogs',
  }
);

ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
export default ActivityLog;
