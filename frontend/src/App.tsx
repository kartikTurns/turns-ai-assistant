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
                };
                currentToolUses.push(toolUse);
                
                // Update message with tool uses
                currentMessages = currentMessages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, toolUses: [...currentToolUses] }
                    : msg
                );
                updateConversation(conversationId, currentMessages);
              } else if (data.type === 'tool_result') {
                // Update tool use with result
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
                // Update tool use with error
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
                currentMessages = currentMessages.map(msg => 
                  msg.id === data.id 
                    ? { ...msg, content: data.message, toolUses: currentToolUses }
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {currentConversation?.title || 'Claude Chat Clone'}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Welcome to Claude Chat</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg p-4 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-gray-500 text-sm">Claude is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

export default App
