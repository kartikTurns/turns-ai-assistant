import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { mcpService } from './mcpService';
import { 
  TOOL_CONFIG, 
  shouldUseToolsForMessage, 
  generateSystemPrompt 
} from './config/toolConfig';

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

app.use(cors());
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
  
  if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory ? conversationHistory.length : 0);
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
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    const messageId = Date.now().toString();
    const timestamp = new Date().toISOString();

    await handleConversationWithTools(message, conversationHistory, res, messageId, timestamp);

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
  timestamp: string
) {
  // Prepare messages for Claude API
  interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: any;
  }

  let messagesToSend: ClaudeMessage[] = [];
  // Add conversation history if provided
  if (conversationHistory && Array.isArray(conversationHistory)) {
    messagesToSend = conversationHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
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
  // Use config to determine if we should provide tools
  const shouldProvideTools = shouldUseToolsForMessage(originalUserMessage);
  
  if (TOOL_CONFIG.LOGGING.VERBOSE) {
    console.log(`Message: "${originalUserMessage}"`);
    console.log(`Should use tools: ${shouldProvideTools}`);
  }

  // Add MCP tools only if needed
  const mcpTools = mcpService.isReady() && shouldProvideTools ? mcpService.getClaudeTools() : [];

  let conversationComplete = false;
  let currentIteration = 0;
  const maxIterations = TOOL_CONFIG.AI_SETTINGS.MAX_ITERATIONS;

  // Generate system prompt using config
  const systemPrompt = generateSystemPrompt(new Date(), mcpTools.map(t => t.name));

  while (!conversationComplete && currentIteration < maxIterations) {
    currentIteration++;
    
    if (TOOL_CONFIG.LOGGING.VERBOSE) {
      console.log(`Iteration ${currentIteration}/${maxIterations}`);
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

    // Only add tools on first iteration if we determined they're needed
    if (mcpTools.length > 0 && currentIteration === 1) {
      createParams.tools = mcpTools;
      if (TOOL_CONFIG.LOGGING.LOG_TOOL_CALLS) {
        console.log(`Providing ${mcpTools.length} tools to Claude`);
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
          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(toolResult)
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
          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: `Error: ${toolError instanceof Error ? toolError.message : 'Tool execution failed'}`
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

      // Add a prompt to encourage Claude to interpret the results
      messagesToSend.push({
        role: 'user',
        content: `Based on the data retrieved, please provide a clear and helpful summary.${yearContext} Original request: "${originalUserMessage}"`
      });
    } else {
      conversationComplete = true;
    }

    if (TOOL_CONFIG.LOGGING.VERBOSE) {
      console.log(`Iteration ${currentIteration} complete: hasToolUse=${hasToolUse}, conversationComplete=${conversationComplete}`);
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