// Chat model - represents a conversation
import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  businessId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessageAt: Date;
  metadata: {
    model?: string;
    totalTokens?: number;
    toolCallsCount?: number;
  };
}

const ChatSchema = new Schema<IChat>({
  businessId: {
    type: String,
    required: true
    // Removed "index: true" - compound indexes below cover this
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat'
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    model: {
      type: String,
      default: 'claude-sonnet-4-20250514'
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    toolCallsCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Compound indexes for efficient queries (these already include businessId)
ChatSchema.index({ businessId: 1, updatedAt: -1 }); // For listing user's chats sorted by recent
ChatSchema.index({ businessId: 1, lastMessageAt: -1 }); // For activity-based sorting

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
