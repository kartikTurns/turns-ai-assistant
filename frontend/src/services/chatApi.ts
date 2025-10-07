// Chat API service - replaces localStorage with backend API calls
import type { Conversation, Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Login or create user in MongoDB after authentication
 */
export async function loginUser(businessId: string, accessToken: string, refreshToken?: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      businessId,
      accessToken,
      refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  return data;
}

// Helper to get auth headers from localStorage
function getAuthHeaders(): HeadersInit {
  // Load from the correct storage key
  const authParamsJson = localStorage.getItem('claude-auth-params');
  let accessToken, businessId, refreshToken;

  if (authParamsJson) {
    try {
      const authParams = JSON.parse(authParamsJson);
      accessToken = authParams.accessToken;
      businessId = authParams.businessId;
      refreshToken = authParams.refreshToken;
    } catch (error) {
      console.error('Error parsing auth params:', error);
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(accessToken && { 'X-Access-Token': accessToken }),
    ...(businessId && { 'X-Business-Id': businessId }),
    ...(refreshToken && { 'X-Refresh-Token': refreshToken })
  };
}

export const chatApi = {
  /**
   * Get all chats for the current user
   */
  async getChats(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    const data = await response.json();
    return data.chats || [];
  },

  /**
   * Create a new chat
   */
  async createChat(title?: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: title || 'New Chat' })
    });

    if (!response.ok) {
      throw new Error('Failed to create chat');
    }

    const data = await response.json();
    return data.chat;
  },

  /**
   * Get a specific chat with all messages
   */
  async getChat(chatId: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat');
    }

    const data = await response.json();
    return data.chat;
  },

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error('Failed to update chat');
    }
  },

  /**
   * Delete a chat
   */
  async deleteChat(chatId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
  },

  /**
   * Save a message to a chat
   */
  async saveMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    toolUses?: any[],
    tokens?: number,
    model?: string
  ): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatId,
        role,
        content,
        toolUses,
        tokens,
        model
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    const data = await response.json();
    return data.message;
  }
};
