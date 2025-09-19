import type { ToolUse } from '../types';

interface ToolUsageProps {
  toolUse: ToolUse;
}

export default function ToolUsage({ toolUse }: ToolUsageProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 text-blue-600">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-medium text-blue-900">
          {toolUse.error ? 'Tool Error' : 'Tool Used'}: {toolUse.name}
        </span>
      </div>
      
      <div className="text-sm space-y-2">
        <div>
          <span className="font-medium text-gray-700">Input:</span>
          <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(toolUse.input, null, 2)}
          </pre>
        </div>
        
        {toolUse.error ? (
          <div>
            <span className="font-medium text-red-700">Error:</span>
            <div className="mt-1 bg-red-100 text-red-800 p-2 rounded text-xs">
              {toolUse.error}
            </div>
          </div>
        ) : toolUse.result ? (
          <div>
            <span className="font-medium text-green-700">Result:</span>
            <pre className="mt-1 bg-green-100 p-2 rounded text-xs overflow-x-auto">
              {typeof toolUse.result === 'string' ? toolUse.result : JSON.stringify(toolUse.result, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-gray-500 text-xs">Executing...</div>
        )}
      </div>
    </div>
  );
}