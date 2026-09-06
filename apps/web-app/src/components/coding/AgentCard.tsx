import { Robot, Trash } from '@phosphor-icons/react';

interface AgentNode {
  id: string;
  title: string;
  role: string;
  content: string;
  framework: string;
}

interface AgentCardProps {
  node: AgentNode;
  onChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
}

export default function AgentCard({ node, onChange, onDelete }: AgentCardProps) {
  return (
    <div className="flex flex-col bg-[#151515] border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors rounded-lg overflow-hidden group">
      <div className="flex items-center justify-between p-3 border-b border-[#2A2A2A] bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <Robot size={16} weight="fill" className="text-white" />
          <input 
            type="text" 
            value={node.title} 
            onChange={(e) => onChange(node.id, 'title', e.target.value)}
            className="bg-transparent text-sm font-semibold text-white outline-none w-32"
          />
        </div>
        <button 
          onClick={() => onDelete(node.id)}
          className="text-[#8A8A8A] hover:text-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash size={14} />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8A8A8A] mb-1">Role</label>
          <input 
            type="text" 
            value={node.role} 
            onChange={(e) => onChange(node.id, 'role', e.target.value)}
            className="w-full bg-[#000000] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#4A4A4A]"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8A8A8A] mb-1">Goal / Prompt</label>
          <textarea 
            value={node.content} 
            onChange={(e) => onChange(node.id, 'content', e.target.value)}
            className="w-full bg-[#000000] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#4A4A4A] resize-none h-16"
          />
        </div>
        <div className="flex justify-end">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#2A2A2A] text-[#8A8A8A] uppercase">
            {node.framework}
          </span>
        </div>
      </div>
    </div>
  );
}
