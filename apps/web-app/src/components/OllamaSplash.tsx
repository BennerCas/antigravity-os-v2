import React, { useState, useEffect, useCallback } from 'react';

type EngineStatus = 'checking' | 'loading' | 'ready' | 'fallback';

interface OllamaSplashProps {
  onReady: () => void;
}

const TIPS = [
  'Hermes 3 Unlocked cargando en tu GPU AMD Radeon...',
  'El Triángulo Dorado: Ollama → Free.AI → Gemini',
  'Precalentando el Enjambre de agentes cuánticos...',
  'Antigravity OS v2 — 100% local cuando es posible',
  'Comprobando motores de inferencia...',
];

export function OllamaSplash({ onReady }: OllamaSplashProps) {
  const [status, setStatus] = useState<EngineStatus>('checking');
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [ollamaReady, setOllamaReady] = useState(false);
  const [freeAiReady, setFreeAiReady] = useState(false);
  const [dots, setDots] = useState('');

  // Rotate tips every 3s
  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const checkOllama = useCallback(async (): Promise<boolean> => {
    try {
      const r = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(2000) });
      if (!r.ok) return false;
      const data = await r.json();
      // Check hermes3 is loaded
      const models: string[] = (data.models || []).map((m: { name: string }) => m.name);
      return models.some(n => n.includes('hermes'));
    } catch {
      return false;
    }
  }, []);

  const checkFreeAi = useCallback(async (): Promise<boolean> => {
    try {
      const r = await fetch('/api/v1/health/engines', { signal: AbortSignal.timeout(3000) });
      if (!r.ok) return false;
      const d = await r.json();
      return d.free_ai === true;
    } catch {
      // If endpoint not found, just assume it's ok to proceed
      return true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const MAX_WAIT = 180; // seconds — Hermes 3 Unlocked puede tardar en iGPU AMD

    const poll = async () => {
      setStatus('loading');

      while (!cancelled && retries < MAX_WAIT) {
        const [ollama, freeai] = await Promise.all([checkOllama(), checkFreeAi()]);

        if (!cancelled) {
          setOllamaReady(ollama);
          setFreeAiReady(freeai);
        }

        if (!cancelled && ollama) {
          setStatus('ready');
          await new Promise(r => setTimeout(r, 800));
          if (!cancelled) onReady();
          return;
        }

        // After 120s give up waiting for Ollama and use fallback
        if (!cancelled && retries >= 120) {
          setStatus('fallback');
          await new Promise(r => setTimeout(r, 1500));
          if (!cancelled) onReady();
          return;
        }

        retries++;
        await new Promise(r => setTimeout(r, 1000));
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [checkOllama, checkFreeAi, onReady]);

  const pct = Math.min(100, Math.round((elapsed / 180) * 100));
  const remaining = Math.max(0, 120 - elapsed);

  const statusColor = {
    checking: '#94a3b8',
    loading: '#f59e0b',
    ready: '#10b981',
    fallback: '#3b82f6',
  }[status];

  const statusLabel = {
    checking: 'Verificando motores',
    loading: `Cargando modelo local${dots}`,
    ready: '✓ Motor local listo',
    fallback: '→ Usando nube como respaldo',
  }[status];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at center, #0f172a 0%, #020817 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Logo */}
      <div style={{ position: 'relative', marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, boxShadow: '0 0 40px rgba(59,130,246,0.4)',
          animation: 'pulse-logo 2s ease-in-out infinite',
        }}>⚡</div>
      </div>

      {/* Title */}
      <h1 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
        ANTIGRAVITY OS
        <span style={{ color: '#3b82f6', marginLeft: 8 }}>v2</span>
      </h1>
      <p style={{ color: '#475569', fontSize: 13, margin: '8px 0 40px', letterSpacing: 2, textTransform: 'uppercase' }}>
        Sistema de Agentes Cuánticos
      </p>

      {/* Engine Status Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        {[
          { label: 'Ollama / Hermes 3 Unlocked', ready: ollamaReady, icon: '🦙', desc: 'Motor local AMD' },
          { label: 'Free.AI / Qwen', ready: freeAiReady, icon: '☁️', desc: 'Fallback nube' },
        ].map(({ label, ready, icon, desc }) => (
          <div key={label} style={{
            background: ready ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${ready ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '12px 20px', minWidth: 160, textAlign: 'center',
            transition: 'all 0.4s ease',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
            <div style={{ color: ready ? '#10b981' : '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              {ready ? '● ACTIVO' : '○ CARGANDO'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>{label}</div>
            <div style={{ color: '#475569', fontSize: 10 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Main status */}
      <div style={{
        color: statusColor, fontSize: 15, fontWeight: 600,
        marginBottom: 20, letterSpacing: 0.3,
        transition: 'color 0.3s',
        minHeight: 24,
      }}>
        {statusLabel}
      </div>

      {/* Progress bar */}
      <div style={{ width: 360, marginBottom: 16 }}>
        <div style={{
          width: '100%', height: 4, background: 'rgba(255,255,255,0.06)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            width: status === 'ready' || status === 'fallback' ? '100%' : `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, #3b82f6, ${statusColor})`,
            borderRadius: 4,
            transition: 'width 0.8s ease',
            boxShadow: `0 0 8px ${statusColor}60`,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: '#475569', fontSize: 11 }}>{elapsed}s transcurridos</span>
          <span style={{ color: '#475569', fontSize: 11 }}>
            {status === 'ready' || status === 'fallback' ? 'Listo ✓' : remaining > 0 ? `~${remaining}s restantes` : 'Finalizando...'}
          </span>
        </div>
      </div>

      {/* Rotating tip */}
      <p style={{
        color: '#334155', fontSize: 12, maxWidth: 400,
        textAlign: 'center', letterSpacing: 0.2,
        transition: 'opacity 0.3s',
        fontStyle: 'italic',
      }}>
        {TIPS[tipIndex]}
      </p>

      {/* Skip button - only show after 10s */}
      {elapsed >= 10 && status === 'loading' && (
        <button
          onClick={onReady}
          style={{
            marginTop: 30, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', color: '#475569',
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.target as HTMLElement).style.color = '#94a3b8'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.color = '#475569'; }}
        >
          Entrar de todas formas →
        </button>
      )}

      {/* Firma */}
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#1e293b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          HUMAN AI SYNERGY
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#1e293b', letterSpacing: '0.1em' }}>
          BY BENNER CASTILLO
        </p>
      </div>

      <style>{`
        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 0 40px rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 60px rgba(139,92,246,0.6); }
        }
      `}</style>
    </div>
  );
}
