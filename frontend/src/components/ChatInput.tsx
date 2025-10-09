import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  tokenBalance?: number | null;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  tokenBalance = null
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

  // Check if tokens are too low
  const MIN_TOKEN_THRESHOLD = 1000;
  const hasLowTokens = tokenBalance !== null && tokenBalance < MIN_TOKEN_THRESHOLD;
  const placeholderText = hasLowTokens
    ? `Insufficient tokens (${tokenBalance?.toLocaleString()} remaining). You need at least ${MIN_TOKEN_THRESHOLD.toLocaleString()} tokens to send a message.`
    : "Ask me anything... I'm here to help!";

  return (
    <div style={{
      borderTop: '1px solid #E5E7EB',
      backgroundColor: 'white',
      padding: '12px 24px 15px',
      boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {/* Input Container */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px'
          }}>
            {/* Textarea Container */}
            <div style={{ position: 'relative', flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                disabled={disabled || isSubmitting}
                rows={1}
                style={{
                  width: '100%',
                  padding: '12px 56px 12px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  outline: 'none',
                  minHeight: '44px',
                  maxHeight: '200px',
                  overflowY: 'hidden',
                  fontFamily: 'inherit',
                  backgroundColor: disabled || isSubmitting ? '#F9FAFB' : '#FFFFFF',
                  color: disabled || isSubmitting ? '#9CA3AF' : '#111827',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FD390E';
                  e.target.style.boxShadow = '0 0 0 3px rgba(253, 57, 14, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!message.trim() || isSubmitting || disabled}
                style={{
                  position: 'absolute',
                  right: '6px',
                  bottom: '6px',
                  padding: '8px',
                  backgroundColor: (!message.trim() || isSubmitting || disabled)
                    ? '#F9FAFB'
                    : '#FD390E',
                  color: (!message.trim() || isSubmitting || disabled) ? '#9CA3AF' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!message.trim() || isSubmitting || disabled) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  width: '32px',
                  height: '32px',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  if (!(!message.trim() || isSubmitting || disabled)) {
                    e.currentTarget.style.backgroundColor = '#E6330D';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!message.trim() || isSubmitting || disabled)) {
                    e.currentTarget.style.backgroundColor = '#FD390E';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
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
                      strokeWidth={2.5}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Disclaimer or Warning */}
          {hasLowTokens ? (
            <div style={{
              fontSize: '12px',
              color: '#DC2626',
              backgroundColor: '#FEE2E2',
              textAlign: 'center',
              margin: '8px 0 0 0',
              padding: '8px 12px',
              borderRadius: '6px',
              lineHeight: '1.4',
              fontWeight: '500',
              border: '1px solid #FCA5A5'
            }}>
              ⚠️ Insufficient tokens! You have {tokenBalance?.toLocaleString()} tokens remaining.
              You need at least {MIN_TOKEN_THRESHOLD.toLocaleString()} tokens to send a message.
              Please contact support to top up your balance.
            </div>
          ) : (
            <p style={{
              fontSize: '11px',
              color: '#9CA3AF',
              textAlign: 'center',
              margin: '8px 0 0 0',
              lineHeight: '1.4'
            }}>
              TurnsIQ can make mistakes. Consider checking important information.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}