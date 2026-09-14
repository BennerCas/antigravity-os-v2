import { useState } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Bug, TreeStructure, List, 
  TerminalWindow, CaretRight, CaretDown, WarningCircle, CheckCircle, Robot
} from '@phosphor-icons/react';

// Mock telemetry data
const MOCK_TRACE = {
  id: 'run_01HZQK7',
  project: 'Lead Triage',
  version: 'sysn_lead_triage@1.4.0',
  duration: '3.9s',
  cost: '$0.031',
  status: 'OK',
  spans: [
    { id: 's1', name: 'trigger.webhook', kind: 'trigger', latency: '12ms', cost: '$0', status: 'OK' },
    { 
      id: 's2', name: 'node.lead_qual', kind: 'agent', latency: '1500ms', cost: '$0.021', status: 'OK',
      model: 'gpt-4o@2026-05', tokensIn: 1840, tokensOut: 210,
      children: [
        { id: 's2_1', name: 'retrieval.rag', kind: 'tool', latency: '180ms', cost: '$0.0002', status: 'OK', detail: 'docs=4 rerank=true' },
        { id: 's2_2', name: 'tool.crm_lookup', kind: 'tool', latency: '120ms', cost: '$0.0005', status: 'OK', detail: 'cache=HIT' },
        { id: 's2_3', name: 'guardrail.output', kind: 'tool', latency: '9ms', cost: '$0', status: 'OK' }
      ]
    },
    { id: 's3', name: 'node.route_A', kind: 'router', latency: '3ms', cost: '$0', status: 'OK', detail: 'expr="classification==\'A\'"' },
    { 
      id: 's4', name: 'node.enrich_sql', kind: 'tool', latency: '800ms', cost: '$0.001', status: 'OK', detail: 'cache=MISS',
      children: [
        { id: 's4_1', name: 'db.query', kind: 'tool', latency: '790ms', cost: '$0', status: 'OK' }
      ]
    },
    { id: 's5', name: 'node.proposal', kind: 'agent', latency: '420ms', cost: '$0.004', status: 'WARN', detail: 'fallback=true', model: 'gpt-4o-mini' },
    { id: 's6', name: 'sink.email_send', kind: 'sink', latency: '200ms', cost: '$0.0009', status: 'OK', detail: 'idempotency=IDEMP_...' }
  ]
};

