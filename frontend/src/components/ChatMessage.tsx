import type { Message } from '../types';
import ToolUsage from './ToolUsage';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isUser ? 'ml-auto' : ''}`}>
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        {/* Show tool usage for assistant messages */}
        {!isUser && message.toolUses && message.toolUses.length > 0 && (
          <div className="mt-2">
            {message.toolUses.map((toolUse) => (
              <ToolUsage key={toolUse.id} toolUse={toolUse} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}