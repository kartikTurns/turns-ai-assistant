// src/utils/toolStatusUtils.ts
// Utility functions for managing tool execution display in the UI

export interface ToolExecutionStatus {
  id: string;
  name: string;
  status: 'executing' | 'completed' | 'error';
  displayText: string;
  input?: any;
  result?: any;
  error?: string;
  timestamp: string;
  duration?: number;
}

export class ToolStatusManager {
  private toolExecutions: Map<string, ToolExecutionStatus> = new Map();
  private startTimes: Map<string, number> = new Map();

  // Start tracking a tool execution
  startExecution(id: string, name: string, input: any): ToolExecutionStatus {
    const status: ToolExecutionStatus = {
      id,
      name,
      status: 'executing',
      displayText: this.getDisplayText(name, 'executing'),
      input,
      timestamp: new Date().toISOString(),
    };
    
    this.toolExecutions.set(id, status);
    this.startTimes.set(id, Date.now());
    
    return status;
  }

  // Complete a tool execution
  completeExecution(id: string, result?: any, error?: string): ToolExecutionStatus | undefined {
    const execution = this.toolExecutions.get(id);
    if (!execution) return undefined;

    const startTime = this.startTimes.get(id);
    const duration = startTime ? Date.now() - startTime : 0;

    execution.status = error ? 'error' : 'completed';
    execution.displayText = this.getDisplayText(execution.name, execution.status);
    execution.result = result;
    execution.error = error;
    execution.duration = duration;

    this.startTimes.delete(id);
    
    return execution;
  }

  // Get formatted display text for a tool
  private getDisplayText(toolName: string, status: 'executing' | 'completed' | 'error'): string {
    const readableName = this.formatToolName(toolName);
    
    switch (status) {
      case 'executing':
        return `🔧 Fetching ${readableName}...`;
      case 'completed':
        return `✅ ${readableName} retrieved`;
      case 'error':
        return `❌ Failed to fetch ${readableName}`;
      default:
        return readableName;
    }
  }

  // Format tool name for display
  private formatToolName(name: string): string {
    // Convert snake_case to readable format
    const formatted = name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Special cases for better readability
    const nameMap: Record<string, string> = {
      'Get Customer Count': 'customer data',
      'Get Revenue': 'revenue data',
      'Get Metrics': 'business metrics',
      'Get Sales Data': 'sales information',
      'Get Report': 'report data',
    };
    
    return nameMap[formatted] || formatted.toLowerCase();
  }

  // Get all executions
  getAllExecutions(): ToolExecutionStatus[] {
    return Array.from(this.toolExecutions.values());
  }

  // Clear completed executions
  clearCompleted(): void {
    const completed = Array.from(this.toolExecutions.entries())
      .filter(([_, exec]) => exec.status !== 'executing');
    
    completed.forEach(([id]) => {
      this.toolExecutions.delete(id);
      this.startTimes.delete(id);
    });
  }

  // Clear all executions
  clearAll(): void {
    this.toolExecutions.clear();
    this.startTimes.clear();
  }

  // Get execution by ID
  getExecution(id: string): ToolExecutionStatus | undefined {
    return this.toolExecutions.get(id);
  }

  // Check if any tools are currently executing
  hasActiveExecutions(): boolean {
    return Array.from(this.toolExecutions.values())
      .some(exec => exec.status === 'executing');
  }

  // Get summary text for multiple tool executions
  getSummaryText(executions: ToolExecutionStatus[]): string {
    const completed = executions.filter(e => e.status === 'completed').length;
    const errors = executions.filter(e => e.status === 'error').length;
    const executing = executions.filter(e => e.status === 'executing').length;
    
    const parts = [];
    if (executing > 0) parts.push(`${executing} fetching`);
    if (completed > 0) parts.push(`${completed} completed`);
    if (errors > 0) parts.push(`${errors} failed`);
    
    return parts.join(', ');
  }
}

// Singleton instance
export const toolStatusManager = new ToolStatusManager();

// Helper function to parse tool execution from stream data
export function parseToolExecution(data: any): {
  type: 'start' | 'complete';
  execution: ToolExecutionStatus;
} | null {
  if (!data) return null;

  if (data.type === 'tool_use') {
    return {
      type: 'start',
      execution: toolStatusManager.startExecution(
        data.id,
        data.name,
        data.input
      ),
    };
  }

  if (data.type === 'tool_complete') {
    const execution = toolStatusManager.completeExecution(
      data.id,
      data.result,
      data.error
    );
    
    if (execution) {
      return {
        type: 'complete',
        execution,
      };
    }
  }

  return null;
}

// Helper to determine if a message likely needs tools
export function messageNeedsTools(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Keywords that indicate data requests
  const dataKeywords = [
    'customer', 'revenue', 'sales', 'metric', 'report',
    'data', 'total', 'count', 'how many', 'show me',
    'get', 'fetch', 'retrieve', 'analyze', 'summary'
  ];
  
  // Keywords that indicate NO tool usage needed
  const excludeKeywords = [
    'hi', 'hello', 'help', 'what can you',
    'explain', 'tell me about', 'how do',
    'thank', 'bye', 'good'
  ];
  
  const hasDataKeyword = dataKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  const hasExcludeKeyword = excludeKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  return hasDataKeyword && !hasExcludeKeyword;
}

// Format duration for display
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}