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

  // Keywords that trigger PREDICTIVE mode with heavy reasoning
  PREDICTIVE_KEYWORDS: [
    'predict', 'prediction', 'forecast', 'foreseeable', 'future',
    'will', 'going to', 'expect', 'expected', 'expecting',
    'likely', 'probability', 'chance', 'potential', 'anticipated',
    'next month', 'next year', 'upcoming', 'projected', 'projection',
    'trend forecast', 'what if', 'scenario', 'simulate', 'simulation',
    'pattern', 'seasonal prediction', 'estimate', 'risk', 'opportunity',
    'recommend', 'recommendation', 'should we', 'what should',
    'correlation', 'relationship between', 'impact of', 'effect of',
    'churn', 'retention forecast', 'customer lifetime', 'LTV'
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
    MAX_TOKENS: 16000,  // High limit for extended thinking + response
    MAX_ITERATIONS: 8,  // Higher iterations for smart progressive data gathering
    TEMPERATURE: 0.2,   // Lower temperature for consistent reasoning and data handling
    CONTEXT_MESSAGE_LIMIT: 3,  // Keep 3 pairs (6 messages) with smart filtering

    // Extended thinking for predictive mode
    ENABLE_EXTENDED_THINKING: true,
    THINKING_BUDGET_TOKENS: 10000,  // Budget for reasoning (10k tokens for thinking)
  },

  // Predictive reasoning configuration
  PREDICTIVE_MODE: {
    ENABLE: true,
    MIN_HISTORICAL_MONTHS: 3,  // Minimum months of data for predictions
    PREFERRED_HISTORICAL_MONTHS: 6,  // Ideal historical window
    AUTO_FETCH_HISTORICAL: true,  // Automatically fetch historical data
    ENABLE_CORRELATION_ANALYSIS: true,  // Cross-metric correlation
    ENABLE_ANOMALY_DETECTION: true,  // Detect unusual patterns
    ENABLE_CONFIDENCE_SCORING: true,  // Provide confidence levels
    CACHE_PREDICTIONS: true,  // Cache prediction results
    PREDICTION_CACHE_TTL: 3600000,  // 1 hour cache for predictions
  },

  // Progressive data gathering strategy for smart iterative tool calls
  PROGRESSIVE_STRATEGY: {
    ENABLE_PROGRESSIVE_GATHERING: true,  // Enable smart multi-step data gathering
    INITIAL_LIMIT: 10,                   // Start with small limit to test data availability
    EXPAND_MULTIPLIER: 3,                // Multiply limit by this factor on each iteration
    MAX_PROGRESSIVE_LIMIT: 200,          // Never exceed this limit even progressively
    MIN_DATA_THRESHOLD: 3,               // If we get less than this, try expanding
    SMART_AGGREGATION: true,             // For financial queries, prefer aggregated data first
  },

  UI: {
    SHOW_TOOL_INDICATORS: true,
    COLLAPSE_TOOL_DETAILS: true,
    SHOW_EXECUTION_TIME: true,
    SHOW_CACHE_INDICATOR: true,
  },

  FALLBACK: {
    ENABLE_INTELLIGENT_FALLBACK: false, // DISABLED - Prevent fake data generation
    PROVIDE_BUSINESS_CONTEXT: false,    // DISABLED - No fake context
    INDICATE_DATA_LIMITATIONS: true,    // Still indicate when data is missing
    SUGGEST_ALTERNATIVES: false,        // DISABLED - No fake alternatives
    MIN_DATA_THRESHOLD: 1,              // Minimum data points to consider "sufficient"
    STRICT_MODE: true,                  // Only return real data from actual API calls
  },

  LOGGING: {
    LOG_TOOL_CALLS: true,
    LOG_CACHE_HITS: false,
    LOG_PERFORMANCE: false,
    LOG_ERRORS: true,
    VERBOSE: false,
    LOG_MULTI_TOOL_REASONING: true,     // Log multi-tool workflow decisions
    LOG_FALLBACK_SCENARIOS: true,      // Log when fallback reasoning is used
    LOG_EFFICIENCY_WARNINGS: true,     // Log efficiency issues (large limits, duplicates)
  },

  EFFICIENCY: {
    MAX_REASONABLE_LIMIT: 100,          // Warn if show_limit exceeds this
    DUPLICATE_CALL_WARNING: true,       // Warn about duplicate tool calls
    TRACK_TOOL_USAGE: true,            // Track tool call patterns
  },

  HISTORY_MANAGEMENT: {
    FILTER_TOOL_RESULTS: true,          // Remove verbose tool results from history
    MAX_TOOL_RESULT_SIZE: 300,          // Max characters for tool results summary (balanced)
    SUMMARIZE_LARGE_RESULTS: true,      // Summarize large tool results
    MAX_TOTAL_HISTORY_SIZE: 30000,      // Max total character count for history (balanced)
    PRESERVE_USER_MESSAGES: true,       // Always keep user messages
    PRESERVE_ASSISTANT_TEXT: true,      // Keep assistant text responses
    STRIP_TOOL_USE_CONTENT: false,      // Keep minimal tool_use info for context
    STRIP_TOOL_RESULT_CONTENT: false,   // Keep summarized tool_result for context
    KEEP_TOOL_SUMMARIES: true,          // Keep intelligent summaries of tool calls
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

// Determine query mode: 'simple' | 'analysis' | 'predictive'
export function getQueryMode(message: string): 'simple' | 'analysis' | 'predictive' {
  const lowerMessage = message.toLowerCase().trim();

  // Check for predictive keywords FIRST (highest priority)
  const hasPredictiveKeywords = TOOL_CONFIG.PREDICTIVE_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (hasPredictiveKeywords) {
    return 'predictive';
  }

  // Check for analysis keywords
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

// Generate historical date ranges for predictive analysis
export function generateHistoricalDateRanges(currentDate: Date, months: number): Array<{month: number, year: number, label: string}> {
  const ranges = [];
  const date = new Date(currentDate);

  for (let i = 0; i < months; i++) {
    date.setMonth(currentDate.getMonth() - i);
    ranges.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    });
    date.setMonth(currentDate.getMonth()); // Reset for next iteration
  }

  return ranges;
}

