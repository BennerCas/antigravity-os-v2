import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { BuilderNode } from '../../../types/builder-flow';

interface SemanticNodeProps {
  data: BuilderNode;
  selected?: boolean;
}

const NodeShell: React.FC<React.PropsWithChildren<{ title: string; color: string; selected?: boolean }>> = ({ title, color, selected, children }) => (
  <div className={`p-4 rounded-xl shadow-lg border-2 bg-gray-900 w-72 transition-colors ${selected ? `border-[${color}] shadow-[0_0_15px_${color}40]` : 'border-gray-700'}`}>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
    <div className="flex items-center mb-3 border-b border-gray-700 pb-2">
      <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: color }}></div>
      <h3 className="font-bold text-gray-200 uppercase text-xs tracking-wider">{title}</h3>
    </div>
    <div className="text-sm text-gray-300">
      {children}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-400" />
  </div>
);

export const AgentNodeUI: React.FC<SemanticNodeProps> = ({ data, selected }) => {
  return (
    <NodeShell title={data.name || 'Agent'} color="#3b82f6" selected={selected}>
      <div className="line-clamp-3 text-xs text-gray-400">
        {data.config?.prompt || 'Sin prompt definido...'}
      </div>
      {data.config?.unresolved_capabilities && (
        <div className="mt-2 text-[10px] bg-blue-900/30 text-blue-300 p-1 rounded">
          🛠 Tool: {data.config.unresolved_capabilities}
        </div>
      )}
    </NodeShell>
  );
};

export const DecisionNodeUI: React.FC<SemanticNodeProps> = ({ data, selected }) => {
  return (
    <div className={`p-4 rounded-xl shadow-lg border-2 bg-gray-900 w-64 transition-colors ${selected ? `border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]` : 'border-gray-700'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500"></div>
        <h3 className="font-bold text-gray-200 uppercase text-xs tracking-wider">{data.name || 'Decision'}</h3>
      </div>
      <div className="text-xs text-yellow-400 font-mono bg-black/30 p-2 rounded">
        {data.config?.expression || 'Sin expresión'}
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 bg-green-500" />
      <div className="absolute -bottom-5 left-1/4 -translate-x-1/2 text-[10px] text-green-500 font-bold">TRUE</div>
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 bg-red-500" />
      <div className="absolute -bottom-5 left-3/4 -translate-x-1/2 text-[10px] text-red-500 font-bold">FALSE</div>
    </div>
  );
};

export const HumanGateNodeUI: React.FC<SemanticNodeProps> = ({ data, selected }) => {
  return (
    <NodeShell title={data.name || 'Human Gate'} color="#a855f7" selected={selected}>
      <div className="text-xs text-purple-300">
        ✋ Pausa la ejecución para revisión humana.
      </div>
      <div className="mt-2 text-[10px] text-gray-500">
        Obj: {data.config?.objective || 'Aprobación general'}
      </div>
    </NodeShell>
  );
};

export const TransformNodeUI: React.FC<SemanticNodeProps> = ({ data, selected }) => {
  return (
    <NodeShell title={data.name || 'Transform'} color="#10b981" selected={selected}>
      <div className="text-xs text-green-300 font-mono">
        var: {data.config?.var_name || 'unknown'}
      </div>
    </NodeShell>
  );
};
