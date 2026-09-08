import { useState } from 'react';
import { Handle, Position, useReactFlow, NodeProps, NodeResizer, Node } from '@xyflow/react';

type VariableNodeData = {
  title?: string;
  variableName?: string;
};

type VariableNodeProps = NodeProps<Node<VariableNodeData>>;

export const VariableNode = ({ id, data, selected }: VariableNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [variableName, setVariableName] = useState(data.variableName || "");

  return (
    <div className={`flex flex-col transition-colors duration-300 p-4 rounded-xl w-full h-full min-w-[200px] min-h-[100px] relative cyber-glass-node border border-blue-500/50 bg-black/40 backdrop-blur-md`}>
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={200} minHeight={100} />
      <Handle type="target" position={Position.Top} id="in" />
      <Handle type="source" position={Position.Bottom} id="out" />
      <h3 className="font-bold text-md mb-2 text-blue-200">Variable</h3>
      <input 
        type="text"
        className="w-full rounded p-2 text-sm outline-none bg-black/50 text-white border border-blue-500/30 focus:border-blue-500"
        value={variableName}
        onChange={(e) => {
          setVariableName(e.target.value);
          updateNodeData(id, { variableName: e.target.value });
        }}
        placeholder="Nombre de variable..."
      />
    </div>
  );
};
