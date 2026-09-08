import { useState } from 'react';
import { Handle, Position, useReactFlow, NodeProps, NodeResizer, Node } from '@xyflow/react';

type HumanNodeData = {
  title?: string;
  instructions?: string;
};

type HumanNodeProps = NodeProps<Node<HumanNodeData>>;

export const HumanNode = ({ id, data, selected }: HumanNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [instructions, setInstructions] = useState(data.instructions || "");

  return (
    <div className={`flex flex-col transition-colors duration-300 p-4 rounded-xl w-full h-full min-w-[250px] min-h-[150px] relative cyber-glass-node border border-orange-500/50 bg-black/40 backdrop-blur-md`}>
      <NodeResizer color="#f97316" isVisible={!!selected} minWidth={250} minHeight={150} />
      <Handle type="target" position={Position.Top} id="in" />
      <Handle type="source" position={Position.Bottom} id="out" />
      <h3 className="font-bold text-md mb-2 text-orange-200">Revisión Humana</h3>
      <textarea 
        className="w-full h-full min-h-[80px] rounded p-2 text-sm outline-none bg-black/50 text-white border border-orange-500/30 focus:border-orange-500 resize-none"
        value={instructions}
        onChange={(e) => {
          setInstructions(e.target.value);
          updateNodeData(id, { instructions: e.target.value });
        }}
        placeholder="Instrucciones para el humano..."
      />
    </div>
  );
};
