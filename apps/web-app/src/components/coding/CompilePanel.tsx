import { Copy, Play } from '@phosphor-icons/react';

interface CompilePanelProps {
  code: string;
  framework: string;
  onExecute: () => void;
}

export default function CompilePanel({ code, framework, onExecute }: CompilePanelProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  // Basic simple highlighting for demonstration
  const renderHighlightedCode = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let html = line
        .replace(/def |class |import |from |return /g, match => `<span class="text-[#c678dd]">${match}</span>`)
        .replace(/print|Agent|Task|Crew|Graph|Workflow/g, match => `<span class="text-[#61afef]">${match}</span>`)
        .replace(/("|')(.*?)("|')/g, match => `<span class="text-[#98c379]">${match}</span>`);
      return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-[#2A2A2A] bg-[#151515]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-wider">
            Compiled Output
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2A2A2A] text-white uppercase">
            {framework}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#8A8A8A] hover:text-white hover:bg-[#2A2A2A] rounded transition-colors"
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>
          <button
            onClick={onExecute}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#151515] border border-[#2A2A2A] text-white hover:bg-[#2A2A2A] rounded transition-colors"
          >
            <Play size={14} weight="fill" />
            <span>Execute</span>
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed text-[#abb2bf] whitespace-pre">
        {code ? renderHighlightedCode(code) : <span className="text-[#4A4A4A]">No code compiled yet.</span>}
      </div>
    </div>
  );
}
