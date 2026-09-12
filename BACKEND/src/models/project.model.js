import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'planning',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    expectedCompletionDate: {
      type: Date,
      default: null,
    },
    budget: {
      type: Number,
      default: 0,
    },
    usedbudget: {
      type: Number,
      default: 0,
    },
    utilizedBudget: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      default: 'Medium',
    },
    department: {
      type: String,
      default: '',
    },
    ministry: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    district: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    responsibleOfficer: {
      type: String,
      default: '',
    },
    milestones: {
      type: Array,
      default: [],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: false,
    timestamps: false,
  }
);

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export default Project;
