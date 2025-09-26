import React from 'react';
import type { ToolUse } from '../types';

// JSON syntax highlighting component
function SyntaxHighlightedJSON({ data }: { data: any }) {
  const jsonString = JSON.stringify(data, null, 2);

  const highlightJSON = (str: string) => {
    return str  
      .replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let color = '#374151';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            color = '#2563EB'; // property names (blue)
          } else {
            color = '#16A34A'; // string values (green)
          }
        } else if (/true|false/.test(match)) {
          color = '#9333EA'; // booleans (purple)
        } else if (/null/.test(match)) {
          color = '#EF4444'; // null (red)
        } else if (/^-?\d/.test(match)) {
          color = '#EA580C'; // numbers (orange)
        }
        return `<span style="color: ${color}; font-weight: ${/:$/.test(match) ? '500' : 'normal'}">${match}</span>`;
      });
  };

  return (
    <pre
      style={{
        fontSize: '12px',
        overflowX: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        lineHeight: '1.7',
        margin: 0,
        padding: 0
      }}
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
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          borderColor: '#FDE68A',
          icon: (
            <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              <div style={{
                animation: 'spin 1s linear infinite',
                borderRadius: '50%',
                height: '12px',
                width: '12px',
                border: '2px solid #FCD34D',
                borderTopColor: '#D97706'
              }} />
            </div>
          ),
          text: 'Running...'
        };
      case 'completed':
        return {
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          borderColor: '#A7F3D0',
          icon: (
            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: executionTime ? `Completed (${executionTime}ms)` : 'Completed'
        };
      case 'failed':
        return {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          borderColor: '#FECACA',
          icon: (
            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          text: 'Failed'
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          color: '#374151',
          borderColor: '#E5E7EB',
          icon: null,
          text: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      border: `1px solid ${config.borderColor}`,
      backgroundColor: config.backgroundColor,
      color: config.color
    }}>
      {config.icon}
      <span>{config.text}</span>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}
      </style>
    </div>
  );
}

