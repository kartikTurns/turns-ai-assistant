# Claude Chat Clone with MCP Integration

A full-stack chat application that replicates Claude.ai's interface with Model Context Protocol (MCP) integration for enhanced tool capabilities.

## Features

- 💬 **Real-time Chat Interface** - Clean, responsive UI matching Claude.ai's design
- 🔧 **MCP Tool Integration** - Execute tools via Model Context Protocol servers
- 🧠 **Intelligent Multi-Tool Chaining** - Automatically chains multiple tool calls for comprehensive answers
- 📊 **Tool Result Visualization** - Smart formatting for different data types (tables, files, JSON)
- 💾 **Conversation Management** - Save, load, and manage chat history
- 🎨 **Syntax Highlighting** - Beautiful JSON and code formatting
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Advanced Reasoning** - Strategically plans and executes multi-step data gathering workflows
- 🧠 **Intelligent Fallback System** - Provides expert-level responses even when tools fail or return limited data

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for API routes
- **Anthropic SDK** for Claude API integration
- **Model Context Protocol** for tool execution
- **CORS** for cross-origin requests

### Frontend
- **React 19** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling (with inline styles for components)
- **Custom hooks** for state management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd new_mcp_assistant
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Environment Setup**

   Copy the example environment file and add your configuration:
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `.env` with your settings:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   MCP_SERVER_URL=https://your-mcp-server-url.com
   PORT=5000
   ```

4. **Start the Development Servers**

   From the root directory:
   ```bash
   npm run dev
   ```

   This runs both backend and frontend concurrently:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

## Project Structure

```
new_mcp_assistant/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── toolConfig.ts    # MCP tool configuration
│   │   ├── index.ts             # Express server setup
│   │   └── mcpService.ts        # MCP client service
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInput.tsx    # Message input component
│   │   │   ├── ChatMessage.tsx  # Message display component
│   │   │   ├── Sidebar.tsx      # Conversation sidebar
│   │   │   └── ToolUsage.tsx    # Tool execution display
│   │   ├── hooks/
│   │   │   └── useConversations.ts # Conversation management
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript type definitions
│   │   ├── utils/
│   │   │   └── toolStatusutils.ts # Tool status utilities
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # React entry point
│   │   ├── types.ts             # Additional type definitions
│   │   └── index.css            # Tailwind imports
│   ├── package.json
│   └── vite.config.ts
└── package.json                 # Root package.json for concurrent scripts
```

## API Endpoints

### Backend Routes

- `GET /health` - Health check and MCP status
- `GET /api/tools` - List available MCP tools
- `GET /api/config` - Get frontend configuration
- `POST /api/chat` - Send chat message (streaming response)
- `POST /api/cache/clear` - Clear MCP tool cache
- `GET /api/cache/stats` - Get cache statistics

## MCP Integration

The application integrates with Model Context Protocol servers to provide enhanced functionality:

- **Tool Discovery** - Automatically discovers available tools from MCP servers
- **Smart Tool Selection** - Uses keyword analysis to determine when tools are needed
- **Caching** - Implements intelligent caching for tool results
- **Error Handling** - Robust error handling for tool execution failures
- **Visual Feedback** - Real-time status updates for tool execution

### 🧠 Intelligent Multi-Tool Chaining

The assistant now features advanced multi-tool reasoning capabilities:

**Strategic Planning:**
- Analyzes complex questions to identify all required data points
- Plans optimal sequence of tool calls for comprehensive answers
- Breaks down queries into logical component parts

**Workflow Examples:**
- **"How is business performing?"** → Fetches revenue, customer count, order volume, then compares to previous periods
- **"Show me trends for this year"** → Gets data for multiple months, calculates growth rates, identifies patterns
- **"Compare this month vs last month"** → Retrieves both periods, calculates differences and percentages
- **"What's our best performing service?"** → Gets service data, revenue breakdown, customer metrics, then synthesizes insights

**Enhanced Features:**
- **Continuous Tool Access** - Tools remain available throughout the conversation, not just the first call
- **Smart Continuation** - Assistant analyzes if additional data would improve the answer
- **Up to 8 iterations** - Allows for sophisticated multi-step workflows
- **Context Preservation** - Maintains original request context across all tool calls
- **Result Synthesis** - Combines data from multiple sources into coherent insights

### 🧠 Intelligent Fallback System

The assistant features sophisticated fallback behavior that ensures every response delivers value, even when data is unavailable:

**Fallback Scenarios Handled:**
- **Tool Failures** - Network issues, API errors, or tool malfunctions
- **Empty Data** - No matching records or data collection gaps
- **Limited Data** - Insufficient data points for complete analysis
- **Partial Success** - Some tools succeed while others fail

**Expert-Level Response Generation:**
- **Industry Knowledge** - Applies laundromat business expertise and benchmarks
- **Contextual Reasoning** - Uses business logic and operational patterns
- **Professional Insights** - Offers actionable recommendations despite data limitations
- **Transparency** - Clearly indicates what data is available vs. reasoned estimates

**Business Intelligence Features:**
- **Seasonal Patterns** - References typical industry trends and cycles
- **Operational Benchmarks** - Provides industry-standard comparisons
- **Strategic Recommendations** - Suggests data collection improvements
- **Risk Assessment** - Identifies potential causes for data unavailability

**Response Quality Indicators:**
- "Based on available data..." (partial data scenarios)
- "Industry analysis suggests..." (domain knowledge application)
- "Typical patterns indicate..." (business logic reasoning)
- "While data is limited, here's what we can deduce..." (transparent limitations)

**Example Fallback Responses:**
- When revenue tools fail → Provides typical revenue patterns, seasonal expectations, and optimization strategies
- When customer data is empty → Explains possible causes, suggests tracking improvements, offers customer acquisition insights
- When metrics are limited → Extracts maximum value from available data and supplements with industry benchmarks

### Tool Configuration

Tools are configured in `backend/src/config/toolConfig.ts`:

- **Data Keywords** - Triggers for tool usage
- **Exclude Keywords** - Prevents unnecessary tool calls
- **Performance Settings** - Cache timeouts, retry logic
- **UI Settings** - Display preferences for tool results
- **Fallback Settings** - Configure intelligent fallback behavior and business context integration

## Features in Detail

### Chat Interface
- Streaming responses for real-time chat experience
- Message history with conversation management
- Clean, accessible UI design

### Tool Execution Display
- Collapsible tool execution details
- Syntax-highlighted JSON input/output
- Smart formatting for different data types:
  - Database tables
  - File listings
  - HTTP requests/responses
  - Key-value pairs
- Copy-to-clipboard functionality
- Execution time tracking

### Data Visualization
- **Tables** - Automatic table generation for structured data
- **File Trees** - Visual file browser for directory listings
- **HTTP Display** - Request/response formatting
- **JSON Highlighting** - Color-coded JSON with proper indentation

## Development

### Available Scripts

**Root Level:**
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both applications
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript
- `npm start` - Run production build

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Variables

**Backend:**
- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `MCP_SERVER_URL` - MCP server endpoint
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Architecture

### Backend Architecture
- **Express Server** - RESTful API with streaming support
- **MCP Service** - Handles tool discovery and execution
- **Configuration System** - Flexible tool and AI configuration
- **Caching Layer** - Improves performance for repeated tool calls

### Frontend Architecture
- **Component-Based** - Modular React components
- **Custom Hooks** - Reusable state management
- **Type Safety** - Full TypeScript coverage
- **Responsive Design** - Mobile-first approach

### Data Flow
1. User sends message via ChatInput
2. Frontend streams to backend /api/chat endpoint
3. Backend determines if tools are needed
4. If needed, executes MCP tools and streams results
5. Claude processes results and streams response
6. Frontend displays formatted response with tool details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Your License Here]

## Support

For questions or issues, please open a GitHub issue or contact the maintainers.