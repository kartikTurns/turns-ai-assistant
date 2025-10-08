// User model - represents authenticated users by businessId
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  businessId: string;
  accessToken: string;
  refreshToken?: string;
  lastLoginAt: Date;
  createdAt: Date;
  tokenBalance: number;
  metadata: {
    loginCount: number;
    lastIp?: string;
  };
}

const UserSchema = new Schema<IUser>({
  businessId: {
    type: String,
    required: true,
    unique: true
    // Removed "index: true" to avoid duplicate - unique already creates index
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
  tokenBalance: {
    type: Number,
    default: 1000000, // 1 million tokens for new users
    min: 0
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

// Note: No need for UserSchema.index({ businessId: 1 }) because "unique: true" already creates it

export const User = mongoose.model<IUser>('User', UserSchema);
