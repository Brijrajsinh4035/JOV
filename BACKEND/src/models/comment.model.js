import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
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
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
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

export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export default Comment;
