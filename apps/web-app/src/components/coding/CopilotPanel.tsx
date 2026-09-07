import { useState, useRef, useEffect } from 'react';
import {
  Lightning, PaperPlaneTilt, Robot, User,
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
}

// ─── Badge de modo ────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  completar: 'bg-[#111111] text-blue-400 border-[#333333]',
  explicar:  'bg-[#111111] text-yellow-400 border-[#333333]',
  corregir:  'bg-[#111111] text-red-400 border-[#333333]',
  revisar:   'bg-[#111111] text-purple-400 border-[#333333]',
  auto:      'bg-[#000000] text-[#999999] border-[#333333]',
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
    <div className="relative mt-1 rounded-md bg-[#000000] border border-[#333333] overflow-hidden">
      {lang && (
        <div className="px-3 py-1 text-[10px] text-[#888888] font-mono border-b border-[#333333] bg-[#0a0a0a] uppercase">
          {lang}
        </div>
      )}
      <pre className="p-3 text-xs font-mono text-[#cccccc] overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-1.5 right-1.5 p-1 rounded text-[#888888] hover:text-[#d0d0d0] hover:bg-[#111111] transition-colors"
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
}: CopilotPanelProps) {
  const [input, setInput]             = useState('');
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loading, setLoading]         = useState(false);
  const [includeCtx, setIncludeCtx]   = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  return (
    /* ── Panel fijo derecho (Gris oscuro general) ────────────────────────── */
    <div className="
      w-[320px] shrink-0 flex flex-col
      border-l border-[#2e2e2e]
      bg-[#1e1e1e] 
      overflow-hidden
    ">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] bg-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2">
          <Robot size={16} weight="fill" className="text-[#d0d0d0]" />
          <span className="text-sm font-semibold text-[#d0d0d0] tracking-wide">APEX-COPILOT</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#000000] text-green-400 border border-[#333333] uppercase tracking-wider">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle contexto */}
          <label className="flex items-center gap-1.5 cursor-pointer" title="Incluir código del editor como contexto">
            <span className="text-[10px] text-[#888888] uppercase font-semibold">Ctx</span>
            <div
              onClick={() => setIncludeCtx(v => !v)}
              className={`w-7 h-3.5 rounded-full relative transition-colors cursor-pointer ${includeCtx ? 'bg-[#d0d0d0]' : 'bg-[#000000] border border-[#333333]'}`}
            >
              <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${includeCtx ? 'bg-black left-3.5' : 'bg-[#555555] left-0.5'}`} />
            </div>
          </label>
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-[#888888] hover:text-[#d0d0d0] transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Barra de contexto activo */}
      {(filename || includeCtx) && (
        <div className="px-4 py-1.5 bg-[#1a1a1a] border-b border-[#2e2e2e] flex items-center gap-2 shrink-0 flex-wrap">
          {filename && (
            <span className="text-[10px] text-[#888888] font-mono truncate">📄 {filename}</span>
          )}
          {language !== 'auto' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#000000] text-[#888888] font-mono uppercase">
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
            <Lightning size={32} weight="duotone" className="text-[#666666]" />
            <p className="text-xs text-[#888888] leading-relaxed">
              Pega código, pregunta técnica<br />o un error para resolverlo.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {[
                { label: 'Completar', hint: 'Pega código con TODO o pass' },
                { label: 'Explicar',  hint: '¿Qué hace esta función?' },
                { label: 'Corregir',  hint: 'Pega el traceback del error' },
                { label: 'Revisar',   hint: 'Refactoriza con SOLID' },
              ].map(({ label, hint }) => (
                <button
                  key={label}
                  onClick={() => setInput(hint)}
                  // Botones negros con texto gris claro
                  className="text-left px-3 py-2 rounded-md bg-[#000000] hover:bg-[#111111] border border-[#2e2e2e] hover:border-[#444444] transition-all"
                >
                  <span className="text-[11px] font-semibold text-[#d0d0d0]">{label} </span>
                  <span className="text-[10px] text-[#888888]">— {hint}</span>
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
              msg.role === 'user' ? 'bg-[#000000] border border-[#333333]' : 'bg-[#000000] border border-[#333333]'
            }`}>
              {msg.role === 'user'
                ? <User size={11} weight="bold" className="text-[#d0d0d0]" />
                : <Robot size={11} weight="fill" className="text-[#d0d0d0]" />
              }
            </div>

            {/* Burbuja */}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-[#000000] text-[#d0d0d0] border border-[#333333] rounded-tr-none'
                : 'bg-[#1a1a1a] text-[#cccccc] border border-[#333333] rounded-tl-none'
            }`}>
              {msg.role === 'user'
                ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                : <AssistantMessage content={msg.content} />
              }
              {msg.role === 'assistant' && (msg.mode || msg.model) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#333333]">
                  {msg.mode && <ModeBadge mode={msg.mode} />}
                  {msg.model && (
                    <span className="text-[9px] text-[#666666] font-mono truncate">{msg.model}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loader */}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#000000] border border-[#333333] flex items-center justify-center shrink-0">
              <Robot size={11} weight="fill" className="text-[#d0d0d0]" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-2">
              <SpinnerGap size={12} className="text-[#888888] animate-spin" />
              <span className="text-xs text-[#888888]">APEX procesando…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#2e2e2e] p-3 bg-[#1a1a1a]">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={3}
            placeholder="Código o pregunta..."
            className="
              flex-1 bg-[#111111] border border-[#333333] rounded-lg
              p-2.5 text-sm text-[#d0d0d0] font-mono
              placeholder:text-[#666666] resize-none outline-none
              focus:border-[#555555] transition-colors leading-relaxed
            "
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            // Botón negro con texto gris claro
            className="p-2 rounded-lg bg-[#000000] text-[#d0d0d0] border border-[#333333] hover:bg-[#111111] hover:border-[#555555] disabled:opacity-25 transition-all shrink-0 self-end"
            title="Enviar (Enter)"
          >
            <PaperPlaneTilt size={14} weight="fill" />
          </button>
        </div>
        <p className="mt-1.5 text-[9px] text-[#666666] text-right font-mono tracking-wide">
          Free.AI → Ollama · {messages.length} msgs
        </p>
      </div>
    </div>
  );
}
