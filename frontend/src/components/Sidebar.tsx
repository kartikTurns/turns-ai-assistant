import { useState } from 'react';
import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getGroupLabel = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'TODAY';
    if (diffDays === 2) return 'YESTERDAY';
    return null;
  };

  const groupConversations = () => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];

    conversations.forEach(conv => {
      const group = getGroupLabel(conv.updatedAt);
      if (group === 'TODAY') today.push(conv);
      else if (group === 'YESTERDAY') yesterday.push(conv);
      else older.push(conv);
    });

    return { today, yesterday, older };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Collapsed state - show a minimal sidebar with just icons
  if (isCollapsed) {
    return (
      <div style={{
        width: '60px',
        backgroundColor: '#FAFAFA',
        borderRight: '1px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        flexShrink: 0
      }}>
        {/* Collapsed Header */}
        <div style={{ 
          padding: '16px 0', 
          borderBottom: '1px solid #E5E5E5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Expand button */}
          <button
            onClick={onToggleCollapse}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              cursor: 'pointer',
              color: '#374151',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
              (e.target as HTMLButtonElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'white';
              (e.target as HTMLButtonElement).style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
            title="Expand sidebar"
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* New conversation button - icon only */}
          <button
            onClick={onNewConversation}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              background: 'white',
              cursor: 'pointer',
              color: '#374151',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
              (e.target as HTMLButtonElement).style.borderColor = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'white';
              (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB';
            }}
            title="New conversation"
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Recent conversations indicators */}
        <div style={{ 
          flex: 1, 
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto'
        }}>
          {conversations.slice(0, 5).map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentConversationId === conversation.id ? '#E5E7EB' : '#F9FAFB',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (currentConversationId !== conversation.id) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (currentConversationId !== conversation.id) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                }
              }}
              title={conversation.title}
            >
              <svg style={{ width: '20px', height: '20px', color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {currentConversationId === conversation.id && (
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '24px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '0 2px 2px 0'
                }}></div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Expanded state - show full sidebar
  return (
    <div style={{
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E5E5E5',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      transition: 'width 0.3s ease',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E5E5' }}>
        {/* TurnsIQ Logo with Bot Icon and Collapse Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#FD390E',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                style={{ width: '20px', height: '20px', color: '#FFFFFF' }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 9a5 5 0 0 0-5 5v3H3v1h1a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5h1v-1h-1v-3a5 5 0 0 0-5-5H9zm2.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM8 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0, lineHeight: 1.2 }}>TurnsIQ</h1>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, lineHeight: 1.2 }}>AI Assistant</p>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.color = '#6B7280'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = '#9CA3AF'}
            title="Collapse sidebar"
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* New Conversation Button */}
        <button
          onClick={onNewConversation}
          style={{
            width: '100%',
            backgroundColor: '#FD390E',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#E6330D';
            (e.target as HTMLButtonElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#FD390E';
            (e.target as HTMLButtonElement).style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg
            style={{
              position: 'absolute',
              left: '12px',
              width: '16px',
              height: '16px',
              color: '#9CA3AF',
              pointerEvents: 'none'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              outline: 'none',
              backgroundColor: '#F9FAFB',
              color: '#111827',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.backgroundColor = '#FFFFFF';
              (e.target as HTMLInputElement).style.borderColor = '#D1D5DB';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.backgroundColor = '#F9FAFB';
              (e.target as HTMLInputElement).style.borderColor = '#E5E7EB';
            }}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 8px' }}>
        {filteredConversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 4px 0' }}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              {searchQuery ? 'Try a different search' : 'Start your first conversation!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {(() => {
              const { today, yesterday, older } = groupConversations();
              const filtered = {
                today: today.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())),
                yesterday: yesterday.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())),
                older: older.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
              };

              const renderConversation = (conversation: Conversation) => (
                <div
                  key={conversation.id}
                  className="group"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: currentConversationId === conversation.id ? '#FFF1EE' : 'transparent',
                    transition: 'background-color 0.15s ease',
                    position: 'relative'
                  }}
                  onClick={() => onSelectConversation(conversation.id)}
                  onMouseEnter={(e) => {
                    if (currentConversationId !== conversation.id) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F9FAFB';
                    }
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    if (currentConversationId !== conversation.id) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <h3
                        className="conversation-title"
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: currentConversationId === conversation.id ? '#111827' : '#374151',
                          margin: '0 0 2px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.15s ease'
                        }}
                      >
                        {conversation.title}
                      </h3>
                      <p style={{
                        fontSize: '11px',
                        color: '#9CA3AF',
                        margin: 0
                      }}>
                        {conversation.messageCount !== undefined ? conversation.messageCount : conversation.messages.length} message{((conversation.messageCount !== undefined ? conversation.messageCount : conversation.messages.length) !== 1) ? 's' : ''}
                      </p>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      style={{
                        opacity: 0,
                        color: '#9CA3AF',
                        padding: '4px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FEE2E2';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );

              return (
                <>
                  {filtered.today.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#9CA3AF',
                        letterSpacing: '0.05em',
                        padding: '8px 12px 4px',
                        textTransform: 'uppercase'
                      }}>
                        TODAY
                      </div>
                      {filtered.today.map(renderConversation)}
                    </div>
                  )}

                  {filtered.yesterday.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#9CA3AF',
                        letterSpacing: '0.05em',
                        padding: '8px 12px 4px',
                        textTransform: 'uppercase'
                      }}>
                        YESTERDAY
                      </div>
                      {filtered.yesterday.map(renderConversation)}
                    </div>
                  )}

                  {filtered.older.length > 0 && (
                    <div>
                      {filtered.older.map(renderConversation)}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer with Credits and User Profile */}
      <div style={{
        borderTop: '1px solid #E5E7EB',
        padding: '12px 16px',
        backgroundColor: '#F9FAFB'
      }}>
        {/* Credits */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          marginBottom: '10px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#6B7280' }}>Credits</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#FD390E' }}>2,450</span>
        </div>

        {/* Version Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#9CA3AF',
          marginBottom: '10px',
          padding: '0 4px'
        }}>
          <span>Version 1.2.5</span>
          <span>© 2025 TurnsIQ</span>
        </div>

        {/* User Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            border: '1px solid #E5E7EB'
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F9FAFB'}
          onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFFFFF'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FD390E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              K
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', lineHeight: 1.2 }}>Kartik</div>
              <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%', display: 'inline-block' }}></span>
                Online
              </div>
            </div>
          </div>
          <svg style={{ width: '16px', height: '16px', color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}