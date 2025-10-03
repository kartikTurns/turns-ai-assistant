import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { mcpService } from './mcpService';
import { authService } from './authService';
import {
  TOOL_CONFIG,
  shouldUseToolsForMessage,
  getQueryMode,
  generateSystemPrompt,
  filterToolResultForSimpleMode,
  smartToolSelection,
  extractDateParameters,
  validateToolResult,
  generateEnhancedSystemPrompt,
  generateSmartToolParameters,
  filterConversationHistory,
  detectMultiToolNeeds
} from './config/toolConfig';
import { generateFallbackContext, getBusinessRecommendations } from './utils/businessKnowledge';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://6efm5r3o2d.execute-api.ap-south-1.amazonaws.com/prod';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize MCP connection
(async () => {
  try {
    await mcpService.connect(MCP_SERVER_URL);
    console.log('MCP service initialized');
    console.log(`Loaded configuration with ${TOOL_CONFIG.DATA_KEYWORDS.length} data keywords`);
  } catch (error) {
    console.warn('MCP service initialization failed:', error);
  }
})();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://my-project-omega-orpin.vercel.app'], // Allow multiple frontend ports
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-Access-Token', 'X-Business-Id', 'X-Refresh-Token']
}));
// Increase payload limit for large conversation histories, but we'll filter them
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Claude Chat Clone Backend',
    mcpReady: mcpService.isReady(),
    configLoaded: true,
    cacheStats: mcpService.getCacheStats()
  });
});

app.get('/api/tools', (req, res) => {
  const tools = mcpService.getAvailableTools();
  res.json({
    tools,
    mcpReady: mcpService.isReady(),
    mcpServerUrl: MCP_SERVER_URL,
    config: {
      cacheTimeout: TOOL_CONFIG.PERFORMANCE.CACHE_TIMEOUT_MS,
      maxIterations: TOOL_CONFIG.AI_SETTINGS.MAX_ITERATIONS,
      dataKeywords: TOOL_CONFIG.DATA_KEYWORDS.length,
    }
  });
});

app.get('/api/config', (req, res) => {
  // Endpoint to get configuration for frontend if needed
  res.json({
    ui: TOOL_CONFIG.UI,
    performance: TOOL_CONFIG.PERFORMANCE,
    dataKeywordsCount: TOOL_CONFIG.DATA_KEYWORDS.length,
    excludeKeywordsCount: TOOL_CONFIG.EXCLUDE_KEYWORDS.length,
  });
});

// Simple test endpoint for debugging
app.post('/api/test-chat', async (req, res) => {
  const { message } = req.body;

  // Simple non-streaming response for testing
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedMessage: message,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, messages: conversationHistory } = req.body;

  // Extract auth parameters from headers
  const access_token = req.headers['x-access-token'] as string;
  const business_id = req.headers['x-business-id'] as string;
  const refresh_token = req.headers['x-refresh-token'] as string;

  if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory ? conversationHistory.length : 0);
    console.log('Auth headers - Access token:', !!access_token, 'Business ID:', business_id, 'Refresh token:', !!refresh_token);
  }

  // Check if auth parameters are provided
  if (!access_token || !business_id) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Access token and business ID are required',
      redirect: authService.getRedirectUrl(),
      requiresRedirect: true
    });
  }

  // Validate authentication with external API
  try {
    const authResult = await authService.validateAuth(access_token, business_id);

    if (!authResult.status) {
      console.log('Backend: Authentication failed:', authResult.message);

      // If access token expired and we have refresh token, try to refresh
      if (refresh_token && authResult.message && authResult.message.includes('expired')) {
        console.log('Backend: Access token expired, attempting to refresh...');

        const refreshResult = await authService.refreshAccessToken(refresh_token, business_id);

        if (refreshResult.status && refreshResult.data?.access_token) {
          console.log('Backend: Token refresh successful, new token obtained');
          // Return the new access token to frontend
          return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            tokenRefreshed: true,
            newAccessToken: refreshResult.data.access_token,
            refreshData: refreshResult
          });
        } else {
          console.log('Backend: Token refresh failed:', refreshResult.message);
          // Refresh failed, redirect to login
          return res.status(401).json({
            error: 'Token refresh failed',
            message: refreshResult.message || 'Unable to refresh token',
            redirect: authService.getRedirectUrl(),
            requiresRedirect: true,
            refreshFailed: true
          });
        }
      } else {
        // No refresh token or not an expiry error, return auth failure
        return res.status(401).json({
          error: 'Authentication failed',
          message: authResult.message,
          redirect: authService.getRedirectUrl(),
          requiresRedirect: true,
          authData: {
            status: authResult.status,
            data: authResult.data,
            meta: authResult.meta,
            validation_error: authResult.validation_error
          }
        });
      }
    }

    console.log('Backend: Authentication successful for business:', business_id);
  } catch (error) {
    console.error('Backend: Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication system error',
      message: 'Unable to validate authentication',
      redirect: authService.getRedirectUrl(),
      requiresRedirect: true
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured'
    });
  }

  try {
    // Set response headers before starting stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token, X-Business-Id, X-Refresh-Token',
    });

    const messageId = Date.now().toString();
    const timestamp = new Date().toISOString();

    await handleConversationWithTools(message, conversationHistory, res, messageId, timestamp, access_token, business_id);

  } catch (error) {
    console.error('Error calling Claude API:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to process message with Claude API'
      });
    } else {
      res.end();
    }
  }
});

