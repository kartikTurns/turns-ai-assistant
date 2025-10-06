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

  // Auto-resize textarea and manage scrollbar visibility
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = newHeight + 'px';

      // Only show scrollbar when content exceeds maxHeight (200px)
      if (textarea.scrollHeight > 200) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
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

  // Refocus textarea when it becomes enabled
  useEffect(() => {
    if (!disabled && !isSubmitting) {
      textareaRef.current?.focus();
    }
  }, [disabled, isSubmitting]);

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
      padding: '20px 24px',
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(8px)'
    }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
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
              padding: '18px 70px 18px 20px',
              border: '2px solid #FECACA',
              borderRadius: '16px',
              fontSize: '15px',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none',
              minHeight: '56px',
              maxHeight: '200px',
              overflowY: 'hidden',
              fontFamily: 'inherit',
              backgroundColor: disabled || isSubmitting ? '#F8FAFC' : '#FAFBFC',
              color: disabled || isSubmitting ? '#6B7280' : '#1F2937',
              boxSizing: 'border-box',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#FD390E';
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.boxShadow = '0 0 0 4px rgba(253, 57, 14, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#FECACA';
              e.target.style.backgroundColor = disabled || isSubmitting ? '#F8FAFC' : '#FAFBFC';
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
              e.target.style.transform = 'translateY(0)';
            }}
          />

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting || disabled}
            style={{
              position: 'absolute',
              right: '14px',
              bottom: '12px',
              padding: '10px',
              backgroundColor: (!message.trim() || isSubmitting || disabled)
                ? '#FFF1EE'
                : 'linear-gradient(135deg, #FD390E 0%, #E62E08 100%)',
              background: (!message.trim() || isSubmitting || disabled)
                ? '#FFF1EE'
                : 'linear-gradient(135deg, #FD390E 0%, #E62E08 100%)',
              color: (!message.trim() || isSubmitting || disabled) ? '#FD390E' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: (!message.trim() || isSubmitting || disabled) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '36px',
              height: '36px',
              justifyContent: 'center',
              zIndex: 1,
              boxShadow: (!message.trim() || isSubmitting || disabled)
                ? 'none'
                : '0 4px 12px rgba(253, 57, 14, 0.3), 0 2px 4px rgba(253, 57, 14, 0.2)',
              transform: 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!(!message.trim() || isSubmitting || disabled)) {
                e.currentTarget.style.backgroundColor = '#E62E08';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!message.trim() || isSubmitting || disabled)) {
                e.currentTarget.style.backgroundColor = '#FD390E';
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
            )}
          </button>
        </div>
      </form>
    </div>
  );
}