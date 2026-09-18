import React from 'react';
import { CanvasTabs } from './AgentOSStudio';

export default function AgentOSInfinityBoard() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#030712] text-white">
      {/* Ocupa todo el espacio de su propio tab al 100% de width */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <CanvasTabs />
      </div>
    </div>
  );
}
