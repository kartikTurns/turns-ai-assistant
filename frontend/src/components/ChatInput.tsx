import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSubmitting || disabled) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    setIsSubmitting(true);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setMessage(messageToSend);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div style={{
      borderTop: '1px solid #E5E7EB',
      backgroundColor: 'white',
      padding: '16px'
    }}>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            rows={1}
            style={{
              width: '100%',
              padding: '12px 60px 12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              outline: 'none',
              minHeight: '44px',
              maxHeight: '200px',
              fontFamily: 'inherit',
              backgroundColor: disabled || isSubmitting ? '#F9FAFB' : 'white',
              color: disabled || isSubmitting ? '#6B7280' : 'black'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8B5CF6';
              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
          />

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting || disabled}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              padding: '8px 12px',
              backgroundColor: (!message.trim() || isSubmitting || disabled) ? '#E5E7EB' : '#8B5CF6',
              color: (!message.trim() || isSubmitting || disabled) ? '#9CA3AF' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: (!message.trim() || isSubmitting || disabled) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background-color 0.2s ease',
              height: '28px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!(!message.trim() || isSubmitting || disabled)) {
                e.currentTarget.style.backgroundColor = '#7C3AED';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!message.trim() || isSubmitting || disabled)) {
                e.currentTarget.style.backgroundColor = '#8B5CF6';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>
                  {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                </style>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
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
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}