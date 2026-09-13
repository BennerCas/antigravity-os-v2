import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  SpeakerHigh,
  SpeakerSlash,
  Play,
  Pause,
  ArrowsCounterClockwise,
  MagnifyingGlass,
  Sparkle,
  Lightning,
  CaretRight,
  X,
  Compass,
  ArrowsOut,
  ArrowsIn
} from '@phosphor-icons/react';
import type { SkillGraphNode, SkillMasteryRecord, MissionDefinition } from '../../types/academy';
import { ttsEngine, TTSState } from '../../utils/ttsEngine';

interface KnowledgeGraph3DProps {
  skills: SkillGraphNode[];
  links: { source: string; target: string }[];
  masteryRecords: SkillMasteryRecord[];
  missions?: MissionDefinition[];
  currentUserId: string;
  selectedSkillId?: string | null;
  onSelectSkill?: (skill: SkillGraphNode, record?: SkillMasteryRecord) => void;
  onLaunchMission?: (missionId: string) => void;
}

// Track styling metadata
const TRACK_META: Record<string, { label: string; color: string; border: string; glow: string; bg: string }> = {
  foundation: {
    label: 'Foundation',
    color: '#86EFAC',
    border: 'border-[#22C55E]/60',
    glow: 'rgba(34, 197, 94, 0.35)',
    bg: 'bg-[#071F0F]/90',
  },
  builder: {
    label: 'Builder',
    color: '#67E8F9',
    border: 'border-cyan-500/60',
    glow: 'rgba(6, 182, 212, 0.35)',
    bg: 'bg-cyan-950/90',
  },
  operator: {
    label: 'Operator',
    color: '#FDE047',
    border: 'border-amber-500/60',
    glow: 'rgba(234, 179, 8, 0.35)',
    bg: 'bg-amber-950/90',
  },
  architect: {
    label: 'Architect',
    color: '#D8B4FE',
    border: 'border-purple-500/60',
    glow: 'rgba(168, 85, 247, 0.35)',
    bg: 'bg-purple-950/90',
  },
  expert: {
    label: 'Expert',
    color: '#F43F5E',
    border: 'border-rose-500/60',
    glow: 'rgba(244, 63, 94, 0.35)',
    bg: 'bg-rose-950/90',
  },
};

const DIMENSION_CONFIG: Array<{ key: keyof SkillMasteryRecord['dimensions']; label: string; desc: string }> = [
  { key: 'correctness', label: 'Corrección Funcional', desc: 'Topología y flujo sin fallos de contrato' },
  { key: 'independence', label: 'Independencia', desc: 'Resolución autónoma sin dependencia de pistas avanzadas' },
  { key: 'transfer', label: 'Transferencia', desc: 'Dominio verificado en escenarios de dominios cruzados' },
  { key: 'reliability', label: 'Fiabilidad & Resiliencia', desc: 'Manejo de reintentos, idempotencia y caídas' },
  { key: 'comprehension', label: 'Comprensión Arquitectónica', desc: 'Justificación socrática y explicación de trade-offs' },
  { key: 'consistency', label: 'Consistencia de Ejecución', desc: 'Tasa de éxito sostenida en múltiples intentos' },
  { key: 'complexity', label: 'Complejidad', desc: 'Profundidad de grafo, agentes concurrentes y subflows' },
  { key: 'safety', label: 'Seguridad & Permisos', desc: 'Mínimo privilegio, manejo de credenciales y compuertas' },
];

