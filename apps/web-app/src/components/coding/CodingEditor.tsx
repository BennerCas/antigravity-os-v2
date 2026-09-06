import { Sparkle, Code, Trash } from '@phosphor-icons/react';

interface CodingEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onCompile: () => void;
  onClear: () => void;
  framework: string;
  isLoading: boolean;
}

export default function CodingEditor({
  value,
  onChange,
  onGenerate,
  onCompile,
  onClear,
  framework,
  isLoading
}: CodingEditorProps) {
  return (
    <div className="flex flex-col h-full bg-[#151515] border border-[#2A2A2A] rounded-lg overflow-hidden focus-within:border-[#3A3A3A] transition-colors duration-200">
      <div className="flex items-center justify-between p-3 border-b border-[#2A2A2A] bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">
            Prompt / Task Description
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2A2A2A] text-white uppercase">
            {framework}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8A8A8A] hover:text-white hover:bg-[#2A2A2A] rounded transition-colors"
          >
            <Trash size={14} />
            <span>Limpiar</span>
          </button>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-transparent border border-[#2A2A2A] text-white hover:bg-[#151515] rounded transition-colors disabled:opacity-50"
          >
            <Sparkle size={14} weight="fill" />
            <span>Generar con IA</span>
          </button>
          <button
            onClick={onCompile}
            disabled={isLoading || !value.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#151515] border border-[#2A2A2A] text-white hover:bg-[#2A2A2A] rounded transition-colors disabled:opacity-50"
          >
            <Code size={14} weight="bold" />
            <span>Compilar Código</span>
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the task or prompt for the AI agents..."
        className="flex-1 w-full p-4 bg-transparent text-white font-mono text-sm resize-none outline-none focus:outline-none placeholder:text-[#4A4A4A]"
      />
      <div className="p-2 border-t border-[#2A2A2A] bg-[#0a0a0a] flex justify-end">
        <span className="text-xs text-[#8A8A8A] font-mono">
          {value.length} characters
        </span>
      </div>
    </div>
  );
}
