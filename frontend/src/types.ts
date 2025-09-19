// src/types.ts

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
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}
