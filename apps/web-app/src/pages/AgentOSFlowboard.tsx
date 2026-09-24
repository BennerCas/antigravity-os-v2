import { useState, useCallback } from 'react';
import { Play, ShieldCheck, CheckCircle, Warning, Database, FileCode, HardDrives, HandPointing, ArrowsSplit, GitMerge, ListDashes } from '@phosphor-icons/react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'trigger_1', type: 'custom', position: { x: 50, y: 150 }, data: { label: 'Webhook Trigger', kind: 'trigger', status: 'ready' } },
  { id: 'agent_1', type: 'custom', position: { x: 300, y: 100 }, data: { label: 'Lead Triage', kind: 'agent', status: 'ready' } },
  { id: 'router_1', type: 'custom', position: { x: 550, y: 150 }, data: { label: 'Router (CEL)', kind: 'router', status: 'warning' } },
  { id: 'tool_1', type: 'custom', position: { x: 800, y: 50 }, data: { label: 'CRM Enrich', kind: 'tool', status: 'ready' } },
  { id: 'sink_1', type: 'custom', position: { x: 800, y: 250 }, data: { label: 'Email Send', kind: 'sink', status: 'ready' } },
];

const initialEdges = [
  { id: 'e1-2', source: 'trigger_1', target: 'agent_1', animated: true },
  { id: 'e2-3', source: 'agent_1', target: 'router_1' },
  { id: 'e3-4', source: 'router_1', target: 'tool_1', label: 'class=="A"' },
  { id: 'e3-5', source: 'router_1', target: 'sink_1', label: 'default' },
];

const CustomNode = ({ data }: any) => {
  const getIcon = (kind: string) => {
    switch (kind) {
      case 'trigger': return <ListDashes size={16} />;
      case 'agent': return <FileCode size={16} />;
      case 'router': return <ArrowsSplit size={16} />;
      case 'join': return <GitMerge size={16} />;
      case 'tool': return <Database size={16} />;
      case 'human': return <HandPointing size={16} />;
      case 'sink': return <HardDrives size={16} />;
      default: return <FileCode size={16} />;
    }
  };

  const statusColor = data.status === 'ready' ? 'text-[var(--theme-border)]' : 'text-yellow-400';
  const dotColor = data.status === 'ready' ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="bg-[#111] border border-[#333] rounded p-3 shadow-lg min-w-[150px]">
      <div className="flex items-center gap-2 mb-2 border-b border-[#222] pb-1">
        <span className={statusColor}>{getIcon(data.kind)}</span>
        <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">{data.kind}</span>
        <span className={`ml-auto text-[8px] ${dotColor}`}>●</span>
      </div>
      <div className="text-xs text-[var(--text-primary)]">{data.label}</div>
    </div>
  );
};

const nodeTypes: NodeTypes = { custom: CustomNode };

const DEPLOYMENT_GATES = [
  { id: 1, name: 'BUILD', desc: 'Compiles SystemNode bundle, pins models' },
  { id: 2, name: 'STATIC ANALYSIS', desc: 'Type-check ports, secrets, cost' },
  { id: 3, name: 'EVAL GATE', desc: 'Runs eval suite baseline vs candidate' },
  { id: 4, name: 'SECURITY SCAN', desc: 'OWASP LLM Top 10 + allowlist check' },
  { id: 5, name: 'SHADOW', desc: 'Parallel execution without side effects' },
  { id: 6, name: 'CANARY', desc: '5% → 25% → 50% → 100% rollout' },
  { id: 7, name: 'PROMOTE', desc: 'Marks active revision' }
];

export default function AgentOSFlowboard() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [deployStep, setDeployStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleDeploy = () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setDeployStep(1);
    
    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep++;
      setDeployStep(currentStep);
      if (currentStep > 7) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDeploying(false);
          setDeployStep(0);
        }, 2000);
      }
    }, 1500);
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar: CI/CD Deployment Gates */}
      <div className="w-[320px] bg-[var(--surface-canvas)] border-r border-[#222] flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-[#222]">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--theme-border)]" />
            Deployment Gates
          </h2>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-wide">
            CI/CD Pipeline to Production
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {DEPLOYMENT_GATES.map((gate) => {
            const isCompleted = deployStep > gate.id;
            const isCurrent = deployStep === gate.id;
            
            return (
              <div 
                key={gate.id} 
                className={`flex gap-3 p-3 rounded border ${
                  isCurrent ? 'bg-[#0f1f2a] border-[#00D9FF]' : 
                  isCompleted ? 'bg-[#0a1a0a] border-[#1a4a1a]' : 
                  'bg-[#111] border-[#222]'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? <CheckCircle size={16} weight="fill" className="text-[var(--theme-border)]" /> : 
                   isCurrent ? <Play size={16} className="text-[var(--theme-border)] animate-pulse" /> :
                   <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[9px] text-[var(--text-secondary)]">{gate.id}</div>}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isCurrent ? 'text-[var(--text-primary)]' : isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    [{gate.id}] {gate.name}
                  </div>
                  <div className={`text-[10px] mt-1 ${isCurrent ? 'text-[var(--theme-border)]' : 'text-gray-600'}`}>
                    {gate.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#222]">
          <button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`w-full py-2.5 rounded text-xs font-bold flex justify-center items-center gap-2 transition-colors ${
              isDeploying ? 'bg-[#333] text-[var(--text-secondary)] cursor-not-allowed' : 'bg-[var(--theme-border)] text-black hover:bg-[#00b0d0]'
            }`}
          >
            <Play size={14} weight="fill" />
            {isDeploying ? 'DEPLOYING...' : 'RUN PIPELINE'}
          </button>
        </div>
      </div>

      {/* Main Area: React Flow Canvas */}
      <div className="flex-1 relative bg-[var(--surface-canvas)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background color="#333" gap={16} />
          <Controls className="!bg-[#111] !border-[#333] !fill-white" />
          <MiniMap 
            nodeColor={(n: any) => n.data.status === 'ready' ? '#4ade80' : '#facc15'} 
            maskColor="rgba(0, 0, 0, 0.7)" 
            className="!bg-[#111]" 
          />
        </ReactFlow>

        {/* Top bar info */}
        <div className="absolute top-4 left-4 z-10 bg-[#111]/90 backdrop-blur border border-[#333] rounded px-4 py-2 flex gap-6 shadow-xl">
          <div className="flex flex-col">
            <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold">Project</span>
            <span className="text-xs text-[var(--text-primary)]">Lead Qualification V2</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold">Revision</span>
            <span className="text-xs text-[var(--theme-border)] font-mono">v1.4.0 (Draft)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold">Diagnostics</span>
            <span className="text-xs text-yellow-400 flex items-center gap-1"><Warning size={12}/> 1 warning</span>
          </div>
        </div>
      </div>
    </div>
  );
}

