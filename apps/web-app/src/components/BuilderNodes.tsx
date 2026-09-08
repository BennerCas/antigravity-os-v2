import React, { useState } from 'react';
import { Handle, Position, useReactFlow, NodeResizer, NodeProps, Node } from '@xyflow/react';
import { Copy, SpeakerHigh, Trash, MagicWand, Spinner } from '@phosphor-icons/react';
import { getStroke } from 'perfect-freehand';
import type { BuilderNodeData, DrawingNodeData } from '../types/builder';
import { API_URL } from '../lib/api';

type BuilderNodeProps = NodeProps<Node<BuilderNodeData>>;

/**
 * Prevent the ReactFlow canvas from capturing scroll (zoom) events when the
 * user is scrolling inside a textarea that still has content to scroll.
 * If the textarea has reached its top/bottom limit, we let the event bubble
 * so ReactFlow can zoom normally.
 */
const onWheelTextarea = (e: React.WheelEvent<HTMLTextAreaElement>) => {
  const el = e.currentTarget;
  const scrollingDown = e.deltaY > 0;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
  const atTop = el.scrollTop <= 0;

  // Only block if the textarea can absorb this scroll direction
  if ((scrollingDown && !atBottom) || (!scrollingDown && !atTop)) {
    e.stopPropagation();
  }
};

const handleCopy = (text: string) => {
  if (text) {
    navigator.clipboard.writeText(text).catch(err => console.error("Error al copiar: ", err));
  }
};

