export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatResponse {
  id: string;
  message: string;
  timestamp: string;
  role: 'assistant';
}