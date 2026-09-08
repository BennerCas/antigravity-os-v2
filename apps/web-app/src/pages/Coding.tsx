import { useState } from 'react';
import { Play, Code } from '@phosphor-icons/react';
import { API_URL } from '../lib/api';
import CodingEditor from '../components/coding/CodingEditor';
import CodingTerminal from '../components/coding/CodingTerminal';
import PromptLibraryPanel from '../components/coding/PromptLibraryPanel';
import CompilePanel from '../components/coding/CompilePanel';
import AgentCard from '../components/coding/AgentCard';
import CodingAcademyPanel from '../components/coding/CodingAcademyPanel';
import CopilotPanel from '../components/coding/CopilotPanel';

export default function Coding() {
  const [framework, setFramework] = useState('crewai');
  const [prompt, setPrompt] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'compiled' | 'nodes' | 'academy'>('academy');
  const [, setTerminalStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [triggerRun, setTriggerRun] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // (No hay estado open: el panel copilot ahora es fijo a la derecha)

  const handleGenerate = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setPrompt((prev) => prev + '\n\n# AI Generated Task Additions:\n- Data processing\n- Output formatting');
      setIsLoading(false);
    }, 1000);
  };

  const handleCompile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/compile/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ framework, nodes: [], edges: [], execution_plan: prompt })
      });
      if (response.ok) {
        const data = await response.json();
        setCompiledCode(data.code || '# Compiled code generated here\nprint("Hello World")');
        setActiveTab('compiled');
      } else {
        setCompiledCode('# Error compiling code\nprint("Compilation failed")');
      }
    } catch {
      setCompiledCode('# Error connecting to compiler\nprint("Connection failed")');
    }
    setIsLoading(false);
    setActiveTab('compiled');
  };

  const handleRun = () => setTriggerRun(Date.now());

  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#FFFFFF] overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#151515] shrink-0">
        <div className="flex items-center gap-3">
          <Code size={24} weight="bold" className="text-white" />
          <h1 className="text-lg font-medium text-white tracking-wide">Coding Studio</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-[#2A2A2A] rounded-md px-3 py-1.5 bg-[#000000]">
            <span className="text-xs text-[#8A8A8A] uppercase font-semibold">Framework</span>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="bg-transparent text-sm text-white outline-none border-none cursor-pointer"
            >
              <option value="crewai">CrewAI</option>
              <option value="autogen">AutoGen</option>
              <option value="langgraph">LangGraph</option>
            </select>
          </div>
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#151515] border border-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors rounded-md text-white text-sm font-medium"
          >
            <Play size={16} weight="fill" />
            <span>Run</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div className="w-[280px] border-r border-[#2A2A2A] shrink-0 flex flex-col">
          {/* Prompt Library */}
          <div className="flex-1 overflow-y-auto">
            <PromptLibraryPanel onSelectPrompt={(content) => setPrompt(content)} />
          </div>
        </div>


        {/* Center Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-2 px-6 border-b border-[#2A2A2A] shrink-0 h-[53px]">
            {[
          { id: 'academy',  label: 'Guía y Ejemplos' },
          { id: 'editor',   label: 'Editor' },
          { id: 'compiled', label: 'Código Compilado' },
          { id: 'nodes',    label: 'Nodos' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 font-medium transition-all duration-200 ${isActive ? 'nav-item-active shadow-[0_0_10px_rgba(23,74,31,0.5)]' : 'nav-item-inactive'}`}
            >
              {tab.label}
            </button>
          );
        })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-0">
            {activeTab === 'academy' && (
              <CodingAcademyPanel
                onLoadExample={(content, fw) => {
                  setPrompt(content);
                  setFramework(fw);
                  setActiveTab('editor');
                }}
              />
            )}
            {activeTab === 'editor' && (
              <div className="p-6 h-full">
                <CodingEditor
                  value={prompt}
                  onChange={setPrompt}
                  onGenerate={handleGenerate}
                  onCompile={handleCompile}
                  onClear={() => setPrompt('')}
                  framework={framework}
                  isLoading={isLoading}
                />
              </div>
            )}
            {activeTab === 'compiled' && (
              <div className="p-6 h-full">
                <CompilePanel code={compiledCode} framework={framework} onExecute={handleRun} />
              </div>
            )}
            {activeTab === 'nodes' && (
              <div className="p-6 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AgentCard
                    node={{ id: '1', title: 'Data Analyzer', role: 'Analyst', content: 'Analyze datasets for patterns', framework }}
                    onChange={() => {}} onDelete={() => {}}
                  />
                  <AgentCard
                    node={{ id: '2', title: 'Report Writer', role: 'Writer', content: 'Summarize findings into reports', framework }}
                    onChange={() => {}} onDelete={() => {}}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel - Terminal */}
          <div className="h-[300px] border-t border-[#2A2A2A] shrink-0 bg-[#0a0a0a]">
            <CodingTerminal
              wsUrl="ws://127.0.0.1:8001/ws/execute"
              onStatusChange={setTerminalStatus}
              triggerRun={triggerRun}
            />
          </div>
        </div>

        {/* ── Right Panel: APEX-COPILOT ─────────────────────────────────── */}
        <CopilotPanel
          editorCode={prompt}
          language={framework}
          filename={`agent_${framework}.py`}
        />
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-6 py-2 border-t border-[#2A2A2A] bg-[#000000] flex justify-end">
        <span className="text-[10px] text-[#8A8A8A] tracking-wider uppercase font-mono">
          HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®
        </span>
      </footer>
    </div>
  );
}
