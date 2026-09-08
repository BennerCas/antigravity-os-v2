import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  CheckCircle,
  Warning,
  ShieldCheck,
  Cpu,
  Play,
  Sparkle,
  ArrowRight,
  GitFork,
  Certificate,
  BookOpen,
  ChatCircleDots,
  Bug,
  ArrowsClockwise,
  X,
  Trophy,
  ShieldWarning,
  Flame,
  Clock,
  Graph
} from '@phosphor-icons/react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { academyApi } from '../lib/academyApi';
import type {
  LearningProfile,
  Track,
  MissionDefinition,
  MissionSession,
  SkillMasteryRecord,
  SkillGraphNode,
  EvidenceRecord,
  DriftAnalysisResult,
  CertificationRecord,
  PortfolioCompilation,
  CopilotRole,
  CopilotMessage,
  SimulationResult,
  ValidationFinding
} from '../types/academy';

import { MainPromptNode, ActionNode, PostItNode } from '../components/BuilderNodes';
import { ConditionNode } from '../components/builder/nodes/ConditionNode';
import { HumanNode } from '../components/builder/nodes/HumanNode';

const nodeTypes = {
  mainPrompt: MainPromptNode,
  action: ActionNode,
  postIt: PostItNode,
  condition: ConditionNode,
  human: HumanNode,
};

type AcademyTab = 'hub' | 'tracks' | 'sandbox' | 'graph' | 'drift' | 'certifications' | 'portfolio';

