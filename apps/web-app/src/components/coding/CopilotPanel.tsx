import { useState, useRef, useEffect } from 'react';
import { Lightning, X, PaperPlaneTilt, Robot, User, SpinnerGap, Copy, Check } from '@phosphor-icons/react';
import { API_URL } from '../../lib/api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  model?: string;
}

interface CopilotPanelProps {
  /** Código actualmente visible en el editor (se usa como contexto) */
  editorCode?: string;
  /** Lenguaje detectado en el editor */
  language?: string;
  /** Nombre del archivo activo */
  filename?: string;
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
        <div className="px-3 py-1 text-[10px] text-[#8A8A8A] font-mono border-b border-[#2A2A2A] bg-[#111111] uppercase">
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
        {copied ? <Check size={12} weight="bold" className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

// ─── Renderizador de respuesta (detecta bloques de código) ────────────────────

function AssistantMessage({ content }: { content: string }) {
  // Divide el texto en partes: texto normal y bloques ```lang\n...\n```
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
        return (
          <p key={i} className="whitespace-pre-wrap">
            {part}
          </p>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CopilotPanel({ editorCode = '', language = 'auto', filename }: CopilotPanelProps) {
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [includeCtx, setIncludeCtx] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus al abrir
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [open]);

  const handleSend = async () => {
    const code = input.trim();
    if (!code || loading) return;

    const userMsg: Message = { role: 'user', content: code };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = { code, language };
      if (filename) body.filename = filename;
      if (includeCtx && editorCode) body.context = editorCode.slice(0, 3000); // max 3k chars de contexto

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
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        mode: data.mode_detected,
        model: data.model_used,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${errorMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(v => !v)}
        title="APEX-COPILOT"
        className={`
          fixed bottom-6 right-6 z-50
          flex items-center gap-2 px-4 py-2.5
          rounded-full shadow-lg
          border transition-all duration-200
          ${open
            ? 'bg-white text-black border-white'
            : 'bg-[#0a0a0a] text-white border-[#2A2A2A] hover:border-white hover:bg-[#111111]'
          }
        `}
      >
        <Lightning size={16} weight="fill" />
        <span className="text-sm font-semibold tracking-wide">COPILOT</span>
        {messages.length > 0 && !open && (
          <span className="ml-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {/* Panel lateral */}
      {open && (
        <div className="
          fixed right-0 top-0 bottom-0 z-40
          w-[420px] max-w-[100vw]
          bg-[#0a0a0a] border-l border-[#2A2A2A]
          flex flex-col shadow-2xl
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] bg-[#111111] shrink-0">
            <div className="flex items-center gap-2">
              <Robot size={18} weight="fill" className="text-white" />
              <span className="text-sm font-semibold text-white tracking-wide">APEX-COPILOT</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30 uppercase">
                Live
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle contexto */}
              <label className="flex items-center gap-1.5 cursor-pointer" title="Incluir código del editor como contexto">
                <span className="text-[10px] text-[#8A8A8A] uppercase font-semibold">Contexto</span>
                <div
                  onClick={() => setIncludeCtx(v => !v)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${includeCtx ? 'bg-white' : 'bg-[#2A2A2A]'}`}
                >
                  <div className={`
                    absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all
                    ${includeCtx ? 'left-4' : 'left-0.5'}
                  `} />
                </div>
              </label>
              <button
                onClick={() => setMessages([])}
                className="text-[10px] text-[#8A8A8A] hover:text-white transition-colors"
                title="Limpiar chat"
              >
                Limpiar
              </button>
              <button onClick={() => setOpen(false)} className="text-[#8A8A8A] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Info de contexto activo */}
          {(filename || language !== 'auto') && (
            <div className="px-4 py-2 bg-[#111111] border-b border-[#2A2A2A] flex items-center gap-3 shrink-0">
              {filename && (
                <span className="text-[10px] text-[#8A8A8A] font-mono truncate">
                  📄 {filename}
                </span>
              )}
              {language !== 'auto' && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#2A2A2A] text-[#8A8A8A] font-mono uppercase">
                  {language}
                </span>
              )}
              {includeCtx && editorCode && (
                <span className="text-[10px] text-green-400 font-mono">
                  ✓ contexto activo ({Math.min(editorCode.length, 3000)} chars)
                </span>
              )}
            </div>
          )}

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-[#3A3A3A]">
                <Lightning size={40} weight="duotone" />
                <p className="text-sm text-[#5A5A5A]">
                  Pega código, pregunta algo técnico<br />o pega un error para que APEX lo corrija.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 w-full max-w-[280px]">
                  {[
                    ['Completar', 'Pega código con TODO o pass'],
                    ['Explicar',  '¿Qué hace esta función?'],
                    ['Corregir',  'Pega el traceback del error'],
                    ['Revisar',   'Refactoriza esto con SOLID'],
                  ].map(([label, hint]) => (
                    <button
                      key={label}
                      onClick={() => setInput(hint)}
                      className="text-left p-2 rounded-md border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
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
                {/* Avatar */}
                <div className={`
                  w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs
                  ${msg.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-[#2A2A2A] text-white'}
                `}>
                  {msg.role === 'user'
                    ? <User size={14} weight="bold" />
                    : <Robot size={14} weight="fill" />
                  }
                </div>

                {/* Burbuja */}
                <div className={`
                  max-w-[85%] rounded-xl px-3 py-2.5
                  ${msg.role === 'user'
                    ? 'bg-white text-black text-sm rounded-tr-none'
                    : 'bg-[#151515] border border-[#2A2A2A] rounded-tl-none'
                  }
                `}>
                  {msg.role === 'user'
                    ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    : <AssistantMessage content={msg.content} />
                  }
                  {msg.role === 'assistant' && (msg.mode || msg.model) && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#2A2A2A]">
                      {msg.mode && <ModeBadge mode={msg.mode} />}
                      {msg.model && (
                        <span className="text-[10px] text-[#4A4A4A] font-mono truncate">
                          {msg.model}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0">
                  <Robot size={14} weight="fill" className="text-white" />
                </div>
                <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl rounded-tl-none px-3 py-2.5 flex items-center gap-2">
                  <SpinnerGap size={14} className="text-[#8A8A8A] animate-spin" />
                  <span className="text-xs text-[#8A8A8A]">APEX procesando…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#2A2A2A] p-3 bg-[#0a0a0a]">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={3}
                placeholder="Pega código, pregunta o error… (Enter para enviar, Shift+Enter para nueva línea)"
                className="
                  flex-1 bg-[#151515] border border-[#2A2A2A] rounded-lg
                  p-3 text-sm text-white font-mono
                  placeholder:text-[#4A4A4A] resize-none outline-none
                  focus:border-[#3A3A3A] transition-colors
                "
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="
                  p-2.5 rounded-lg bg-white text-black
                  hover:bg-[#d0d0d0] disabled:opacity-30
                  transition-colors shrink-0 self-end
                "
                title="Enviar (Enter)"
              >
                <PaperPlaneTilt size={16} weight="fill" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-[#3A3A3A] text-right">
              Motor: Free.AI → Ollama fallback
            </p>
          </div>
        </div>
      )}
    </>
  );
}
