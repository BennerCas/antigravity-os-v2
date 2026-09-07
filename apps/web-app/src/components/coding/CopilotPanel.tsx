import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Lightning, X, PaperPlaneTilt, Robot, User,
  SpinnerGap, Copy, Check, ArrowsOutCardinal
} from '@phosphor-icons/react';
import { API_URL } from '../../lib/api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  model?: string;
}

export interface CopilotPanelProps {
  /** Código actualmente visible en el editor */
  editorCode?: string;
  /** Lenguaje detectado en el editor */
  language?: string;
  /** Nombre del archivo activo */
  filename?: string;
  /** Control externo: abierto/cerrado */
  open: boolean;
  /** Callback para cerrar desde el botón del sidebar */
  onClose: () => void;
}

// ─── Badge de modo ────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  completar: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  explicar:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  corregir:  'bg-red-500/20 text-red-300 border-red-500/30',
  revisar:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
  auto:      'bg-[#2A2A2A] text-[#8A8A8A] border-[#3A3A3A]',
};

function ModeBadge({ mode }: { mode: string }) {
  const cls = MODE_COLORS[mode] ?? MODE_COLORS.auto;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cls}`}>
      {mode}
    </span>
  );
}

// ─── Bloque de código con copiar ──────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative mt-1 rounded-md bg-[#0a0a0a] border border-[#2A2A2A] overflow-hidden">
      {lang && (
        <div className="px-3 py-1 text-[10px] text-[#8A8A8A] font-mono border-b border-[#2A2A2A] bg-[#0d0d0d] uppercase">
          {lang}
        </div>
      )}
      <pre className="p-3 text-xs font-mono text-[#d0d0d0] overflow-x-auto whitespace-pre-wrap break-words">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-1.5 right-1.5 p-1 rounded text-[#8A8A8A] hover:text-white hover:bg-[#2A2A2A] transition-colors"
        title="Copiar"
      >
        {copied
          ? <Check size={12} weight="bold" className="text-green-400" />
          : <Copy size={12} />
        }
      </button>
    </div>
  );
}

// ─── Renderizador de respuesta ────────────────────────────────────────────────

function AssistantMessage({ content }: { content: string }) {
  const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);
  return (
    <div className="text-sm text-[#d0d0d0] leading-relaxed space-y-1">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const lang = lines[0].replace('```', '').trim() || undefined;
          const code = lines.slice(1).join('\n').replace(/```$/, '').trimEnd();
          return <CodeBlock key={i} code={code} lang={lang} />;
        }
        if (!part.trim()) return null;
        return <p key={i} className="whitespace-pre-wrap">{part}</p>;
      })}
    </div>
  );
}

// ─── Panel principal (draggable) ──────────────────────────────────────────────

export default function CopilotPanel({
  editorCode = '',
  language = 'auto',
  filename,
  open,
  onClose,
}: CopilotPanelProps) {
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [includeCtx, setIncludeCtx] = useState(false);

  // Posición inicial: centro-derecha de la pantalla
  const [pos, setPos] = useState({ x: window.innerWidth - 460, y: 80 });
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus al abrir
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open]);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: dragStart.current.px + ev.clientX - dragStart.current.mx,
        y: dragStart.current.py + ev.clientY - dragStart.current.my,
      });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]);

  // ── Envío de mensajes ──────────────────────────────────────────────────────

  const handleSend = async () => {
    const code = input.trim();
    if (!code || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: code }]);
    setInput('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = { code, language };
      if (filename) body.filename = filename;
      if (includeCtx && editorCode) body.context = editorCode.slice(0, 3000);

      const res = await fetch(`${API_URL}/api/v1/coding/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        mode: data.mode_detected,
        model: data.model_used,
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        width: 420,
        maxHeight: 'calc(100vh - 100px)',
        // ── Sin transparencia: fondo sólido ──
        background: '#111111',
        border: '1px solid #2A2A2A',
        borderRadius: 12,
        boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header (área de drag) ─────────────────────────────────────────── */}
      <div
        onMouseDown={onDragStart}
        style={{ cursor: 'grab', userSelect: 'none' }}
        className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] bg-[#181818] shrink-0"
      >
        <div className="flex items-center gap-2">
          <ArrowsOutCardinal size={13} className="text-[#4A4A4A]" />
          <Robot size={17} weight="fill" className="text-white" />
          <span className="text-sm font-semibold text-white tracking-wide">APEX-COPILOT</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30 uppercase">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle contexto */}
          <label className="flex items-center gap-1.5 cursor-pointer" title="Incluir código del editor como contexto">
            <span className="text-[10px] text-[#8A8A8A] uppercase font-semibold">Ctx</span>
            <div
              onClick={() => setIncludeCtx(v => !v)}
              className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${includeCtx ? 'bg-white' : 'bg-[#2A2A2A]'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all ${includeCtx ? 'left-4' : 'left-0.5'}`} />
            </div>
          </label>
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-[#8A8A8A] hover:text-white transition-colors"
          >
            Limpiar
          </button>
          <button onClick={onClose} className="text-[#8A8A8A] hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Barra de contexto */}
      {(filename || language !== 'auto') && (
        <div className="px-4 py-1.5 bg-[#141414] border-b border-[#222222] flex items-center gap-3 shrink-0">
          {filename && (
            <span className="text-[10px] text-[#6A6A6A] font-mono truncate">📄 {filename}</span>
          )}
          {language !== 'auto' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#2A2A2A] text-[#8A8A8A] font-mono uppercase">
              {language}
            </span>
          )}
          {includeCtx && editorCode && (
            <span className="text-[10px] text-green-400 font-mono">
              ✓ ctx {Math.min(editorCode.length, 3000)} chars
            </span>
          )}
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[380px]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <Lightning size={36} weight="duotone" className="text-[#3A3A3A]" />
            <p className="text-sm text-[#5A5A5A]">
              Pega código, pregunta técnica<br />o un error para que APEX lo resuelva.
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2 w-full max-w-[280px]">
              {[
                ['Completar', 'Pega código con TODO o pass'],
                ['Explicar',  '¿Qué hace esta función?'],
                ['Corregir',  'Pega el traceback del error'],
                ['Revisar',   'Refactoriza esto con SOLID'],
              ].map(([label, hint]) => (
                <button
                  key={label}
                  onClick={() => setInput(hint)}
                  className="text-left p-2 rounded-md border border-[#2A2A2A] hover:border-[#3A3A3A] bg-[#0d0d0d] hover:bg-[#161616] transition-all"
                >
                  <div className="text-[11px] font-semibold text-[#8A8A8A]">{label}</div>
                  <div className="text-[10px] text-[#3A3A3A] mt-0.5">{hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs ${
              msg.role === 'user' ? 'bg-white text-black' : 'bg-[#2A2A2A] text-white'
            }`}>
              {msg.role === 'user'
                ? <User size={12} weight="bold" />
                : <Robot size={12} weight="fill" />
              }
            </div>
            <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
              msg.role === 'user'
                ? 'bg-white text-black text-sm rounded-tr-none'
                : 'bg-[#1a1a1a] border border-[#2A2A2A] rounded-tl-none'
            }`}>
              {msg.role === 'user'
                ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                : <AssistantMessage content={msg.content} />
              }
              {msg.role === 'assistant' && (msg.mode || msg.model) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#222222]">
                  {msg.mode && <ModeBadge mode={msg.mode} />}
                  {msg.model && (
                    <span className="text-[10px] text-[#4A4A4A] font-mono truncate">{msg.model}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0">
              <Robot size={12} weight="fill" className="text-white" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-2">
              <SpinnerGap size={13} className="text-[#8A8A8A] animate-spin" />
              <span className="text-xs text-[#8A8A8A]">APEX procesando…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#222222] p-3 bg-[#111111]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={3}
            placeholder="Código, pregunta o error… (Enter envía, Shift+Enter = nueva línea)"
            className="flex-1 bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg p-3 text-sm text-white font-mono placeholder:text-[#4A4A4A] resize-none outline-none focus:border-[#3A3A3A] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-white text-black hover:bg-[#d0d0d0] disabled:opacity-30 transition-colors shrink-0 self-end"
            title="Enviar"
          >
            <PaperPlaneTilt size={15} weight="fill" />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-[#333333] text-right font-mono">
          Free.AI → Ollama fallback · {messages.length} msgs
        </p>
      </div>
    </div>
  );
}