// Copy button component
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  const [isHover, setIsHover] = React.useState(false);

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
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        fontSize: '12px',
        color: isHover ? '#7C3AED' : '#8B5CF6',
        backgroundColor: isHover ? '#F3F0FF' : 'white',
        border: '1px solid #C4B5FD',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title={`Copy ${label}`}
    >
      {copied ? (
        <>
          <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    return <div style={{ color: '#6B7280', fontStyle: 'italic' }}>No data returned</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ minWidth: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#F9FAFB' }}>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#4B5563',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #E5E7EB'
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              style={{ borderBottom: '1px solid #E5E7EB' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {columns.map((column) => (
                <td
                  key={column}
                  style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: '#111827'
                  }}
                >
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
    <div style={{
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '12px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {files.map((file, index) => {
          const fileName = typeof file === 'string' ? file : (file.name || file.path || String(file));
          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '18px' }}>{getFileIcon(fileName)}</span>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                color: '#1F2937'
              }}>
                {fileName}
              </span>
              {typeof file === 'object' && file.size && (
                <span style={{ fontSize: '12px', color: '#6B7280' }}>({file.size} bytes)</span>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
            fontSize: '12px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            borderRadius: '4px'
          }}>
            {data.method || 'GET'}
          </span>
          <span style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '14px',
            color: '#1F2937'
          }}>
            {data.url}
          </span>
        </div>

        {data.headers && (
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#4B5563',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Headers:
            </h4>
            <div style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}>
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} style={{ display: 'flex' }}>
                  <span style={{ color: '#2563EB', fontWeight: '500' }}>{key}:</span>
                  <span style={{ marginLeft: '8px', color: '#1F2937' }}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.body && (
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#4B5563',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Body:
            </h4>
            <div style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}>
              <SyntaxHighlightedJSON data={data.body} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isResponse) {
    const isError = (data.status || data.statusCode) >= 400;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 8px',
            backgroundColor: isError ? '#FEE2E2' : '#D1FAE5',
            color: isError ? '#991B1B' : '#065F46',
            fontSize: '12px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            borderRadius: '4px'
          }}>
            {data.status || data.statusCode} {data.statusText || ''}
          </span>
        </div>

        {data.headers && (
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#4B5563',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Response Headers:
            </h4>
            <div style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}>
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} style={{ display: 'flex' }}>
                  <span style={{ color: '#16A34A', fontWeight: '500' }}>{key}:</span>
                  <span style={{ marginLeft: '8px', color: '#1F2937' }}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.data && (
          <div>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#4B5563',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Response Data:
            </h4>
            <div style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '12px'
            }}>
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
        <div style={{
          color: '#111827',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.7'
        }}>
          {result}
        </div>
      );
    }
  }

  // Handle arrays - check if it looks like database results or file lists
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return <div style={{ color: '#6B7280', fontStyle: 'italic' }}>No items found</div>;
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {result.map((item, index) => (
          <div key={index} style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            padding: '12px'
          }}>
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
        <div style={{
          color: '#111827',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.7'
        }}>
          {result.content}
        </div>
      );
    }

    if (result.text && typeof result.text === 'string') {
      return (
        <div style={{
          color: '#111827',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.7'
        }}>
          {result.text}
        </div>
      );
    }

    if (result.message && typeof result.message === 'string') {
      return (
        <div style={{
          color: '#111827',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.7'
        }}>
          {result.message}
        </div>
      );
    }

    // Handle key-value pairs nicely
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(result).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#4B5563',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
            <div style={{ marginLeft: '8px' }}>
              {typeof value === 'object' ? (
                formatToolResult(value, toolName)
              ) : (
                <span style={{ color: '#111827' }}>{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle primitives
  return <span style={{ color: '#111827' }}>{String(result)}</span>;
}

export default function ToolUsage({ toolUse }: ToolUsageProps) {
  const [showRaw, setShowRaw] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [startTime] = React.useState(() => Date.now());
  const [executionTime, setExecutionTime] = React.useState<number | undefined>();
  const [rawButtonHover, setRawButtonHover] = React.useState(false);

  // Calculate execution time when tool completes
  React.useEffect(() => {
    if ((toolUse.result || toolUse.error) && !executionTime) {
      setExecutionTime(Date.now() - startTime);
    }
  }, [toolUse.result, toolUse.error, startTime, executionTime]);

  // Determine status
  const getStatus = (): 'running' | 'completed' | 'failed' => {
    if (toolUse.status === 'error' || toolUse.error) return 'failed';
    if (toolUse.status === 'completed' || toolUse.result) return 'completed';
    return 'running';
  };

  return (
    <div style={{
      backgroundColor: '#F3F0FF',
      border: '1px solid #C4B5FD',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg
              style={{
                width: '16px',
                height: '16px',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔧</span>
            <span style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              color: '#6B46C1',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {toolUse.name}
            </span>
          </div>
        </div>

        <StatusBadge
          status={getStatus()}
          executionTime={getStatus() === 'completed' ? executionTime : undefined}
        />
      </div>

      {isExpanded && (
        <div style={{
          transition: 'all 0.2s ease',
          marginTop: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Input Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{
                  fontWeight: '600',
                  color: '#6B46C1',
                  fontSize: '14px'
                }}>
                  Input:
                </span>
                <CopyButton
                  text={JSON.stringify(toolUse.input, null, 2)}
                  label="input"
                />
              </div>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #C4B5FD',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <SyntaxHighlightedJSON data={toolUse.input} />
              </div>
            </div>

            {/* Output/Error/Loading Section */}
            {toolUse.error ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: '#B91C1C',
                    fontSize: '14px'
                  }}>
                    Error:
                  </span>
                  <CopyButton
                    text={toolUse.error}
                    label="error"
                  />
                </div>
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  {toolUse.error}
                </div>
              </div>
            ) : toolUse.result ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: '#047857',
                    fontSize: '14px'
                  }}>
                    Output:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRaw(!showRaw);
                      }}
                      onMouseEnter={() => setRawButtonHover(true)}
                      onMouseLeave={() => setRawButtonHover(false)}
                      style={{
                        fontSize: '12px',
                        color: rawButtonHover ? '#7C3AED' : '#8B5CF6',
                        backgroundColor: rawButtonHover ? '#F3F0FF' : 'white',
                        border: '1px solid #C4B5FD',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {showRaw ? 'Formatted' : 'Raw JSON'}
                    </button>
                    <CopyButton
                      text={typeof toolUse.result === 'string' ? toolUse.result : JSON.stringify(toolUse.result, null, 2)}
                      label="output"
                    />
                  </div>
                </div>
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #A7F3D0',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  {showRaw ? (
                    <SyntaxHighlightedJSON data={toolUse.result} />
                  ) : (
                    <div style={{ fontSize: '14px' }}>
                      {formatToolResult(toolUse.result, toolUse.name)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span style={{
                  fontWeight: '600',
                  color: '#6B46C1',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Output:
                </span>
                <div style={{
                  color: '#8B5CF6',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  border: '1px solid #C4B5FD',
                  padding: '16px',
                  borderRadius: '8px',
                  fontStyle: 'italic'
                }}>
                  Waiting for tool execution to complete...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}