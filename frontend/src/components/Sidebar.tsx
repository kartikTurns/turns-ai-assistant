import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
}

export default function Sidebar({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation 
}: SidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ width: '260px', backgroundColor: '#FAFAFA', borderRight: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E5E5' }}>
        {/* Claude Logo with Bot Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <svg 
            style={{ width: '20px', height: '20px', color: 'black' }}
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 9a5 5 0 0 0-5 5v3H3v1h1a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5h1v-1h-1v-3a5 5 0 0 0-5-5H9zm2.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM8 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4 4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"/>
          </svg>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'black' }}>Claude</h1>
        </div>
        
        {/* New Conversation Button */}
        <button
          onClick={onNewConversation}
          style={{
            width: '100%',
            backgroundColor: 'white',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'black',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New conversation
        </button>
      </div>

      {/* Conversations List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 4px 0' }}>No conversations yet</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Start your first conversation!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: currentConversationId === conversation.id ? '#F3F4F6' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => onSelectConversation(conversation.id)}
                onMouseEnter={(e) => {
                  if (currentConversationId !== conversation.id) {
                    e.target.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentConversationId !== conversation.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: 'black', 
                      margin: '0 0 4px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conversation.title}
                    </h3>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#6B7280', 
                      margin: 0
                    }}>
                      {formatDate(conversation.updatedAt)}
                    </p>
                  </div>
                  <button
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
                      transition: 'all 0.2s ease',
                      marginLeft: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#6B7280';
                      e.target.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#9CA3AF';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    className="group-hover:opacity-100"
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}