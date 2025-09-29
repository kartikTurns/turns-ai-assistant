// backend/src/config/toolConfig.ts
// Configuration with Simple vs Analysis mode support

export const TOOL_CONFIG = {
  // Smart date detection patterns
  DATE_PATTERNS: {
    relative_dates: {
      'today': { type: 'day', offset: 0 },
      'yesterday': { type: 'day', offset: -1 },
      'this week': { type: 'week', offset: 0 },
      'last week': { type: 'week', offset: -1 },
      'this month': { type: 'month', offset: 0 },
      'last month': { type: 'month', offset: -1 },
      'this year': { type: 'year', offset: 0 },
      'last year': { type: 'year', offset: -1 },
      'recent': { type: 'day', offset: -7 }, // Last 7 days
      'lately': { type: 'day', offset: -14 }, // Last 14 days
      'currently': { type: 'month', offset: 0 },
      'now': { type: 'day', offset: 0 }
    },
    month_names: {
      'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
      'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
  },

  // Query categorization patterns
  QUERY_PATTERNS: {
    customer: ['customer', 'client', 'user', 'people', 'visitor'],
    revenue: ['revenue', 'sales', 'income', 'earnings', 'money', 'profit', 'financial'],
    order: ['order', 'transaction', 'service', 'pickup', 'delivery', 'job'],
    analytics: ['report', 'analytics', 'metric', 'performance', 'dashboard', 'summary', 'overview'],
    inventory: ['inventory', 'stock', 'item', 'product', 'supply'],
    count: ['how many', 'count', 'total', 'number of'],
    list: ['show me', 'list', 'get', 'fetch', 'find', 'display']
  },

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
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 8192,  // Increased for complex multi-tool responses with Sonnet
    MAX_ITERATIONS: 6,  // Allow more iterations for sophisticated tool chaining with better model
    TEMPERATURE: 0.1,   // Lower temperature for consistent reasoning and data handling
    CONTEXT_MESSAGE_LIMIT: 3,  // More context with better model (16 total with user/assistant pairs)
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
1. SMART TOOL SELECTION:
   - Use logical reasoning to find the right data source
   - Revenue/sales/money questions need order/transaction data
   - Don't say "no tools available" - think about where the data lives
   - Call ONLY the minimum required tool(s) to answer the question

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

INTELLIGENT REASONING FRAMEWORK:
1. ANALYZE THE REQUEST:
   - Break down complex questions into component data needs
   - Identify all data points required for a complete answer
   - Plan the sequence of tool calls needed
   - THINK LOGICALLY: Revenue/sales/money data comes from order/transaction data

2. SMART TOOL SELECTION:
   - Don't just look for exact tool name matches
   - Understand that financial questions need transaction/order data
   - Business metrics can be calculated from available data sources
   - Use logical reasoning to map concepts to data sources

3. TOOL CHAINING STRATEGY:
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

// Smart tool matching based on query analysis and available MCP tools
export function smartToolSelection(userQuery: string, availableTools: any[]): string[] {
  const lowerQuery = userQuery.toLowerCase();
  const selectedTools: string[] = [];
  const toolScores: { [toolName: string]: number } = {};

  // Smart relationship detection - understand that financial data comes from transaction data
  const getRelatedTools = (query: string, tools: any[]) => {
    const relatedTools: string[] = [];

    // Financial queries should look for transaction/order data
    const financialTerms = ['revenue', 'sales', 'money', 'income', 'earnings', 'profit', 'financial', 'made', 'earned'];
    const isFinancialQuery = financialTerms.some(term => query.includes(term));

    if (isFinancialQuery) {
      // Look for tools that handle transactions, orders, or sales data
      tools.forEach(tool => {
        const toolName = tool.name.toLowerCase();
        const toolDesc = (tool.description || '').toLowerCase();

        if (toolName.includes('order') || toolName.includes('transaction') || toolName.includes('sales') ||
            toolDesc.includes('order') || toolDesc.includes('transaction') || toolDesc.includes('payment')) {
          relatedTools.push(tool.name);
        }
      });
    }

    return relatedTools;
  };

  const relatedTools = getRelatedTools(lowerQuery, availableTools);

  // Score each available tool based on query relevance
  availableTools.forEach(tool => {
    let score = 0;
    const toolName = tool.name.toLowerCase();
    const toolDesc = (tool.description || '').toLowerCase();

    // Apply intelligent relationship scoring
    if (relatedTools.includes(tool.name)) {
      score += 20; // High priority for intelligently detected related tools
    }

    // Check query patterns against tool names and descriptions
    Object.entries(TOOL_CONFIG.QUERY_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (lowerQuery.includes(pattern)) {
          // Higher score if pattern matches tool name
          if (toolName.includes(category) || toolName.includes(pattern.replace(' ', '_'))) {
            score += 10;
          }
          // Lower score if pattern matches description
          if (toolDesc.includes(pattern) || toolDesc.includes(category)) {
            score += 5;
          }
        }
      });
    });

    // Boost score for exact keyword matches
    TOOL_CONFIG.DATA_KEYWORDS.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        if (toolName.includes(keyword.replace(' ', '_')) || toolDesc.includes(keyword)) {
          score += 3;
        }
      }
    });

    if (score > 0) {
      toolScores[tool.name] = score;
    }
  });

  // Return top scoring tools, max 3 for efficiency
  const sortedTools = Object.entries(toolScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([toolName]) => toolName);

  return sortedTools;
}

