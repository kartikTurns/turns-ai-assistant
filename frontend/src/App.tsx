import { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { useConversations } from './hooks/useConversations';
import type { Message, ChatResponse, ToolUse } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    conversations,
    currentConversationId,
    getCurrentConversation,
    createNewConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
  } = useConversations();

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Create new conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = createNewConversation();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message
    const messagesWithUser = [...messages, userMessage];
    updateConversation(conversationId, messagesWithUser);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          messages: messagesWithUser
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessageId = '';
      let assistantContent = '';
      let currentMessages = messagesWithUser;
      let currentToolUses: ToolUse[] = [];

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                if (!assistantMessageId) {
                  assistantMessageId = data.id;
                  const assistantMessage: Message = {
                    id: data.id,
                    content: data.text,
                    role: 'assistant',
                    timestamp: data.timestamp,
                    toolUses: [],
                  };
                  currentMessages = [...currentMessages, assistantMessage];
                  updateConversation(conversationId, currentMessages);
                  assistantContent = data.text;
                } else {
                  assistantContent += data.text;
                  currentMessages = currentMessages.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent, toolUses: currentToolUses }
                      : msg
                  );
                  updateConversation(conversationId, currentMessages);
                }
              } else if (data.type === 'tool_use') {
                // Add tool use to current tools
                const toolUse: ToolUse = {
                  id: data.id,
                  name: data.name,
                  input: data.input,
                  status: data.status || 'executing',
                };
                currentToolUses.push(toolUse);
                
                // Update message with tool uses
                currentMessages = currentMessages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, toolUses: [...currentToolUses] }
                    : msg
                );
                updateConversation(conversationId, currentMessages);
              } else if (data.type === 'tool_complete') {
                // Update tool use with result or error
                currentToolUses = currentToolUses.map(tool =>
                  tool.id === data.id
                    ? {
                        ...tool,
                        result: data.result || undefined,
                        error: data.error || undefined,
                        status: data.status
                      }
                    : tool
                );

                currentMessages = currentMessages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, toolUses: [...currentToolUses] }
                    : msg
                );
                updateConversation(conversationId, currentMessages);
              } else if (data.type === 'tool_result') {
                // Legacy support - Update tool use with result
                currentToolUses = currentToolUses.map(tool =>
                  tool.id === data.tool_use_id
                    ? { ...tool, result: JSON.parse(data.content) }
                    : tool
                );

                currentMessages = currentMessages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, toolUses: [...currentToolUses] }
                    : msg
                );
                updateConversation(conversationId, currentMessages);
              } else if (data.type === 'tool_error') {
                // Legacy support - Update tool use with error
                currentToolUses = currentToolUses.map(tool =>
                  tool.id === data.tool_use_id
                    ? { ...tool, error: data.error }
                    : tool
                );

                currentMessages = currentMessages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, toolUses: [...currentToolUses] }
                    : msg
                );
                updateConversation(conversationId, currentMessages);
              } else if (data.type === 'done') {
                // Just mark as done, don't modify content since it's already set
                currentMessages = currentMessages.map(msg =>
                  msg.id === data.id
                    ? { ...msg, toolUses: currentToolUses }
                    : msg
                );
                updateConversation(conversationId, currentMessages);
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      const currentMessages = [...messagesWithUser, errorMessage];
      updateConversation(conversationId, currentMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <h1 className="text-2xl font-medium text-gray-900 mb-2">Welcome to Claude</h1>
                <p className="text-sm text-gray-600">How can I help you today?</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="px-6 py-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-gray-600 text-sm">Claude is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white flex-shrink-0">
          <div className="max-w-3xl mx-auto w-full px-4">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App