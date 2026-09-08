import { Handle, Position, NodeProps, NodeResizer, Node } from '@xyflow/react';

type ConditionNodeData = {
  condition?: string;
};

type ConditionNodeProps = NodeProps<Node<ConditionNodeData>>;

export const ConditionNode = ({ data, selected }: ConditionNodeProps) => {
  return (
    <div className="relative flex items-center justify-center min-w-[150px] min-h-[150px]">
      <NodeResizer color="#eab308" isVisible={!!selected} minWidth={150} minHeight={150} />
      
      {/* Diamond shape */}
      <div className="absolute w-full h-full bg-yellow-900/40 border-2 border-yellow-500 transform rotate-45 rounded-lg shadow-lg backdrop-blur-md z-0"></div>
      
      {/* Content */}
      <div className="z-10 flex flex-col items-center justify-center text-center p-4">
        <span className="font-bold text-yellow-100 text-sm">CONDICIÓN</span>
        <span className="text-xs text-yellow-100/70 mt-1">{data.condition || 'If / Else'}</span>
      </div>

      <Handle type="target" position={Position.Top} id="in" className="z-20 w-3 h-3 bg-blue-400" />
      
      {/* True Handle */}
      <Handle type="source" position={Position.Left} id="true" className="z-20 w-3 h-3 bg-green-500" />
      <div className="absolute left-[-30px] text-[10px] text-green-400 font-bold">True</div>
      
      {/* False Handle */}
      <Handle type="source" position={Position.Right} id="false" className="z-20 w-3 h-3 bg-red-500" />
      <div className="absolute right-[-35px] text-[10px] text-red-400 font-bold">False</div>
    </div>
  );
};
