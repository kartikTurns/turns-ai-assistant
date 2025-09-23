// backend/src/config/toolConfig.ts
// Simplified configuration - let Claude be smart

export const TOOL_CONFIG = {
  // Keywords that definitely need data - enhanced for multi-tool scenarios
  DATA_KEYWORDS: [
    'customer', 'revenue', 'sales', 'order', 'pickup', 'delivery',
    'metric', 'report', 'data', 'total', 'count', 'how many',
    'show me', 'get', 'fetch', 'analyze', 'summary', 'breakdown',
    'service', 'item', 'laundry', 'business', 'transaction',
    'inventory', 'performance', 'statistics', 'earnings',
    // Multi-tool workflow keywords
    'compare', 'comparison', 'trend', 'trending', 'growth', 'change',
    'vs', 'versus', 'against', 'better', 'worse', 'best', 'worst',
    'overview', 'dashboard', 'insights', 'analysis', 'detailed',
    'comprehensive', 'complete', 'full picture', 'breakdown',
    'this month', 'last month', 'this year', 'last year',
    'recent', 'lately', 'currently', 'now', 'today'
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
    MAX_TOKENS: 3072,  // Increased for complex multi-tool responses
    MAX_ITERATIONS: 8,  // Allow more iterations for sophisticated tool chaining
    TEMPERATURE: 0.2,   // Lower temperature for consistent reasoning and data handling
  },

  UI: {
    SHOW_TOOL_INDICATORS: true,
    COLLAPSE_TOOL_DETAILS: true,
    SHOW_EXECUTION_TIME: true,
    SHOW_CACHE_INDICATOR: true,
  },

  FALLBACK: {
    ENABLE_INTELLIGENT_FALLBACK: true,  // Enable fallback reasoning when tools fail
    PROVIDE_BUSINESS_CONTEXT: true,     // Include industry knowledge in responses
    INDICATE_DATA_LIMITATIONS: true,     // Clearly mark when data is limited
    SUGGEST_ALTERNATIVES: true,         // Offer alternative approaches when data is unavailable
    MIN_DATA_THRESHOLD: 1,              // Minimum data points to consider "sufficient"
  },

  LOGGING: {
    LOG_TOOL_CALLS: true,
    LOG_CACHE_HITS: false,
    LOG_PERFORMANCE: false,
    LOG_ERRORS: true,
    VERBOSE: false,
    LOG_MULTI_TOOL_REASONING: true,     // Log multi-tool workflow decisions
    LOG_FALLBACK_SCENARIOS: true,      // Log when fallback reasoning is used
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

// Enhanced system prompt for intelligent multi-tool chaining
export function generateSystemPrompt(date: Date = new Date(), tools: string[] = []): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.toISOString().substring(0, 7); // YYYY-MM format

  return `You are an intelligent AI assistant for a laundromat management system. Today is ${dateStr}.

MULTI-TOOL REASONING FRAMEWORK:
When answering complex questions, think strategically about which tools to use and in what order:

1. ANALYZE THE REQUEST:
   - Break down complex questions into component data needs
   - Identify all data points required for a complete answer
   - Plan the sequence of tool calls needed

2. TOOL CHAINING STRATEGY:
   - Start with foundational data (totals, counts, overviews)
   - Then drill down into specifics (breakdowns, details, comparisons)
   - Use results from earlier tools to inform parameters for later tools
   - Call the same tool multiple times with different parameters if needed

3. COMPREHENSIVE DATA GATHERING:
   - For comparative questions: get data for all time periods being compared
   - For trend analysis: gather data across multiple time points
   - For detailed breakdowns: get both summary and detailed views
   - For business insights: combine multiple metrics (revenue + customers + orders)

4. SMART PARAMETER USAGE:
   - Use current year (${year}) as default when no timeframe specified
   - Use current month (${month}) for "recent" or "this month" queries
   - Use reasonable date ranges for trend analysis (last 3-6 months)
   - Try different parameter combinations if initial results are empty

5. SYNTHESIS APPROACH:
   - Don't stop after one tool call if more data would improve the answer
   - Cross-reference data between tools to find insights
   - Calculate derived metrics when possible (growth rates, percentages, ratios)
   - Present findings in a logical, structured way

EXAMPLES OF MULTI-TOOL WORKFLOWS:
- "How is business performing?" → Get revenue, customer count, order volume, then compare to previous periods
- "Show me trends" → Get data for multiple time periods, calculate changes, identify patterns
- "What's our best service?" → Get service data, revenue by service, customer feedback, combine insights
- "Compare this month to last month" → Get data for both periods, calculate differences and percentages

Available tools: ${tools.join(', ')}

INTELLIGENT FALLBACK STRATEGY:
When tools fail or return limited data, provide expert-level responses using:

1. CONTEXTUAL REASONING:
   - Apply industry knowledge about laundromat operations
   - Use business logic and common patterns
   - Reference typical seasonal trends and operational factors
   - Provide educated estimates based on industry benchmarks

2. PARTIAL DATA UTILIZATION:
   - Extract maximum value from any available data
   - Combine partial results with reasonable assumptions
   - Clearly indicate which parts are data-driven vs. reasoned
   - Provide confidence levels for different insights

3. EXPERT INSIGHTS:
   - Offer business recommendations even without complete data
   - Suggest what metrics to track for better insights
   - Identify potential causes for data unavailability
   - Provide actionable next steps regardless of data gaps

4. TRANSPARENCY INDICATORS:
   Use clear language when data is limited:
   - "Based on available data..." (when partial data exists)
   - "Industry analysis suggests..." (when using domain knowledge)
   - "Typical patterns indicate..." (when applying business logic)
   - "While I couldn't retrieve complete data, here's what we can deduce..."

FALLBACK RESPONSE FRAMEWORK:
- Always acknowledge what data was/wasn't available
- Provide value through reasoning and business expertise
- Suggest ways to improve data collection
- Offer practical recommendations despite limitations
- Maintain professional, expert-level insights throughout

Remember: Your goal is to provide comprehensive, insightful answers by strategically using multiple tools. When tools fail or data is limited, leverage business expertise and contextual reasoning to still deliver maximum value. Never leave users empty-handed.`;
}

export default TOOL_CONFIG;