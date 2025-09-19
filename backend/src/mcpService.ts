// Since we're using HTTP-based MCP, we don't need the SDK client imports
// We'll use fetch-based approach for the AWS API Gateway endpoint

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

  async connect(serverUrl: string): Promise<void> {
    try {
      // For HTTP-based MCP servers, we'll use fetch-based approach
      // Since the provided URL is an AWS API Gateway endpoint
      console.log(`Connecting to MCP server at ${serverUrl}`);
      
      // Test connection
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.isConnected = true;
        await this.discoverTools(serverUrl);
        console.log('Connected to MCP server successfully');
      } else {
        throw new Error(`Failed to connect to MCP server: ${response.status}`);
      }
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
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
      });
      if (response.ok) {
        const data: any = await response.json();
        console.log('Discovered tools response:', data);
        if (data.result && data.result.tools) {
          this.tools = data.result.tools.map((tool: any) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema,
          }));
          console.log(`Discovered ${this.tools.length} tools:`, this.tools.map(t => t.name));
        }
      }
    } catch (error) {
      console.error('Error discovering tools:', error);
    }
  }

  async executeToolCall(serverUrl: string, toolCall: MCPToolCall): Promise<any> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    const payload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolCall.name,
            arguments: toolCall.arguments,
          }
        }),
      };
    try {
      console.log("response payload",payload);
      const response = await fetch(`${serverUrl}/tools/call`,payload);
      if (response.ok) {
        const data: any = await response.json();
        return data.result;
      } else {
        throw new Error(`Tool execution failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error executing tool:', error);
      throw error;
    }
  }

  getAvailableTools(): MCPTool[] {
    return this.tools;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  // Convert tools to Claude-compatible format
  getClaudeTools(): any[] {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema || {
        type: "object",
        properties: {},
        required: []
      },
    }));
  }
}

export const mcpService = new MCPService();
export type { MCPTool, MCPToolCall };