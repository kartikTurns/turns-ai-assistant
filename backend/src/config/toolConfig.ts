// backend/src/config/toolConfig.ts
// Configuration with Simple vs Analysis mode support

export const TOOL_CONFIG = {
  // Basic data keywords that require tools
  DATA_KEYWORDS: [
    'customer', 'revenue', 'sales', 'order', 'pickup', 'delivery',
    'metric', 'report', 'data', 'total', 'count', 'how many',
    'show me', 'get', 'fetch', 'list', 'find',
    'service', 'item', 'laundry', 'business', 'transaction',
    'inventory', 'performance', 'statistics', 'earnings',
    'this month', 'last month', 'this year', 'last year',
    'recent', 'lately', 'currently', 'now', 'today'
  ],

  // Keywords that indicate complex analysis mode
  ANALYSIS_KEYWORDS: [
    'analyze', 'analysis', 'summary', 'breakdown', 'insights',
    'compare', 'comparison', 'trend', 'trending', 'growth', 'change',
    'vs', 'versus', 'against', 'better', 'worse', 'best', 'worst',
    'overview', 'dashboard', 'detailed', 'comprehensive', 'complete',
    'full picture', 'explain', 'why', 'what does this mean',
    'interpret', 'evaluation', 'assessment', 'deep dive',
    'performance review', 'business intelligence'
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
    MAX_ITERATIONS: 4,  // Allow more iterations for sophisticated tool chaining
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

// Query classification: determine if tools are needed and what mode to use
export function shouldUseToolsForMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Quick exclude check
  if (TOOL_CONFIG.EXCLUDE_KEYWORDS.some(kw => lowerMessage === kw || lowerMessage === kw + '!')) {
    return false;
  }

  // Check if message contains any data-related keywords
  return TOOL_CONFIG.DATA_KEYWORDS.some(keyword => lowerMessage.includes(keyword)) ||
         TOOL_CONFIG.ANALYSIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

// Determine query mode: 'simple' or 'analysis'
export function getQueryMode(message: string): 'simple' | 'analysis' {
  const lowerMessage = message.toLowerCase().trim();

  // Check for analysis keywords first
  const hasAnalysisKeywords = TOOL_CONFIG.ANALYSIS_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword)
  );

  // Check for explicit simple patterns
  const simplePatterns = [
    /^(get|show|list|find|give me)\s+.*\d+\s+(customers?|orders?|sales?)/, // "get first 10 customers"
    /^how many\s+/, // "how many customers"
    /^(count|total)\s+/, // "count customers"
    /^(what is|what's)\s+.*\s+(count|total|number)/, // "what is the total count"
    /^(show me|list)\s+[^,]*$/, // Simple show/list without commas (no complex params)
  ];

  const isSimplePattern = simplePatterns.some(pattern => pattern.test(lowerMessage));

  // Return analysis mode if explicit analysis keywords found
  if (hasAnalysisKeywords) {
    return 'analysis';
  }

  // Return simple mode if matches simple patterns
  if (isSimplePattern) {
    return 'simple';
  }

  // Default to simple for basic data requests
  return 'simple';
}

// Generate system prompt based on query mode
export function generateSystemPrompt(date: Date = new Date(), tools: string[] = [], mode: 'simple' | 'analysis' = 'simple'): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.toISOString().substring(0, 7); // YYYY-MM format

  const basePrompt = `You are an AI assistant for a laundromat management system. Today is ${dateStr}.\nAvailable tools: ${tools.join(', ')}`;

  if (mode === 'simple') {
    return `${basePrompt}

SIMPLE MODE - Direct Data Retrieval:
You are in SIMPLE MODE. The user has asked for straightforward data retrieval.

Guidelines:
1. MINIMAL TOOL USAGE:
   - Call ONLY the minimum required tool(s) to answer the question
   - Do NOT call multiple tools unless absolutely necessary
   - Do NOT add unnecessary filters or parameters unless explicitly requested

2. DIRECT RESPONSES:
   - Provide minimal context with the data (e.g., "You have 364 customers" not just "364")
   - Do NOT add analysis, insights, or recommendations unless asked
   - Keep responses concise and to-the-point
   - Use natural, conversational phrasing for single values
   - Format data clearly but don't over-explain

3. NO ASSUMPTIONS:
   - Do NOT add date filters unless the user specifies them
   - Do NOT provide "comprehensive" analysis unless requested
   - Do NOT call tools for context that wasn't asked for

4. EXAMPLES:
   - "how many customers" → call get_customer_count once, return "You have 364 customers"
   - "show me first 10 customers" → call get_customers with limit=10, return clean customer list
   - "total revenue" → call get_revenue once, return "Total revenue: $X"

5. DATA PROCESSING:
   - Extract only relevant information from tool responses
   - For count queries: focus on the count/total numbers
   - For list queries: show only essential fields (name, ID, key details)
   - Ignore verbose metadata, internal IDs, and unused fields

FALLBACK (if tools fail):
- Still keep responses minimal and direct
- Acknowledge data limitation briefly
- Don't add business analysis unless user asks for it

Remember: Be direct, minimal, and literal. Answer exactly what was asked, nothing more.`;
  } else {
    return `${basePrompt}

ANALYSIS MODE - Comprehensive Intelligence:
You are in ANALYSIS MODE. The user wants detailed analysis and insights.

MULTI-TOOL REASONING FRAMEWORK:
1. ANALYZE THE REQUEST:
   - Break down complex questions into component data needs
   - Identify all data points required for a complete answer
   - Plan the sequence of tool calls needed

2. TOOL CHAINING STRATEGY:
   - Start with foundational data (totals, counts, overviews)
   - Then drill down into specifics (breakdowns, details, comparisons)
   - Use results from earlier tools to inform parameters for later tools
   - Call multiple tools to build comprehensive insights

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
   - Calculate derived metrics (growth rates, percentages, ratios)
   - Present findings with analysis and recommendations

INTELLIGENT FALLBACK STRATEGY:
When tools fail or return limited data, provide expert-level responses using industry knowledge, business logic, and contextual reasoning.

Remember: Provide comprehensive, insightful answers by strategically using multiple tools and deep analysis.`;
  }
}