export const KnowledgeGraph3D: React.FC<KnowledgeGraph3DProps> = ({
  skills,
  links,
  masteryRecords,
  missions = [],
  currentUserId: _currentUserId,
  selectedSkillId,
  onSelectSkill,
  onLaunchMission,
}) => {
  // Container & Dimension
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 900, height: 620 });

  // 3D Angles & Interaction
  const [rotX, setRotX] = useState<number>(0.25);
  const [rotY, setRotY] = useState<number>(0.4);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);
  const [activeInspectorSkill, setActiveInspectorSkill] = useState<SkillGraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Filters & Search
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // TTS State
  const [ttsState, setTtsState] = useState<TTSState>(ttsEngine.getState());
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);

  // Animation frame loop ref
  const animFrameRef = useRef<number | null>(null);
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0.0025, vy: 0 });

  // Sync TTS listener
  useEffect(() => {
    const unsub = ttsEngine.subscribe((s) => setTtsState(s));
    return () => unsub();
  }, []);

  // Update container size dynamically to fill the whole window
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width || containerRef.current.clientWidth || window.innerWidth),
          height: Math.max(500, rect.height || containerRef.current.clientHeight || (window.innerHeight - 220)),
        });
      }
    };
    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isFullscreen]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Sync selectedSkillId to active inspector
  useEffect(() => {
    if (selectedSkillId) {
      const found = skills.find((s) => s.id === selectedSkillId);
      if (found) setActiveInspectorSkill(found);
    }
  }, [selectedSkillId, skills]);

  // Fibonacci Sphere Coordinates Generation
  const sphereRadius = useMemo(() => {
    return Math.max(340, Math.min(dimensions.width, dimensions.height) * 0.45);
  }, [dimensions]);

  const sphereNodes = useMemo(() => {
    const total = skills.length;
    if (total === 0) return [];

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle (~2.3999 rad)

    return skills.map((skill, index) => {
      // Fibonacci point on unit sphere
      const y = 1 - (index / Math.max(1, total - 1)) * 2; // from 1 to -1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * index;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const record = masteryRecords.find((m) => m.skill_id === skill.id);
      const score = record ? Math.round(record.mastery_score * 100) : 0;
      const state = record?.state || 'UNKNOWN';

      return {
        ...skill,
        unitX: x,
        unitY: y,
        unitZ: z,
        score,
        state,
        record,
      };
    });
  }, [skills, masteryRecords]);

  // Map for fast node lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, (typeof sphereNodes)[0]>();
    sphereNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [sphereNodes]);

  // Projected 3D Points
  const projectedNodes = useMemo(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const focalLength = 900;
    const R = sphereRadius * zoom;

    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    return sphereNodes.map((n) => {
      // 1. Scale by radius
      const x0 = n.unitX * R;
      const y0 = n.unitY * R;
      const z0 = n.unitZ * R;

      // 2. Rotate around Y axis
      const x1 = x0 * cosY + z0 * sinY;
      const z1 = -x0 * sinY + z0 * cosY;

      // 3. Rotate around X axis
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;

      // 4. Perspective projection
      const scale = (focalLength / (focalLength + z2));
      const projX = centerX + x1 * scale;
      const projY = centerY + y2 * scale;

      // Depth perception values
      const depthRatio = (z2 + R) / (2 * R); // 0 (far back) to 1 (front)
      const opacity = Math.max(0.35, Math.min(1.0, depthRatio * 0.7 + 0.35));
      const zIndex = Math.round(z2 + 1000);

      // Filtering match
      const matchesTrack = filterTrack === 'all' || n.category.toLowerCase() === filterTrack.toLowerCase();
      const matchesSearch = !searchQuery.trim() || n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
      const isVisible = matchesTrack && matchesSearch;

      return {
        ...n,
        x3D: x1,
        y3D: y2,
        z3D: z2,
        projX,
        projY,
        scale,
        opacity: isVisible ? opacity : 0.1,
        zIndex,
        isVisible,
        isFrontFacing: z2 > -40,
      };
    });
  }, [sphereNodes, dimensions, sphereRadius, zoom, rotX, rotY, filterTrack, searchQuery]);

  const projectedMap = useMemo(() => {
    const map = new Map<string, (typeof projectedNodes)[0]>();
    projectedNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [projectedNodes]);

  // Projected 3D Arcs (Genuine Relationship Bridges)
  const projectedBridges = useMemo(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const focalLength = 900;
    const R = sphereRadius * zoom;

    return links
      .map((link, idx) => {
        const sourceNode = projectedMap.get(link.source);
        const targetNode = projectedMap.get(link.target);
        if (!sourceNode || !targetNode) return null;

        // Elevate midpoint outward from sphere center to form 3D arc
        const midX = (sourceNode.x3D + targetNode.x3D) / 2;
        const midY = (sourceNode.y3D + targetNode.y3D) / 2;
        const midZ = (sourceNode.z3D + targetNode.z3D) / 2;
        const midLen = Math.sqrt(midX * midX + midY * midY + midZ * midZ) || 1;

        // Push arc outward
        const arcElevation = R * 1.18;
        const ctrlX = (midX / midLen) * arcElevation;
        const ctrlY = (midY / midLen) * arcElevation;
        const ctrlZ = (midZ / midLen) * arcElevation;

        const ctrlScale = focalLength / (focalLength + ctrlZ);
        const projCtrlX = centerX + ctrlX * ctrlScale;
        const projCtrlY = centerY + ctrlY * ctrlScale;

        const avgZ = (sourceNode.z3D + targetNode.z3D) / 2;
        const isFront = avgZ > -50;
        const isHovered = hoveredSkillId === link.source || hoveredSkillId === link.target;
        const isPrerequisite = hoveredSkillId === link.target;
        const isUnlocked = hoveredSkillId === link.source;

        return {
          id: `bridge_${link.source}_${link.target}_${idx}`,
          sourceId: link.source,
          targetId: link.target,
          x1: sourceNode.projX,
          y1: sourceNode.projY,
          x2: targetNode.projX,
          y2: targetNode.projY,
          cx: projCtrlX,
          cy: projCtrlY,
          isFront,
          isHovered,
          isPrerequisite,
          isUnlocked,
          avgZ,
          sourceCategory: sourceNode.category.toLowerCase(),
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      sourceId: string;
      targetId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      cx: number;
      cy: number;
      isFront: boolean;
      isHovered: boolean;
      isPrerequisite: boolean;
      isUnlocked: boolean;
      avgZ: number;
      sourceCategory: string;
    }>;
  }, [links, projectedMap, dimensions, sphereRadius, zoom, hoveredSkillId]);

  // Smooth Drag & Auto-Rotation Loop
  useEffect(() => {
    const loop = () => {

      if (!isDragging) {
        if (autoRotate && !hoveredSkillId) {
          // Slow continuous rotation
          setRotY((prev) => (prev + 0.002) % (Math.PI * 2));
        } else if (Math.abs(velocityRef.current.vx) > 0.0001 || Math.abs(velocityRef.current.vy) > 0.0001) {
          // Inertia damping
          setRotY((prev) => (prev + velocityRef.current.vx) % (Math.PI * 2));
          setRotX((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + velocityRef.current.vy)));
          velocityRef.current.vx *= 0.94;
          velocityRef.current.vy *= 0.94;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDragging, autoRotate, hoveredSkillId]);

  // Pointer Handlers for Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-card') || (e.target as HTMLElement).closest('.interactive-control')) {
      return; // Do not drag when clicking controls or card buttons
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    velocityRef.current = { vx: 0, vy: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const sensitivity = 0.0045;
    const vx = dx * sensitivity;
    const vy = -dy * sensitivity;

    setRotY((prev) => (prev + vx) % (Math.PI * 2));
    setRotX((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + vy)));

    velocityRef.current = { vx, vy };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.55, Math.min(2.2, prev * zoomFactor)));
  };

  // Reset Camera View
  const handleResetCamera = () => {
    setRotX(0.2);
    setRotY(0.4);
    setZoom(1.0);
    velocityRef.current = { vx: 0, vy: 0 };
  };

  // Focus and Rotate Camera to Target Node
  const focusNode = useCallback(
    (skillId: string) => {
      const node = nodeMap.get(skillId);
      if (!node) return;

      // Calculate target angles so unit coordinates face positive Z towards the camera
      const targetRotY = Math.atan2(node.unitX, node.unitZ);
      const targetRotX = -Math.asin(Math.max(-1, Math.min(1, node.unitY)));

      setRotY(targetRotY);
      setRotX(targetRotX);
      setZoom(1.15);
      velocityRef.current = { vx: 0, vy: 0 };

      const matchedSkill = skills.find((s) => s.id === skillId);
      if (matchedSkill) {
        setActiveInspectorSkill(matchedSkill);
        if (onSelectSkill) onSelectSkill(matchedSkill, node.record);
      }
    },
    [nodeMap, skills, onSelectSkill]
  );

  // Play/Stop TTS for a skill
  const handleToggleTTS = (e: React.MouseEvent, skill: SkillGraphNode) => {
    e.stopPropagation();
    const record = masteryRecords.find((m) => m.skill_id === skill.id);
    const score = record ? Math.round(record.mastery_score * 100) : 0;
    const state = record?.state || 'UNKNOWN';

    ttsEngine.setRate(ttsSpeed);
    ttsEngine.speakSkill(skill, score, state);
  };

  return (
    <div
      className={`relative w-full bg-[#050807] border border-[#1A261E] rounded-2xl overflow-hidden flex flex-row select-none shadow-2xl transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen m-0'
          : 'h-[calc(100vh-210px)] min-h-[720px] flex-1'
      }`}
    >
      {/* ─── Left Panel: Canvas & Controls ─────────────────────────── */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* ─── Top Controls Bar ─────────────────────────────────────────────── */}
      <div className="z-20 px-5 py-3.5 bg-[#090E0B]/90 backdrop-blur-md border-b border-[#1A261E] flex flex-wrap items-center justify-start gap-4">
        {/* Title */}
        <div className="flex items-center gap-2 mr-2">
          <Compass size={18} weight="bold" className="text-[#22C55E] animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-white hidden sm:inline">
            Knowledge Graph 3D
          </span>
        </div>

        {/* Track Pills */}
        <div className="flex items-center gap-1 bg-[#050807] p-1 rounded-xl border border-[#1A261E] text-[11px] font-mono">
          {['all', 'foundation', 'builder', 'operator', 'architect', 'expert'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTrack(t)}
              className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all ${
                filterTrack === t
                  ? 'bg-[#174A1F] text-[#86EFAC] shadow-sm'
                  : 'text-[#71717A] hover:text-white hover:bg-[#111A13]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search skill */}
        <div className="relative flex items-center ml-2">
          <MagnifyingGlass size={14} className="absolute left-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar habilidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0D140F] border border-[#1A261E] rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#22C55E] w-36 sm:w-44 font-mono transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-zinc-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Auto-rotate toggle */}
        <button
          onClick={() => setAutoRotate((prev) => !prev)}
          title={autoRotate ? 'Pausar rotación automática' : 'Activar rotación automática'}
          className={`p-1.5 rounded-xl border transition-all text-xs flex items-center gap-1 font-mono ${
            autoRotate
              ? 'bg-[#174A1F]/50 border-[#22C55E] text-[#86EFAC]'
              : 'bg-[#0D140F] border-[#1A261E] text-zinc-400 hover:text-white'
          }`}
        >
          {autoRotate ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
          <span className="hidden sm:inline text-[10px]">3D Orbit</span>
        </button>

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          title="Centrar esfera 3D"
          className="p-1.5 rounded-xl bg-[#0D140F] border border-[#1A261E] text-zinc-400 hover:text-white hover:border-[#22C55E] transition-all"
        >
          <ArrowsCounterClockwise size={14} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Aprovechar toda la pantalla'}
          className={`px-2 py-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-mono ${
            isFullscreen
              ? 'bg-[#174A1F] border-[#22C55E] text-[#86EFAC]'
              : 'bg-[#0D140F] border-[#1A261E] text-zinc-400 hover:text-white hover:border-[#22C55E]'
          }`}
        >
          {isFullscreen ? <ArrowsIn size={14} weight="bold" /> : <ArrowsOut size={14} weight="bold" />}
          <span className="hidden sm:inline text-[10px] font-bold">{isFullscreen ? 'Minimizar' : 'Pantalla Completa'}</span>
        </button>

        {/* Global TTS Stop if Playing */}
          {ttsState.isPlaying && (
            <button
              onClick={() => ttsEngine.stop()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs font-mono animate-pulse hover:bg-red-900"
              title="Detener voz TTS en curso"
            >
              <SpeakerSlash size={14} />
              <span className="text-[10px] font-bold">Detener Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 3D Interactive Canvas Area ───────────────────────────────────── */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden cursor-${
          isDragging ? 'grabbing' : 'grab'
        } bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0A160F] via-[#050807] to-[#020403]`}
      >
        {/* Subtle 3D background grid & rings */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(#22C55E 1px, transparent 1px), radial-gradient(#06B6D4 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />

        {/* ─── SVG Canvas for Real 3D Bridges (Arcs & Pulses) ─────────────── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradients for category bridges */}
            <linearGradient id="grad_foundation" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#86EFAC" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad_builder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad_operator" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EAB308" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FDE047" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad_architect" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D8B4FE" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad_expert" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad_highlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="1" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Render 3D Arcs */}
          {projectedBridges.map((bridge) => {
            const pathD = `M ${bridge.x1} ${bridge.y1} Q ${bridge.cx} ${bridge.cy} ${bridge.x2} ${bridge.y2}`;

            let strokeColor = `url(#grad_${bridge.sourceCategory})`;
            let strokeWidth = bridge.isFront ? 1.8 : 0.9;
            let opacity = bridge.isFront ? 0.65 : 0.2;

            if (bridge.isHovered) {
              strokeColor = bridge.isPrerequisite ? '#06B6D4' : '#22C55E';
              strokeWidth = 3.2;
              opacity = 1.0;
            }

            return (
              <g key={bridge.id}>
                {/* Glow underlayer for active bridges */}
                {bridge.isHovered && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={bridge.isPrerequisite ? '#06B6D4' : '#22C55E'}
                    strokeWidth={8}
                    strokeOpacity={0.35}
                  />
                )}
                {/* Main 3D Curve */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                />

                {/* Animated Knowledge Energy Pulse along the bridge */}
                {bridge.isFront && (
                  <circle r={bridge.isHovered ? 3.5 : 2} fill="#86EFAC">
                    <animateMotion
                      path={pathD}
                      dur={bridge.isHovered ? '2.5s' : '4.5s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* ─── Minimalist 3D Nodes (Pills Constellation) ───────────── */}
        <div className="absolute inset-0 pointer-events-none">
          {projectedNodes.map((node) => {
            const meta = TRACK_META[node.category.toLowerCase()] || TRACK_META.foundation;
            const isHovered = hoveredSkillId === node.id;
            const isSelected = activeInspectorSkill?.id === node.id;
            const isSpeaking = ttsState.isPlaying && ttsState.currentSkillId === node.id;

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredSkillId(node.id)}
                onMouseLeave={() => setHoveredSkillId(null)}
                onClick={() => {
                  setActiveInspectorSkill(node);
                  if (onSelectSkill) onSelectSkill(node, node.record);
                }}
                className={`absolute pointer-events-auto cursor-pointer flex items-center justify-center transition-all duration-300 ${
                  isSelected ? 'z-[100]' : isHovered ? 'z-[90]' : ''
                }`}
                style={{
                  left: `${node.projX}px`,
                  top: `${node.projY}px`,
                  transform: `translate(-50%, -50%) scale(${node.scale * (isHovered || isSelected ? 1.25 : 1.0)})`,
                  zIndex: isSelected || isHovered ? 1000 : node.zIndex,
                  opacity: node.opacity,
                }}
              >
                {/* Minimalist Pill Node */}
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all ${
                    isSpeaking ? 'animate-pulse ring-2 ring-[#86EFAC]' : ''
                  }`}
                  style={{
                    backgroundColor: `${meta.color}1A`,
                    borderColor: `${meta.color}40`,
                    boxShadow: isHovered || isSelected ? `0 0 15px ${meta.color}60` : 'none',
                  }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                  <span className="text-[10px] font-bold text-white whitespace-nowrap shadow-sm drop-shadow-md">{node.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* HUD: Tarjeta Holográfica de Información Detallada */}
        {(hoveredSkillId || activeInspectorSkill) && (
          <div className="absolute top-5 left-5 z-40 pointer-events-none">
            {(() => {
              const activeId = hoveredSkillId || activeInspectorSkill?.id;
              const node = projectedNodes.find(n => n.id === activeId);
              if (!node) return null;
              
              const meta = TRACK_META[node.category.toLowerCase()] || TRACK_META.foundation;
              const isSpeaking = ttsState.isPlaying && ttsState.currentSkillId === node.id;
              
              return (
                <div 
                  className={`pointer-events-auto rounded-2xl border p-5 flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in fade-in slide-in-from-left-4 duration-300 ${meta.bg} ${meta.border}`}
                  style={{ width: '280px', minHeight: '150px' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                      style={{
                        color: meta.color,
                        borderColor: meta.color,
                        backgroundColor: `${meta.color}15`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md font-bold shadow-sm ${
                        node.state === 'MASTERED'
                          ? 'bg-[#174A1F] text-[#86EFAC]'
                          : node.state === 'INDEPENDENT'
                          ? 'bg-blue-950 text-blue-300'
                          : node.state === 'COMPETENT'
                          ? 'bg-cyan-950 text-cyan-300'
                          : 'bg-[#111111] text-zinc-500'
                      }`}
                    >
                      {node.state}
                    </span>
                  </div>

                  <div className="my-4">
                    <h4 className="text-[13px] font-bold text-white leading-snug drop-shadow-md">
                      {node.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#1F2923] gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 mb-1.5">
                        <span>Puntaje de Maestría:</span>
                        <span className="text-white font-bold">{node.score}%</span>
                      </div>
                      <div className="w-full bg-[#121A15] h-2 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#22C55E] to-[#06B6D4] transition-all duration-700"
                          style={{ width: `${node.score}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleTTS(e, node)}
                      title={isSpeaking ? 'Detener voz' : 'Escuchar explicación en español'}
                      className={`interactive-control p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                        isSpeaking
                          ? 'bg-[#174A1F] border-[#22C55E] text-[#86EFAC] shadow-[0_0_16px_rgba(34,197,94,0.7)]'
                          : 'bg-[#0D140F] border-[#202E24] text-zinc-300 hover:text-white hover:border-[#22C55E] hover:bg-[#111A13]'
                      }`}
                    >
                      {isSpeaking ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-4 bg-[#86EFAC] rounded-full animate-pulse" />
                          <span className="w-1.5 h-5 bg-[#86EFAC] rounded-full animate-bounce" />
                          <span className="w-1.5 h-3 bg-[#86EFAC] rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <SpeakerHigh size={18} weight="bold" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Floating Instruction Hint */}
        <div className="absolute bottom-4 left-5 z-20 pointer-events-none flex items-center gap-2 text-[11px] font-mono text-[#71717A] bg-[#090E0B]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1A261E]">
          <Sparkle size={13} className="text-[#86EFAC]" />
          <span>Arrastra para rotar en 3D · Rueda para zoom · Clic en nodo para desglose</span>
        </div>
      </div>
      </div>
      {/* ─── End Left Panel ──────────────────────────────────────────────── */}

      {/* ─── Fixed Right Inspector: Desglose Multidimensional 8D ──────────── */}
      {activeInspectorSkill && (
        <div className="w-full sm:w-[420px] bg-[#070D0A] border-l border-[#1A261E] z-30 shadow-2xl flex flex-col p-5 overflow-y-auto shrink-0 relative animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-[#1A261E] gap-2">
            <div>
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                style={{
                  color: (TRACK_META[activeInspectorSkill.category.toLowerCase()] || TRACK_META.foundation).color,
                  borderColor: (TRACK_META[activeInspectorSkill.category.toLowerCase()] || TRACK_META.foundation).color,
                  backgroundColor: `${(TRACK_META[activeInspectorSkill.category.toLowerCase()] || TRACK_META.foundation).color}15`,
                }}
              >
                {activeInspectorSkill.category.toUpperCase()}
              </span>
              <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                {activeInspectorSkill.name}
              </h3>
              <p className="text-xs text-[#71717A] font-mono mt-0.5">
                ID: {activeInspectorSkill.id}
              </p>
            </div>
            <button
              onClick={() => setActiveInspectorSkill(null)}
              className="p-1.5 rounded-lg bg-[#0D140F] border border-[#1A261E] text-zinc-400 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Audio TTS Station in Inspector */}
          <div className="my-4 p-3.5 rounded-xl bg-[#0D1610] border border-[#1F2E23] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SpeakerHigh size={16} className="text-[#86EFAC]" />
                <span className="text-xs font-bold text-white font-mono">Narrador Pedagógico (TTS)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#174A1F]/50 text-[#86EFAC] border border-[#22C55E]/40">
                Voz en Español
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 italic">
              "{ttsEngine.generateScript(
                activeInspectorSkill,
                nodeMap.get(activeInspectorSkill.id)?.score,
                nodeMap.get(activeInspectorSkill.id)?.state
              )}"
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#1A261E]">
              <button
                onClick={(e) => handleToggleTTS(e, activeInspectorSkill)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black text-xs font-bold transition-all shadow-md"
              >
                {ttsState.isPlaying && ttsState.currentSkillId === activeInspectorSkill.id ? (
                  <>
                    <Pause size={14} weight="bold" />
                    <span>Pausar Narración</span>
                  </>
                ) : (
                  <>
                    <Play size={14} weight="bold" />
                    <span>Escuchar Explicación</span>
                  </>
                )}
              </button>

              {/* Speed selectors */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {[0.8, 1.0, 1.2].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTtsSpeed(s);
                      ttsEngine.setRate(s);
                    }}
                    className={`px-2 py-1 rounded ${
                      ttsSpeed === s
                        ? 'bg-[#174A1F] text-[#86EFAC] font-bold'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 8-Dimensional Mastery Breakdown */}
          <div className="space-y-3 my-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                Desglose de Maestría (8 Dimensiones)
              </h4>
              <span className="text-xs font-bold font-mono text-[#86EFAC]">
                {nodeMap.get(activeInspectorSkill.id)?.score || 0}% Total
              </span>
            </div>

            {DIMENSION_CONFIG.map(({ key, label, desc }) => {
              const record = masteryRecords.find((m) => m.skill_id === activeInspectorSkill.id);
              const val = record?.dimensions ? record.dimensions[key] : 0;
              const pct = Math.round(val * 100);

              return (
                <div key={key} className="p-2.5 rounded-lg bg-[#0A110D] border border-[#16221A] space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-200 font-semibold">{label}</span>
                    <span className="text-[#86EFAC] font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#121A15] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#22C55E] to-[#06B6D4] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
                </div>
              );
            })}
          </div>

          {/* Prerequisites & Unlocks (Real Bridges) */}
          <div className="my-4 pt-3 border-t border-[#1A261E] space-y-3">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
              Puentes de Relación en el Grafo
            </h4>

            {/* Prerequisites */}
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">
                ← Prerrequisitos Requeridos:
              </span>
              {activeInspectorSkill.prerequisites && activeInspectorSkill.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeInspectorSkill.prerequisites.map((preId) => {
                    const preNode = nodeMap.get(preId);
                    return (
                      <button
                        key={preId}
                        onClick={() => focusNode(preId)}
                        className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60 transition-all"
                      >
                        <CaretRight size={12} />
                        <span>{preNode ? preNode.name : preId}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono italic">
                  Habilidad base, sin dependencias previas.
                </span>
              )}
            </div>

            {/* Unlocks */}
            <div>
              <span className="text-[11px] font-mono text-[#86EFAC] font-bold block mb-1">
                → Habilidades que Desbloquea:
              </span>
              {(() => {
                const unlockedSkills = skills.filter((s) => s.prerequisites?.includes(activeInspectorSkill.id));
                if (unlockedSkills.length === 0) {
                  return (
                    <span className="text-[11px] text-zinc-500 font-mono italic">
                      Habilidad terminal o capstone.
                    </span>
                  );
                }
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {unlockedSkills.map((unl) => (
                      <button
                        key={unl.id}
                        onClick={() => focusNode(unl.id)}
                        className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#174A1F]/40 border border-[#2B7836]/60 text-[#86EFAC] hover:bg-[#174A1F]/70 transition-all"
                      >
                        <CaretRight size={12} />
                        <span>{unl.name}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Launch Mission CTA if linked */}
          {onLaunchMission && (
            <div className="mt-auto pt-4 border-t border-[#1A261E]">
              {(() => {
                // Find mission training this skill
                const relatedMission = missions.find((m) =>
                  m.skills_trained?.includes(activeInspectorSkill.id)
                );

                if (!relatedMission) return null;

                return (
                  <button
                    onClick={() => onLaunchMission(relatedMission.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#174A1F] to-[#0A1C0D] border border-[#2B7836] text-[#86EFAC] font-mono text-xs font-bold hover:brightness-110 shadow-lg transition-all"
                  >
                    <Lightning size={16} weight="bold" />
                    <span>Practicar en Sandbox: {relatedMission.title}</span>
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
