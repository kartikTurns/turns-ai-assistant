import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #D1D5DB',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask Claude anything..."
              disabled={disabled}
              rows={1}
              style={{
                width: '100%',
                resize: 'none',
                padding: '12px 48px 12px 16px',
                border: 'none',
                borderRadius: '12px',
                outline: 'none',
                minHeight: '48px',
                maxHeight: '128px',
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'black',
                backgroundColor: 'transparent',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.parentElement.style.borderColor = '#9CA3AF';
                e.target.parentElement.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(156, 163, 175, 0.1)';
              }}
              onBlur={(e) => {
                e.target.parentElement.style.borderColor = '#D1D5DB';
                e.target.parentElement.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '8px',
                padding: '8px',
                backgroundColor: !message.trim() || disabled ? '#D1D5DB' : 'black',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !message.trim() || disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!(!message.trim() || disabled)) {
                  e.target.style.backgroundColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!(!message.trim() || disabled)) {
                  e.target.style.backgroundColor = 'black';
                }
              }}
            >
              <svg 
                style={{ width: '16px', height: '16px' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            </button>
          </div>
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#6B7280', 
          marginTop: '8px', 
          textAlign: 'center' 
        }}>
          Press Enter to send • Shift + Enter for new line
        </div>
      </form>
    </div>
  );
}