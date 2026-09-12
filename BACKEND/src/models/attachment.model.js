import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema(
  {
    refType: {
      type: String,
      enum: ['task', 'project'],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const Attachment = mongoose.models.Attachment || mongoose.model('Attachment', AttachmentSchema);
export default Attachment;
