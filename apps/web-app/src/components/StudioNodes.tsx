import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Brain, Lightning, Wrench, GitFork, User, ArrowCircleDown } from '@phosphor-icons/react';

/* ─── Paleta por kind ─────────────────────────────────────────── */
export const KIND_META: Record<string, { label: string; color: string; Icon: React.FC<any> }> = {
  agent:   { label: 'AGENT',   color: '#3b82f6', Icon: Brain },
  trigger: { label: 'TRIGGER', color: '#10b981', Icon: Lightning },
  tool:    { label: 'TOOL',    color: '#f59e0b', Icon: Wrench },
  router:  { label: 'ROUTER',  color: '#a855f7', Icon: GitFork },
  human:   { label: 'HUMAN',   color: '#ec4899', Icon: User },
  sink:    { label: 'SINK',    color: '#64748b', Icon: ArrowCircleDown },
};

/* ─── Nodo base compartido ───────────────────────────────────── */
const StudioNode: React.FC<NodeProps> = ({ data, selected }) => {
  const kind = (data.kind as string) || 'agent';
  const meta = KIND_META[kind] || KIND_META.agent;
  const { Icon, color, label } = meta;

  const tools: string[]    = (data.tools as string[]) || [];
  const inputPort: string  = (data.inputPort  as string) || '';
  const outputPort: string = (data.outputPort as string) || '';
  const cost: string       = (data.cost as string) || '';
  const status: string     = (data.status as string) || '';

  const statusColor: Record<string,string> = { PASS:'#10b981', FAIL:'#ef4444', WARN:'#f59e0b', '':'#475569' };

  return (
    <div
      style={{
        background: '#0d1117',
        border: `2px solid ${selected ? color : color + '66'}`,
        borderRadius: 12,
        minWidth: 200,
        maxWidth: 240,
        boxShadow: selected ? `0 0 20px ${color}66` : `0 4px 16px ${color}22`,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        fontFamily: 'inherit',
      }}
    >
      {/* Entrada */}
      {kind !== 'trigger' && (
        <Handle type="target" position={Position.Left}
          style={{ background: color, width: 10, height: 10, border: '2px solid #0d1117', left: -6 }} />
      )}

      {/* Header — tipo + icono */}
      <div style={{ background: color + '18', borderRadius: '10px 10px 0 0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={13} weight="bold" style={{ color }} />
        <span style={{ color, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' }}>{label}</span>
        {status && (
          <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: statusColor[status] || '#475569', boxShadow: `0 0 6px ${statusColor[status] || '#475569'}` }} />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px 10px' }}>
        {/* Nombre */}
        <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 12, marginBottom: 4, lineHeight: 1.3 }}>
          {data.label as any}
        </div>

        {/* Descripción */}
        {Boolean(data.description) && (
          <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: 1.4, marginBottom: 5,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {data.description as string}
          </div>
        )}

        {/* I/O */}
        {(inputPort || outputPort) && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 5, flexWrap: 'wrap' }}>
            {inputPort && (
              <span style={{ fontSize: 9, fontFamily: 'monospace', background: '#1e293b', color: '#64748b', padding: '1px 5px', borderRadius: 4 }}>
                IN: {inputPort}
              </span>
            )}
            {outputPort && (
              <span style={{ fontSize: 9, fontFamily: 'monospace', background: '#1e293b', color: color + 'cc', padding: '1px 5px', borderRadius: 4 }}>
                OUT: {outputPort}
              </span>
            )}
          </div>
        )}

        {/* Tools */}
        {tools.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {tools.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 9, background: color + '18', color: color + 'cc', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Costo */}
        {cost && (
          <div style={{ marginTop: 5, fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>
            {cost}
          </div>
        )}
      </div>

      {/* Salida */}
      {kind !== 'sink' && (
        <Handle type="source" position={Position.Right}
          style={{ background: color, width: 10, height: 10, border: '2px solid #0d1117', right: -6 }} />
      )}
    </div>
  );
};

/* Exportar un nodeTypes object para ReactFlow */
export const studioNodeTypes = {
  agent:   StudioNode,
  trigger: StudioNode,
  tool:    StudioNode,
  router:  StudioNode,
  human:   StudioNode,
  sink:    StudioNode,
};
