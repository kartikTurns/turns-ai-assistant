export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  toolUses?: ToolUse[];
}

export interface ChatResponse {
  id: string;
  message: string;
  timestamp: string;
  role: 'assistant';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolUse {
  id: string;
  name: string;
  input: any;
  result?: any;
  error?: string;
  status?: 'executing' | 'completed' | 'error';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface StreamedMessage {
  type: 'content' | 'tool_use' | 'tool_complete' | 'tool_result' | 'tool_error' | 'done';
  id: string;
  text?: string;
  name?: string;
  input?: any;
  result?: any;
  error?: string;
  status?: string;
  timestamp: string;
  messageId?: string;
  displayText?: string;
  isCollapsible?: boolean;
  executionTime?: number;
  wasCached?: boolean;
}