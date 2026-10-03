import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

type SupervisorNodeData = {
  label: string;
  description?: string;
};

const SupervisorNode = ({ data, isConnectable }: NodeProps<SupervisorNodeData>) => {
  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg shadow-md p-4 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
      
      <div className="flex flex-col items-center">
        <div className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">
          Supervisor Router
        </div>
        <div className="text-lg font-semibold text-gray-800 text-center">
          {data.label || 'Dynamic Router'}
        </div>
        {data.description && (
          <div className="text-xs text-gray-500 mt-1 text-center">
            {data.description}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  );
};

export default memo(SupervisorNode);
