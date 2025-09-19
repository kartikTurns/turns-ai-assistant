import { useState, useEffect } from 'react';
import type { Conversation, Message } from '../types';

const STORAGE_KEY = 'claude-conversations';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedConversations = JSON.parse(stored);
        setConversations(parsedConversations);
        if (parsedConversations.length > 0) {
          setCurrentConversationId(parsedConversations[0].id);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save conversations to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, isLoaded]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    return newConversation.id;
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter(conv => conv.id !== conversationId);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateConversation = (conversationId: string, messages: Message[]) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        // Update title with first user message if it's still "New Chat"
        let title = conv.title;
        if (title === 'New Chat' && messages.length > 0) {
          const firstUserMessage = messages.find(msg => msg.role === 'user');
          if (firstUserMessage) {
            title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
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

  const getCurrentConversation = () => {
    if (!currentConversationId) return null;
    return conversations.find(conv => conv.id === currentConversationId) || null;
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  return {
    conversations,
    currentConversationId,
    getCurrentConversation,
    createNewConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
  };
}