// Extract date parameters from user query
export function extractDateParameters(userQuery: string): any {
  const lowerQuery = userQuery.toLowerCase();
  const dateParams: any = {};
  const currentDate = new Date();

  // Check for relative date patterns
  Object.entries(TOOL_CONFIG.DATE_PATTERNS.relative_dates).forEach(([phrase, config]) => {
    if (lowerQuery.includes(phrase)) {
      const targetDate = new Date(currentDate);

      switch (config.type) {
        case 'day':
          targetDate.setDate(currentDate.getDate() + config.offset);
          dateParams.date = targetDate.toISOString().split('T')[0];
          break;
        case 'week':
          targetDate.setDate(currentDate.getDate() + (config.offset * 7));
          dateParams.week_start = new Date(targetDate.setDate(targetDate.getDate() - targetDate.getDay())).toISOString().split('T')[0];
          dateParams.week_end = new Date(targetDate.setDate(targetDate.getDate() + 6)).toISOString().split('T')[0];
          break;
        case 'month':
          targetDate.setMonth(currentDate.getMonth() + config.offset);
          dateParams.month = targetDate.getMonth() + 1;
          dateParams.year = targetDate.getFullYear();
          break;
        case 'year':
          targetDate.setFullYear(currentDate.getFullYear() + config.offset);
          dateParams.year = targetDate.getFullYear();
          break;
      }
    }
  });

  // Check for specific month names
  Object.entries(TOOL_CONFIG.DATE_PATTERNS.month_names).forEach(([monthName, monthNum]) => {
    if (lowerQuery.includes(monthName)) {
      dateParams.month = monthNum;
      // Default to current year if not specified
      if (!dateParams.year) {
        dateParams.year = currentDate.getFullYear();
      }
    }
  });

  // Extract year if mentioned explicitly
  const yearMatch = lowerQuery.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    dateParams.year = parseInt(yearMatch[1]);
  }

  return Object.keys(dateParams).length > 0 ? dateParams : null;
}

