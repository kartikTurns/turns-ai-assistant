import { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { useConversations } from './hooks/useConversations';
import {
  getAuthParamsFromUrl,
  cleanAuthParamsFromUrl,
  saveAuthParamsToStorage,
  loadAuthParamsFromStorage,
  type AuthParams
} from './utils/urlParams';
import { frontendAuthService } from './services/authService';
import { loginUser } from './services/chatApi';
import type { Message, ToolUse } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [authParams, setAuthParams] = useState<AuthParams>(() => {
    // Initialize auth params from localStorage on app start
    return loadAuthParamsFromStorage();
  });
  // Load collapsed state from localStorage, default to false (expanded)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loginAttemptedRef = useRef(false); // Track if login was already attempted

  const {
    conversations,
    currentConversationId,
    getCurrentConversation,
    createNewConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
    saveMessageToBackend,
  } = useConversations();

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

  // Extract auth parameters from URL on mount, validate them, and redirect if invalid
  useEffect(() => {
    const validateAuthParams = async (authParams: AuthParams) => {
      if (!authParams.accessToken || !authParams.businessId) {
        console.log('No authentication parameters found, redirecting to admin portal');
        window.location.href = frontendAuthService.getRedirectUrl();
        return;
      }

      try {
        console.log('Validating authentication parameters with API...');
        const authResult = await frontendAuthService.validateAuth(
          authParams.accessToken,
          authParams.businessId
        );

        if (!authResult.status) {
          console.log('Authentication validation failed:', authResult.message);
          console.log('Redirecting to admin portal');
          window.location.href = frontendAuthService.getRedirectUrl();
          return;
        }

        console.log('Authentication validation successful');

        // After validation, login/create user in MongoDB (only once)
        if (!loginAttemptedRef.current) {
          loginAttemptedRef.current = true;
          try {
            console.log('Creating/updating user in database...');
            const loginResult = await loginUser(
              authParams.businessId,
              authParams.accessToken,
              authParams.refreshToken
            );
            console.log('User login successful:', loginResult);
          } catch (error) {
            console.error('Error logging in user to database:', error);
            // Don't block the user if DB login fails, just log it
          }
        }
      } catch (error) {
        console.error('Error validating authentication:', error);
        console.log('Authentication validation error, redirecting to admin portal');
        window.location.href = frontendAuthService.getRedirectUrl();
      }
    };

    const urlAuthParams = getAuthParamsFromUrl();
    if (urlAuthParams.accessToken && urlAuthParams.businessId) {
      setAuthParams(urlAuthParams);
      // Save to localStorage for persistence
      saveAuthParamsToStorage(urlAuthParams);
      // Clean URL parameters after extracting them
      cleanAuthParamsFromUrl();
      console.log('Auth parameters extracted from URL and saved to localStorage:', {
        hasAccessToken: !!urlAuthParams.accessToken,
        businessId: urlAuthParams.businessId,
        hasRefreshToken: !!urlAuthParams.refreshToken
      });

      // Validate the auth parameters immediately
      validateAuthParams(urlAuthParams);
    } else {
      // Check if we have stored auth params
      const storedAuthParams = loadAuthParamsFromStorage();
      if (storedAuthParams.accessToken && storedAuthParams.businessId) {
        console.log('Using stored auth parameters from localStorage:', {
          hasAccessToken: !!storedAuthParams.accessToken,
          businessId: storedAuthParams.businessId,
          hasRefreshToken: !!storedAuthParams.refreshToken
        });
        setAuthParams(storedAuthParams);

        // Validate the stored auth parameters
        validateAuthParams(storedAuthParams);
      } else {
        // No auth parameters found - redirect to admin portal
        console.log('No authentication parameters found, redirecting to admin portal');
        window.location.href = frontendAuthService.getRedirectUrl();
        return;
      }
    }
  }, []);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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
      conversationId = await createNewConversation();
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

    // Save user message to backend
    saveMessageToBackend(conversationId, 'user', content);

    setIsLoading(true);

    // Declare outside try-catch so accessible in finally
    let assistantMessageId = '';
    let currentMessages = messagesWithUser;

    try {
      // Prepare headers with auth parameters
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth headers if available
      if (authParams.accessToken) {
        requestHeaders['X-Access-Token'] = authParams.accessToken;
      }
      if (authParams.businessId) {
        requestHeaders['X-Business-Id'] = authParams.businessId;
      }
      if (authParams.refreshToken) {
        requestHeaders['X-Refresh-Token'] = authParams.refreshToken;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          message: content,
          messages: messagesWithUser
        }),
      });

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          try {
            const errorData = await response.json();
            console.log('Authentication failed from backend:', errorData);
            if (errorData.requiresRedirect && errorData.redirect) {
              console.log('Token expired or invalid, redirecting to:', errorData.redirect);
              window.location.href = errorData.redirect;
              return;
            }
          } catch (e) {
            // If we can't parse the error, still redirect on 401
            console.log('Authentication failed, redirecting to admin portal');
            window.location.href = 'https://admin.turnsapp.com/';
            return;
          }
        }
        throw new Error('Failed to get response');
      }

      // Check if this is a token refresh response
      let reader: ReadableStreamDefaultReader<Uint8Array>;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.clone().json();
        if (responseData.tokenRefreshed && responseData.newAccessToken) {
          console.log('Token was refreshed, updating localStorage with new access token');

          // Update authParams state with new token
          const updatedAuthParams = {
            ...authParams,
            accessToken: responseData.newAccessToken
          };
          setAuthParams(updatedAuthParams);

          // Save updated auth params to localStorage
          saveAuthParamsToStorage(updatedAuthParams);

          console.log('New access token saved to localStorage');

          // Now retry the original request with the new token
          const retryHeaders = { ...requestHeaders };
          retryHeaders['X-Access-Token'] = responseData.newAccessToken;

          const retryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: retryHeaders,
            body: JSON.stringify({
              message: content,
              messages: messagesWithUser
            }),
          });
  
          if (!retryResponse.ok) {
            throw new Error('Failed to get response after token refresh');
          }

          // Use the retry response for processing
          const retryReader = retryResponse.body?.getReader();
          if (!retryReader) {
            throw new Error('No response body after token refresh');
          }

          reader = retryReader;
        } else {
          // Not a token refresh response, use original response
          const originalReader = response.body?.getReader();
          if (!originalReader) {
            throw new Error('No response body');
          }
          reader = originalReader;
        }
      } else {
        // Not JSON response, use original response
        const originalReader = response.body?.getReader();
        if (!originalReader) {
          throw new Error('No response body');
        }
        reader = originalReader;
      }

      let assistantContent = '';
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
      currentMessages = [...messagesWithUser, errorMessage];
      updateConversation(conversationId, currentMessages);
    } finally {
      setIsLoading(false);

      // Save assistant message to backend after streaming completes
      const assistantMsg = currentMessages.find(m => m.id === assistantMessageId);
      if (assistantMsg && conversationId) {
        saveMessageToBackend(
          conversationId,
          'assistant',
          assistantMsg.content,
          assistantMsg.toolUses
        );
      }
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
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Messages - No header needed since sidebar is always visible */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FAFAFA' }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4" style={{ maxWidth: '900px', width: '100%' }}>
                {/* Logo and Welcome */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#FD390E',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    <svg
                      style={{ width: '48px', height: '48px', color: '#FFFFFF' }}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 9a5 5 0 0 0-5 5v3H3v1h1a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5h1v-1h-1v-3a5 5 0 0 0-5-5H9zm2.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM8 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"/>
                    </svg>
                  </div>
                </div>

                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '12px',
                  letterSpacing: '-0.02em'
                }}>
                  Welcome to TurnsIQ
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: '#6B7280',
                  marginBottom: '48px',
                  lineHeight: '1.6'
                }}>
                  Unlock the power of AI. Start a conversation and let's create something extraordinary together.
                </p>

                {/* Feature Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  {/* Order Tracker */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#EEF2FF',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      fontSize: '24px'
                    }}>
                      📦
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      Order Tracker
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
                      Get instant updates on active, completed, or delayed orders in one place.
                    </p>
                  </div>

                  {/* Customer Insights */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#ECFDF5',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      fontSize: '24px'
                    }}>
                      👥
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      Customer Insights
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
                      See who your top spenders are, first-time visitors, and customers at risk of leaving.
                    </p>
                  </div>

                  {/* Revenue Snapshot */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#FFF7ED',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      fontSize: '24px'
                    }}>
                      💲
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      Revenue Snapshot
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
                      Daily, weekly, and monthly sales breakdown — know where profits are coming from.
                    </p>
                  </div>

                  {/* Trend Alerts */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#F3E8FF',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      fontSize: '24px'
                    }}>
                      📈
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      Trend Alerts
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
                      AI highlights shifts in order volume, repeat rates, or service demand before you notice.
                    </p>
                  </div>
                </div>

                {/* Additional Feature Card - Full Width */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  marginBottom: '32px',
                  maxWidth: '600px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#FEF3C7',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '24px'
                    }}>
                      🧾
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px', margin: 0 }}>
                        Billing & Disputes
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                        Track pending payments, disputed charges, and auto-generated invoices.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  fontSize: '13px',
                  color: '#6B7280',
                  paddingTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#10B981' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Secure & Private
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#F59E0B' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Lightning Fast
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#3B82F6' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                    </svg>
                    Multi-language
                  </div>
                </div>
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
                        <span className="text-gray-600 text-sm">TurnsIQ is thinking...</span>
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

export default App;
