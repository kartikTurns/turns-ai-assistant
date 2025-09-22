// Optimized MCP Service with better error handling and caching

interface MCPTool {
  name: string;
  description: string;
  input_schema: any;
}

interface MCPToolCall {
  name: string;
  arguments: any;
}

class MCPService {
  private tools: MCPTool[] = [];
  private isConnected = false;
  private serverUrl: string = '';
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 30000; // Check health every 30 seconds
  private toolsCache: Map<string, { result: any; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // Cache results for 1 minute

  async connect(serverUrl: string): Promise<void> {
    try {
      console.log(`Connecting to MCP server at ${serverUrl}`);
      this.serverUrl = serverUrl;
      
      // Test connection with retry logic
      let retries = 3;
      let connected = false;
      
      while (retries > 0 && !connected) {
        try {
          const response = await fetch(`${serverUrl}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          if (response.ok) {
            connected = true;
            this.isConnected = true;
            this.lastHealthCheck = Date.now();
            await this.discoverTools(serverUrl);
            console.log('Connected to MCP server successfully');
          } else {
            throw new Error(`Health check failed: ${response.status}`);
          }
        } catch (error) {
          retries--;
          if (retries > 0) {
            console.log(`Connection attempt failed, ${retries} retries remaining...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          } else {
            throw error;
          }
        }
      }

      if (!connected) {
        throw new Error('Failed to connect after all retries');
      }
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async discoverTools(serverUrl: string): Promise<void> {
    try {
      const response = await fetch(`${serverUrl}/tools/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (response.ok) {
        const data: any = await response.json();
        if (data.result && data.result.tools) {
          this.tools = data.result.tools.map((tool: any) => ({
            name: tool.name,
            description: tool.description || `Execute ${tool.name} operation`,
            input_schema: tool.input_schema || {
              type: "object",
              properties: {},
              required: []
            },
          }));
          console.log(`Discovered ${this.tools.length} tools:`, this.tools.map(t => t.name));
        } else {
          console.warn('No tools found in response');
          this.tools = [];
        }
      } else {
        console.error(`Tool discovery failed with status: ${response.status}`);
        this.tools = [];
      }
    } catch (error) {
      console.error('Error discovering tools:', error);
      this.tools = [];
    }
  }

  async executeToolCall(serverUrl: string, toolCall: MCPToolCall): Promise<any> {
    // Check connection health periodically
    if (Date.now() - this.lastHealthCheck > this.healthCheckInterval) {
      await this.checkHealth();
    }

    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    console.log('Executing tool call:', toolCall.name);
    
    // Check cache first
    const cacheKey = `${toolCall.name}-${JSON.stringify(toolCall.arguments)}`;
    const cached = this.toolsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('Returning cached result for:', toolCall.name);
      return cached.result;
    }

    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now().toString(), // Use string ID with timestamp
        method: 'tools/call',
        params: {
          name: toolCall.name,
          arguments: toolCall.arguments,
        }
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout for tool execution
    };

    try {
      console.log(`Calling tool: ${toolCall.name} with args:`, toolCall.arguments);
      const response = await fetch(`${serverUrl}/tools/call`, payload);
      
      if (response.ok) {
        const data: any = await response.json();
        
        // Validate response structure
        if (data.error) {
          throw new Error(`Tool error: ${data.error.message || 'Unknown error'}`);
        }
        
        const result = data.result;
        
        // Cache successful results
        this.toolsCache.set(cacheKey, {
          result: result,
          timestamp: Date.now()
        });
        
        // Clean old cache entries
        this.cleanCache();
        
        return result;
      } else {
        const errorText = await response.text();
        throw new Error(`Tool execution failed (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Error executing tool:', error);
      
      // If it's a timeout error, provide a better message
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Tool execution timed out for ${toolCall.name}`);
      }
      
      throw error;
    }
  }

  private async checkHealth(): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        this.isConnected = true;
        this.lastHealthCheck = Date.now();
      } else {
        this.isConnected = false;
        console.warn('Health check failed, attempting reconnect...');
        await this.connect(this.serverUrl);
      }
    } catch (error) {
      this.isConnected = false;
      console.error('Health check error:', error);
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.toolsCache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.toolsCache.delete(key));
    
    if (entriesToDelete.length > 0) {
      console.log(`Cleaned ${entriesToDelete.length} expired cache entries`);
    }
  }

  getAvailableTools(): MCPTool[] {
    return this.tools;
  }

  isReady(): boolean {
    return this.isConnected && this.tools.length > 0;
  }

  // Convert tools to Claude-compatible format
  getClaudeTools(): any[] {
    return this.tools.map(tool => ({
      name: tool.name,
      description: this.enhanceToolDescription(tool),
      input_schema: tool.input_schema || {
        type: "object",
        properties: {},
        required: []
      },
    }));
  }

  private enhanceToolDescription(tool: MCPTool): string {
    // Enhance the description dynamically based on the tool name
    const name = tool.name.toLowerCase();
    
    // Add contextual hints based on common patterns in tool names
    let enhancedDesc = tool.description || `Execute ${tool.name} operation`;
    
    // Add usage hints based on keywords in the tool name
    if (name.includes('customer')) {
      enhancedDesc += ' Use when users ask about customers, customer counts, or customer-related data.';
    } else if (name.includes('revenue') || name.includes('sales')) {
      enhancedDesc += ' Use when users ask about revenue, sales, earnings, income, or financial data.';
    } else if (name.includes('metric') || name.includes('report')) {
      enhancedDesc += ' Use when users ask for reports, metrics, analytics, or business performance.';
    } else if (name.includes('transaction')) {
      enhancedDesc += ' Use when users ask about transactions, transaction history, or transaction details.';
    } else if (name.includes('inventory')) {
      enhancedDesc += ' Use when users ask about inventory, stock levels, or product availability.';
    }
    
    return enhancedDesc;
  }

  // Method to clear cache manually if needed
  clearCache(): void {
    this.toolsCache.clear();
    console.log('Tool cache cleared');
  }

  // Method to get cache statistics
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.toolsCache.size,
      entries: Array.from(this.toolsCache.values()).filter(
        v => Date.now() - v.timestamp < this.cacheTimeout
      ).length
    };
  }
}

export const mcpService = new MCPService();
export type { MCPTool, MCPToolCall };