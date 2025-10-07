// User model - represents authenticated users by businessId
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  businessId: string;
  accessToken: string;
  refreshToken?: string;
  lastLoginAt: Date;
  createdAt: Date;
  metadata: {
    loginCount: number;
    lastIp?: string;
  };
}

const UserSchema = new Schema<IUser>({
  businessId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    loginCount: {
      type: Number,
      default: 1
    },
    lastIp: {
      type: String
    }
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Index for efficient lookups
UserSchema.index({ businessId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
