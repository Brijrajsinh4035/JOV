import mongoose from 'mongoose';

const RiskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'mitigated', 'closed'],
      required: true,
      default: 'open',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

RiskSchema.index({ projectId: 1 });

export const Risk = mongoose.models.Risk || mongoose.model('Risk', RiskSchema);
export default Risk;