// Validate if tool result matches user query intent
export function validateToolResult(userQuery: string, toolName: string, toolResult: any, dateParams: any): boolean {
  const lowerQuery = userQuery.toLowerCase();

  try {
    let data;
    if (toolResult.content && toolResult.content[0] && toolResult.content[0].text) {
      data = JSON.parse(toolResult.content[0].text);
    } else if (typeof toolResult === 'string') {
      data = JSON.parse(toolResult);
    } else {
      data = toolResult;
    }

    // Check if result is empty or error
    if (!data || data.error || data.message?.includes('error')) {
      return false;
    }

    // Validate date relevance if date params were extracted
    if (dateParams) {
      // Check if result data contains date fields matching our parameters
      const resultStr = JSON.stringify(data).toLowerCase();

      if (dateParams.year && !resultStr.includes(dateParams.year.toString())) {
        return false;
      }

      if (dateParams.month) {
        const monthStr = dateParams.month.toString().padStart(2, '0');
        if (!resultStr.includes(monthStr) && !resultStr.includes(`month`)) {
          return false;
        }
      }
    }

    // Validate data type matches query intent
    if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
      // Should have count/total fields
      const hasCount = data.count || data.total_count || data.total ||
                      (data.data && Array.isArray(data.data)) ||
                      typeof data.length === 'number';
      return hasCount;
    }

    if (lowerQuery.includes('list') || lowerQuery.includes('show me')) {
      // Should have array data
      return data.data && Array.isArray(data.data) && data.data.length > 0;
    }

    return true;

  } catch (error) {
    return false;
  }
}

// Generate enhanced system prompt with tool guidance
export function generateEnhancedSystemPrompt(
  date: Date = new Date(),
  availableTools: any[] = [],
  userQuery: string = '',
  mode: 'simple' | 'analysis' = 'simple'
): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.toISOString().substring(0, 7);

  const suggestedTools = smartToolSelection(userQuery, availableTools);
  const dateParams = extractDateParameters(userQuery);

  const basePrompt = `You are an AI assistant for a laundromat management system. Today is ${dateStr}.

AVAILABLE TOOLS: ${availableTools.map(t => `${t.name} - ${t.description}`).join(', ')}

QUERY ANALYSIS:
User Query: "${userQuery}"
Suggested Tools: ${suggestedTools.join(', ')}
${dateParams ? `Detected Date Parameters: ${JSON.stringify(dateParams)}` : 'No specific date parameters detected'}`;

  if (mode === 'simple') {
    return `${basePrompt}

SIMPLE MODE - Smart Tool Selection:

TOOL SELECTION PRIORITY:
${suggestedTools.length > 0 ?
  suggestedTools.map((tool, idx) => `${idx + 1}. ${tool} - Most relevant for this query`).join('\n') :
  'No specific tools suggested - analyze query and available tools to select most appropriate ones'
}

DATE PARAMETER INJECTION:
${dateParams ?
  `IMPORTANT: Add these date parameters to your tool calls: ${JSON.stringify(dateParams)}` :
  'No date parameters detected. Use current date context if needed.'
}

EXECUTION GUIDELINES:
1. Use ONLY the suggested tools unless absolutely necessary
2. Apply detected date parameters automatically
3. Validate results match the user's question intent
4. Provide direct, minimal responses`;

  } else {
    return `${basePrompt}

ANALYSIS MODE - Comprehensive Intelligence:

TOOL CHAINING STRATEGY:
${suggestedTools.length > 0 ?
  `Primary Tools: ${suggestedTools.join(', ')}\nUse these as starting points, then chain additional tools as needed for comprehensive analysis.` :
  'Analyze available tools and select appropriate combinations for comprehensive insights.'
}

SMART DATE HANDLING:
${dateParams ?
  `Auto-detected parameters: ${JSON.stringify(dateParams)}\nApply these to all relevant tool calls and consider comparative analysis with other time periods.` :
  'No specific dates detected. Consider current period analysis and historical comparisons.'
}

VALIDATION REQUIREMENTS:
1. Ensure each tool result matches the query intent
2. Cross-validate data consistency between tools
3. Retry with different parameters if results seem irrelevant
4. Provide comprehensive analysis combining all relevant data`;
  }
}

export default TOOL_CONFIG;