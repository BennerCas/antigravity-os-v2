import { useState, useRef, useEffect } from 'react';
import {
  Lightning, X, PaperPlaneTilt, Robot, User,
  SpinnerGap, Copy, Check
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
  editorCode?: string;
  language?: string;
  filename?: string;
  open: boolean;
  onClose: () => void;
}

// ─── Badge de modo ────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  completar: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  explicar:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  corregir:  'bg-red-500/20 text-red-300 border-red-500/30',
  revisar:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
  auto:      'bg-[#333333] text-[#999999] border-[#444444]',
};

function ModeBadge({ mode }: { mode: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${MODE_COLORS[mode] ?? MODE_COLORS.auto}`}>
      {mode}
    </span>
  );
}

// ─── Bloque de código ─────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative mt-1 rounded-md bg-[#1a1a1a] border border-[#363636] overflow-hidden">
      {lang && (
        <div className="px-3 py-1 text-[10px] text-[#888888] font-mono border-b border-[#363636] bg-[#1e1e1e] uppercase">
          {lang}
        </div>
      )}
      <pre className="p-3 text-xs font-mono text-[#d4d4d4] overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-1.5 right-1.5 p-1 rounded text-[#666666] hover:text-white hover:bg-[#363636] transition-colors"
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
    <div className="text-sm text-[#cccccc] leading-relaxed space-y-1.5">
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

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function CopilotPanel({
  editorCode = '',
  language = 'auto',
  filename,
  open,
  onClose,
}: CopilotPanelProps) {
  const [input, setInput]             = useState('');
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState(false);
  const [includeCtx, setIncludeCtx]   = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open]);

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
    /* ── Panel fijo derecho ──────────────────────────────────────────────── */
    <div className="
      w-[320px] shrink-0
      flex flex-col
      border-l border-[#2e2e2e]
      bg-[#1c1c1c]
      overflow-hidden
    ">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] bg-[#202020] shrink-0">
        <div className="flex items-center gap-2">
          <Robot size={16} weight="fill" className="text-white" />
          <span className="text-sm font-semibold text-white tracking-wide">APEX-COPILOT</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 uppercase tracking-wider">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle contexto */}
          <label className="flex items-center gap-1.5 cursor-pointer" title="Incluir código del editor como contexto">
            <span className="text-[10px] text-[#777777] uppercase font-semibold">Ctx</span>
            <div
              onClick={() => setIncludeCtx(v => !v)}
              className={`w-7 h-3.5 rounded-full relative transition-colors cursor-pointer ${includeCtx ? 'bg-white' : 'bg-[#383838]'}`}
            >
              <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-black transition-all ${includeCtx ? 'left-3.5' : 'left-0.5'}`} />
            </div>
          </label>
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-[#666666] hover:text-[#aaaaaa] transition-colors"
          >
            Limpiar
          </button>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Barra de contexto activo */}
      {(filename || includeCtx) && (
        <div className="px-4 py-1.5 bg-[#1e1e1e] border-b border-[#2a2a2a] flex items-center gap-2 shrink-0 flex-wrap">
          {filename && (
            <span className="text-[10px] text-[#666666] font-mono truncate">📄 {filename}</span>
          )}
          {language !== 'auto' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#777777] font-mono uppercase">
              {language}
            </span>
          )}
          {includeCtx && editorCode && (
            <span className="text-[10px] text-green-500/80 font-mono">
              ✓ {Math.min(editorCode.length, 3000)} chars
            </span>
          )}
        </div>
      )}

      {/* ── Mensajes ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Estado vacío */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <Lightning size={32} weight="duotone" className="text-[#444444]" />
            <p className="text-xs text-[#666666] leading-relaxed">
              Pega código, pregunta técnica<br />o un error para que APEX lo resuelva.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {[
                { label: 'Completar', hint: 'Pega código con TODO o pass' },
                { label: 'Explicar',  hint: '¿Qué hace esta función?' },
                { label: 'Corregir',  hint: 'Pega el traceback del error' },
                { label: 'Revisar',   hint: 'Refactoriza esto con SOLID' },
              ].map(({ label, hint }) => (
                <button
                  key={label}
                  onClick={() => setInput(hint)}
                  className="text-left px-3 py-2 rounded-md border border-[#2e2e2e] hover:border-[#3a3a3a] bg-[#222222] hover:bg-[#272727] transition-all"
                >
                  <span className="text-[11px] font-semibold text-[#888888]">{label} </span>
                  <span className="text-[10px] text-[#4a4a4a]">— {hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Historial */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${
              msg.role === 'user' ? 'bg-white' : 'bg-[#2e2e2e]'
            }`}>
              {msg.role === 'user'
                ? <User size={11} weight="bold" className="text-black" />
                : <Robot size={11} weight="fill" className="text-[#aaaaaa]" />
              }
            </div>

            {/* Burbuja */}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-white text-black rounded-tr-none'
                : 'bg-[#252525] border border-[#333333] rounded-tl-none'
            }`}>
              {msg.role === 'user'
                ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                : <AssistantMessage content={msg.content} />
              }
              {msg.role === 'assistant' && (msg.mode || msg.model) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#333333]">
                  {msg.mode && <ModeBadge mode={msg.mode} />}
                  {msg.model && (
                    <span className="text-[9px] text-[#4a4a4a] font-mono truncate">{msg.model}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loader */}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#2e2e2e] flex items-center justify-center shrink-0">
              <Robot size={11} weight="fill" className="text-[#aaaaaa]" />
            </div>
            <div className="bg-[#252525] border border-[#333333] rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-2">
              <SpinnerGap size={12} className="text-[#666666] animate-spin" />
              <span className="text-xs text-[#666666]">APEX procesando…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#2e2e2e] p-3 bg-[#1e1e1e]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={3}
            placeholder="Código, pregunta o error…&#10;Enter envía · Shift+Enter = nueva línea"
            className="
              flex-1 bg-[#252525] border border-[#363636] rounded-lg
              p-2.5 text-sm text-[#dddddd] font-mono
              placeholder:text-[#484848] resize-none outline-none
              focus:border-[#484848] transition-colors leading-relaxed
            "
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-white text-black hover:bg-[#e0e0e0] disabled:opacity-25 transition-colors shrink-0 self-end"
            title="Enviar (Enter)"
          >
            <PaperPlaneTilt size={14} weight="fill" />
          </button>
        </div>
        <p className="mt-1.5 text-[9px] text-[#3a3a3a] text-right font-mono tracking-wide">
          Free.AI → Ollama · {messages.length} msgs
        </p>
      </div>
    </div>
  );
}
