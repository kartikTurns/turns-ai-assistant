// Message service - business logic for message operations
import { Message, IMessage, IToolUse } from '../models/Message';
import { chatService } from './chatService';
import { Types } from 'mongoose';

export class MessageService {
  /**
   * Save a new message to a chat
   */
  async saveMessage(
    chatId: string,
    businessId: string,
    role: 'user' | 'assistant',
    content: string,
    options?: {
      toolUses?: IToolUse[];
      tokens?: number;
      model?: string;
    }
  ): Promise<IMessage> {
    const message = new Message({
      chatId: new Types.ObjectId(chatId),
      businessId,
      role,
      content,
      timestamp: new Date(),
      toolUses: options?.toolUses || [],
      metadata: {
        tokens: options?.tokens,
        model: options?.model,
        streamingComplete: true
      }
    });

    await message.save();

    // Update chat metadata
    await chatService.updateChatMetadata(chatId, {
      incrementMessageCount: 1,
      lastMessageAt: message.timestamp,
      incrementTokens: options?.tokens || 0,
      incrementToolCalls: options?.toolUses?.length || 0
    });

    // Auto-update chat title if it's the first user message
    if (role === 'user') {
      const chat = await chatService.getChatById(chatId, businessId);
      if (chat && chat.title === 'New Chat' && chat.messageCount === 1) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await chatService.updateChatTitle(chatId, title, businessId);
      }
    }

    return message;
  }

  /**
   * Get all messages for a chat
   */
  async getChatMessages(
    chatId: string,
    businessId: string,
    options?: {
      limit?: number;
      skip?: number;
    }
  ): Promise<IMessage[]> {
    return await Message.find({
      chatId: new Types.ObjectId(chatId),
      businessId
    })
      .sort({ timestamp: 1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 1000)
      .exec();
  }

  /**
   * Update message (for streaming)
   */
  async updateMessage(
    messageId: string,
    updates: {
      content?: string;
      toolUses?: IToolUse[];
      streamingComplete?: boolean;
    }
  ): Promise<IMessage | null> {
    const updateQuery: any = {};

    if (updates.content !== undefined) {
      updateQuery.content = updates.content;
    }

    if (updates.toolUses !== undefined) {
      updateQuery.toolUses = updates.toolUses;
    }

    if (updates.streamingComplete !== undefined) {
      updateQuery['metadata.streamingComplete'] = updates.streamingComplete;
    }

    return await Message.findByIdAndUpdate(
      messageId,
      updateQuery,
      { new: true }
    ).exec();
  }

  /**
   * Convert to frontend format
   */
  convertToFrontendFormat(messages: IMessage[]): any[] {
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp.toISOString(),
      toolUses: msg.toolUses || []
    }));
  }
}

export const messageService = new MessageService();
