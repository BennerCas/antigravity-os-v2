import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Trash } from '@phosphor-icons/react';

interface CodingTerminalProps {
  wsUrl: string;
  onStatusChange: (status: 'idle' | 'running' | 'done' | 'error') => void;
  triggerRun: number;
}

export default function CodingTerminal({ wsUrl, onStatusChange, triggerRun }: CodingTerminalProps) {
  const [logs, setLogs] = useState<{type: 'out'|'err', text: string}[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (triggerRun > 0) {
      handleRun();
    }
  }, [triggerRun]);

  const handleRun = () => {
    setStatus('running');
    onStatusChange('running');
    setLogs([{ type: 'out', text: '> Initiating execution...' }]);

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ command: 'run' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.output) {
            setLogs(prev => [...prev, { type: 'out', text: data.output }]);
          } else if (data.error) {
            setLogs(prev => [...prev, { type: 'err', text: data.error }]);
            setStatus('error');
            onStatusChange('error');
          } else if (data.status === 'completed') {
            setStatus('done');
            onStatusChange('done');
          }
        } catch (e) {
          setLogs(prev => [...prev, { type: 'out', text: event.data }]);
        }
      };

      ws.onerror = () => {
        setLogs(prev => [...prev, { type: 'err', text: 'WebSocket connection error' }]);
        setStatus('error');
        onStatusChange('error');
      };

      ws.onclose = () => {
        if (status === 'running') {
          setStatus('done');
          onStatusChange('done');
        }
      };
    } catch (e) {
      setLogs(prev => [...prev, { type: 'err', text: 'Failed to establish connection' }]);
      setStatus('error');
      onStatusChange('error');
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'idle': return 'bg-[#8A8A8A]';
      case 'running': return 'bg-[#FFD700] animate-pulse';
      case 'done': return 'bg-[#7CFC00]';
      case 'error': return 'bg-[#FF6B6B]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2A2A2A] bg-[#151515]">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-[#8A8A8A]" />
          <span className="text-xs font-semibold text-white tracking-wide">Output Terminal</span>
          <div className={`w-2 h-2 rounded-full ml-2 ${getStatusColor()}`} />
        </div>
        <button 
          onClick={() => { setLogs([]); setStatus('idle'); onStatusChange('idle'); }}
          className="text-[#8A8A8A] hover:text-white transition-colors"
        >
          <Trash size={14} />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed">
        {logs.map((log, i) => (
          <div key={i} className={`whitespace-pre-wrap ${log.type === 'err' ? 'text-[#FF6B6B]' : 'text-[#7CFC00]'}`}>
            {log.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
