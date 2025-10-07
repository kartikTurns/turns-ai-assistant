// Chat service - business logic for chat operations
import { Chat, IChat } from '../models/Chat';
import { Message } from '../models/Message';
import { Types } from 'mongoose';

export class ChatService {
  /**
   * Create a new chat
   */
  async createChat(businessId: string, title: string = 'New Chat'): Promise<IChat> {
    const chat = new Chat({
      businessId,
      title,
      messageCount: 0,
      lastMessageAt: new Date(),
      metadata: {
        model: 'claude-sonnet-4-20250514',
        totalTokens: 0,
        toolCallsCount: 0
      }
    });

    await chat.save();
    return chat;
  }

  /**
   * Get all chats for a user (sorted by most recent)
   */
  async getUserChats(businessId: string, limit: number = 50): Promise<IChat[]> {
    return await Chat.find({ businessId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get a specific chat by ID
   */
  async getChatById(chatId: string, businessId: string): Promise<IChat | null> {
    return await Chat.findOne({
      _id: chatId,
      businessId
    }).exec();
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string, businessId: string): Promise<IChat | null> {
    return await Chat.findOneAndUpdate(
      { _id: chatId, businessId },
      { title, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  /**
   * Delete a chat (and all its messages)
   * Note: Not using transactions since local MongoDB doesn't support them
   */
  async deleteChat(chatId: string, businessId: string): Promise<boolean> {
    try {
      // Delete all messages in the chat first
      await Message.deleteMany({ chatId: new Types.ObjectId(chatId) });

      // Then delete the chat
      const result = await Chat.deleteOne({ _id: chatId, businessId });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  /**
   * Update chat metadata (message count, last message time, etc.)
   */
  async updateChatMetadata(
    chatId: string,
    updates: {
      incrementMessageCount?: number;
      lastMessageAt?: Date;
      incrementTokens?: number;
      incrementToolCalls?: number;
    }
  ): Promise<IChat | null> {
    const updateQuery: any = {
      updatedAt: new Date()
    };

    if (updates.incrementMessageCount) {
      updateQuery.$inc = updateQuery.$inc || {};
      updateQuery.$inc.messageCount = updates.incrementMessageCount;
    }

    if (updates.lastMessageAt) {
      updateQuery.lastMessageAt = updates.lastMessageAt;
    }

    if (updates.incrementTokens) {
      updateQuery.$inc = updateQuery.$inc || {};
      updateQuery.$inc['metadata.totalTokens'] = updates.incrementTokens;
    }

    if (updates.incrementToolCalls) {
      updateQuery.$inc = updateQuery.$inc || {};
      updateQuery.$inc['metadata.toolCallsCount'] = updates.incrementToolCalls;
    }

    return await Chat.findByIdAndUpdate(
      chatId,
      updateQuery,
      { new: true }
    ).exec();
  }

  /**
   * Convert to frontend format
   */
  convertToFrontendFormat(chats: IChat[]): any[] {
    return chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      messages: [], // Messages loaded separately
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    }));
  }
}

export const chatService = new ChatService();
