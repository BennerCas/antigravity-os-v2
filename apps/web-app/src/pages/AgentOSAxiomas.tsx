import React, { useState } from 'react';
import { Target, Crosshair, TrendUp, Checks, PaintBrush, Lightning, CheckCircle, SlidersHorizontal, Database, UploadSimple, ShieldCheck } from '@phosphor-icons/react';
import { useStudioStore } from '../stores/useStudioStore';

export default function AgentOSAxiomas() {
  const { phase1Interview, phase1Complete, phase2Complete, phase3Complete, triageSummary, quantumFriction, setQuantumFriction, atlasFileName, setAtlasFileName } = useStudioStore();
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [editedObjective, setEditedObjective] = useState('');
  
  
  const [atlasFileObj, setAtlasFileObj] = useState<File | null>(null);

  const handleSaveObjective = () => {
    setIsEditingObjective(false);
  };
  
  return (
    <div className="flex-1 flex flex-col p-8 md:p-10 relative overflow-y-auto custom-scrollbar h-full bg-[#030712]">
      {/* Background elements */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Crosshair size={300} weight="thin" />
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col animate-fade-in relative z-10 gap-8 pb-10">
        
        {/* Header Progress */}
        <div className="shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-3">
              <Target size={28} style={{ color: 'var(--theme-border)' }} weight="duotone" />
              Centro de Mando (Axiomas)
            </h2>
            <div className="text-right">
              <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--theme-border)', opacity: 0.7 }}>Progreso Global</div>
              <div className="text-xl font-bold" style={{ color: 'var(--theme-border)' }}>
                {phase3Complete ? '100%' : phase2Complete ? '75%' : phase1Complete ? '50%' : phase1Interview ? '25%' : '0%'}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--stroke-subtle)' }}>
            <div 
              className="h-full transition-all duration-1000 ease-out"
              style={{ 
                width: phase3Complete ? '100%' : phase2Complete ? '75%' : phase1Complete ? '50%' : phase1Interview ? '25%' : '0%',
                background: 'var(--theme-border)',
                boxShadow: '0 0 8px var(--theme-border)'
              }}
            />
          </div>
        </div>

        {/* Vector de Intención */}
        <div className="flex flex-col relative">
          <h3 className="shrink-0 text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendUp size={16} /> Vector de Intención
          </h3>
          
          {phase1Complete && triageSummary ? (
            <div className="flex flex-col p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="flex items-start gap-5">
                <div className="shrink-0 p-4 bg-emerald-500/10 rounded-2xl">
                  <Checks size={28} className="text-emerald-400" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  {isEditingObjective ? (
                    <div className="flex flex-col gap-3">
                      <textarea 
                        value={editedObjective}
                        onChange={(e) => setEditedObjective(e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsEditingObjective(false); setEditedObjective(triageSummary); }} className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200">Cancelar</button>
                        <button onClick={handleSaveObjective} className="px-4 py-2 text-xs rounded-lg bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed text-zinc-300 font-medium">{triageSummary}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-emerald-500/10 pt-4">
                <button onClick={() => setIsEditingObjective(!isEditingObjective)} className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors" title="Editar Objetivo">
                  <PaintBrush size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 border border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/20">
              <div className="text-center max-w-sm px-6">
                <Target size={40} className="mx-auto text-zinc-700 mb-4" weight="thin" />
                <p className="text-sm font-medium text-zinc-500 mb-2">Esperando Intención Cero</p>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Inicia la conversación en The AureliOS para definir el vector principal del proyecto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Módulos de Control Base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          
          {/* Quantum Engine */}
          <div className="flex flex-col p-6 rounded-3xl border border-blue-500/10 bg-blue-500/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <SlidersHorizontal size={80} weight="duotone" />
            </div>
            <h3 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
              <Lightning size={18} weight="duotone" /> Quantum Engine
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Regula la entropía cognitiva del enjambre.</p>
            
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                <span className={quantumFriction < 30 ? 'text-blue-400' : ''}>Laminar</span>
                <span className={quantumFriction > 70 ? 'text-purple-400' : ''}>Turbulencia</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={quantumFriction}
                onChange={(e) => setQuantumFriction(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-blue-400 hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
              />
              <div className="text-center text-xs text-zinc-300 mt-2 font-medium">
                {quantumFriction < 30 ? 'Precisión Estricta (Determinista)' : quantumFriction > 70 ? 'Brainstorming Extremo (Caos Creativo)' : 'Equilibrio Dinámico'}
              </div>
            </div>
          </div>

          {/* Atlas Forge Pipeline */}
          <div className="flex flex-col p-6 rounded-3xl border border-amber-500/10 bg-amber-500/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Database size={80} weight="duotone" />
            </div>
            <h3 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
              <Database size={18} weight="duotone" /> Atlas Forge Pipeline
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Ingesta de contexto masivo (Documentos maestros, logs, código legacy).</p>
            
            <div className="flex flex-col items-center justify-center border border-dashed border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 mt-auto hover:bg-amber-500/10 transition-colors cursor-pointer" onClick={() => document.getElementById('atlas-upload')?.click()}>
              <input type="file" id="atlas-upload" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; setAtlasFileObj(f || null); setAtlasFileName(f ? f.name : null); }} />
              {atlasFileName ? (
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck size={24} className="text-amber-400" />
                  <p className="text-xs text-amber-300 font-medium break-all">{atlasFileName}</p>
                  <p className="text-[10px] text-zinc-500">Cargado en memoria (Streaming)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2">
                  <UploadSimple size={24} className="text-amber-500/50" />
                  <p className="text-xs font-medium text-amber-400/80">Subir Contexto Base</p>
                  <p className="text-[10px] text-zinc-500">Límite de carga: 1GB (Streaming)</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