const handleTTS = (text: string) => {
  if (text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};

const UniversalHandles = () => (
  <>
    <Handle type="target" position={Position.Top} id="tt" style={{ left: '30%' }} />
    <Handle type="source" position={Position.Top} id="st" style={{ left: '70%' }} />
    <Handle type="target" position={Position.Right} id="tr" style={{ top: '30%' }} />
    <Handle type="source" position={Position.Right} id="sr" style={{ top: '70%' }} />
    <Handle type="target" position={Position.Bottom} id="tb" style={{ left: '30%' }} />
    <Handle type="source" position={Position.Bottom} id="sb" style={{ left: '70%' }} />
    <Handle type="target" position={Position.Left} id="tl" style={{ top: '30%' }} />
    <Handle type="source" position={Position.Left} id="sl" style={{ top: '70%' }} />
  </>
);


const CardHeaderActions = ({ id, data, customColor }: { id: string; data: BuilderNodeData; customColor?: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const text = data.content || data.prompt || data.note || "";
  const selectedForPdf = data.selectedForPdf;

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, selectedForPdf: checked } } : n));
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  const handleAutoSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch(`${API_URL}/builder/autocomplete_node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title || '',
          content: text || '',
          role: data.role || '',
          framework: data.framework || 'auto',
          variables: data.variables || ''
        })
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.data) {
          const result = responseData.data;
          setNodes((nds) => nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  content: result.content || n.data.content,
                  role: result.role || n.data.role,
                  variables: result.variables || n.data.variables,
                  framework: result.framework || n.data.framework,
                  llm_model: result.llm_model || n.data.llm_model,
                  temperature: result.temperature ? parseFloat(result.temperature) : n.data.temperature,
                  output_schema: result.output_schema ? JSON.stringify(result.output_schema, null, 2) : n.data.output_schema
                }
              };
            }
            return n;
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="absolute top-2 right-2 nodrag flex items-center gap-1.5 z-10" style={customColor ? { color: customColor } : {}}>
      <button onClick={handleAutoSuggest} disabled={isSuggesting} className={`p-1 hover:bg-black/10 rounded transition-colors ${!customColor ? "theme-node-btn" : ""} ${isSuggesting ? "opacity-50" : ""}`} title="Mejorar Prompt con IA">
        {isSuggesting ? <Spinner size={14} className="animate-spin" /> : <MagicWand size={14} className="text-pink-400" />}
      </button>
      <button onClick={() => handleCopy(text)} className={`p-1 hover:bg-black/10 rounded transition-colors ${!customColor ? "theme-node-btn" : ""}`} title="Copiar">
        <Copy size={14} />
      </button>
      <button onClick={() => handleTTS(text)} className={`p-1 hover:bg-black/10 rounded transition-colors ${!customColor ? "theme-node-btn" : ""}`} title="TTS">
        <SpeakerHigh size={14} />
      </button>
      <button onClick={handleDelete} className={`p-1 hover:bg-black/10 rounded transition-colors ${!customColor ? "theme-node-btn-danger" : ""}`} title="Eliminar">
        <Trash size={14} />
      </button>
      <input 
        type="checkbox" 
        className="cursor-pointer w-4 h-4 ml-1 accent-blue-500"
        checked={!!selectedForPdf}
        onChange={handleToggle}
        title="Seleccionar para PDF/Acciones"
      />
    </div>
  );
};
export const MainPromptNode = ({ id, data, selected }: BuilderNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [textContent, setTextContent] = useState(String(data.content || data.prompt || ""));
  const isVariant = data.isVariant;
    
  return (
    <div className={`flex flex-col transition-colors duration-300 p-6 rounded-xl w-full h-full min-w-[360px] min-h-[640px] relative cyber-glass-node ${isVariant ? 'variant' : ''}`}>
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={360} minHeight={640} />
      <CardHeaderActions id={id} data={data} customColor={isVariant ? "var(--theme-bg)" : undefined} />
      <UniversalHandles />
      <h3 className="font-bold text-lg mb-4 pr-32 flex-shrink-0">{data.title || "Main Prompt"}</h3>
      <textarea onWheel={onWheelTextarea} 
        className="flex-grow w-full rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--theme-border)] whitespace-pre-wrap"
        style={{ scrollbarWidth: 'none' }}
        value={textContent}
        onChange={(e) => {
          setTextContent(e.target.value);
          updateNodeData(id, { content: e.target.value });
        }}
        placeholder="Escribe el prompt aquí..."
      />
    </div>
  );
};

export const ActionNode = ({ id, data, selected }: BuilderNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [textContent, setTextContent] = useState(String(data.content || ""));
  const isVariant = data.isVariant;

  return (
    <div className={`flex flex-col transition-colors duration-300 p-6 rounded-xl w-full h-full min-w-[360px] min-h-[640px] transform transition-transform hover:scale-105 relative cyber-glass-node ${isVariant ? 'variant' : ''}`}>
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={360} minHeight={640} />
      <CardHeaderActions id={id} data={data} customColor={isVariant ? "var(--theme-bg)" : undefined} />
      <UniversalHandles />
      <h3 className="font-bold text-lg mb-4 pr-32 flex-shrink-0">{String(data.title || data.actionType || "Action Node")}</h3>
      <textarea onWheel={onWheelTextarea} 
        className="flex-grow w-full rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--theme-border)] whitespace-pre-wrap"
        style={{ scrollbarWidth: 'none' }}
        value={textContent}
        onChange={(e) => {
          setTextContent(e.target.value);
          updateNodeData(id, { content: e.target.value });
        }}
        placeholder="Definir acción aquí..."
      />
    </div>
  );
};

export const LogicaNode = ({ id, data, selected }: BuilderNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [textContent, setTextContent] = useState(String(data.content || ""));
  const isVariant = data.isVariant;

  return (
    <div className={`flex flex-col transition-colors duration-300 p-6 rounded-xl w-full h-full min-w-[360px] min-h-[640px] transform transition-transform hover:scale-105 relative cyber-glass-node ${isVariant ? 'variant' : ''}`}>
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={360} minHeight={640} />
      <CardHeaderActions id={id} data={data} customColor={isVariant ? "var(--theme-bg)" : undefined} />
      <UniversalHandles />
      <h3 className="font-bold text-lg mb-4 pr-32 flex items-center gap-2 flex-shrink-0">🧠 Lógica del Prompt</h3>
      <textarea onWheel={onWheelTextarea} 
        className="flex-grow w-full rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap opacity-90"
        style={{ scrollbarWidth: 'none' }}
        value={textContent}
        onChange={(e) => {
          setTextContent(e.target.value);
          updateNodeData(id, { content: e.target.value });
        }}
        placeholder="Explicación o lógica..."
      />
    </div>
  );
};

export const TraducirNode = ({ id, data, selected }: BuilderNodeProps) => {
  const [lang, setLang] = useState('Inglés');
  const [content, setContent] = useState(data.content || "");

  return (
    <div className="transition-colors duration-300 p-5 rounded-xl w-full h-full min-w-[288px] min-h-[200px] relative cyber-glass-node">
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={360} minHeight={220} />
      <CardHeaderActions id={id} data={data} />
      <UniversalHandles />
      <h3 className="font-bold mb-4 pr-32">Traducir</h3>
      <select 
        value={lang} 
        onChange={(e) => setLang(e.target.value)}
        className="w-full rounded p-1.5 mb-2 text-sm outline-none"
      >
        <option value="Inglés" className="bg-black">Inglés</option>
        <option value="Español" className="bg-black">Español</option>
        <option value="Francés" className="bg-black">Francés</option>
        <option value="Alemán" className="bg-black">Alemán</option>
        <option value="Italiano" className="bg-black">Italiano</option>
      </select>
      <textarea onWheel={onWheelTextarea} 
        className="w-full rounded p-2 text-sm resize-none h-24 outline-none scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Texto a traducir..."
      />
    </div>
  );
};

export const EditarNode = ({ id, data, selected }: BuilderNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [content, setContent] = useState(data.content || "");

  return (
    <div className="transition-colors duration-300 p-5 rounded-xl w-full h-full min-w-[288px] min-h-[200px] relative cyber-glass-node">
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={360} minHeight={250} />
      <CardHeaderActions id={id} data={data} />
      <UniversalHandles />
      <h3 className="font-bold mb-4 pr-32">Editar</h3>
      <textarea onWheel={onWheelTextarea} 
        className="w-full rounded p-2 text-sm resize-none h-32 outline-none scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          updateNodeData(id, { content: e.target.value });
        }}
        placeholder="Edita el prompt aquí..."
      />
    </div>
  );
};

export const PostItNode = ({ id, data, selected }: BuilderNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [note, setNote] = useState(String(data.note || ''));
  const [color, setColor] = useState<string>(String(data.color || '#facc15'));

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r: isNaN(r) ? 255 : r, g: isNaN(g) ? 255 : g, b: isNaN(b) ? 255 : b };
  };
  const getContrast = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };
  const textColor = getContrast(color);
  
  return (
    <div className="p-4 pt-10 rounded-sm shadow-md w-full h-full min-w-[256px] min-h-[200px] border relative transition-colors" style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.2)', color: textColor }}>
      <NodeResizer color="#3b82f6" isVisible={!!selected} minWidth={256} minHeight={640} />
      <UniversalHandles />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-2 w-8 h-4 bg-black/10 rounded-full blur-[1px]"></div>
      
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10" style={{ color: textColor }}>
        <div className="relative w-5 h-5 rounded overflow-hidden border border-black/20 shadow-sm cursor-pointer" title="Color de la Nota">
          <input 
            type="color" 
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              updateNodeData(id, { color: e.target.value });
            }}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
          />
        </div>
        <label className="text-xs font-mono opacity-60">HEX</label>
      </div>

      <CardHeaderActions id={id} data={data} customColor={textColor} />

      <textarea onWheel={onWheelTextarea} 
        className="w-full h-32 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed scrollbar-none"
        placeholder="Escribe una nota..."
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          updateNodeData(id, { note: e.target.value });
        }}
        style={{ color: textColor, scrollbarWidth: 'none' }}
      />
    </div>
  );
};

function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

export const DrawingNode = ({ data }: NodeProps<Node<DrawingNodeData>>) => {
  const { points, color, size, type } = data;
  if (!points || points.length === 0) return null;

  if (type === 'line') {
    const first = points[0];
    const last = points[points.length - 1];
    return (
      <div className="drawing-node-wrapper" style={{ width: 1, height: 1, overflow: "visible" }}
      /* 
        SELLO DE SEGURIDAD (ANTI-REGRESION):
        No eliminar el style width: 1, height: 1, overflow: "visible". 
        ReactFlow requiere dimensiones base para no aplicar opacity: 0 al medir nodos personalizados.
      */>
        <svg width="1" height="1" style={{ overflow: "visible", position: "absolute", top: 0, left: 0 }}>
           <line x1={first[0]} y1={first[1]} x2={last[0]} y2={last[1]} stroke={color} strokeWidth={size} strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  const stroke = getStroke(points, { size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 });
  const pathData = getSvgPathFromStroke(stroke);

  return (
    <div className="drawing-node-wrapper" style={{ width: 1, height: 1, overflow: "visible" }}
      /* 
        SELLO DE SEGURIDAD (ANTI-REGRESION):
        No eliminar el style width: 1, height: 1, overflow: "visible". 
        ReactFlow requiere dimensiones base para no aplicar opacity: 0 al medir nodos personalizados.
      */>
      <svg width="1" height="1" style={{ overflow: "visible", position: "absolute", top: 0, left: 0 }}>
        <path d={pathData} fill={color} />
      </svg>
    </div>
  );
};

export const RulerNode = ({ id }: { id: string }) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  React.useEffect(() => {
    if (!isDragging) return;
    const onPointerMove = (e: PointerEvent) => {
      if (!nodeRef.current) return;
      const rect = nodeRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      setRotation(angle);
    };
    const onPointerUp = () => setIsDragging(false);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging]);

  return (
    <div ref={nodeRef} className="relative flex items-center justify-center"
      style={{
        width: 900,
        height: 40,
        background: 'transparent',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('deleteNode', { detail: { id } }));
        }}
        className="absolute -top-2 -left-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full cursor-pointer shadow hover:scale-110 flex items-center justify-center text-white text-xs z-10 transition-transform"
        title="Cerrar regla"
      >
        ✕
      </button>

      <div 
        className="absolute top-0 left-0 w-full h-2" 
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(59,130,246,0.8) 0px, rgba(59,130,246,0.8) 1px, transparent 1px, transparent 10px)'
        }}
      />
      <div
        onPointerDown={onPointerDown}
        className="absolute -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-grab border-2 border-white shadow hover:scale-110 flex items-center justify-center text-xs"
        style={{ touchAction: 'none' }}
      >
        O
      </div>
      <span className="text-blue-300 font-bold tracking-wider text-xs select-none">REGLA</span>
    </div>
  );
};
