import React from 'react';
import type { ToolUse } from '../types';

// JSON syntax highlighting component
function SyntaxHighlightedJSON({ data }: { data: any }) {
  const jsonString = JSON.stringify(data, null, 2);
  
  const highlightJSON = (str: string) => {
    return str
      .replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-gray-800';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-600 font-medium'; // property names
          } else {
            cls = 'text-green-600'; // string values
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-600'; // booleans
        } else if (/null/.test(match)) {
          cls = 'text-red-500'; // null
        } else if (/^-?\d/.test(match)) {
          cls = 'text-orange-600'; // numbers
        }
        return `<span class="${cls}">${match}</span>`;
      });
  };

  return (
    <pre 
      className="text-xs overflow-x-auto font-mono leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlightJSON(jsonString) }}
    />
  );
}

// Status badge component
function StatusBadge({ status, executionTime }: { status: 'running' | 'completed' | 'failed'; executionTime?: number }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: (
            <div className="animate-pulse">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-300 border-t-yellow-600"></div>
            </div>
          ),
          text: 'Running...'
        };
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: executionTime ? `Completed (${executionTime}ms)` : 'Completed'
        };
      case 'failed':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          text: 'Failed'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: null,
          text: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

// Copy button component
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:text-purple-800 bg-white hover:bg-purple-50 border border-purple-200 rounded transition-colors duration-200"
      title={`Copy ${label}`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

interface ToolUsageProps {
  toolUse: ToolUse;
}

// Database table component
function DatabaseTable({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 italic">No data returned</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column} className="px-3 py-2 text-sm text-gray-900 border-b border-gray-100">
                  {String(row[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// File tree component
function FileTree({ files }: { files: string[] | any[] }) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
        return '📄';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'css':
      case 'scss':
        return '🎨';
      case 'html':
        return '🌐';
      case 'py':
        return '🐍';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
        return '⚙️';
      default:
        return fileName.includes('.') ? '📄' : '📁';
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="space-y-1">
        {files.map((file, index) => {
          const fileName = typeof file === 'string' ? file : (file.name || file.path || String(file));
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{getFileIcon(fileName)}</span>
              <span className="font-mono text-gray-800">{fileName}</span>
              {typeof file === 'object' && file.size && (
                <span className="text-xs text-gray-500">({file.size} bytes)</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// HTTP request/response component
function HTTPDisplay({ data }: { data: any }) {
  const isRequest = data.method || data.url || data.headers;
  const isResponse = data.status || data.statusCode || data.statusText;

  if (isRequest) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
            {data.method || 'GET'}
          </span>
          <span className="font-mono text-sm text-gray-800">{data.url}</span>
        </div>
        
        {data.headers && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Headers:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-mono">
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="text-blue-600 font-medium">{key}:</span>
                  <span className="ml-2 text-gray-800">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.body && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Body:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-mono">
              <SyntaxHighlightedJSON data={data.body} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isResponse) {
    const statusColor = (data.status || data.statusCode) >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-mono rounded ${statusColor}`}>
            {data.status || data.statusCode} {data.statusText || ''}
          </span>
        </div>
        
        {data.headers && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Response Headers:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-mono">
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="text-green-600 font-medium">{key}:</span>
                  <span className="ml-2 text-gray-800">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.data && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Response Data:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs">
              {formatToolResult(data.data)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return formatToolResult(data);
}

function formatToolResult(result: any, toolName?: string): React.ReactNode {
  if (!result) return null;

  // Handle string results
  if (typeof result === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(result);
      return formatToolResult(parsed, toolName);
    } catch {
      // If not JSON, treat as plain text
      return (
        <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {result}
        </div>
      );
    }
  }

  // Handle arrays - check if it looks like database results or file lists
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return <div className="text-gray-500 italic">No items found</div>;
    }
    
    // Check if this looks like database query results
    if (toolName && (toolName.toLowerCase().includes('query') || toolName.toLowerCase().includes('sql') || toolName.toLowerCase().includes('database'))) {
      if (result.every(item => typeof item === 'object' && item !== null)) {
        return <DatabaseTable data={result} />;
      }
    }
    
    // Check if this looks like file listings
    if (toolName && (toolName.toLowerCase().includes('file') || toolName.toLowerCase().includes('ls') || toolName.toLowerCase().includes('dir'))) {
      return <FileTree files={result} />;
    }
    
    return (
      <div className="space-y-2">
        {result.map((item, index) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
            {formatToolResult(item, toolName)}
          </div>
        ))}
      </div>
    );
  }

  // Handle objects
  if (typeof result === 'object') {
    // Check for HTTP request/response patterns
    if (toolName && (toolName.toLowerCase().includes('http') || toolName.toLowerCase().includes('api') || toolName.toLowerCase().includes('fetch'))) {
      return <HTTPDisplay data={result} />;
    }

    // Check for common result patterns
    if (result.content && typeof result.content === 'string') {
      return (
        <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {result.content}
        </div>
      );
    }

    if (result.text && typeof result.text === 'string') {
      return (
        <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {result.text}
        </div>
      );
    }

    if (result.message && typeof result.message === 'string') {
      return (
        <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {result.message}
        </div>
      );
    }

    // Handle key-value pairs nicely
    return (
      <div className="space-y-2">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
            <div className="ml-2">
              {typeof value === 'object' ? (
                formatToolResult(value, toolName)
              ) : (
                <span className="text-gray-900">{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle primitives
  return <span className="text-gray-900">{String(result)}</span>;
}

export default function ToolUsage({ toolUse }: ToolUsageProps) {
  const [showRaw, setShowRaw] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [startTime] = React.useState(() => Date.now());
  const [executionTime, setExecutionTime] = React.useState<number | undefined>();

  // Calculate execution time when tool completes
  React.useEffect(() => {
    if ((toolUse.result || toolUse.error) && !executionTime) {
      setExecutionTime(Date.now() - startTime);
    }
  }, [toolUse.result, toolUse.error, startTime, executionTime]);

  // Determine status
  const getStatus = (): 'running' | 'completed' | 'failed' => {
    if (toolUse.error) return 'failed';
    if (toolUse.result) return 'completed';
    return 'running';
  };

  return (
    <div style={{ backgroundColor: '#F3F0FF' }} className="border border-purple-200 rounded-lg p-4">
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 text-purple-600 flex items-center justify-center">
            <svg 
              className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-purple-900 text-sm">
              Tool:
            </span>
            <span className="font-mono text-purple-700 text-sm">{toolUse.name}</span>
          </div>
        </div>
        
        <StatusBadge 
          status={getStatus()} 
          executionTime={getStatus() === 'completed' ? executionTime : undefined}
        />
      </div>
      
      <div className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'max-h-none opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="text-sm space-y-4">
          {/* Input Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-purple-800 text-sm">Input:</span>
              <CopyButton 
                text={JSON.stringify(toolUse.input, null, 2)} 
                label="input"
              />
            </div>
            <div className="bg-white border border-purple-200 p-3 rounded-lg">
              <SyntaxHighlightedJSON data={toolUse.input} />
            </div>
          </div>
          
          {/* Output/Error/Loading Section */}
          {toolUse.error ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-red-700 text-sm">Error:</span>
                <CopyButton 
                  text={toolUse.error} 
                  label="error"
                />
              </div>
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                {toolUse.error}
              </div>
            </div>
          ) : toolUse.result ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-green-700 text-sm">Output:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRaw(!showRaw);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 bg-white hover:bg-purple-50 border border-purple-200 px-2 py-1 rounded transition-colors duration-200"
                  >
                    {showRaw ? 'Formatted' : 'Raw JSON'}
                  </button>
                  <CopyButton 
                    text={typeof toolUse.result === 'string' ? toolUse.result : JSON.stringify(toolUse.result, null, 2)} 
                    label="output"
                  />
                </div>
              </div>
              <div className="bg-white border border-green-200 p-3 rounded-lg">
                {showRaw ? (
                  <SyntaxHighlightedJSON data={toolUse.result} />
                ) : (
                  <div className="text-sm">
                    {formatToolResult(toolUse.result, toolUse.name)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <span className="font-semibold text-purple-800 text-sm block mb-3">Output:</span>
              <div className="text-purple-600 text-sm bg-white border border-purple-200 p-4 rounded-lg italic">
                Waiting for tool execution to complete...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}