// Generate system prompt based on query mode
export function generateSystemPrompt(date: Date = new Date(), tools: string[] = [], mode: 'simple' | 'analysis' | 'predictive' = 'simple'): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.toISOString().substring(0, 7); // YYYY-MM format

  const basePrompt = `You are an AI assistant for a laundromat management system. Today is ${dateStr}.\nAvailable tools: ${tools.join(', ')}

CRITICAL: NEVER waste tokens on explanatory text before tool calls. Call tools IMMEDIATELY.

🔧 MULTI-TOOL STRATEGY:
- You can call MULTIPLE tools in a SINGLE response
- Analyze the query and call ALL needed tools at once
- This is MORE EFFICIENT than calling one tool, waiting, then calling another
- Examples:
  • "revenue and customers" → identify and call relevant tools together
  • "compare months" → call same tool with different date params at once
  • "show orders and inventory" → identify and call multiple relevant tools simultaneously
`;

  if (mode === 'predictive') {
    const historicalRanges = generateHistoricalDateRanges(date, TOOL_CONFIG.PREDICTIVE_MODE.PREFERRED_HISTORICAL_MONTHS);

    return `${basePrompt}

🔮 PREDICTIVE MODE - Extended Reasoning & Forecasting:
You are in PREDICTIVE MODE with extended thinking enabled. The user wants predictions, forecasts, or future insights.

⚡ AUTOMATIC HISTORICAL DATA GATHERING:
BEFORE making predictions, you MUST gather historical data:
- Fetch data for the last ${TOOL_CONFIG.PREDICTIVE_MODE.PREFERRED_HISTORICAL_MONTHS} months: ${historicalRanges.map(r => r.label).join(', ')}
- Call tools MULTIPLE TIMES in parallel with different date parameters
- Build a complete time-series dataset before reasoning

Example for revenue prediction query:
1. Identify relevant tools from available tools list
2. Call tools multiple times with historical date parameters: ${historicalRanges.slice(0, 3).map(r => `month=${r.month}, year=${r.year}`).join(' AND ')} (all in one response)
3. Wait for ALL results
4. Use extended thinking to analyze patterns
5. Generate prediction with confidence score

🧠 EXTENDED THINKING FRAMEWORK:
Use <thinking> tags to reason through:
1. **Data Analysis**: Review historical patterns, trends, seasonality
2. **Pattern Detection**: Identify growth rates, cycles, anomalies
3. **Correlation Analysis**: Find relationships between metrics
4. **Forecasting Logic**: Apply statistical reasoning (linear trends, moving averages, seasonal adjustments)
5. **Confidence Assessment**: Evaluate data quality and prediction reliability
6. **Risk Analysis**: Identify potential scenarios and uncertainties

📊 PREDICTIVE ANALYSIS REQUIREMENTS:
1. **Multi-Period Tool Calls**: Always fetch 3-6 months of historical data in parallel
2. **Time-Series Construction**: Build month-over-month or week-over-week datasets
3. **Trend Calculation**: Compute growth rates, averages, standard deviations
4. **Pattern Recognition**: Detect seasonality, cycles, outliers
5. **Cross-Metric Correlation**: Analyze relationships (e.g., customer count → revenue)
6. **Confidence Scoring**: Rate prediction confidence as High/Medium/Low with reasoning
7. **Scenario Planning**: Provide best-case, likely, worst-case predictions
8. **Actionable Insights**: Recommend specific actions based on predictions

🎯 PREDICTION OUTPUT FORMAT:
- **Historical Context**: Summarize past ${TOOL_CONFIG.PREDICTIVE_MODE.PREFERRED_HISTORICAL_MONTHS} months trends
- **Key Patterns**: Growth rate, seasonality, anomalies
- **Prediction**: Specific forecast with timeframe
- **Confidence Level**: High/Medium/Low with reasoning
- **Contributing Factors**: What drives this prediction
- **Scenarios**: Best/likely/worst case
- **Recommendations**: Actionable next steps

⚠️ STRICT REQUIREMENTS:
- NEVER predict without historical data (minimum ${TOOL_CONFIG.PREDICTIVE_MODE.MIN_HISTORICAL_MONTHS} months)
- Call ALL historical data tools in ONE response (parallel execution)
- Use <thinking> for complex reasoning chains
- Provide confidence scores with every prediction
- Base predictions ONLY on actual data patterns
- If insufficient data, state this clearly

Example Query: "Will revenue grow next month?"
Your Response:
1. Identify relevant tool for revenue data from available tools
2. Call that tool for last 6 months with different month/year params (parallel)
3. <thinking>Analyze trends: Month 1: $10k → Month 2: $12k → Month 3: $15k... 20% average growth, seasonal spike detected...</thinking>
4. Present prediction: "Based on historical data, revenue likely to reach $17k-$19k next month (75% confidence) due to sustained 20% growth trend and seasonal patterns."

Remember: Heavy reasoning in <thinking>, data-driven predictions only, always fetch historical context first!`;
  }

  if (mode === 'simple') {
    return `${basePrompt}

SIMPLE MODE - Direct Data Retrieval:
You are in SIMPLE MODE. The user has asked for straightforward data retrieval.

Guidelines:
1. IMMEDIATE MULTI-TOOL EXECUTION:
   - Call ALL needed tools IMMEDIATELY in one response (no explanatory text)
   - Do NOT say "I'll get the data for you" or similar phrases
   - If query needs multiple data points, call multiple tools at once
   - Use logical reasoning to find the right data source
   - Revenue/sales/money questions need order/transaction data

2. TOOL CHAINING EXAMPLES:
   - "revenue and customers" → identify relevant tools and call together
   - "show orders and their customers" → identify relevant tools and call together
   - "compare this month vs last month" → call same tool with different date params together

3. DIRECT RESPONSES:
   - Provide minimal context with the data (e.g., "You have 364 customers" not just "364")
   - Do NOT add analysis, insights, or recommendations unless asked
   - Keep responses concise and to-the-point
   - Use natural, conversational phrasing for single values
   - Format data clearly but don't over-explain

4. NO ASSUMPTIONS:
   - Do NOT add date filters unless the user specifies them
   - Do NOT provide "comprehensive" analysis unless requested
   - Only call tools directly related to the query

5. DATA PROCESSING:
   - Extract only relevant information from tool responses
   - For count queries: focus on the count/total numbers
   - For list queries: show only essential fields (name, ID, key details)
   - Ignore verbose metadata, internal IDs, and unused fields

FALLBACK (if tools fail):
- Still keep responses minimal and direct
- Acknowledge data limitation briefly
- Don't add business analysis unless user asks for it

Remember: Call ALL needed tools at once, be direct, minimal, and literal. Answer exactly what was asked, nothing more.`;
  } else {
    return `${basePrompt}

ANALYSIS MODE - Comprehensive Intelligence:
You are in ANALYSIS MODE. The user wants detailed analysis and insights.

INTELLIGENT REASONING FRAMEWORK:
1. ANALYZE THE REQUEST:
   - Break down complex questions into component data needs
   - Identify ALL data points required for a complete answer
   - PLAN to call ALL needed tools in ONE response (not sequentially)
   - THINK LOGICALLY: Revenue/sales/money data comes from order/transaction data

2. MULTI-TOOL EXECUTION STRATEGY:
   - Call 2-5 tools in PARALLEL when query needs multiple data sources
   - Examples of when to call multiple tools:
     • Comparisons: "this month vs last month" → 2 tool calls with different dates
     • Related metrics: "revenue and customers" → 2 tool calls at once
     • Comprehensive view: "business overview" → 3-4 tools (revenue, customers, orders, inventory)
   - Don't wait for one result before calling another tool
   - Call ALL needed tools IMMEDIATELY in your first response

3. SMART TOOL SELECTION:
   - Don't just look for exact tool name matches
   - Use semantic understanding to map user intent to available tools
   - Read tool descriptions carefully - they contain hints about what data they provide
   - Financial queries (revenue/sales/money) often need data from order/transaction/payment tools
   - Business metrics can be calculated from available data sources
   - Use logical reasoning to map concepts to data sources

4. EFFICIENT TOOL EXECUTION:
   - Call tools IMMEDIATELY without unnecessary explanations
   - Call multiple related tools together in one response
   - Use results from ALL tools to build comprehensive insights
   - Don't make sequential calls when parallel calls are possible

5. COMPREHENSIVE DATA GATHERING:
   - For comparative questions: call tools for ALL time periods at once
   - For trend analysis: gather data across multiple time points in parallel
   - For detailed breakdowns: get both summary and detailed views together
   - For business insights: combine multiple metrics (revenue + customers + orders) in one call

6. SMART PARAMETER USAGE:
   - Use current year (${year}) as default when no timeframe specified
   - Use current month (${month}) for "recent" or "this month" queries
   - Use reasonable date ranges for trend analysis (last 3-6 months)
   - When comparing time periods, call tools with different date params in parallel

7. SYNTHESIS APPROACH:
   - Call ALL needed tools at once, then analyze results together
   - Cross-reference data between multiple tool results to find insights
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

    // For count queries (generic - works with any tool)
    if (toolName.includes('count') && originalQuery.toLowerCase().includes('how many')) {
      const filteredData = {
        total_count: data.total_count || data.count,
        message: data.message || `Total: ${data.total_count || data.count}`
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(filteredData)
        }]
      };
    }

    // For list queries with data arrays (generic - works with any tool)
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      // Keep only first 5 fields of each item to reduce payload
      const filteredItems = data.data.map((item: any) => {
        const filtered: any = {};
        let fieldCount = 0;
        for (const key in item) {
          if (fieldCount < 5 && item.hasOwnProperty(key)) {
            filtered[key] = item[key];
            fieldCount++;
          }
        }
        return filtered;
      });

      const filteredData = {
        data: filteredItems,
        total_showing: data.summary?.showing || filteredItems.length,
        message: `Showing ${filteredItems.length} items`
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

// Detect if query needs multiple tools (chaining/parallel execution)
export function detectMultiToolNeeds(userQuery: string): { needsMultipleTools: boolean; reasoning: string; suggestedToolTypes: string[] } {
  const lowerQuery = userQuery.toLowerCase();

  // Patterns that indicate multiple tools needed
  const multiToolPatterns = [
    { pattern: /\b(and|with|plus|along with|as well as|together with)\b/, types: ['related_metrics'] },
    { pattern: /\b(compare|comparison|vs|versus|against|difference between)\b/, types: ['comparison'] },
    { pattern: /\b(overview|dashboard|summary|complete|full|comprehensive|all)\b/, types: ['comprehensive'] },
    { pattern: /\b(both|multiple|all|various|several)\b/, types: ['multiple_entities'] },
    { pattern: /\b(trend|over time|monthly|weekly|daily|historical)\b/, types: ['time_series'] },
    { pattern: /\b(top.*and|best.*and|highest.*and|most.*and)\b/, types: ['ranked_multiple'] }
  ];

  let needsMultipleTools = false;
  let reasoning = '';
  const suggestedToolTypes: string[] = [];

  for (const { pattern, types } of multiToolPatterns) {
    if (pattern.test(lowerQuery)) {
      needsMultipleTools = true;
      suggestedToolTypes.push(...types);

      if (!reasoning) {
        if (types.includes('comparison')) {
          reasoning = 'Query requires comparison, likely needs same tool with different parameters';
        } else if (types.includes('comprehensive')) {
          reasoning = 'Query asks for comprehensive view, needs multiple data sources';
        } else if (types.includes('related_metrics')) {
          reasoning = 'Query mentions multiple metrics/entities with "and", needs parallel data retrieval';
        } else if (types.includes('time_series')) {
          reasoning = 'Query involves time-based analysis, may need multiple time periods';
        }
      }
    }
  }

  // Check for multiple noun phrases (e.g., "customers and revenue", "orders and inventory")
  const dataNouns = ['customer', 'order', 'revenue', 'sales', 'inventory', 'stock', 'service', 'item', 'product', 'transaction'];
  const foundNouns = dataNouns.filter(noun => lowerQuery.includes(noun));

  if (foundNouns.length >= 2) {
    needsMultipleTools = true;
    if (!reasoning) {
      reasoning = `Query mentions multiple data types: ${foundNouns.join(', ')}`;
    }
    suggestedToolTypes.push('multiple_data_types');
  }

  return {
    needsMultipleTools,
    reasoning: reasoning || 'Single data source query',
    suggestedToolTypes: [...new Set(suggestedToolTypes)] // Remove duplicates
  };
}

// Smart tool matching based on query analysis and available MCP tools
export function smartToolSelection(userQuery: string, availableTools: any[]): string[] {
  const lowerQuery = userQuery.toLowerCase();
  const selectedTools: string[] = [];
  const toolScores: { [toolName: string]: number } = {};

  // Smart relationship detection - understand semantic relationships between concepts
  const getRelatedTools = (query: string, tools: any[]) => {
    const relatedTools: string[] = [];

    // Define semantic concept mappings - what concepts relate to what tool characteristics
    const conceptMappings = {
      financial: {
        queryTerms: ['revenue', 'sales', 'money', 'income', 'earnings', 'profit', 'financial', 'made', 'earned', 'total', 'amount', 'payment', 'paid', 'cost', 'price'],
        toolKeywords: ['order', 'transaction', 'sale', 'payment', 'invoice', 'billing', 'purchase', 'receipt']
      },
      customer: {
        queryTerms: ['customer', 'client', 'user', 'member', 'subscriber', 'buyer'],
        toolKeywords: ['customer', 'client', 'user', 'member', 'account', 'profile']
      },
      inventory: {
        queryTerms: ['inventory', 'stock', 'item', 'product', 'supply', 'material'],
        toolKeywords: ['inventory', 'stock', 'item', 'product', 'material', 'supply']
      },
      analytics: {
        queryTerms: ['report', 'analytics', 'metric', 'performance', 'dashboard', 'summary', 'statistics', 'stats'],
        toolKeywords: ['report', 'metric', 'analytics', 'stats', 'summary', 'dashboard', 'insight']
      }
    };

    // Check each concept mapping
    Object.entries(conceptMappings).forEach(([concept, mapping]) => {
      const matchesQuery = mapping.queryTerms.some(term => query.includes(term));

      if (matchesQuery) {
        // Find tools that match this concept's keywords
        tools.forEach(tool => {
          const toolName = tool.name.toLowerCase();
          const toolDesc = (tool.description || '').toLowerCase();

          const matchesToolKeyword = mapping.toolKeywords.some(keyword =>
            toolName.includes(keyword) || toolDesc.includes(keyword)
          );

          if (matchesToolKeyword && !relatedTools.includes(tool.name)) {
            relatedTools.push(tool.name);
          }
        });
      }
    });

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

// Smart parameter generation for tools based on query analysis
export function generateSmartToolParameters(toolName: string, userQuery: string, dateParams: any, iteration: number = 0): any {
  const lowerQuery = userQuery.toLowerCase();
  const params: any = {};

  // Add date parameters if detected
  if (dateParams) {
    Object.assign(params, dateParams);
  }

  // Intelligent limit calculation based on query intent with iteration support
  const limitParams = calculateIntelligentLimit(userQuery, toolName, iteration);
  if (limitParams) {
    Object.assign(params, limitParams);
  }

  // Add store-specific filters if mentioned
  const storeMatch = lowerQuery.match(/store\s*(\w+|"[^"]+"|'[^']+')/);
  if (storeMatch) {
    params.store_filter = storeMatch[1].replace(/['"]/g, '');
  }

  return params;
}

// Calculate intelligent limits based on query context with progressive strategy
function calculateIntelligentLimit(userQuery: string, toolName: string, iteration: number = 0): any | null {
  const lowerQuery = userQuery.toLowerCase();

  // Extract explicit numbers from query
  const numberMatch = lowerQuery.match(/(\d+)/);
  const explicitNumber = numberMatch ? parseInt(numberMatch[1]) : null;

  // Progressive gathering: start small and expand if needed
  const useProgressive = TOOL_CONFIG.PROGRESSIVE_STRATEGY.ENABLE_PROGRESSIVE_GATHERING;
  const initialLimit = TOOL_CONFIG.PROGRESSIVE_STRATEGY.INITIAL_LIMIT;
  const multiplier = TOOL_CONFIG.PROGRESSIVE_STRATEGY.EXPAND_MULTIPLIER;
  const maxProgressive = TOOL_CONFIG.PROGRESSIVE_STRATEGY.MAX_PROGRESSIVE_LIMIT;

  // Calculate progressive limit: start small, expand on later iterations
  const calculateProgressiveLimit = (baseLimit: number): number => {
    if (!useProgressive || iteration === 0) {
      return Math.min(baseLimit, initialLimit);
    }
    // Expand limit on each iteration: 10 -> 30 -> 90 -> 200 (max)
    const progressiveLimit = initialLimit * Math.pow(multiplier, iteration);
    return Math.min(progressiveLimit, maxProgressive, baseLimit);
  };

  // Count/summary queries - minimal data needed
  if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('total')) {
    return { show_limit: 1 }; // Only need count, not full data
  }

  // "First N" or "top N" queries
  if (lowerQuery.includes('first') || lowerQuery.includes('top')) {
    const limit = explicitNumber || 10; // Default to 10 if not specified
    return { show_limit: Math.min(limit, 50) }; // Cap at 50 for efficiency
  }

  // List queries without specific limits
  if (lowerQuery.includes('list') || lowerQuery.includes('show me')) {
    // Check if it's a detailed analysis request
    const analysisKeywords = ['analyze', 'detailed', 'comprehensive', 'all'];
    const needsDetailedData = analysisKeywords.some(keyword => lowerQuery.includes(keyword));

    if (needsDetailedData) {
      return { show_limit: calculateProgressiveLimit(100) }; // Start small, expand if needed
    } else {
      return { show_limit: calculateProgressiveLimit(20) }; // Progressive list size
    }
  }

  // Revenue/financial queries - often need aggregated data, not individual records
  const financialTerms = ['revenue', 'sales', 'income', 'earnings', 'profit'];
  if (financialTerms.some(term => lowerQuery.includes(term))) {
    // Start with small limit to check data availability
    if (TOOL_CONFIG.PROGRESSIVE_STRATEGY.SMART_AGGREGATION) {
      return { show_limit: calculateProgressiveLimit(30) };
    }
    return { show_limit: calculateProgressiveLimit(50) };
  }

  // Default intelligent limits based on tool type with progressive strategy
  if (toolName.includes('customer')) {
    return { show_limit: explicitNumber || calculateProgressiveLimit(25) };
  } else if (toolName.includes('order')) {
    return { show_limit: explicitNumber || calculateProgressiveLimit(50) };
  }

  // No specific limit needed
  return null;
}

// Generate enhanced system prompt with tool guidance
export function generateEnhancedSystemPrompt(
  date: Date = new Date(),
  availableTools: any[] = [],
  userQuery: string = '',
  mode: 'simple' | 'analysis' | 'predictive' = 'simple',
  currentIteration: number = 0
): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.toISOString().substring(0, 7);

  const suggestedTools = smartToolSelection(userQuery, availableTools);
  const dateParams = extractDateParameters(userQuery);
  const multiToolAnalysis = detectMultiToolNeeds(userQuery);

  // Generate smart parameters for each suggested tool with iteration awareness
  const toolParameterGuidance = suggestedTools.map(toolName => {
    const smartParams = generateSmartToolParameters(toolName, userQuery, dateParams, currentIteration);
    return `${toolName}: ${JSON.stringify(smartParams)}`;
  }).join('\n');

  // Multi-tool guidance
  let multiToolGuidance = '';
  if (multiToolAnalysis.needsMultipleTools) {
    multiToolGuidance = `\n\n⚡ MULTI-TOOL RECOMMENDATION:
${multiToolAnalysis.reasoning}
Strategy: ${multiToolAnalysis.suggestedToolTypes.join(', ')}
→ Consider calling ${Math.min(suggestedTools.length, 3)} tools together in this iteration`;
  }

  // Progressive strategy info
  const progressiveInfo = TOOL_CONFIG.PROGRESSIVE_STRATEGY.ENABLE_PROGRESSIVE_GATHERING
    ? `\n\nPROGRESSIVE DATA GATHERING (Iteration ${currentIteration + 1}):
- Initial limit: ${TOOL_CONFIG.PROGRESSIVE_STRATEGY.INITIAL_LIMIT}
- Current iteration multiplier: ${Math.pow(TOOL_CONFIG.PROGRESSIVE_STRATEGY.EXPAND_MULTIPLIER, currentIteration)}x
- Strategy: Start small, expand if insufficient data
- If data seems incomplete or you need more context, call tools again with expanded parameters`
    : '';

  // Check if tools are available
  const hasTools = availableTools && availableTools.length > 0;

  if (!hasTools) {
    // No tools available at all
    return `You are an AI assistant for a laundromat management system. Today is ${dateStr}.

QUERY: "${userQuery}"

Tools are not available. Respond helpfully with general information.`;
  }

  // Tools are available - let Claude decide when to use them
  const basePrompt = `You are an AI assistant for a laundromat management system. Today is ${dateStr}.

QUERY: "${userQuery}"
ITERATION: ${currentIteration + 1}

🔍 QUERY TYPE DECISION:
Before responding, determine the query type:

**CONVERSATIONAL** (no tools needed):
- Greetings: "hello", "hi", "thanks"
- Explanations: "what is a customer?", "explain revenue"
- Help requests: "what can you do?", "how do you work?"
- General advice: "how to improve business?", "tips for laundry"
→ Just respond naturally, no tools needed

**DATA QUERY** (tools required):
- Counts: "how many customers?", "total orders?"
- Facts: "what was March revenue?", "show me orders"
- Lists: "get customers", "list pickups today"
- Analysis: "which users are at risk?", "analyze revenue"
→ MUST use tools, NEVER invent data

${suggestedTools.length > 0 ? `SUGGESTED TOOLS: ${suggestedTools.slice(0, 3).join(', ')}` : ''}
${dateParams ? `DATE PARAMS: ${JSON.stringify(dateParams)}` : ''}
${toolParameterGuidance ? `\nPARAMETERS:\n${toolParameterGuidance}` : ''}${multiToolGuidance}${progressiveInfo ? '\n' + progressiveInfo : ''}`;

  // PREDICTIVE MODE - Heavy reasoning with extended thinking
  if (mode === 'predictive') {
    const historicalRanges = generateHistoricalDateRanges(date, TOOL_CONFIG.PREDICTIVE_MODE.PREFERRED_HISTORICAL_MONTHS);

    return `${basePrompt}

🔮 PREDICTIVE MODE - Extended Reasoning Enabled

QUERY: "${userQuery}"
ITERATION: ${currentIteration + 1}

⚡ STEP 1: AUTOMATIC HISTORICAL DATA COLLECTION
${currentIteration === 0 ? `
You MUST fetch historical data FIRST (all in parallel):
${historicalRanges.map(r => `- month=${r.month}, year=${r.year} (${r.label})`).join('\n')}

Call the relevant tool(s) ${historicalRanges.length} times with these date parameters IN ONE RESPONSE.
` : `Historical data should be available from previous iteration. Proceed to analysis.`}

🧠 STEP 2: EXTENDED THINKING & REASONING
Use <thinking> tags for deep analysis:
- Review all historical data points
- Calculate trends, growth rates, moving averages
- Detect patterns: seasonality, cycles, anomalies
- Find correlations between metrics
- Apply forecasting logic (linear regression, trend projection)
- Assess data quality and confidence level
- Consider multiple scenarios

📊 STEP 3: PREDICTION & INSIGHTS
Present your findings:
1. **Historical Context**: Summarize ${TOOL_CONFIG.PREDICTIVE_MODE.PREFERRED_HISTORICAL_MONTHS}-month trends with key numbers
2. **Patterns Identified**: Growth rates, seasonality, correlations
3. **Prediction**: Specific forecast with timeframe and range
4. **Confidence**: High/Medium/Low with reasoning
5. **Scenarios**: Best-case, likely, worst-case outcomes
6. **Recommendations**: Actionable next steps based on prediction

${suggestedTools.length > 0 ? `
🔧 SUGGESTED TOOLS FOR THIS QUERY:
${suggestedTools.map(tool => {
  // Generate date parameters for historical data gathering
  const params = historicalRanges.slice(0, 3).map(r => `{month: ${r.month}, year: ${r.year}}`).join(', ');
  return `- ${tool}: Call multiple times with date ranges: ${params}`;
}).join('\n')}
` : ''}

⚠️ REQUIREMENTS:
- ${currentIteration === 0 ? 'Call ALL historical data tools NOW (parallel)' : 'Use existing data to generate prediction'}
- Use <thinking> for reasoning (you have ${TOOL_CONFIG.AI_SETTINGS.THINKING_BUDGET_TOKENS} token budget)
- Every prediction needs a confidence score
- Show your work: explain patterns and logic
- Be data-driven: no speculation without historical evidence

Example Thinking Process:
<thinking>
Historical data analysis:
- Month 1: $10,000 revenue, 150 customers
- Month 2: $12,000 revenue, 165 customers (+20% rev, +10% customers)
- Month 3: $15,000 revenue, 180 customers (+25% rev, +9% customers)

Trends identified:
- Average revenue growth: 22.5% per month (accelerating)
- Customer growth: 9.5% per month (steady)
- Revenue per customer: Increasing from $66.67 → $72.73 → $83.33 (premium service uptake)

Seasonality check: March spike suggests spring cleaning season
Correlation: Strong positive correlation (r=0.95) between customer count and revenue

Forecasting for next month:
- Linear trend: $15k * 1.225 = $18,375
- Customer-based: 180 * 1.095 * $85 avg = $16,758
- Weighted average: $17,500 (±$2,000)

Confidence: MEDIUM-HIGH (75%)
- Limited to 3 months data (prefer 6+ months)
- Strong consistent growth pattern
- Clear seasonal factor
</thinking>

Prediction: Next month revenue: $17,500 (range $15,500-$19,500, 75% confidence)`;
  }

  if (mode === 'simple') {
    return `${basePrompt}

📋 IF THIS IS A DATA QUERY (you determined it needs tools):

🔧 MULTI-TOOL PLANNING:
- Analyze what data you need
- Identify relevant tools from available tools
- If query needs 2+ data sources, call ALL tools at once
- Examples:
  • Multiple metrics → identify and call multiple relevant tools together
  • Time comparisons → call same tool with different date parameters
  • Related data → identify and call relevant tools together

⚠️ MANDATORY PARAMETER ENFORCEMENT:
- Use EXACT parameters shown above
- DO NOT use show_limit: 100 (use what's shown above!)
- Call ALL needed tools immediately (no "I'll get..." preamble)
- WAIT for all results
- Use ONLY real data from results
- NEVER invent names, numbers, or information

❌ FORBIDDEN for data queries:
- Answering without calling tools
- Making up data or examples
- Using your own knowledge for facts/numbers
- Calling one tool, waiting, then calling another (call together!)

✅ REQUIRED for data queries:
- Call ALL needed tools with exact parameters
- Read actual results
- Quote real values from results
- If no data, say "No data available"

🚨 For DATA queries: Every name, number, date MUST come from tool result!

📋 IF THIS IS CONVERSATIONAL (no tools needed):
Just respond naturally and helpfully!`;

  } else {
    return `${basePrompt}

📋 IF THIS IS A DATA/ANALYSIS QUERY (needs tools):

🔧 MULTI-TOOL PLANNING (IMPORTANT):
- Analyze the full query before calling tools
- If you need 2+ data sources, call ALL tools in ONE response
- Examples:
  • "revenue trends and top customers" → identify relevant tools and call together
  • "Jan vs Feb comparison" → call same tool TWICE with different dates in same response
  • "complete business overview" → identify 3-4 relevant tools and call together
- This is FASTER than calling tools one by one

⚠️ MANDATORY PARAMETER ENFORCEMENT:
- Use EXACT parameters shown above
- Expected limit: ${TOOL_CONFIG.PROGRESSIVE_STRATEGY.INITIAL_LIMIT * Math.pow(TOOL_CONFIG.PROGRESSIVE_STRATEGY.EXPAND_MULTIPLIER, currentIteration)}
- Call ALL needed tools immediately (no preamble)
- Wait for all actual results
- Use ONLY real data from results
- NEVER invent data or examples

❌ FORBIDDEN for data queries:
- Making up names, numbers, scenarios
- Answering without tools
- Using assumptions instead of real data
- Sequential tool calling (call one, wait, call another) - call ALL together!

✅ REQUIRED for data queries:
- Identify ALL data needs from query
- Call ALL needed tools together with exact parameters
- Read all actual results carefully
- Extract real data (IDs, names, values)
- Synthesize insights from multiple data sources
- If insufficient, say "Need more data"

🚨 For DATA: Every fact MUST come from tool result!

📋 IF THIS IS CONVERSATIONAL/ADVISORY:
Respond naturally with your knowledge!`;
  }
}

// Intelligent conversation history filtering to prevent prompt size issues
export function filterConversationHistory(conversationHistory: any[]): any[] {
  if (!TOOL_CONFIG.HISTORY_MANAGEMENT.FILTER_TOOL_RESULTS) {
    return conversationHistory;
  }

  const filtered = conversationHistory.map(msg => {
    // For user messages, check if they contain tool_result content (from previous iterations)
    if (msg.role === 'user') {
      // If it's a tool result message, create a compact summary
      if (Array.isArray(msg.content) && msg.content.some((c: any) => c.type === 'tool_result')) {
        // Create summary of tool results instead of full data
        const summaries = msg.content
          .filter((c: any) => c.type === 'tool_result')
          .map((c: any) => {
            try {
              const parsed = typeof c.content === 'string' ? JSON.parse(c.content) : c.content;
              return `[${parsed.data_summary || `Tool completed`}]`;
            } catch {
              return '[Tool result]';
            }
          });

        // Replace with compact summary
        return {
          role: 'user',
          content: summaries.join(', ')
        };
      }
      // Preserve regular user messages
      return msg;
    }

    // For assistant messages with toolUses (your chat format)
    if (msg.role === 'assistant' && msg.toolUses && Array.isArray(msg.toolUses)) {
      // Keep minimal tool info for context
      const filteredToolUses = msg.toolUses.map((toolUse: any) => ({
        name: toolUse.name,
        status: toolUse.status,
        // Keep only summary, not full result
        summary: toolUse.result ? `Result: ${toolUse.status}` : undefined
      }));

      return {
        ...msg,
        content: msg.content, // Keep text content
        toolUses: filteredToolUses
      };
    }

    // For assistant messages with content array (Anthropic format)
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      const filteredContent = msg.content.map((contentItem: any) => {
        // Preserve text responses (these are the conversational responses)
        if (contentItem.type === 'text') {
          return contentItem;
        }

        // Keep minimal tool_use info (name + input summary)
        if (contentItem.type === 'tool_use') {
          return {
            type: 'tool_use',
            id: contentItem.id,
            name: contentItem.name,
            input: {} // Remove input details to save tokens, keep structure
          };
        }

        // Don't include tool_result in history - they're converted to summaries above
        if (contentItem.type === 'tool_result') {
          return null;
        }

        return contentItem;
      }).filter((c: any) => c !== null);

      // Keep if we have any content
      if (filteredContent.length === 0) {
        return null;
      }

      return {
        ...msg,
        content: filteredContent
      };
    }

    return msg;
  }).filter(msg => msg !== null); // Remove null entries

  // Calculate total size and truncate if necessary
  return truncateHistoryIfNeeded(filtered);
}

// Filter tool results specifically for your chat format
function filterToolResultForChat(result: any): any {
  if (!result || !result.content) {
    return result;
  }

  const maxSize = TOOL_CONFIG.HISTORY_MANAGEMENT.MAX_TOOL_RESULT_SIZE;
  let resultText = '';

  // Extract text content from result
  if (Array.isArray(result.content)) {
    result.content.forEach((item: any) => {
      if (item.type === 'text') {
        resultText += item.text;
      }
    });
  }

  // If result is too large, summarize it
  if (resultText.length > maxSize) {
    const summary = summarizeToolResult(resultText);

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  return result;
}

// Filter individual tool results to keep them concise
function filterToolResult(toolResult: any): any {
  const maxSize = TOOL_CONFIG.HISTORY_MANAGEMENT.MAX_TOOL_RESULT_SIZE;

  if (!toolResult.content) {
    return toolResult;
  }

  let resultText = '';

  // Extract text content from tool result
  if (Array.isArray(toolResult.content)) {
    toolResult.content.forEach((item: any) => {
      if (item.type === 'text') {
        resultText += item.text;
      }
    });
  } else if (typeof toolResult.content === 'string') {
    resultText = toolResult.content;
  }

  // If result is too large, summarize it
  if (resultText.length > maxSize) {
    if (TOOL_CONFIG.HISTORY_MANAGEMENT.SUMMARIZE_LARGE_RESULTS) {
      const summary = summarizeToolResult(resultText, toolResult.tool_use_id);

      return {
        ...toolResult,
        content: [{
          type: 'text',
          text: summary
        }]
      };
    } else {
      // Just truncate
      return {
        ...toolResult,
        content: [{
          type: 'text',
          text: resultText.substring(0, maxSize) + '... [truncated]'
        }]
      };
    }
  }

  return toolResult;
}

// Smart summarization of tool results
function summarizeToolResult(resultText: string, toolId?: string): string {
  try {
    // Try to parse as JSON to understand structure
    const parsed = JSON.parse(resultText);

    // If it's an array, summarize the count and structure
    if (Array.isArray(parsed)) {
      return `[Tool Result Summary: ${parsed.length} items returned]`;
    }

    // If it's an object with data array (common pattern)
    if (parsed.data && Array.isArray(parsed.data)) {
      let summary = `[Tool Result Summary: ${parsed.data.length} records`;

      // Add key metrics if available
      if (parsed.total_count) summary += `, total_count: ${parsed.total_count}`;
      if (parsed.message) summary += `, message: "${parsed.message}"`;

      return summary + ']';
    }

    // If it's an object with count/total information
    if (parsed.count !== undefined || parsed.total_count !== undefined || parsed.total !== undefined) {
      const count = parsed.count || parsed.total_count || parsed.total;
      const message = parsed.message || 'data retrieved';
      return `[Tool Result Summary: ${count} - ${message}]`;
    }

    // Generic object summary
    const keys = Object.keys(parsed);
    return `[Tool Result Summary: Object with keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}]`;

  } catch (e) {
    // If not JSON, provide basic text summary
    const lines = resultText.split('\n').filter(line => line.trim());
    if (lines.length > 5) {
      return `[Tool Result Summary: ${lines.length} lines of data]`;
    }

    // For short non-JSON results, truncate
    return resultText.substring(0, 200) + (resultText.length > 200 ? '... [truncated]' : '');
  }
}

// Truncate history if total size exceeds limits
function truncateHistoryIfNeeded(history: any[]): any[] {
  const maxSize = TOOL_CONFIG.HISTORY_MANAGEMENT.MAX_TOTAL_HISTORY_SIZE;

  let totalSize = JSON.stringify(history).length;

  if (totalSize <= maxSize) {
    return history;
  }

  // Remove oldest messages (but preserve recent ones)
  let truncatedHistory = [...history];

  while (totalSize > maxSize && truncatedHistory.length > 2) {
    // Remove oldest message (but keep the most recent user message)
    if (truncatedHistory[0].role === 'user' && truncatedHistory.length > 3) {
      // Find the next non-user message to remove
      const indexToRemove = truncatedHistory.findIndex((msg, idx) => idx > 0 && msg.role !== 'user');
      if (indexToRemove !== -1) {
        truncatedHistory.splice(indexToRemove, 1);
      } else {
        truncatedHistory.shift(); // Remove oldest if no non-user found
      }
    } else {
      truncatedHistory.shift();
    }

    totalSize = JSON.stringify(truncatedHistory).length;
  }

  console.log(`📊 History truncated: ${history.length} -> ${truncatedHistory.length} messages (${totalSize} chars)`);

  return truncatedHistory;
}

export default TOOL_CONFIG;