async function handleConversationWithTools(
  message: string,
  conversationHistory: any[],
  res: express.Response,
  messageId: string,
  timestamp: string,
  accessToken?: string,
  businessId?: string
) {
  // Prepare messages for Claude API
  interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: any;
  }

  let messagesToSend: ClaudeMessage[] = [];
  // Add conversation history if provided, but limit to recent messages and filter verbose content
  if (conversationHistory && Array.isArray(conversationHistory)) {
    // Extract messages from chat format - handle both flat array and chat object with messages
    let allMessages: any[] = [];

    if (conversationHistory.length > 0 && conversationHistory[0].messages) {
      // Handle chat format: [{ messages: [...] }]
      conversationHistory.forEach(chat => {
        if (chat.messages && Array.isArray(chat.messages)) {
          allMessages = allMessages.concat(chat.messages);
        }
      });
    } else {
      // Handle flat message array format
      allMessages = conversationHistory;
    }

    // First, filter out verbose tool content to reduce prompt size
    const originalSize = JSON.stringify(allMessages).length;
    const filteredHistory = filterConversationHistory(allMessages);
    const filteredSize = JSON.stringify(filteredHistory).length;

    // Then limit to recent messages to keep context focused
    const messageLimit = TOOL_CONFIG.AI_SETTINGS.CONTEXT_MESSAGE_LIMIT * 2; // x2 for user+assistant pairs
    const recentHistory = filteredHistory.slice(-messageLimit);

    messagesToSend = recentHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const finalSize = JSON.stringify(messagesToSend).length;
    const reductionPercent = originalSize > 0 ? Math.round((1 - finalSize / originalSize) * 100) : 0;

    if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
      console.log(`📊 History: ${allMessages.length} -> ${filteredHistory.length} -> ${recentHistory.length} messages`);
      console.log(`📉 Size: ${(originalSize / 1024).toFixed(1)}KB -> ${(finalSize / 1024).toFixed(1)}KB (${reductionPercent}% reduction)`);
    }

    // Safety check: If still too large, keep only the most recent messages
    if (finalSize > TOOL_CONFIG.HISTORY_MANAGEMENT.MAX_TOTAL_HISTORY_SIZE) {
      console.warn(`⚠️ History still too large (${(finalSize / 1024).toFixed(1)}KB), keeping only last 2 messages`);
      messagesToSend = recentHistory.slice(-2).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    }
  }

  // Add current message if not already in history
  const lastMessage = messagesToSend[messagesToSend.length - 1];
  if (!lastMessage || lastMessage.content !== message) {
    messagesToSend.push({
      role: 'user',
      content: message,
    });
  }

  // Store the original user message for context
  const originalUserMessage = message;

  // ALWAYS provide tools if MCP is ready - let Claude decide if they're needed!
  // Claude is smart enough to know when to use tools vs when to just respond
  const mcpTools = mcpService.isReady() ? mcpService.getClaudeTools() : [];

  // Determine query mode for response style
  const queryMode = getQueryMode(originalUserMessage);

  // Detect if multi-tool execution is recommended
  const multiToolAnalysis = detectMultiToolNeeds(originalUserMessage);

  if (TOOL_CONFIG.LOGGING.VERBOSE) {
    console.log(`Message: "${originalUserMessage}"`);
    console.log(`Tools available: ${mcpTools.length > 0 ? 'Yes' : 'No'}`);
    console.log(`Query mode: ${queryMode}`);
    if (multiToolAnalysis.needsMultipleTools) {
      console.log(`🔗 Multi-tool scenario detected: ${multiToolAnalysis.reasoning}`);
      console.log(`   Suggested strategies: ${multiToolAnalysis.suggestedToolTypes.join(', ')}`);
    }
  }

  let conversationComplete = false;
  let currentIteration = 0;
  // Adjust max iterations based on query mode - allow more for progressive gathering
  const maxIterations = queryMode === 'simple' ? 5 : TOOL_CONFIG.AI_SETTINGS.MAX_ITERATIONS;

  // Track tool calls to prevent excessive iterations and monitor data sufficiency
  let toolCallHistory: { toolName: string, params: any, recordCount?: number }[] = [];
  let totalRecordsGathered = 0;

  while (!conversationComplete && currentIteration < maxIterations) {
    // Generate system prompt with current iteration for progressive parameter guidance
    const systemPrompt = generateEnhancedSystemPrompt(
      new Date(),
      mcpTools,
      originalUserMessage,
      queryMode,
      currentIteration
    );

    currentIteration++;

    if (TOOL_CONFIG.LOGGING.VERBOSE || TOOL_CONFIG.LOGGING.LOG_MULTI_TOOL_REASONING) {
      console.log(`🔄 Starting iteration ${currentIteration}/${maxIterations} for multi-tool workflow`);
      if (currentIteration > 1) {
        console.log(`📋 Progressive gathering: iteration ${currentIteration}, limits expanded by ${Math.pow(TOOL_CONFIG.PROGRESSIVE_STRATEGY.EXPAND_MULTIPLIER, currentIteration - 1)}x`);
      }
    }

    // Validate messages have content
    const validMessages = messagesToSend.filter(msg => {
      if (typeof msg.content === 'string') {
        return msg.content.trim().length > 0;
      } else if (Array.isArray(msg.content)) {
        return msg.content.length > 0;
      }
      return false;
    });

    if (validMessages.length === 0) {
      console.error('No valid messages to send');
      break;
    }

    const createParams: any = {
      model: TOOL_CONFIG.AI_SETTINGS.MODEL,
      max_tokens: TOOL_CONFIG.AI_SETTINGS.MAX_TOKENS,
      messages: validMessages,
      system: systemPrompt,
    };

    // Add temperature if specified
    if (TOOL_CONFIG.AI_SETTINGS.TEMPERATURE) {
      createParams.temperature = TOOL_CONFIG.AI_SETTINGS.TEMPERATURE;
    }

    // Provide tools on all iterations if they were determined to be needed
    // This allows Claude to continue using tools throughout the conversation
    if (mcpTools.length > 0) {
      createParams.tools = mcpTools;
      if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
        console.log(`Providing ${mcpTools.length} tools to Claude (iteration ${currentIteration})`);
      }
    }

    const startTime = Date.now();
    let response;

    try {
      response = await anthropic.messages.create(createParams);
    } catch (error: any) {
      // Handle rate limit errors
      if (error.status === 429) {
        const retryAfter = parseInt(error.headers?.['retry-after'] || '60');
        console.error(`⚠️ Rate limit hit! Retry after ${retryAfter}s. Input tokens remaining: ${error.headers?.['anthropic-ratelimit-input-tokens-remaining'] || 'unknown'}`);

        // Send error to user
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Rate limit exceeded',
          message: `API rate limit reached. Please wait ${retryAfter} seconds and try again.`,
          retryAfter: retryAfter
        })}\n\n`);
        res.end();
        return;
      }
      throw error;
    }

    const responseTime = Date.now() - startTime;

    // Log token usage to monitor rate limits
    const usage = (response as any).usage;
    if (usage && TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
      console.log(`🎯 Tokens - Input: ${usage.input_tokens || 0}, Output: ${usage.output_tokens || 0}, Total: ${(usage.input_tokens || 0) + (usage.output_tokens || 0)}`);
    }

    if (TOOL_CONFIG.LOGGING.LOG_PERFORMANCE) {
      console.log(`Claude response time: ${responseTime}ms`);
    }

    let hasToolUse = false;
    let hasTextContent = false;
    let assistantContent: any[] = [];
    let toolResults: any[] = [];

    // First pass: collect all content and identify tool uses
    const toolUsesToExecute: any[] = [];

    for (const content of response.content) {
      if (content.type === 'text') {
        hasTextContent = true;

        // Log if Claude is providing text without calling tools first
        if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS && !hasToolUse && content.text.length > 50) {
          console.warn(`⚠️ Claude generating long text response without calling tools!`);
          console.warn(`Text preview: ${content.text.substring(0, 100)}...`);
        }

        // Stream text content to user
        const streamData = {
          type: 'content',
          text: content.text,
          id: messageId,
          timestamp: timestamp,
        };
        res.write(`data: ${JSON.stringify(streamData)}\n\n`);

        // Force flush to ensure data is sent immediately
        if ((res as any).flush) {
          (res as any).flush();
        }

        assistantContent.push(content);
      } else if (content.type === 'tool_use') {
        hasToolUse = true;
        toolUsesToExecute.push(content);
        assistantContent.push(content);
      }
    }

    // Log multi-tool execution plan
    if (toolUsesToExecute.length > 1 && TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
      console.log(`🎯 Multi-tool execution: Claude called ${toolUsesToExecute.length} tools in parallel`);
      console.log(`   Tools: ${toolUsesToExecute.map(t => t.name).join(', ')}`);
    }

    // Second pass: execute all tool uses in PARALLEL
    const toolExecutionPromises = toolUsesToExecute.map(async (content) => {
      // Track this tool call for efficiency monitoring (will update with record count later)
      const currentToolCall = { toolName: content.name, params: content.input, recordCount: 0 };
      toolCallHistory.push(currentToolCall);

      // Check for duplicate or inefficient tool calls
      const duplicateCall = toolCallHistory.slice(0, -1).find(
        prev => prev.toolName === content.name &&
        JSON.stringify(prev.params) === JSON.stringify(content.input)
      );

      if (duplicateCall && TOOL_CONFIG.EFFICIENCY.DUPLICATE_CALL_WARNING && TOOL_CONFIG.LOGGING.LOG_EFFICIENCY_WARNINGS) {
        console.warn(`⚠️ Duplicate tool call detected: ${content.name} with same parameters`);
      }

      // Check for potentially inefficient parameters
      const input = content.input as any;
      if (input?.show_limit > TOOL_CONFIG.EFFICIENCY.MAX_REASONABLE_LIMIT && TOOL_CONFIG.LOGGING.LOG_EFFICIENCY_WARNINGS) {
        console.warn(`⚠️ Large limit detected: ${content.name} with show_limit: ${input.show_limit} (recommended max: ${TOOL_CONFIG.EFFICIENCY.MAX_REASONABLE_LIMIT})`);
      }

      if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
        console.log(`Tool call: ${content.name}`, content.input);
        console.log(`Total tool calls this conversation: ${toolCallHistory.length}`);

        // Log progressive gathering info and validate compliance
        if (input?.show_limit && TOOL_CONFIG.PROGRESSIVE_STRATEGY.ENABLE_PROGRESSIVE_GATHERING) {
          const expectedLimit = TOOL_CONFIG.PROGRESSIVE_STRATEGY.INITIAL_LIMIT *
            Math.pow(TOOL_CONFIG.PROGRESSIVE_STRATEGY.EXPAND_MULTIPLIER, currentIteration - 1);
          const actualLimit = input.show_limit;

          console.log(`📊 Progressive strategy - Iteration ${currentIteration}: Expected ~${Math.round(expectedLimit)}, Actual: ${actualLimit}`);

          // Warn if Claude is disobeying parameters
          if (actualLimit > expectedLimit * 2) {
            console.warn(`⚠️⚠️⚠️ PARAMETER VIOLATION: Claude used show_limit=${actualLimit} but should use ~${Math.round(expectedLimit)}`);
            console.warn(`⚠️ This wastes tokens and defeats progressive gathering!`);
          }
        }
      }

      // Notify user about tool execution
      const toolData = {
        type: 'tool_use',
        id: content.id,
        name: content.name,
        input: content.input,
        messageId: messageId,
        timestamp: timestamp,
        displayText: `🔧 Fetching ${content.name.replace(/_/g, ' ')}...`,
        isCollapsible: TOOL_CONFIG.UI.COLLAPSE_TOOL_DETAILS,
        status: 'executing'
      };
      res.write(`data: ${JSON.stringify(toolData)}\n\n`);

      // Execute the tool
      try {
        const toolStartTime = Date.now();
        const toolResult = await mcpService.executeToolCall(MCP_SERVER_URL, {
          name: content.name,
          arguments: content.input,
        }, {
          accessToken,
          businessId
        });
        const toolExecutionTime = Date.now() - toolStartTime;

          if (TOOL_CONFIG.LOGGING.LOG_PERFORMANCE) {
            console.log(`Tool ${content.name} execution time: ${toolExecutionTime}ms`);
          }

          // Validate tool result matches user query intent
          const dateParams = extractDateParameters(originalUserMessage);
          const isValidResult = validateToolResult(originalUserMessage, content.name, toolResult, dateParams);

          if (!isValidResult && TOOL_CONFIG.LOGGING.LOG_ERRORS) {
            console.warn(`Tool result validation failed for ${content.name}:`, {
              query: originalUserMessage,
              dateParams,
              resultPreview: JSON.stringify(toolResult).substring(0, 200)
            });
          }

          // Check if result was cached
          const cacheStats = mcpService.getCacheStats();
          const wasCached = toolExecutionTime < 100; // Assume cached if very fast

          // Notify completion with validation status
          const toolCompleteData = {
            type: 'tool_complete',
            id: content.id,
            name: content.name,
            input: content.input,
            result: toolResult,
            messageId: messageId,
            timestamp: timestamp,
            displayText: `${isValidResult ? '✅' : '⚠️'} Data retrieved${wasCached && TOOL_CONFIG.UI.SHOW_CACHE_INDICATOR ? ' (cached)' : ''}${!isValidResult ? ' (validation warning)' : ''}`,
            status: isValidResult ? 'completed' : 'completed_with_warning',
            executionTime: TOOL_CONFIG.UI.SHOW_EXECUTION_TIME ? toolExecutionTime : undefined,
            wasCached: wasCached && TOOL_CONFIG.UI.SHOW_CACHE_INDICATOR,
            validationStatus: isValidResult
          };
          res.write(`data: ${JSON.stringify(toolCompleteData)}\n\n`);

          // Note: content already added to assistantContent in first pass
          // Analyze tool result quality and add context for fallback reasoning

          // Track record count for progressive gathering decisions
          let recordCount = 0;
          try {
            let parsedResult;
            if (toolResult.content && toolResult.content[0] && toolResult.content[0].text) {
              parsedResult = JSON.parse(toolResult.content[0].text);
            } else if (typeof toolResult === 'string') {
              parsedResult = JSON.parse(toolResult);
            } else {
              parsedResult = toolResult;
            }

            if (parsedResult.data && Array.isArray(parsedResult.data)) {
              recordCount = parsedResult.data.length;
            } else if (Array.isArray(parsedResult)) {
              recordCount = parsedResult.length;
            } else if (parsedResult.total_count) {
              recordCount = parsedResult.total_count;
            }

            // Update the last tool call with record count
            if (toolCallHistory.length > 0) {
              toolCallHistory[toolCallHistory.length - 1].recordCount = recordCount;
              totalRecordsGathered += recordCount;
            }

            if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS && recordCount > 0) {
              console.log(`📊 Records retrieved: ${recordCount} (total session: ${totalRecordsGathered})`);
            }
          } catch (e) {
            // Parsing failed, skip record counting
          }

          // Apply data filtering for simple queries to reduce data sent to Claude
          let enhancedResult = queryMode === 'simple'
            ? filterToolResultForSimpleMode(content.name, toolResult, originalUserMessage)
            : toolResult;

          // Check if result is empty, null, or insufficient (use the filtered result for simple mode)
          const resultToCheck = queryMode === 'simple' ? enhancedResult : toolResult;
          const isEmpty = !resultToCheck ||
            (Array.isArray(resultToCheck) && resultToCheck.length === 0) ||
            (typeof resultToCheck === 'object' && Object.keys(resultToCheck).length === 0) ||
            (typeof resultToCheck === 'string' && resultToCheck.trim().length === 0);

          const isMinimal = Array.isArray(resultToCheck) && resultToCheck.length < TOOL_CONFIG.PROGRESSIVE_STRATEGY.MIN_DATA_THRESHOLD;

          if (isEmpty) {
            // STRICT MODE: No fallback context or fake data generation
            const businessContext = '';
            const recommendations: string[] = [];

            if (queryMode === 'simple') {
              enhancedResult = {
                data_summary: 'No data returned',
                data_quality: 'empty',
                validation_status: isValidResult,
                fallback_guidance: `The ${content.name} tool returned no data. State clearly that no data is available from the system.`,
                simple_mode: true,
                query_match_analysis: !isValidResult ? 'Tool result does not match the user query intent' : 'Query intent validated'
              };
            } else {
              enhancedResult = {
                data_summary: 'No data returned',
                data_quality: 'empty',
                validation_status: isValidResult,
                fallback_guidance: `The ${content.name} tool returned no data. State clearly that no data is available from the system. Do not generate fake data or examples.`,
                suggested_reasoning: `Explain that the data is not available and cannot be retrieved from the system.`,
                business_context: businessContext,
                recommendations: recommendations.length > 0 ? recommendations : undefined,
                query_match_analysis: !isValidResult ? 'Tool result validation failed - may not match user query intent' : 'Query intent validated'
              };
            }
          } else if (isMinimal) {
            // STRICT MODE: No fallback context or fake data generation
            const businessContext = '';

            // Create a minimal summary instead of including full result
            const dataSummary = `Tool returned ${recordCount} records (minimal data)`;

            if (queryMode === 'simple') {
              enhancedResult = {
                data_summary: dataSummary,
                record_count: recordCount,
                actual_data: enhancedResult, // Use the already filtered result for simple mode
                data_quality: 'limited',
                validation_status: isValidResult,
                fallback_guidance: `The ${content.name} tool returned minimal data. Present what's available directly.`,
                simple_mode: true,
                query_match_analysis: !isValidResult ? 'Limited data may not fully answer user query' : 'Data validates against query intent'
              };
            } else {
              enhancedResult = {
                data_summary: dataSummary,
                record_count: recordCount,
                data_quality: 'limited',
                validation_status: isValidResult,
                fallback_guidance: `The ${content.name} tool returned minimal data (${recordCount} records). Extract maximum value from these results.`,
                data_enhancement_suggestions: 'Consider what additional context or calculations could make this data more valuable.',
                business_context: businessContext,
                query_match_analysis: !isValidResult ? 'Limited data validation failed - may not fully match user query' : 'Data validates against query intent'
              };
            }
          } else {
            // Data looks good - but still create a summary to reduce payload size
            const dataSummary = recordCount > 0
              ? `Tool returned ${recordCount} records`
              : 'Tool returned data successfully';

            // For successful results, include the filtered data but with a summary wrapper
            enhancedResult = {
              data_summary: dataSummary,
              record_count: recordCount,
              actual_data: enhancedResult, // Use the already filtered result
              data_quality: 'good',
              validation_status: isValidResult,
              query_match_analysis: isValidResult ? 'Data validates against query intent' : 'Validation warning'
            };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(enhancedResult)
          });

          // Return success for this tool execution
          return {
            success: true,
            toolId: content.id,
            recordCount: recordCount
          };

        } catch (toolError) {
          if (TOOL_CONFIG.LOGGING.LOG_ERRORS) {
            console.error('Tool execution error:', toolError);
          }

          // Notify error
          const toolErrorData = {
            type: 'tool_complete',
            id: content.id,
            name: content.name,
            input: content.input,
            error: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            messageId: messageId,
            timestamp: timestamp,
            displayText: `❌ Failed to fetch data`,
            status: 'error'
          };
          res.write(`data: ${JSON.stringify(toolErrorData)}\n\n`);

          // Note: content already added to assistantContent in first pass

          // STRICT MODE: No fallback context or fake data generation
          const businessContext = '';
          const recommendations: string[] = [];

          const errorContext = queryMode === 'simple' ? {
            tool_name: content.name,
            tool_input: content.input,
            error_message: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            fallback_guidance: `The ${content.name} tool failed. State clearly that the system cannot retrieve this data at the moment.`,
            data_quality: 'failed',
            simple_mode: true
          } : {
            tool_name: content.name,
            tool_input: content.input,
            error_message: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            fallback_guidance: `The ${content.name} tool failed. State clearly that the system cannot retrieve this data. Do not generate fake data or examples.`,
            business_context: businessContext,
            recommendations: recommendations.length > 0 ? recommendations : undefined,
            data_quality: 'failed'
          };

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(errorContext)
          });

          // Return the tool result object for this execution
          return {
            success: false,
            error: toolError instanceof Error ? toolError.message : 'Tool execution failed'
          };
        }
    });

    // Wait for ALL tool executions to complete in parallel
    const parallelExecutionStart = Date.now();
    await Promise.all(toolExecutionPromises);
    const parallelExecutionTime = Date.now() - parallelExecutionStart;

    if (toolUsesToExecute.length > 1 && TOOL_CONFIG.LOGGING.LOG_PERFORMANCE) {
      console.log(`⚡ Parallel execution of ${toolUsesToExecute.length} tools completed in ${parallelExecutionTime}ms`);
      console.log(`   Average time per tool: ${Math.round(parallelExecutionTime / toolUsesToExecute.length)}ms`);
    }

    // Add assistant's response to conversation
    if (assistantContent.length > 0) {
      messagesToSend.push({
        role: 'assistant',
        content: assistantContent
      });
    }

    // If there were tool uses, add results and continue for interpretation
    if (hasToolUse && toolResults.length > 0) {
      // Add tool results
      messagesToSend.push({
        role: 'user',
        content: toolResults
      });

      // Extract year from original message for context preservation
      let yearContext = '';
      const yearMatch = originalUserMessage.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        yearContext = ` The user asked about ${yearMatch[1]}.`;
      }

      // Enhanced prompt with intelligent fallback guidance
      const hasFailedTools = toolResults.some(tr => {
        try {
          const parsed = JSON.parse(tr.content);
          return parsed.error_message || parsed.fallback_guidance;
        } catch {
          return tr.content && tr.content.includes('Error:');
        }
      });

      const successfulToolCount = toolResults.length - (hasFailedTools ? toolResults.filter(tr => {
        try {
          const parsed = JSON.parse(tr.content);
          return parsed.error_message || parsed.fallback_guidance;
        } catch {
          return tr.content && tr.content.includes('Error:');
        }
      }).length : 0);

      let continuePrompt;
      if (queryMode === 'simple') {
        // Simple mode: explicit instructions to use real data
        if (hasFailedTools && successfulToolCount === 0) {
          continuePrompt = `Tools failed. Say: "Data unavailable" - DO NOT make up data!${yearContext}`;
        } else if (hasFailedTools) {
          continuePrompt = `Tool gave you real data. Use ONLY that real data to answer "${originalUserMessage}". DO NOT invent information.${yearContext}`;
        } else {
          if (currentIteration < maxIterations - 1) {
            continuePrompt = `Tool returned REAL data. Read it carefully. Answer "${originalUserMessage}" using ONLY this actual data. DO NOT make up names/numbers. If need more, say so. DO NOT call tool again.${yearContext}`;
          } else {
            continuePrompt = `Use the REAL data from tools to answer "${originalUserMessage}". DO NOT generate fake data. DO NOT call more tools.${yearContext}`;
          }
        }
      } else {
        // Analysis mode: explicit instructions to use real data
        if (currentIteration < maxIterations - 1) {
          if (hasFailedTools && successfulToolCount === 0) {
            continuePrompt = `All tools failed. Say: "Data unavailable" - DO NOT invent data!${yearContext}`;
          } else if (hasFailedTools) {
            continuePrompt = `Tools gave REAL data. Use ONLY actual data to answer "${originalUserMessage}". DO NOT make up info.${yearContext}`;
          } else {
            continuePrompt = `Tool gave REAL data (${toolResults.length} results). Read carefully. Analyze ONLY actual data for "${originalUserMessage}". DO NOT invent examples. If need more, say so (I'll expand to ${TOOL_CONFIG.PROGRESSIVE_STRATEGY.INITIAL_LIMIT * Math.pow(TOOL_CONFIG.PROGRESSIVE_STRATEGY.EXPAND_MULTIPLIER, currentIteration)}). DO NOT call tools.${yearContext}`;
          }
        } else {
          continuePrompt = hasFailedTools && successfulToolCount === 0
            ? `Final answer: "Data unavailable" - DO NOT make up data!${yearContext}`
            : `Final analysis for "${originalUserMessage}" using ONLY real tool data. DO NOT invent. DO NOT call tools.${yearContext}`;
        }
      }

      messagesToSend.push({
        role: 'user',
        content: continuePrompt
      });
    } else {
      conversationComplete = true;
    }

    if (TOOL_CONFIG.LOGGING.VERBOSE || TOOL_CONFIG.LOGGING.LOG_MULTI_TOOL_REASONING) {
      console.log(`✅ Iteration ${currentIteration} complete (${queryMode} mode): hasToolUse=${hasToolUse}, conversationComplete=${conversationComplete}, toolsExecuted=${toolResults.length}`);
      if (hasToolUse) {
        const toolSummary = toolResults.map(tr => {
          try {
            const parsed = tr.content ? JSON.parse(tr.content) : tr;
            if (parsed.data_quality) {
              return { tool: 'unknown', quality: parsed.data_quality, hasData: parsed.original_result ? 'yes' : 'no' };
            }
            if (parsed.error_message) {
              return { tool: parsed.tool_name, status: 'failed', error: parsed.error_message };
            }
            return { tool: 'unknown', status: 'success', hasData: 'yes' };
          } catch {
            return { tool: 'unknown', status: 'unknown' };
          }
        });

        console.log(`🔧 Tools executed in iteration ${currentIteration}:`, toolSummary);

        // Log fallback scenarios
        const failedTools = toolSummary.filter(t => t.status === 'failed').length;
        const emptyResults = toolSummary.filter(t => t.quality === 'empty').length;
        const limitedResults = toolSummary.filter(t => t.quality === 'limited').length;

        if (failedTools > 0 || emptyResults > 0 || limitedResults > 0) {
          if (TOOL_CONFIG.LOGGING.LOG_FALLBACK_SCENARIOS) {
            console.log(`🚨 Fallback scenarios detected: ${failedTools} failed, ${emptyResults} empty, ${limitedResults} limited`);
            console.log(`🧠 Claude will use intelligent fallback reasoning for comprehensive response`);
            if (TOOL_CONFIG.FALLBACK.PROVIDE_BUSINESS_CONTEXT) {
              console.log(`📊 Business context and industry knowledge will be applied`);
            }
            if (TOOL_CONFIG.FALLBACK.SUGGEST_ALTERNATIVES) {
              console.log(`💡 Alternative recommendations will be provided`);
            }
          }
        }

        if (!conversationComplete && currentIteration < maxIterations) {
          console.log(`🤔 Claude will now analyze results and decide if more tools are needed...`);
        }
      }
    }
  }

  if (currentIteration >= maxIterations) {
    console.warn(`Max iterations (${maxIterations}) reached, ending conversation`);
  }

  const endData = {
    type: 'done',
    id: messageId,
    timestamp: timestamp,
  };

  res.write(`data: ${JSON.stringify(endData)}\n\n`);
  res.end();
}

// Add endpoint to clear cache if needed
app.post('/api/cache/clear', (req, res) => {
  mcpService.clearCache();
  res.json({ 
    success: true, 
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});

// Add endpoint to get cache statistics
app.get('/api/cache/stats', (req, res) => {
  const stats = mcpService.getCacheStats();
  res.json({
    ...stats,
    cacheTimeout: TOOL_CONFIG.PERFORMANCE.CACHE_TIMEOUT_MS,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 MCP Server URL: ${MCP_SERVER_URL}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚙️  Config: ${TOOL_CONFIG.DATA_KEYWORDS.length} data keywords, ${TOOL_CONFIG.EXCLUDE_KEYWORDS.length} exclude keywords`);
  console.log(`💾 Cache timeout: ${TOOL_CONFIG.PERFORMANCE.CACHE_TIMEOUT_MS}ms`);
});

