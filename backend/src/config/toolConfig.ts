// backend/src/config/toolConfig.ts
// Simplified configuration - let Claude be smart

export const TOOL_CONFIG = {
  // Only keywords that definitely need data
  DATA_KEYWORDS: [
    'customer', 'revenue', 'sales', 'order', 'pickup', 'delivery',
    'metric', 'report', 'data', 'total', 'count', 'how many',
    'show me', 'get', 'fetch', 'analyze', 'summary', 'breakdown',
    'service', 'item', 'laundry', 'business', 'transaction',
    'inventory', 'performance', 'statistics', 'earnings'
  ],

  // Only obvious non-data conversations
  EXCLUDE_KEYWORDS: [
    'hi', 'hello', 'hey', 'thanks', 'bye', 'help',
    'what can you', 'who are you', 'how do you work'
  ],

  PERFORMANCE: {
    CACHE_TIMEOUT_MS: 60000,
    HEALTH_CHECK_INTERVAL_MS: 30000,
    REQUEST_TIMEOUT_MS: 30000,
    CONNECTION_TIMEOUT_MS: 5000,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
  },

  AI_SETTINGS: {
    MODEL: 'claude-3-haiku-20240307',
    MAX_TOKENS: 2048,  // Increased for complex responses
    MAX_ITERATIONS: 5,  // Allow more tool calls for complex queries
    TEMPERATURE: 0.3,   // Lower temperature for more consistent data handling
  },

  UI: {
    SHOW_TOOL_INDICATORS: true,
    COLLAPSE_TOOL_DETAILS: true,
    SHOW_EXECUTION_TIME: true,
    SHOW_CACHE_INDICATOR: true,
  },

  LOGGING: {
    LOG_TOOL_CALLS: true,
    LOG_CACHE_HITS: false,
    LOG_PERFORMANCE: false,
    LOG_ERRORS: true,
    VERBOSE: false,
  },
};

// Simplified check - just basic filtering
export function shouldUseToolsForMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Quick exclude check
  if (TOOL_CONFIG.EXCLUDE_KEYWORDS.some(kw => lowerMessage === kw || lowerMessage === kw + '!')) {
    return false;
  }
  
  // Check if message contains any data-related keywords
  return TOOL_CONFIG.DATA_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

// Minimal system prompt - let Claude figure things out
export function generateSystemPrompt(date: Date = new Date(), tools: string[] = []): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  
  return `You are an AI assistant for a laundromat management system. Today is ${dateStr}.

KEY INSTRUCTIONS:
1. Use the provided tools to fetch data when users ask about business metrics, customers, orders, services, etc.
2. You can call multiple tools or the same tool multiple times with different parameters as needed.
3. When dates aren't specified, use reasonable defaults (current year, month, or all-time based on context).
4. Be smart about combining data from multiple sources to answer complex questions.
5. If a query needs multiple data points, fetch them all.

Available tools: ${tools.join(', ')}

Be concise, helpful, and smart about using tools efficiently.`;
}

export default TOOL_CONFIG;