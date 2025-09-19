import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { mcpService } from './mcpService';

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
  } catch (error) {
    console.warn('MCP service initialization failed:', error);
  }
})();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Claude Chat Clone Backend' });
});

app.get('/api/tools', (req, res) => {
  const tools = mcpService.getAvailableTools();
  res.json({
    tools,
    mcpReady: mcpService.isReady(),
    mcpServerUrl: MCP_SERVER_URL,
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, messages: conversationHistory } = req.body;
  
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ 
      error: 'ANTHROPIC_API_KEY not configured' 
    });
  }

  try {

    // Prepare messages for Claude API
    interface ClaudeMessage {
      role: 'user' | 'assistant';
      content: string;
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

    // Add MCP tools if available
    const mcpTools = mcpService.isReady() ? mcpService.getClaudeTools() : [];
    
    const createParams: any = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: messagesToSend,
    };

    // Add tools if available
    if (mcpTools.length > 0) {
      createParams.tools = mcpTools;
    }

    // Set response headers before starting stream
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    const stream = anthropic.messages.stream(createParams);

    let fullResponse = '';
    const messageId = Date.now().toString();
    const timestamp = new Date().toISOString();

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        
        const streamData = {
          type: 'content',
          text: text,
          id: messageId,
          timestamp: timestamp,
        };
        
        res.write(`data: ${JSON.stringify(streamData)}\n\n`);
      } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
        // Handle tool use
        const toolUse = chunk.content_block;
        const toolData = {
          type: 'tool_use',
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input,
          messageId: messageId,
          timestamp: timestamp,
        };
        
        res.write(`data: ${JSON.stringify(toolData)}\n\n`);
        
        // Execute the tool
        try {
          const toolResult = await mcpService.executeToolCall(MCP_SERVER_URL, {
            name: toolUse.name,
            arguments: toolUse.input,
          });
          
          const toolResultData = {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult),
            messageId: messageId,
            timestamp: timestamp,
          };
          
          res.write(`data: ${JSON.stringify(toolResultData)}\n\n`);
          fullResponse += `\n[Tool: ${toolUse.name} executed successfully]\n`;
        } catch (toolError) {
          console.error('Tool execution error:', toolError);
          const toolErrorData = {
            type: 'tool_error',
            tool_use_id: toolUse.id,
            error: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            messageId: messageId,
            timestamp: timestamp,
          };
          
          res.write(`data: ${JSON.stringify(toolErrorData)}\n\n`);
          fullResponse += `\n[Tool: ${toolUse.name} failed - ${toolError}]\n`;
        }
      }
    }

    const endData = {
      type: 'done',
      id: messageId,
      message: fullResponse,
      timestamp: timestamp,
    };
    
    res.write(`data: ${JSON.stringify(endData)}\n\n`);
    res.end();

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});