const SpanRow = ({ span, level = 0, isSelected, onClick }: any) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = span.children && span.children.length > 0;

  return (
    <>
      <div 
        onClick={() => onClick(span)}
        className={`flex items-center text-xs py-1.5 px-2 border-b border-[#222] cursor-pointer hover:bg-[#111] transition-colors ${isSelected ? 'bg-[#1a2b3c] border-l-2 border-l-[#00D9FF]' : 'border-l-2 border-l-transparent'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center w-6 text-gray-500">
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
              {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
            </button>
          ) : <span className="w-3.5" />}
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          {span.status === 'OK' ? <CheckCircle size={14} className="text-green-500" /> : <WarningCircle size={14} className="text-yellow-500" />}
          <span className={isSelected ? 'text-white font-bold' : 'text-gray-300'}>{span.name}</span>
          <span className="text-[10px] text-gray-500 uppercase px-1.5 py-0.5 bg-[#111] rounded">{span.kind}</span>
          {span.model && <span className="text-[10px] text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-900/50 flex items-center gap-1"><Robot size={10}/>{span.model}</span>}
        </div>
        
        <div className="w-24 text-right text-gray-400 font-mono text-[10px]">{span.latency}</div>
        <div className="w-24 text-right text-gray-400 font-mono text-[10px]">{span.cost}</div>
      </div>
      {expanded && hasChildren && span.children.map((child: any) => (
        <SpanRow key={child.id} span={child} level={level + 1} isSelected={isSelected} onClick={onClick} />
      ))}
    </>
  );
};

export default function AgentOSInspector() {
  const [selectedSpan, setSelectedSpan] = useState<any>(MOCK_TRACE.spans[1]);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  return (
    <div className="flex h-full w-full bg-[#050505] text-[#E0E0E0] overflow-hidden">
      
      {/* Left Panel: Trace Tree */}
      <div className="w-[55%] flex flex-col border-r border-[#222]">
        
        {/* Toolbar */}
        <div className="h-[52px] border-b border-[#222] bg-[#0A0A0A] flex items-center px-4 justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TRACE ID</span>
            <span className="text-xs text-[#00D9FF] font-mono">{MOCK_TRACE.id}</span>
          </div>
          
          <div className="flex items-center gap-1 bg-[#111] rounded border border-[#333] p-0.5">
            <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#222] transition-colors"><SkipBack size={14} /></button>
            <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#222] transition-colors"><Play size={14} /></button>
            <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#222] transition-colors"><Pause size={14} /></button>
            <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#222] transition-colors"><SkipForward size={14} /></button>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'tree' ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <TreeStructure size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="px-4 py-2 border-b border-[#222] flex items-center gap-6 bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Duration</span>
            <span className="text-xs font-mono">{MOCK_TRACE.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Total Cost</span>
            <span className="text-xs font-mono">{MOCK_TRACE.cost}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Status</span>
            <span className="text-xs font-mono text-green-400">{MOCK_TRACE.status}</span>
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto bg-[#050505]">
          <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider py-1.5 px-2 border-b border-[#222] bg-[#0A0A0A]">
            <div className="w-6"></div>
            <div className="flex-1">Span</div>
            <div className="w-24 text-right">Latency</div>
            <div className="w-24 text-right">Cost</div>
          </div>
          <div className="py-2">
            {MOCK_TRACE.spans.map(span => (
              <SpanRow 
                key={span.id} 
                span={span} 
                isSelected={selectedSpan?.id === span.id}
                onClick={setSelectedSpan}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Inspector Details */}
      <div className="flex-1 flex flex-col bg-[#0A0A0A]">
        {selectedSpan ? (
          <>
            <div className="p-4 border-b border-[#222] flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-white mb-1">{selectedSpan.name}</h2>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500">
                  <span className="px-1.5 py-0.5 bg-[#111] rounded">{selectedSpan.kind}</span>
                  {selectedSpan.status === 'WARN' && <span className="text-yellow-500 flex items-center gap-1"><WarningCircle size={12}/> Warning</span>}
                  {selectedSpan.status === 'OK' && <span className="text-green-500 flex items-center gap-1"><CheckCircle size={12}/> OK</span>}
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 rounded text-xs font-bold transition-colors border border-[#00D9FF]/20">
                <Bug size={14} weight="duotone" />
                Debug in Sandbox
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#222] rounded p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Performance</span>
                  <div className="flex justify-between items-end">
                    <span className="text-lg text-white font-mono">{selectedSpan.latency}</span>
                    <span className="text-[10px] text-gray-500">p95: 1800ms</span>
                  </div>
                </div>
                <div className="bg-[#111] border border-[#222] rounded p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Economics</span>
                  <div className="flex justify-between items-end">
                    <span className="text-lg text-[#00D9FF] font-mono">{selectedSpan.cost}</span>
                    <span className="text-[10px] text-gray-500">budget: $0.05</span>
                  </div>
                </div>
              </div>

              {selectedSpan.model && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111] border border-[#222] rounded p-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Model</span>
                    <div className="text-sm text-white font-mono flex items-center gap-2">
                      <Robot size={16} className="text-purple-400"/>
                      {selectedSpan.model}
                    </div>
                  </div>
                  <div className="bg-[#111] border border-[#222] rounded p-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Tokens (In / Out)</span>
                    <div className="text-sm text-white font-mono">
                      <span className="text-blue-400">{selectedSpan.tokensIn}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-green-400">{selectedSpan.tokensOut}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payload Details */}
              <div className="flex flex-col flex-1 border border-[#222] rounded bg-[#111] overflow-hidden min-h-[200px]">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-[#222]">
                  <TerminalWindow size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-300">Payload Inspector</span>
                </div>
                <div className="p-3 overflow-y-auto">
                  <pre className="text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
{`{
  "request": {
    "role": "system",
    "content": "You are Lead Triage agent... [REDACTED]"
  },
  "context": {
    "docs_retrieved": 4,
    "cache_status": "${selectedSpan.detail || 'N/A'}"
  },
  "response": {
    "classification": "A",
    "confidence": 0.92
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Select a span to view details
          </div>
        )}
      </div>

    </div>
  );
}
