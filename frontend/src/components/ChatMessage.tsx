import type { Message } from '../types';
import ToolUsage from './ToolUsage';
import ReactMarkdown from 'react-markdown';

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
              {isUser ? 'You' : 'TurnsIQ'}
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
            wordWrap: 'break-word'
          }} className="markdown-content">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap' }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: '700', color: '#111827' }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                ul: ({ children }) => <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '0 0 12px 0', paddingLeft: '24px' }}>{children}</ol>,
                li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
                h1: ({ children }) => <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 16px 0', color: '#111827' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0', color: '#111827' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#111827' }}>{children}</h3>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code style={{
                      backgroundColor: '#F3F4F6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace'
                    }}>{children}</code>
                  ) : (
                    <code style={{
                      display: 'block',
                      backgroundColor: '#F3F4F6',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                      overflowX: 'auto',
                      margin: '0 0 12px 0'
                    }}>{children}</code>
                  );
                },
                pre: ({ children }) => <pre style={{ margin: 0 }}>{children}</pre>,
                a: ({ children, href }) => <a href={href} style={{ color: '#3B82F6', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: '4px solid #E5E7EB', paddingLeft: '16px', margin: '0 0 12px 0', color: '#6B7280' }}>{children}</blockquote>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}