
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Package, GitMerge } from 'lucide-react';
import type { BuilderNodeData } from '../../../types/builder';

export const SubflowNode = ({ data, selected }: NodeProps<Node<BuilderNodeData>>) => {
  return (
    <div className={`relative min-w-[220px] rounded-xl border-2 bg-zinc-900/90 backdrop-blur-sm transition-all duration-300 shadow-xl overflow-hidden ${
      selected ? 'border-fuchsia-500 shadow-fuchsia-500/20' : 'border-zinc-700 hover:border-zinc-500'
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-fuchsia-500 border-2 border-zinc-900" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-fuchsia-500 border-2 border-zinc-900" />
      
      <div className="flex items-center gap-2 p-3 bg-zinc-800/80 border-b border-zinc-700/50">
        <div className="w-6 h-6 rounded bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
          <Package size={14} />
        </div>
        <div className="flex-1 font-bold text-xs uppercase tracking-wider text-zinc-100 truncate">
          {data?.title || 'Sub-Flujo (Macro)'}
        </div>
        <GitMerge size={14} className="text-zinc-500" />
      </div>
      
      <div className="p-4 space-y-2">
        <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono bg-black/30 p-2 rounded border border-zinc-800 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {data?.content || 'Selecciona un macro...'}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-fuchsia-500 border-2 border-zinc-900" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-fuchsia-500 border-2 border-zinc-900" />
    </div>
  );
};

SubflowNode.displayName = 'SubflowNode';
