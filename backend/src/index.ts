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
  filterToolResultForSimpleMode
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
app.use(express.json());

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
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token, X-Business-Id',
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
  // Add conversation history if provided, but limit to recent messages
  if (conversationHistory && Array.isArray(conversationHistory)) {
    // Limit conversation history to the last N messages to keep context focused
    const messageLimit = TOOL_CONFIG.AI_SETTINGS.CONTEXT_MESSAGE_LIMIT * 2; // x2 for user+assistant pairs
    const recentHistory = conversationHistory.slice(-messageLimit);

    messagesToSend = recentHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    if (TOOL_CONFIG.LOGGING.VERBOSE || TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
      console.log(`Context: Using ${recentHistory.length} recent messages from ${conversationHistory.length} total messages`);
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
  console.log(originalUserMessage);
  // process.exit(0);
  // Use config to determine if we should provide tools and what mode to use
  const shouldProvideTools = shouldUseToolsForMessage(originalUserMessage);
  const queryMode = getQueryMode(originalUserMessage);

  if (TOOL_CONFIG.LOGGING.VERBOSE) {
    console.log(`Message: "${originalUserMessage}"`);
    console.log(`Should use tools: ${shouldProvideTools}`);
    console.log(`Query mode: ${queryMode}`);
  }

  // Add MCP tools only if needed
  const mcpTools = mcpService.isReady() && shouldProvideTools ? mcpService.getClaudeTools() : [];

  let conversationComplete = false;
  let currentIteration = 0;
  // Adjust max iterations based on query mode
  const maxIterations = queryMode === 'simple' ? 2 : TOOL_CONFIG.AI_SETTINGS.MAX_ITERATIONS;

  // Generate system prompt using config and query mode
  const systemPrompt = generateSystemPrompt(new Date(), mcpTools.map(t => t.name), queryMode);

  while (!conversationComplete && currentIteration < maxIterations) {
    currentIteration++;

    if (TOOL_CONFIG.LOGGING.VERBOSE || TOOL_CONFIG.LOGGING.LOG_MULTI_TOOL_REASONING) {
      console.log(`🔄 Starting iteration ${currentIteration}/${maxIterations} for multi-tool workflow`);
      if (currentIteration > 1) {
        console.log(`📋 Previous iterations have executed tools, continuing reasoning chain...`);
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
    const response = await anthropic.messages.create(createParams);
    const responseTime = Date.now() - startTime;
    
    if (TOOL_CONFIG.LOGGING.LOG_PERFORMANCE) {
      console.log(`Claude response time: ${responseTime}ms`);
    }

    let hasToolUse = false;
    let hasTextContent = false;
    let assistantContent: any[] = [];
    let toolResults: any[] = [];

    for (const content of response.content) {
      if (content.type === 'text') {
        hasTextContent = true;

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
        
        if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
          console.log(`Tool call: ${content.name}`, content.input);
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

          // Check if result was cached
          const cacheStats = mcpService.getCacheStats();
          const wasCached = toolExecutionTime < 100; // Assume cached if very fast

          // Notify completion
          const toolCompleteData = {
            type: 'tool_complete',
            id: content.id,
            name: content.name,
            input: content.input,
            result: toolResult,
            messageId: messageId,
            timestamp: timestamp,
            displayText: `✅ Data retrieved${wasCached && TOOL_CONFIG.UI.SHOW_CACHE_INDICATOR ? ' (cached)' : ''}`,
            status: 'completed',
            executionTime: TOOL_CONFIG.UI.SHOW_EXECUTION_TIME ? toolExecutionTime : undefined,
            wasCached: wasCached && TOOL_CONFIG.UI.SHOW_CACHE_INDICATOR
          };
          res.write(`data: ${JSON.stringify(toolCompleteData)}\n\n`);

          assistantContent.push(content);
          // Analyze tool result quality and add context for fallback reasoning

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

          const isMinimal = Array.isArray(resultToCheck) && resultToCheck.length < 3;

          if (isEmpty) {
            const businessContext = (TOOL_CONFIG.FALLBACK.PROVIDE_BUSINESS_CONTEXT && queryMode === 'analysis')
              ? generateFallbackContext(content.name, content.input, 'empty')
              : '';

            const recommendations = (TOOL_CONFIG.FALLBACK.SUGGEST_ALTERNATIVES && queryMode === 'analysis')
              ? getBusinessRecommendations(content.name)
              : [];

            if (queryMode === 'simple') {
              enhancedResult = {
                original_result: toolResult,
                data_quality: 'empty',
                fallback_guidance: `The ${content.name} tool returned no data. Acknowledge this limitation and provide a direct response.`,
                simple_mode: true
              };
            } else {
              enhancedResult = {
                original_result: toolResult,
                data_quality: 'empty',
                fallback_guidance: `The ${content.name} tool returned no data. ${businessContext} Please provide expert insights about what this might mean and offer business recommendations despite the lack of data.`,
                suggested_reasoning: `Consider typical laundromat operations, seasonal patterns, or industry benchmarks that might apply to this scenario.`,
                business_context: businessContext,
                recommendations: recommendations.length > 0 ? recommendations : undefined
              };
            }
          } else if (isMinimal) {
            const businessContext = (TOOL_CONFIG.FALLBACK.PROVIDE_BUSINESS_CONTEXT && queryMode === 'analysis')
              ? generateFallbackContext(content.name, content.input, 'limited')
              : '';

            if (queryMode === 'simple') {
              enhancedResult = {
                original_result: toolResult,
                data_quality: 'limited',
                fallback_guidance: `The ${content.name} tool returned minimal data. Present what's available directly.`,
                simple_mode: true
              };
            } else {
              enhancedResult = {
                original_result: toolResult,
                data_quality: 'limited',
                fallback_guidance: `The ${content.name} tool returned minimal data. Extract maximum value from these results and supplement with business reasoning and industry knowledge.`,
                data_enhancement_suggestions: 'Consider what additional context or calculations could make this data more valuable.',
                business_context: businessContext
              };
            }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(enhancedResult)
          });

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

          assistantContent.push(content);

          // Enhanced error context for intelligent fallback
          const businessContext = (TOOL_CONFIG.FALLBACK.PROVIDE_BUSINESS_CONTEXT && queryMode === 'analysis')
            ? generateFallbackContext(content.name, content.input, 'failed')
            : '';

          const recommendations = (TOOL_CONFIG.FALLBACK.SUGGEST_ALTERNATIVES && queryMode === 'analysis')
            ? getBusinessRecommendations(content.name)
            : [];

          const errorContext = queryMode === 'simple' ? {
            tool_name: content.name,
            tool_input: content.input,
            error_message: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            fallback_guidance: `The ${content.name} tool failed. Acknowledge the failure and provide a direct response that data is unavailable.`,
            data_quality: 'failed',
            simple_mode: true
          } : {
            tool_name: content.name,
            tool_input: content.input,
            error_message: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            fallback_guidance: `The ${content.name} tool failed. Please provide an expert-level response using business reasoning and industry knowledge. Acknowledge the data limitation and offer valuable insights despite the tool failure.`,
            business_context: businessContext,
            recommendations: recommendations.length > 0 ? recommendations : undefined,
            data_quality: 'failed'
          };

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(errorContext)
          });
        }
      }
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
        // Simple mode: minimal continuation prompts
        if (hasFailedTools && successfulToolCount === 0) {
          continuePrompt = `Tools failed. Provide a direct answer acknowledging data unavailability.${yearContext} Original request: "${originalUserMessage}"`;
        } else if (hasFailedTools) {
          continuePrompt = `Use available data to provide a direct answer to: "${originalUserMessage}"${yearContext}`;
        } else {
          continuePrompt = `Provide the requested data directly without additional analysis.${yearContext} Original request: "${originalUserMessage}"`;
        }
      } else {
        // Analysis mode: comprehensive continuation prompts
        if (currentIteration < maxIterations - 1) {
          if (hasFailedTools && successfulToolCount === 0) {
            // All tools failed - focus on expert reasoning
            continuePrompt = `All tools failed to retrieve data. Please provide an expert-level response using your business knowledge and industry expertise. Apply contextual reasoning about laundromat operations, typical business patterns, and actionable insights. Be transparent about data limitations while delivering maximum value through professional analysis.${yearContext}

Original request: "${originalUserMessage}"

Focus on: Business logic, industry benchmarks, operational insights, and practical recommendations.`;
          } else if (hasFailedTools) {
            // Some tools failed - combine available data with reasoning
            continuePrompt = `Some tools succeeded while others failed. Analyze the available data and determine if you need additional information or if you can provide a comprehensive answer using the retrieved data combined with business reasoning. If more tools might help, try them. Otherwise, provide expert insights combining data and professional knowledge.${yearContext}

Original request: "${originalUserMessage}"

Remember: Use both data-driven insights and business expertise to deliver comprehensive value.`;
          } else {
            // Normal multi-tool continuation
            continuePrompt = `Based on the data retrieved, analyze if you need additional information to provide a complete answer. If so, use more tools to gather that data. If you have enough information, provide a comprehensive summary and analysis.${yearContext}

Original request: "${originalUserMessage}"

Remember: You can call more tools if needed to provide better insights, comparisons, or context.`;
          }
        } else {
          // Final iteration - synthesize everything
          if (hasFailedTools && successfulToolCount === 0) {
            continuePrompt = `Provide your best expert-level response using business knowledge and reasoning, clearly acknowledging the data limitations.${yearContext} Original request: "${originalUserMessage}"`;
          } else {
            continuePrompt = `Based on all available information (both data and any limitations encountered), provide a comprehensive, expert-level analysis and recommendations.${yearContext} Original request: "${originalUserMessage}"`;
          }
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