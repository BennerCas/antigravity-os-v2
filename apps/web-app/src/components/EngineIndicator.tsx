import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

interface EngineStatus {
  active: 'cloud' | 'local' | 'offline';
  cloud: { provider: string; model: string; ready: boolean };
  local: { provider: string; model: string; ready: boolean };
}

/**
 * Indicador del Motor Híbrido: muestra qué cerebro respondería ahora.
 * 🌐 GPT-4o (nube) · 💻 Hermes3 (local) · ⚠️ offline
 */
export function EngineIndicator() {
  const [status, setStatus] = useState<EngineStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/builder/engine`);
        if (res.ok && alive) setStatus(await res.json());
      } catch {
        if (alive) setStatus(null);
      }
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!status) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 px-2 py-1 rounded-lg border border-zinc-800" title="Backend no disponible">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono">offline</span>
      </div>
    );
  }

  const isCloud = status.active === 'cloud';
  const label = isCloud ? status.cloud.model.split('/').pop() : status.active === 'local' ? status.local.model : 'sin motor';
  const detail = isCloud
    ? `Nube: ${status.cloud.model}`
    : status.active === 'local'
      ? `Local: ${status.local.model}`
      : 'Ni nube ni Ollama disponibles';

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border border-zinc-800 cursor-default"
      title={`${detail} · ${status.cloud.ready ? '☁️ nube lista' : '☁️ sin key'} · ${status.local.ready ? '💻 hermes3 listo' : '💻 ollama no disponible'}`}
    >
      <span className={`w-2 h-2 rounded-full ${isCloud ? 'bg-sky-400' : status.active === 'local' ? 'bg-amber-400' : 'bg-red-500'} animate-pulse`} />
      <span className="font-mono text-zinc-300">{isCloud ? '🌐' : '💻'} {label}</span>
    </div>
  );
}