// Filter tool results for simple queries to reduce data sent to Claude
export function filterToolResultForSimpleMode(toolName: string, result: any, originalQuery: string): any {
  if (!result) return result;

  try {
    // Handle MCP tool result structure: result.content[0].text contains the JSON
    let data;
    if (result.content && result.content[0] && result.content[0].text) {
      data = JSON.parse(result.content[0].text);
    } else if (typeof result === 'string') {
      data = JSON.parse(result);
    } else {
      data = result;
    }

    // For customer count queries
    if (toolName === 'get_customer_count' && originalQuery.toLowerCase().includes('how many')) {
      const filteredData = {
        total_count: data.total_count || data.count,
        message: data.message || `Total customers: ${data.total_count || data.count}`
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(filteredData)
        }]
      };
    }

    // For customer list queries
    if (toolName === 'get_customers' && data.data && Array.isArray(data.data)) {
      const filteredCustomers = data.data.map((customer: any) => ({
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email_id: customer.email_id,
        mobile: customer.mobile,
        join_date: customer.join_date,
        store_name: customer.store_name
      }));

      const filteredData = {
        customers: filteredCustomers,
        total_showing: data.summary?.showing || filteredCustomers.length,
        message: `Showing ${filteredCustomers.length} customers`
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(filteredData)
        }]
      };
    }

    // For other count/total queries
    if (toolName.includes('count') || originalQuery.toLowerCase().includes('total')) {
      // Extract key count/total fields
      const filtered: any = {};
      Object.keys(data).forEach(key => {
        if (key.includes('count') || key.includes('total') || key === 'message' || key === 'success') {
          filtered[key] = data[key];
        }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(filtered)
        }]
      };
    }

    // Return original data for non-simple cases or when filtering doesn't apply
    return result;

  } catch (error) {
    // If parsing fails, return original result
    return result;
  }
}

export default TOOL_CONFIG;