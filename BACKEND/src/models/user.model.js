import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      default: 'manager',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    department: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: false,
    timestamps: false,
  }
);

export const User = mongoose.models.User || model('User', UserSchema);
export default User;