export default function Academy() {
  const [currentUserId] = useState<string>('learner_default');
  const [activeTab, setActiveTab] = useState<AcademyTab>('hub');
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [missions, setMissions] = useState<MissionDefinition[]>([]);
  const [activeMission, setActiveMission] = useState<MissionDefinition | null>(null);
  const [activeSession, setActiveSession] = useState<MissionSession | null>(null);
  const [masteryRecords, setMasteryRecords] = useState<SkillMasteryRecord[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [certifications, setCertifications] = useState<CertificationRecord[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioCompilation | null>(null);
  const [skillGraph, setSkillGraph] = useState<{ nodes: SkillGraphNode[]; links: any[] }>({ nodes: [], links: [] });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all');
  const [selectedSkillForDetail, setSelectedSkillForDetail] = useState<SkillMasteryRecord | null>(null);
  
  // Sandbox State
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);
  const [validationFindings, setValidationFindings] = useState<ValidationFinding[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [activeHintContent, setActiveHintContent] = useState<string | null>(null);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  
  // Copilot State
  const [copilotRole, setCopilotRole] = useState<CopilotRole>('socratic_guide');
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: string; text: string; action?: string }>>([]);
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);

  // Reflection Modal
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [reflectionSubmitting, setReflectionSubmitting] = useState<boolean>(false);

  // Drift Studio State
  const [driftSpecJson, setDriftSpecJson] = useState<string>(JSON.stringify({
    architecture_id: "arch_order_v1",
    critical_path: ["start_1", "validate_order", "human_approval", "charge_payment", "end_1"],
    required_human_gates: ["human_approval"],
    required_error_sinks: ["payment_failed_sink"]
  }, null, 2));
  const [driftBuilderJson, setDriftBuilderJson] = useState<string>(JSON.stringify({
    nodes: [
      { id: "start_1", data: { role: "start", title: "Start" } },
      { id: "validate_order", data: { role: "agent", title: "Validar Orden" } },
      { id: "charge_payment", data: { role: "agent", title: "Cobrar Pago" } },
      { id: "end_1", data: { role: "end", title: "End" } }
    ],
    edges: [
      { source: "start_1", target: "validate_order" },
      { source: "validate_order", target: "charge_payment" },
      { source: "charge_payment", target: "end_1" }
    ]
  }, null, 2));
  const [driftResult, setDriftResult] = useState<DriftAnalysisResult | null>(null);
  const [driftAnalyzing, setDriftAnalyzing] = useState<boolean>(false);

  // Token verification
  const [verifyTokenInput, setVerifyTokenInput] = useState<string>('');
  const [tokenVerifyResult, setTokenVerifyResult] = useState<any>(null);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [userProfile, tracksList, missionsList, masteryList, evList, _certsList, graphData] = await Promise.all([
        academyApi.getProfile(currentUserId),
        academyApi.getTracks(),
        academyApi.getMissions(),
        academyApi.getUserMastery(currentUserId),
        academyApi.getUserEvidence(currentUserId),
        academyApi.auditCertification(currentUserId, 'foundation').then(() => []).catch(() => []),
        academyApi.getSkillGraph().catch(() => ({ nodes: [], links: [] }))
      ]);

      setProfile(userProfile);
      setTracks(tracksList);
      setMissions(missionsList);
      setMasteryRecords(masteryList);
      setEvidenceList(evList);
      setSkillGraph(graphData);

      // Also get portfolio if available
      try {
        const port = await academyApi.getPortfolio(currentUserId);
        setPortfolio(port);
        setCertifications(port.certifications || []);
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error("Error loading academy data:", err);
      setErrorMsg(err.message || "Error al conectar con Antigravity Academy API");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Launch a Mission in Sandbox
  const handleLaunchMission = async (mission: MissionDefinition) => {
    try {
      setLoading(true);
      setActiveMission(mission);
      const session = await academyApi.startSession(currentUserId, mission.id);
      setActiveSession(session);
      
      const flowNodes = session.sandbox_flow?.nodes || [];
      const flowEdges = session.sandbox_flow?.edges || [];
      setRfNodes(flowNodes);
      setRfEdges(flowEdges);
      setUnlockedHints(session.hints_unlocked || []);
      setActiveHintContent(null);
      setSimResult(null);
      setCopilotHistory([
        {
          role: 'assistant',
          text: `Bienvenido a la misión: ${mission.title}. Analiza el problema, revisa la rúbrica y conecta los nodos requeridos.`
        }
      ]);

      // Initial validation
      const valRes = await academyApi.validateSessionFlow(session.id);
      setValidationFindings(valRes.all_findings || []);

      setActiveTab('sandbox');
    } catch (err: any) {
      console.error("Error launching mission:", err);
      setErrorMsg(err.message || "Error al iniciar misión");
    } finally {
      setLoading(false);
    }
  };

  // Sync flow changes to backend
  const handleFlowSaveAndValidate = async () => {
    if (!activeSession) return;
    try {
      setIsValidating(true);
      const updatedFlow = {
        nodes: rfNodes,
        edges: rfEdges
      };
      await academyApi.updateSessionFlow(activeSession.id, updatedFlow);
      const val = await academyApi.validateSessionFlow(activeSession.id);
      setValidationFindings(val.all_findings || []);
    } catch (err: any) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setRfEdges((eds) => addEdge(connection, eds));
    },
    [setRfEdges]
  );

  // Unlock next hint
  const handleUnlockHint = async (level: number) => {
    if (!activeSession) return;
    try {
      const res = await academyApi.unlockHint(activeSession.id, level);
      setUnlockedHints((prev) => Array.from(new Set([...prev, level])));
      setActiveHintContent(`[Nivel ${level}]: ${res.hint_text}`);
    } catch (err: any) {
      console.error("Error unlocking hint:", err);
    }
  };

  // Run Simulation
  const handleRunSimulation = async () => {
    if (!activeSession) return;
    try {
      setSimRunning(true);
      await handleFlowSaveAndValidate();
      const res = await academyApi.runSimulation(activeSession.id, {
        test_event: "academy_simulation_trigger",
        timestamp: new Date().toISOString()
      });
      setSimResult(res);
    } catch (err: any) {
      console.error("Simulation error:", err);
    } finally {
      setSimRunning(false);
    }
  };

  // Inject Chaos
  const handleInjectChaos = async (scenarioId: string) => {
    if (!activeSession) return;
    try {
      setLoading(true);
      const res = await academyApi.injectChaos(activeSession.id, scenarioId);
      const updated = await academyApi.getSession(activeSession.id);
      setActiveSession(updated);
      setRfNodes(updated.sandbox_flow?.nodes || []);
      setRfEdges(updated.sandbox_flow?.edges || []);
      const val = await academyApi.validateSessionFlow(activeSession.id);
      setValidationFindings(val.all_findings || []);
      alert(`Caos inyectado: ${res.message}. Observa la respuesta del sistema y repáralo.`);
    } catch (err: any) {
      alert(`Error al inyectar fallo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ask Copilot
  const handleSendCopilot = async () => {
    if (!copilotInput.trim() || !activeSession) return;
    const query = copilotInput.trim();
    setCopilotInput('');
    setCopilotHistory((prev) => [...prev, { role: 'user', text: query }]);
    try {
      setIsCopilotLoading(true);
      const msg: CopilotMessage = await academyApi.consultCopilot(activeSession.id, query, copilotRole);
      setCopilotHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: msg.message,
          action: msg.actionable_step
        }
      ]);
    } catch (err: any) {
      setCopilotHistory((prev) => [
        ...prev,
        { role: 'assistant', text: `Error de asistencia: ${err.message}` }
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Complete Mission & Submit Reflection
  const handleSubmitReflectionAndComplete = async () => {
    if (!activeSession || !reflectionText.trim()) return;
    try {
      setReflectionSubmitting(true);
      await academyApi.submitReflection(
        activeSession.id,
        reflectionText.trim(),
        "Explica por qué diseñaste esta arquitectura y cómo gestionas la resiliencia y los contratos."
      );
      const completeRes = await academyApi.completeMission(activeSession.id);
      setShowReflectionModal(false);
      alert(`¡Misión completada con éxito! Puntaje: ${Math.round(completeRes.score * 100)}%`);
      await loadInitialData();
      setActiveTab('hub');
    } catch (err: any) {
      alert(`No se pudo completar la misión: ${err.message}`);
    } finally {
      setReflectionSubmitting(false);
    }
  };

  // Clone to Workspace
  const handleCloneToWorkspace = async () => {
    if (!activeSession) return;
    try {
      const res = await academyApi.cloneToWorkspace(activeSession.id);
      alert(`Flujo promovido a producción: ${res.flow_id}. Ya está disponible en Nexus y Builder.`);
    } catch (err: any) {
      alert(`Error al promover flujo: ${err.message}`);
    }
  };

  // Run Drift Comparison
  const handleCompareDrift = async () => {
    try {
      setDriftAnalyzing(true);
      const spec = JSON.parse(driftSpecJson);
      const builder = JSON.parse(driftBuilderJson);
      const res = await academyApi.compareDrift(spec, builder);
      setDriftResult(res);
    } catch (err: any) {
      alert(`Error en análisis de Drift: ${err.message}`);
    } finally {
      setDriftAnalyzing(false);
    }
  };

  // Verify Certificate Token
  const handleVerifyToken = async () => {
    if (!verifyTokenInput.trim()) return;
    try {
      const res = await academyApi.verifyCertificate(verifyTokenInput.trim());
      setTokenVerifyResult(res);
    } catch (err: any) {
      setTokenVerifyResult({ status: 'INVALID', error: err.message });
    }
  };

  // Issue Certification
  const handleIssueCert = async (level: string) => {
    try {
      const cert = await academyApi.issueCertification(currentUserId, level);
      alert(`¡Certificación emitida! Token: ${cert.verification_token}`);
      await loadInitialData();
    } catch (err: any) {
      alert(`Requisitos no cumplidos: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-[#E0E0E0] font-sans antialiased select-none">
      {/* Top Header */}
      <header className="border-b border-[#1A1A1A] bg-[#0A0A0A]/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#174A1F] to-[#0A1C0D] flex items-center justify-center border border-[#2B7836] shadow-lg shadow-[#174A1F]/30">
            <GraduationCap size={24} weight="bold" className="text-[#86EFAC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide uppercase">Antigravity Academy V3</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#174A1F]/40 border border-[#2B7836]/60 text-[#86EFAC]">
                PROD-LOS
              </span>
            </div>
            <p className="text-xs text-[#71717A] font-mono">Learning Operating System & Verifiable Architecture Ledger</p>
          </div>
        </div>

        {/* Global Context Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#222222] text-xs font-mono text-[#A1A1AA]">
          <Cpu size={14} className="text-[#86EFAC]" />
          <span>[Contexto Cargado: Arquitecto_Sistemas + Ingeniero_Fullstack + Auditor_Industrial]</span>
        </div>

        {/* Learner Pill */}
        <div className="flex items-center gap-3 bg-[#111111] border border-[#262626] rounded-full px-4 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
          <div className="text-xs">
            <span className="text-[#71717A]">Learner: </span>
            <span className="text-white font-semibold font-mono">{currentUserId}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#86EFAC] font-mono uppercase font-bold border border-[#333333]">
            {profile?.level || 'Foundation'}
          </span>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-[#1A1A1A] bg-[#0A0A0A] px-6 flex overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'hub', label: 'Hub General', icon: <Trophy size={16} /> },
          { id: 'tracks', label: 'Rutas & Misiones (18+2)', icon: <BookOpen size={16} /> },
          { id: 'sandbox', label: 'Interactive Sandbox', icon: <Sparkle size={16} /> },
          { id: 'graph', label: 'Skill Graph & Mastery', icon: <Graph size={16} /> },
          { id: 'drift', label: 'Drift Studio', icon: <GitFork size={16} /> },
          { id: 'certifications', label: 'Certificaciones', icon: <Certificate size={16} /> },
          { id: 'portfolio', label: 'Portfolio Ledger', icon: <ShieldCheck size={16} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AcademyTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-[#22C55E] text-[#86EFAC] bg-[#174A1F]/15'
                  : 'border-transparent text-[#71717A] hover:text-white hover:bg-[#141414]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-[#270A0A] border border-[#7F1D1D] flex items-center justify-between text-red-200 text-xs">
          <div className="flex items-center gap-2">
            <Warning size={18} className="text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#71717A]">
            <ArrowsClockwise size={32} className="animate-spin text-[#22C55E]" />
            <p className="text-xs font-mono">Sincronizando estado de aprendizaje y evidencias...</p>
          </div>
        ) : (
          <>
            {/* 1. HUB TAB */}
            {activeTab === 'hub' && (
              <div className="space-y-8 max-w-7xl mx-auto">
                {/* Hero / Diagnostic Status Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F2012] via-[#081309] to-[#0D0D0D] border border-[#1E4D25] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174A1F]/50 border border-[#2B7836] text-[11px] font-mono text-[#86EFAC]">
                        <Flame size={14} /> Antigravity Adaptive Curriculum
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Aprende Diseñando Arquitecturas Reales de IA
                      </h2>
                      <p className="text-sm text-[#A1A1AA] leading-relaxed">
                        Progresa a través de 18 misiones estructuradas y 2 capstones industriales. Valida contratos de datos, inyecta fallos en el Failure Lab, calibra agentes autónomos y genera certificados respaldados por evidencias criptográficas SHA-256.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      <button
                        onClick={() => {
                          const firstUnfinished = missions.find(m => !(profile?.completed_missions || []).includes(m.id)) || missions[0];
                          if (firstUnfinished) handleLaunchMission(firstUnfinished);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#22C55E]/20"
                      >
                        <Play size={16} weight="fill" />
                        Continuar Aprendizaje
                      </button>
                      <button
                        onClick={() => setActiveTab('graph')}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#333333] text-white font-medium text-xs transition-all"
                      >
                        <Graph size={16} />
                        Ver Grafo de Habilidades
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#202020]">
                    <span className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider">Misiones Completadas</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white font-mono">{profile?.completed_missions?.length || 0}</span>
                      <span className="text-xs text-[#71717A]">/ 20</span>
                    </div>
                    <div className="mt-2 w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#22C55E] h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (((profile?.completed_missions?.length || 0) / 20) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#202020]">
                    <span className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider">Evidencias Ledger</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#86EFAC] font-mono">{evidenceList.length}</span>
                      <span className="text-xs text-[#71717A]">registros SHA-256</span>
                    </div>
                    <p className="mt-2 text-[10px] font-mono text-[#52525B]">100% Inmutables en SQLite WAL</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#202020]">
                    <span className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider">Certificaciones</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white font-mono">{certifications.length}</span>
                      <span className="text-xs text-[#71717A]">obtenidas</span>
                    </div>
                    <p className="mt-2 text-[10px] font-mono text-[#52525B]">Foundation · Practitioner · Expert</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#202020]">
                    <span className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider">Promedio de Dominio</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#86EFAC] font-mono">
                        {masteryRecords.length > 0
                          ? Math.round((masteryRecords.reduce((acc, curr) => acc + curr.mastery_score, 0) / masteryRecords.length) * 100)
                          : 0}%
                      </span>
                      <span className="text-xs text-[#71717A]">8 dimensiones</span>
                    </div>
                    <p className="mt-2 text-[10px] font-mono text-[#52525B]">Anti-Mock · Penalidad por Pistas</p>
                  </div>
                </div>

                {/* Tracks Overview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rutas de Maestría</h3>
                    <button
                      onClick={() => setActiveTab('tracks')}
                      className="text-xs text-[#22C55E] hover:underline flex items-center gap-1"
                    >
                      Explorar todas las rutas <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="p-5 rounded-xl bg-[#0F0F0F] border border-[#222222] hover:border-[#333333] transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#A1A1AA] border border-[#2A2A2A]">
                              Ruta 0{track.order}
                            </span>
                            <span className="text-xs font-mono text-[#71717A]">{track.mission_count} misiones</span>
                          </div>
                          <h4 className="text-base font-bold text-white">{track.title}</h4>
                          <p className="text-xs text-[#A1A1AA] leading-relaxed">{track.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTrackFilter(track.id);
                            setActiveTab('tracks');
                          }}
                          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#171717] hover:bg-[#202020] border border-[#2E2E2E] text-xs font-medium text-white transition-all"
                        >
                          Ver Misiones <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TRACKS & MISSIONS TAB */}
            {activeTab === 'tracks' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Filter Bar */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#1A1A1A] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Catálogo de Misiones Profesionales</h2>
                    <p className="text-xs text-[#71717A]">Aprende construyendo arquitecturas verificables en el Sandbox.</p>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setSelectedTrackFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedTrackFilter === 'all'
                          ? 'bg-[#22C55E] text-black font-bold'
                          : 'bg-[#141414] text-[#A1A1AA] hover:text-white'
                      }`}
                    >
                      Todas ({missions.length})
                    </button>
                    {tracks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTrackFilter(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                          selectedTrackFilter === t.id
                            ? 'bg-[#22C55E] text-black font-bold'
                            : 'bg-[#141414] text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Missions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missions
                    .filter((m) => selectedTrackFilter === 'all' || m.track_id === selectedTrackFilter)
                    .map((mission) => {
                      const isCompleted = (profile?.completed_missions || []).includes(mission.id);
                      return (
                        <div
                          key={mission.id}
                          className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                            isCompleted
                              ? 'bg-[#0A140C] border-[#1B4D22]'
                              : 'bg-[#0D0D0D] border-[#222222] hover:border-[#383838]'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#181818] text-[#86EFAC] border border-[#282828]">
                                {mission.difficulty}
                              </span>
                              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
                                <Clock size={12} />
                                <span>{mission.estimated_minutes} min</span>
                                {isCompleted && (
                                  <span className="flex items-center gap-1 text-[#22C55E] font-bold">
                                    <CheckCircle size={14} weight="fill" /> Completada
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white leading-snug">{mission.title}</h4>
                              <p className="text-xs text-[#999999] mt-1.5 line-clamp-2">{mission.problem_statement}</p>
                            </div>

                            {/* Skills trained */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mission.skills_trained.slice(0, 3).map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-[#A1A1AA] border border-[#222222]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleLaunchMission(mission)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                              isCompleted
                                ? 'bg-[#17301B] hover:bg-[#1C3E22] text-[#86EFAC] border border-[#2B6D36]'
                                : 'bg-[#22C55E] hover:bg-[#16A34A] text-black shadow-md shadow-[#22C55E]/10'
                            }`}
                          >
                            <Play size={14} weight="fill" />
                            {isCompleted ? 'Volver a Practicar' : 'Iniciar Misión'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 3. INTERACTIVE SANDBOX TAB */}
            {activeTab === 'sandbox' && (
              <div className="h-[calc(100vh-180px)] flex flex-col gap-3">
                {activeMission ? (
                  <>
                    {/* Sandbox Control Header */}
                    <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#222222] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181818] text-[#86EFAC] border border-[#282828] uppercase">
                            Misión: {activeMission.id}
                          </span>
                          <h2 className="text-sm font-bold text-white">{activeMission.title}</h2>
                        </div>
                        <p className="text-xs text-[#71717A] mt-0.5">{activeMission.problem_statement}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleFlowSaveAndValidate}
                          disabled={isValidating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#333333] text-xs font-medium text-white transition-all"
                        >
                          <ShieldCheck size={16} className="text-[#86EFAC]" />
                          {isValidating ? 'Validando...' : 'Validar Flujo'}
                        </button>

                        <button
                          onClick={handleRunSimulation}
                          disabled={simRunning}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#333333] text-xs font-medium text-white transition-all"
                        >
                          <Play size={16} className="text-[#22C55E]" />
                          {simRunning ? 'Simulando...' : 'Ejecutar Simulación'}
                        </button>

                        <button
                          onClick={() => setShowReflectionModal(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          <CheckCircle size={16} weight="fill" />
                          Defender & Graduar
                        </button>

                        <button
                          onClick={handleCloneToWorkspace}
                          title="Promover a Producción"
                          className="p-2 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#333333] text-white"
                        >
                          <GitFork size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Main Sandbox Layout: Left Canvas, Right Panels */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
                      {/* React Flow Canvas (3 cols) */}
                      <div className="lg:col-span-3 rounded-xl border border-[#222222] bg-[#080808] relative overflow-hidden flex flex-col">
                        <ReactFlowProvider>
                          <ReactFlow
                            nodes={rfNodes}
                            edges={rfEdges}
                            nodeTypes={nodeTypes}
                            onConnect={onConnect}
                            fitView
                            className="bg-[#050505]"
                          >
                            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#222222" />
                            <Controls className="bg-[#111111] border border-[#2A2A2A] text-white fill-white" />
                            <MiniMap
                              nodeStrokeColor="#22C55E"
                              nodeColor="#111111"
                              className="bg-[#0A0A0A] border border-[#2A2A2A]"
                            />
                          </ReactFlow>
                        </ReactFlowProvider>

                        {/* In-Canvas Bottom Drawer: Simulation & Findings */}
                        <div className="absolute bottom-3 left-3 right-3 bg-[#0D0D0D]/90 backdrop-blur-md border border-[#222222] rounded-xl p-3 max-h-40 overflow-y-auto flex flex-col gap-2 shadow-2xl">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#A1A1AA] font-bold flex items-center gap-2">
                              <ShieldWarning size={14} className="text-[#FBBF24]" />
                              Hallazgos de Validación ({validationFindings.length})
                            </span>
                            <span className="text-[10px] text-[#71717A]">
                              {validationFindings.filter(f => f.severity === 'blocking').length} Bloqueadores
                            </span>
                          </div>

                          {validationFindings.length === 0 ? (
                            <div className="text-xs text-[#22C55E] flex items-center gap-1.5 font-mono">
                              <CheckCircle size={14} /> Flujo topológicamente correcto y alineado a contratos.
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {validationFindings.map((f, idx) => (
                                <div
                                  key={idx}
                                  className={`text-[11px] p-1.5 rounded flex items-start justify-between gap-2 font-mono ${
                                    f.severity === 'blocking'
                                      ? 'bg-red-950/40 text-red-300 border border-red-900/50'
                                      : 'bg-yellow-950/30 text-yellow-300 border border-yellow-900/40'
                                  }`}
                                >
                                  <span>[{f.code}] {f.message}</span>
                                  <span className="text-[10px] text-zinc-400 underline cursor-help" title={f.suggested_action}>
                                    Acción sugerida
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {simResult && (
                            <div className="mt-1 pt-2 border-t border-[#222222] text-[11px] font-mono flex items-center justify-between">
                              <span className="text-zinc-300">
                                Estado Simulación: <strong className={simResult.status === 'success' ? 'text-green-400' : 'text-red-400'}>{simResult.status}</strong> ({simResult.execution_trace?.length || 0} pasos)
                              </span>
                              <span className="text-zinc-500">{simResult.duration_ms}ms</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Panel: Hints, Copilot & Chaos Lab (1 col) */}
                      <div className="rounded-xl border border-[#222222] bg-[#0D0D0D] flex flex-col overflow-hidden">
                        {/* Panel Selector */}
                        <div className="p-3 border-b border-[#1F1F1F] bg-[#111111] flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-white">
                            <ChatCircleDots size={16} className="text-[#22C55E]" /> Copilot & Pistas
                          </span>
                          <select
                            value={copilotRole}
                            onChange={(e) => setCopilotRole(e.target.value as CopilotRole)}
                            className="bg-[#1C1C1C] border border-[#333333] rounded px-2 py-1 text-[11px] text-[#A1A1AA] outline-none"
                          >
                            <option value="socratic_guide">Guía Socrático</option>
                            <option value="code_architect">Arquitecto</option>
                            <option value="failure_explainer">Analista Fallos</option>
                            <option value="resilience_coach">Coach Resiliencia</option>
                            <option value="capstone_defense_inquisitor">Inquisidor Capstone</option>
                          </select>
                        </div>

                        {/* Hint Ladder Section */}
                        <div className="p-3 border-b border-[#1F1F1F] bg-[#0A0A0A] space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#A1A1AA]">Escalera de Pistas (Penaliza Score)</span>
                            <span className="text-yellow-500 text-[10px]">Anti-Mock</span>
                          </div>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((lvl) => {
                              const isUnlocked = unlockedHints.includes(lvl);
                              return (
                                <button
                                  key={lvl}
                                  onClick={() => handleUnlockHint(lvl)}
                                  className={`flex-1 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                                    isUnlocked
                                      ? 'bg-[#1E3B22] text-[#86EFAC] border border-[#2D6A35]'
                                      : 'bg-[#181818] text-[#71717A] hover:text-white border border-[#2A2A2A]'
                                  }`}
                                >
                                  L{lvl}
                                </button>
                              );
                            })}
                          </div>
                          {activeHintContent && (
                            <div className="p-2 rounded bg-[#171717] border border-[#2B2B2B] text-[11px] text-[#A1A1AA] font-mono leading-tight">
                              {activeHintContent}
                            </div>
                          )}
                        </div>

                        {/* Failure Lab Fast Injector */}
                        <div className="p-3 border-b border-[#1F1F1F] bg-[#0A0A0A] space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#A1A1AA] flex items-center gap-1">
                              <Bug size={13} className="text-red-400" /> Inyectar Caos
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => handleInjectChaos('fail_schema_mismatch')}
                              className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-900/60 text-[10px] font-mono text-red-300"
                            >
                              Schema Mismatch
                            </button>
                            <button
                              onClick={() => handleInjectChaos('fail_rate_limit_429')}
                              className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-900/60 text-[10px] font-mono text-red-300"
                            >
                              Rate Limit 429
                            </button>
                            <button
                              onClick={() => handleInjectChaos('fail_duplicate_side_effect')}
                              className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-900/60 text-[10px] font-mono text-red-300"
                            >
                              Duplicado Idemp
                            </button>
                          </div>
                        </div>

                        {/* Copilot Chat Body */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs font-mono">
                          {copilotHistory.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg leading-relaxed ${
                                item.role === 'assistant'
                                  ? 'bg-[#151515] text-[#D4D4D8] border border-[#222222]'
                                  : 'bg-[#18341D] text-[#86EFAC] border border-[#26532E] ml-4'
                              }`}
                            >
                              <div>{item.text}</div>
                              {item.action && (
                                <div className="mt-1.5 pt-1.5 border-t border-[#2A2A2A] text-[10px] text-yellow-300">
                                  Paso sugerido: {item.action}
                                </div>
                              )}
                            </div>
                          ))}
                          {isCopilotLoading && (
                            <div className="p-2 text-zinc-500 flex items-center gap-2">
                              <ArrowsClockwise size={12} className="animate-spin" /> Analizando arquitectura...
                            </div>
                          )}
                        </div>

                        {/* Copilot Input */}
                        <div className="p-2 border-t border-[#1F1F1F] bg-[#111111] flex gap-2">
                          <input
                            type="text"
                            value={copilotInput}
                            onChange={(e) => setCopilotInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendCopilot()}
                            placeholder="Pregunta al Copilot Pedagógico..."
                            className="flex-1 bg-[#181818] border border-[#2B2B2B] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#22C55E]"
                          />
                          <button
                            onClick={handleSendCopilot}
                            disabled={isCopilotLoading || !copilotInput.trim()}
                            className="px-3 py-1.5 rounded bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-xs"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-[#71717A] gap-4">
                    <BookOpen size={48} className="text-[#333333]" />
                    <p className="text-sm">Selecciona una misión del catálogo para cargar el Sandbox de aprendizaje.</p>
                    <button
                      onClick={() => setActiveTab('tracks')}
                      className="px-4 py-2 rounded-lg bg-[#22C55E] text-black font-bold text-xs"
                    >
                      Ver Catálogo de Misiones
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. SKILL GRAPH & MASTERY TAB */}
            {activeTab === 'graph' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="border-b border-[#1A1A1A] pb-4">
                  <h2 className="text-lg font-bold text-white">Grafo de Habilidades & Maestría Multidimensional</h2>
                  <p className="text-xs text-[#71717A]">
                    Evaluación en 8 dimensiones: Corrección, Independencia, Transferencia, Confiabilidad, Comprensión, Consistencia, Complejidad y Seguridad.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Skills list categorized */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {skillGraph.nodes.map((skill) => {
                        const rec = masteryRecords.find(m => m.skill_id === skill.id);
                        const state = rec?.state || 'UNKNOWN';
                        const score = rec ? Math.round(rec.mastery_score * 100) : 0;

                        return (
                          <div
                            key={skill.id}
                            onClick={() => setSelectedSkillForDetail(rec || {
                              user_id: currentUserId,
                              skill_id: skill.id,
                              mastery_score: 0.0,
                              state: 'UNKNOWN',
                              attempts: 0,
                              successes: 0,
                              hints_taken: 0,
                              last_evaluated_at: new Date().toISOString(),
                              dimensions: {
                                correctness: 0, independence: 0, transfer: 0, reliability: 0,
                                comprehension: 0, consistency: 0, complexity: 0, safety: 0
                              }
                            })}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedSkillForDetail?.skill_id === skill.id
                                ? 'bg-[#152B1A] border-[#22C55E]'
                                : 'bg-[#0D0D0D] border-[#202020] hover:border-[#333333]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-[#71717A] uppercase">{skill.category}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                state === 'MASTERED' ? 'bg-[#174A1F] text-[#86EFAC]' :
                                state === 'INDEPENDENT' ? 'bg-blue-950 text-blue-300' :
                                state === 'COMPETENT' ? 'bg-cyan-950 text-cyan-300' :
                                state === 'NOVICE' ? 'bg-yellow-950 text-yellow-300' :
                                'bg-[#1A1A1A] text-zinc-500'
                              }`}>
                                {state}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1.5">{skill.name}</h4>
                            <div className="mt-3 flex items-center justify-between text-xs font-mono">
                              <span className="text-[#71717A]">Puntaje:</span>
                              <span className="text-white font-bold">{score}%</span>
                            </div>
                            <div className="mt-1 w-full bg-[#1A1A1A] h-1 rounded-full overflow-hidden">
                              <div className="bg-[#22C55E] h-full" style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Dimension Radar / Inspector */}
                  <div className="p-5 rounded-xl bg-[#0D0D0D] border border-[#222222] space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Desglose de Dimensiones
                    </h3>
                    {selectedSkillForDetail ? (
                      <div className="space-y-3 font-mono text-xs">
                        <div className="border-b border-[#202020] pb-2">
                          <span className="text-[10px] text-[#71717A] uppercase">Habilidad Seleccionada</span>
                          <h4 className="text-base font-bold text-white mt-0.5">{selectedSkillForDetail.skill_id}</h4>
                          <span className="text-xs text-[#22C55E]">Estado: {selectedSkillForDetail.state}</span>
                        </div>

                        {[
                          { key: 'correctness', label: 'Correctitud Funcional', val: selectedSkillForDetail.dimensions?.correctness || 0 },
                          { key: 'independence', label: 'Independencia (Sin Pistas)', val: selectedSkillForDetail.dimensions?.independence || 0 },
                          { key: 'transfer', label: 'Transferencia a Producción', val: selectedSkillForDetail.dimensions?.transfer || 0 },
                          { key: 'reliability', label: 'Resiliencia & Fallos', val: selectedSkillForDetail.dimensions?.reliability || 0 },
                          { key: 'comprehension', label: 'Defensa & Reflexión', val: selectedSkillForDetail.dimensions?.comprehension || 0 },
                          { key: 'consistency', label: 'Consistencia de Ejecución', val: selectedSkillForDetail.dimensions?.consistency || 0 },
                          { key: 'complexity', label: 'Manejo de Complejidad', val: selectedSkillForDetail.dimensions?.complexity || 0 },
                          { key: 'safety', label: 'Seguridad & HITL', val: selectedSkillForDetail.dimensions?.safety || 0 },
                        ].map((dim) => (
                          <div key={dim.key} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[#A1A1AA]">{dim.label}</span>
                              <span className="text-white font-bold">{Math.round(dim.val * 100)}%</span>
                            </div>
                            <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#22C55E] h-full" style={{ width: `${Math.round(dim.val * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#71717A]">Haz clic en cualquier habilidad para inspeccionar sus 8 dimensiones de dominio.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. DRIFT STUDIO TAB */}
            {activeTab === 'drift' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="border-b border-[#1A1A1A] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Drift Studio: Architecture vs. Implementation</h2>
                    <p className="text-xs text-[#71717A]">
                      Diferencial estricto entre el Architecture Spec formal y el Builder Flow. Detecta pasos faltantes, omisión de revisión humana y políticas de error descartadas.
                    </p>
                  </div>
                  <button
                    onClick={handleCompareDrift}
                    disabled={driftAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-xs uppercase tracking-wider"
                  >
                    <GitFork size={16} />
                    {driftAnalyzing ? 'Analizando...' : 'Ejecutar Análisis de Drift'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[#A1A1AA] font-bold">Architecture Specification (Spec)</label>
                    <textarea
                      value={driftSpecJson}
                      onChange={(e) => setDriftSpecJson(e.target.value)}
                      rows={12}
                      className="w-full bg-[#0D0D0D] border border-[#222222] rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[#A1A1AA] font-bold">Builder Flow Real (Implementation)</label>
                    <textarea
                      value={driftBuilderJson}
                      onChange={(e) => setDriftBuilderJson(e.target.value)}
                      rows={12}
                      className="w-full bg-[#0D0D0D] border border-[#222222] rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                {/* Drift Results Display */}
                {driftResult && (
                  <div className="p-5 rounded-xl bg-[#0D0D0D] border border-[#222222] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Resultado del Análisis de Drift</h3>
                      <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                        driftResult.is_compliant ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {driftResult.is_compliant ? 'CONFORME (100% Alineado)' : `NO CONFORME (${driftResult.total_drifts} Derivas)`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {driftResult.drifts.map((d, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] text-xs font-mono flex items-start justify-between gap-4">
                          <div>
                            <span className="text-red-400 font-bold">[{d.type}]</span> <span className="text-white">{d.description}</span>
                            <div className="text-[11px] text-[#A1A1AA] mt-1">Sugerencia: {d.suggested_action}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-red-900/40 text-red-300 border border-red-800">
                            {d.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. CERTIFICATIONS CENTER TAB */}
            {activeTab === 'certifications' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="border-b border-[#1A1A1A] pb-4">
                  <h2 className="text-lg font-bold text-white">Centro de Certificaciones Profesionales</h2>
                  <p className="text-xs text-[#71717A]">
                    Emisión y validación criptográfica de credenciales técnicas auditables mediante token AG-CERT.
                  </p>
                </div>

                {/* Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { level: 'foundation', title: 'Antigravity Foundation', req: 'Completar Misiones 0 a 3', color: '#22C55E' },
                    { level: 'practitioner', title: 'Antigravity Practitioner', req: 'Completar Misiones 0 a 11 + Capstone 1', color: '#38BDF8' },
                    { level: 'expert', title: 'Antigravity Expert Architect', req: 'Completar 18 Misiones + Capstone 2 Defendido', color: '#A855F7' }
                  ].map((cert) => {
                    const isOwned = certifications.some(c => c.level === cert.level);
                    return (
                      <div key={cert.level} className="p-6 rounded-2xl bg-[#0D0D0D] border border-[#222222] flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#181818] text-[#A1A1AA] border border-[#282828]">
                              Nivel {cert.level}
                            </span>
                            {isOwned && <span className="text-xs text-[#22C55E] font-bold">Emitida</span>}
                          </div>
                          <h3 className="text-base font-bold text-white">{cert.title}</h3>
                          <p className="text-xs text-[#71717A]">{cert.req}</p>
                        </div>
                        <button
                          onClick={() => handleIssueCert(cert.level)}
                          className="w-full py-2.5 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-xs font-bold text-white transition-all uppercase tracking-wider"
                        >
                          Auditar & Reclamar
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Verification Box */}
                <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-[#222222] space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verificador Público de Token</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyTokenInput}
                      onChange={(e) => setVerifyTokenInput(e.target.value)}
                      placeholder="Pega el token AG-CERT-... para auditar su validez criptográfica"
                      className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-2 text-xs font-mono text-white outline-none focus:border-[#22C55E]"
                    />
                    <button
                      onClick={handleVerifyToken}
                      className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-xs"
                    >
                      Verificar
                    </button>
                  </div>
                  {tokenVerifyResult && (
                    <div className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs font-mono">
                      <pre>{JSON.stringify(tokenVerifyResult, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. PORTFOLIO LEDGER TAB */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="border-b border-[#1A1A1A] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Portfolio Ledger Público</h2>
                    <p className="text-xs text-[#71717A]">
                      Arquitecturas aprobadas, cadenas de hash de evidencias y firmas digitales para evaluación técnica.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await academyApi.compilePortfolio(currentUserId);
                      setPortfolio(res);
                      alert('Portfolio compilado con las últimas evidencias.');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22C55E] text-black font-bold text-xs uppercase tracking-wider"
                  >
                    <ArrowsClockwise size={16} /> Compilar Portfolio
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-[#222222] space-y-6">
                  <div>
                    <span className="text-[10px] font-mono text-[#71717A] uppercase">Firma Digital del Portfolio</span>
                    <h3 className="text-sm font-bold text-white mt-1">{portfolio?.signature || 'HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®'}</h3>
                  </div>

                  {/* Evidence Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Cadenas de Evidencia SHA-256</h4>
                    <div className="space-y-2">
                      {evidenceList.slice(0, 8).map((ev) => (
                        <div key={ev.id} className="p-3 rounded-lg bg-[#141414] border border-[#222222] text-xs font-mono flex items-center justify-between gap-4">
                          <div className="truncate">
                            <span className="text-[#86EFAC] font-semibold">{ev.artifact_type}:</span> {ev.mission_id}
                            <div className="text-[10px] text-zinc-500 truncate">{ev.hash_sha256}</div>
                          </div>
                          <span className="text-[10px] text-zinc-400 whitespace-nowrap">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0F0F0F] border border-[#262626] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white">Defensa de Arquitectura & Reflexión</h3>
              <button onClick={() => setShowReflectionModal(false)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Explica las decisiones de diseño tomadas en este flujo: ¿por qué conectaste estos nodos? ¿cómo garantizas idempotencia y mitigas fallos en producción?
            </p>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              rows={5}
              placeholder="Escribe tu justificación técnica aquí..."
              className="w-full bg-[#141414] border border-[#2B2B2B] rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-[#22C55E]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReflectionModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1C1C1C] text-zinc-300 text-xs hover:bg-[#252525]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReflectionAndComplete}
                disabled={reflectionSubmitting || !reflectionText.trim()}
                className="px-5 py-2 rounded-lg bg-[#22C55E] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#16A34A]"
              >
                {reflectionSubmitting ? 'Graduando...' : 'Enviar Defensa & Graduar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Industrial Footer */}
      <footer className="border-t border-[#1A1A1A] bg-[#0A0A0A] px-6 py-3 flex items-center justify-between text-[11px] font-mono text-[#71717A]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span>ANTIGRAVITY ACADEMY V3 · VERIFIABLE LEARNING OPERATING SYSTEM</span>
        </div>
        <div className="text-white font-semibold tracking-wider">
          HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®
        </div>
      </footer>
    </div>
  );
}
