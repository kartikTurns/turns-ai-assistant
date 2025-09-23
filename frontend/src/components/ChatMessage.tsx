import type { Message } from '../types';
import ToolUsage from './ToolUsage';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div style={{ 
      padding: '24px', 
      borderBottom: '1px solid #F3F4F6',
      backgroundColor: 'white'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isUser ? (
            <svg style={{ width: '16px', height: '16px', color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg style={{ width: '16px', height: '16px', color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          )}
        </div>
        
        {/* Message Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'black' 
            }}>
              {isUser ? 'You' : 'Claude'}
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: '#6B7280' 
            }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          {/* Show tool usage BEFORE assistant message content */}
          {!isUser && message.toolUses && message.toolUses.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {message.toolUses.map((toolUse) => (
                <ToolUsage key={toolUse.id} toolUse={toolUse} />
              ))}
            </div>
          )}

          <div style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'black',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}