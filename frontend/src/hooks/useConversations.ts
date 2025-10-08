import { useState, useEffect } from 'react';
import type { Conversation, Message } from '../types';
import { chatApi } from '../services/chatApi';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    // Load current conversation ID from localStorage on init
    return localStorage.getItem('currentConversationId');
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from backend on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const chats = await chatApi.getChats();
      setConversations(chats);

      // Validate that the stored currentConversationId still exists
      const storedId = localStorage.getItem('currentConversationId');
      let selectedId: string | null = null;

      if (storedId && chats.some(chat => chat.id === storedId)) {
        selectedId = storedId;
        setCurrentConversationId(storedId);

        // Load messages for the selected conversation
        try {
          const chatWithMessages = await chatApi.getChat(selectedId);
          setConversations(prev => prev.map(conv =>
            conv.id === selectedId ? chatWithMessages : conv
          ));
        } catch (error) {
          console.error('Error loading conversation messages:', error);
        }
      } else {
        // If no valid stored conversation, don't create one yet
        // Let the user send a message first, then create it
        setCurrentConversationId(null);
        localStorage.removeItem('currentConversationId');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback to empty state if not authenticated
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    // Check if current conversation is empty, if so just clear it instead of creating new one
    const currentConv = conversations.find(conv => conv.id === currentConversationId);
    if (currentConv && currentConv.messages.length === 0) {
      // Current conversation is already empty, just return its ID
      return currentConversationId as string;
    }

    try {
      const newChat = await chatApi.createChat();
      setConversations(prev => [newChat, ...prev]);
      setCurrentConversationId(newChat.id);
      localStorage.setItem('currentConversationId', newChat.id);
      return newChat.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to local-only conversation if API fails
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      localStorage.setItem('currentConversationId', newConversation.id);
      return newConversation.id;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await chatApi.deleteChat(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      if (currentConversationId === conversationId) {
        const remaining = conversations.filter(conv => conv.id !== conversationId);
        const newId = remaining.length > 0 ? remaining[0].id : null;
        setCurrentConversationId(newId);
        if (newId) {
          localStorage.setItem('currentConversationId', newId);
        } else {
          localStorage.removeItem('currentConversationId');
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const updateConversation = async (conversationId: string, messages: Message[]) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        // Update title with first user message if it's still "New Chat"
        let title = conv.title;
        if (title === 'New Chat' && messages.length > 0) {
          const firstUserMessage = messages.find(msg => msg.role === 'user');
          if (firstUserMessage) {
            title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');

            // Update title in backend
            chatApi.updateChatTitle(conversationId, title).catch(err => {
              console.error('Error updating chat title:', err);
            });
          }
        }

        return {
          ...conv,
          title,
          messages,
          updatedAt: new Date().toISOString(),
        };
      }
      return conv;
    }));
  };

  const saveMessageToBackend = async (
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    toolUses?: any[]
  ) => {
    try {
      await chatApi.saveMessage(chatId, role, content, toolUses);
    } catch (error) {
      console.error('Error saving message to backend:', error);
    }
  };

  const getCurrentConversation = () => {
    if (!currentConversationId) return null;
    return conversations.find(conv => conv.id === currentConversationId) || null;
  };

  const selectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    localStorage.setItem('currentConversationId', conversationId);

    // Load messages for this conversation if not already loaded
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation && (!conversation.messages || conversation.messages.length === 0)) {
      try {
        const chatWithMessages = await chatApi.getChat(conversationId);
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? chatWithMessages : conv
        ));
      } catch (error) {
        console.error('Error loading conversation messages:', error);
      }
    }
  };

  return {
    conversations,
    currentConversationId,
    getCurrentConversation,
    createNewConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
    saveMessageToBackend,
    isLoading,
    loadConversations, // Expose for manual refresh
  };
}