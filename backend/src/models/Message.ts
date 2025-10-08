// Message model - represents individual messages in a chat
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IToolUse {
  id: string;
  name: string;
  input: any;
  result?: any;
  error?: string;
  status?: 'executing' | 'completed' | 'completed_with_warning' | 'error';
  executionTime?: number;
  wasCached?: boolean;
}

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  businessId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolUses?: IToolUse[];
  metadata: {
    tokens?: number;
    model?: string;
    streamingComplete?: boolean;
  };
}

const ToolUseSchema = new Schema<IToolUse>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  input: {
    type: Schema.Types.Mixed,
    default: {}
  },
  result: {
    type: Schema.Types.Mixed
  },
  error: {
    type: String
  },
  status: {
    type: String,
    enum: ['executing', 'completed', 'completed_with_warning', 'error'],
    default: 'executing'
  },
  executionTime: {
    type: Number
  },
  wasCached: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
    // Removed "index: true" - compound index below covers this
  },
  businessId: {
    type: String,
    required: true
    // Removed "index: true" - compound index below covers this
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
    // Removed "index: true" - compound indexes below cover this
  },
  toolUses: {
    type: [ToolUseSchema],
    default: []
  },
  metadata: {
    tokens: {
      type: Number
    },
    model: {
      type: String
    },
    streamingComplete: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Compound indexes for efficient queries (these already include chatId, businessId, timestamp)
MessageSchema.index({ chatId: 1, timestamp: 1 }); // For retrieving messages in order
MessageSchema.index({ businessId: 1, timestamp: -1 }); // For user's message history

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
