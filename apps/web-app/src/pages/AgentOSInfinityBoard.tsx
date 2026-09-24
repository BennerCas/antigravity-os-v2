import React, { useEffect, useRef } from 'react';
import { CanvasTabs } from './AgentOSStudio';

export default function AgentOSInfinityBoard() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Cuando llega el evento 'infinityboard:fitView', buscamos el botón
  // de fitView de ReactFlow Controls y lo clickeamos programáticamente
  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        // ReactFlow Controls tiene un botón con aria-label="fit view"
        const fitBtn = document.querySelector<HTMLButtonElement>(
          'button[title="fit view"], button[aria-label="fit view"], .react-flow__controls-fitview'
        );
        if (fitBtn) fitBtn.click();
      }, 150); // pequeño delay para asegurar que la vista ya montó
    };
    window.addEventListener('infinityboard:fitView', handler);
    return () => window.removeEventListener('infinityboard:fitView', handler);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-hidden bg-[#030712] text-[var(--text-primary)]">
      {/* Ocupa todo el espacio de su propio tab al 100% de width */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <CanvasTabs />
      </div>
    </div>
  );
}
