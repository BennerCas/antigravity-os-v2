import { useEffect, useRef, useState } from "react";
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import {
  Database,
  CheckCircle, Shield, Code2,
  X, Play, ChevronRight, Circle,
  Crosshair, Route, Zap, TrendingUp, Target, AlertCircle
} from "lucide-react";

import type {
  SkillGraphNode,
  SkillMasteryRecord,
  MissionDefinition
} from "../../types/academy";

export interface GraphSkillNode {
  id: string;
  name: string;
  desc?: string;
  val?: number;
  color?: string;
  icon?: string;
  group?: number;
  isSub?: boolean;
  x?: number;
  y?: number;
  z?: number;
  [key: string]: unknown;
}

export interface GraphSkillLink {
  source: string | GraphSkillNode;
  target: string | GraphSkillNode;
  name?: string;
  [key: string]: unknown;
}

export interface KnowledgeGraph3DProps {
  skills?: SkillGraphNode[];
  links?: GraphSkillLink[];
  masteryRecords?: SkillMasteryRecord[];
  missions?: MissionDefinition[];
  selectedSkillId?: string;
  onSelectSkill?: (skill: SkillGraphNode, rec?: SkillMasteryRecord) => void;
  onLaunchMission?: (missionId: string) => void;
  currentUserId?: string;
}

export const gData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = {
  nodes: [
    {"id": "center", "name": "FLOWARCHITECT AI", "desc": "Core Ontology of the Antigravity Agentic Framework.", "val": 40, "color": "#39ff14", "group": 0, "icon": "\ud83d\ude80"},
    {"id": "n1", "name": "1. Navegaci\u00f3n del Canvas", "desc": "Navegaci\u00f3n del Canvas", "val": 32, "color": "#00f5d4", "icon": "\ud83e\udded", "group": 1},
    {"id": "n1_mission_00", "name": "Elige tu destino: Diagn\u00f3stico e Intenci\u00f3n", "desc": "Define tu objetivo de aprendizaje y autoeval\u00faa tu experiencia previa para configurar tu ruta adaptativa.", "val": 12, "color": "#00f5d4", "group": 1, "isSub": true},
    {"id": "n2", "name": "2. Conexiones de Grafo", "desc": "Conexiones de Grafo", "val": 32, "color": "#00f5d4", "icon": "\ud83e\udded", "group": 1},
    {"id": "n2_mission_01", "name": "Primer flujo funcional: Clasifica una solicitud", "desc": "Construye un flujo Start \u2192 Agent \u2192 End. El agente debe recibir un mensaje de soporte y clasificar su categor\u00eda.", "val": 12, "color": "#00f5d4", "group": 1, "isSub": true},
    {"id": "n2_mission_02", "name": "Lee antes de construir: Encuentra el flujo roto", "desc": "Un agente est\u00e1 conectado a dos destinos sin un nodo de decisi\u00f3n expl\u00edcito. Encuentra la ambig\u00fcedad y resu\u00e9lvela.", "val": 12, "color": "#00f5d4", "group": 1, "isSub": true},
    {"id": "n3", "name": "3. Contratos de Datos y Transforms", "desc": "Contratos de Datos y Transforms", "val": 32, "color": "#00bbf9", "icon": "\ud83c\udfd7\ufe0f", "group": 2},
    {"id": "n3_mission_03", "name": "Variables y transforms: De texto a dato \u00fatil", "desc": "Llega un string textual 'USD 1,250.00' y la decisi\u00f3n contable requiere un n\u00famero float. Inserta un Transform de parseo.", "val": 12, "color": "#00bbf9", "group": 2, "isSub": true},
    {"id": "n3_mission_07", "name": "Revisi\u00f3n por evidencia: Corrige un contrato roto", "desc": "Un agente devuelve amount como string y una tool de ERP exige number. Usa Contract Inspector para localizar y subsanar.", "val": 12, "color": "#00bbf9", "group": 2, "isSub": true},
    {"id": "n4", "name": "4. Decisiones Deterministas", "desc": "Decisiones Deterministas", "val": 32, "color": "#00bbf9", "icon": "\ud83c\udfd7\ufe0f", "group": 2},
    {"id": "n4_mission_04", "name": "Decisiones deterministas: Ruta de prioridad", "desc": "Configura una condici\u00f3n con urgencia >= 8 para escalar, de lo contrario responder normal, cubriendo la ruta de error.", "val": 12, "color": "#00bbf9", "group": 2, "isSub": true},
    {"id": "n5", "name": "5. Clasificaci\u00f3n con IA", "desc": "Clasificaci\u00f3n con IA", "val": 32, "color": "#00bbf9", "icon": "\ud83c\udfd7\ufe0f", "group": 2},
    {"id": "n5_mission_05", "name": "Clasificaci\u00f3n con IA: Cuando la regla no basta", "desc": "Clasifica el tono de un cliente en 'enojado', 'neutral', 'positivo' o 'incierto'. Si la confianza es menor a 0.7, desv\u00eda a revisi\u00f3n humana.", "val": 12, "color": "#00bbf9", "group": 2, "isSub": true},
    {"id": "n6", "name": "6. Prompt Engineering como C\u00f3digo", "desc": "Prompt Engineering como C\u00f3digo", "val": 32, "color": "#00bbf9", "icon": "\ud83c\udfd7\ufe0f", "group": 2},
    {"id": "n6_mission_06", "name": "Prompt como contrato: Agente de respuesta segura", "desc": "Construye un agente de soporte con prop\u00f3sito, contexto, restricciones y schema estricto que no invente pol\u00edticas.", "val": 12, "color": "#00bbf9", "group": 2, "isSub": true},
    {"id": "n6_mission_17", "name": "Laboratorio de prompts y evaluaci\u00f3n: Mejora sin romper", "desc": "Gestiona un sistema documental con 15+ prompts versionados, ejecutando suites de regresi\u00f3n para garantizar que ninguna mejora cause drift aguas abajo.", "val": 12, "color": "#00bbf9", "group": 2, "isSub": true},
    {"id": "n7", "name": "7. Capabilities y M\u00ednimo Privilegio", "desc": "Capabilities y M\u00ednimo Privilegio", "val": 32, "color": "#fee440", "icon": "\u2699\ufe0f", "group": 3},
    {"id": "n7_mission_08", "name": "Capabilities y permisos: Enviar sin exponer secretos", "desc": "Env\u00eda un mensaje de Slack a partir de un ticket escalado usando una referencia de credencial segura de sandbox.", "val": 12, "color": "#fee440", "group": 3, "isSub": true},
    {"id": "n8", "name": "8. Fiabilidad, Retry e Idempotencia", "desc": "Fiabilidad, Retry e Idempotencia", "val": 32, "color": "#fee440", "icon": "\u2699\ufe0f", "group": 3},
    {"id": "n8_mission_09", "name": "Retry e idempotencia: No env\u00edes dos veces", "desc": "Un webhook responde timeout tras aceptar la orden. Declara idempotency_key y demuestra que eventos duplicados no causan doble cobro.", "val": 12, "color": "#fee440", "group": 3, "isSub": true},
    {"id": "n9", "name": "9. Human-in-the-Loop Resiliente", "desc": "Human-in-the-Loop Resiliente", "val": 32, "color": "#fee440", "icon": "\u2699\ufe0f", "group": 3},
    {"id": "n9_mission_10", "name": "Human-in-the-loop: Aprobaci\u00f3n con vencimiento", "desc": "Una solicitud de reembolso mayor a 500 USD requiere aprobaci\u00f3n de un supervisor con l\u00edmite de 24h y ruta ante expiraci\u00f3n.", "val": 12, "color": "#fee440", "group": 3, "isSub": true},
    {"id": "n10", "name": "10. Observabilidad e Inspecci\u00f3n de Trazas", "desc": "Observabilidad e Inspecci\u00f3n de Trazas", "val": 32, "color": "#fee440", "icon": "\u2699\ufe0f", "group": 3},
    {"id": "n10_mission_11", "name": "Observabilidad: Explica qu\u00e9 ocurri\u00f3", "desc": "Un flujo termin\u00f3 en dead-letter. Usa el Run Inspector para encontrar el nodo culpable, clase de error y causa ra\u00edz.", "val": 12, "color": "#fee440", "group": 3, "isSub": true},
    {"id": "n11", "name": "11. Discovery Arquitect\u00f3nico", "desc": "Discovery Arquitect\u00f3nico", "val": 32, "color": "#f15bb5", "icon": "\ud83d\udcd0", "group": 4},
    {"id": "n11_mission_12", "name": "FlowArchitect Discovery: De idea a requisito", "desc": "Convierte un requerimiento informal de procesamiento de proveedores en un Requirement Map formal, rechazando suposiciones inseguras.", "val": 12, "color": "#f15bb5", "group": 4, "isSub": true},
    {"id": "n12", "name": "12. Dise\u00f1o de Blueprint y Rutas de Fallo", "desc": "Dise\u00f1o de Blueprint y Rutas de Fallo", "val": 32, "color": "#f15bb5", "icon": "\ud83d\udcd0", "group": 4},
    {"id": "n12_mission_13", "name": "Blueprint y rutas de fallo: Dise\u00f1a antes de dibujar", "desc": "Especifica el ArchitectureSpec completo para procesamiento de facturas con rutas para archivo corrupto, schema inv\u00e1lido y timeout.", "val": 12, "color": "#f15bb5", "group": 4, "isSub": true},
    {"id": "n13", "name": "13. Subflows y Composici\u00f3n Modular", "desc": "Subflows y Composici\u00f3n Modular", "val": 32, "color": "#f15bb5", "icon": "\ud83d\udcd0", "group": 4},
    {"id": "n13_mission_14", "name": "Subflows reutilizables: Una capacidad, varios equipos", "desc": "Encapsula el proceso 'Validar Proveedor' en un subflow con schema versionado y util\u00edzalo en dos flujos diferentes.", "val": 12, "color": "#f15bb5", "group": 4, "isSub": true},
    {"id": "n14", "name": "14. Paralelismo, Joins y Reducers", "desc": "Paralelismo, Joins y Reducers", "val": 32, "color": "#f15bb5", "icon": "\ud83d\udcd0", "group": 4},
    {"id": "n15", "name": "15. Orquestaci\u00f3n Multiagente", "desc": "Orquestaci\u00f3n Multiagente", "val": 32, "color": "#9b5de5", "icon": "\ud83d\udc51", "group": 5},
    {"id": "n15_mission_16", "name": "Equipo de agentes: Orquesta una investigaci\u00f3n", "desc": "Dise\u00f1a un equipo de 6 agentes (Investigador 1, Investigador 2, Cr\u00edtico, Sintetizador, Verificador, Redactor) con handoffs tipados y ruta de contradicci\u00f3n.", "val": 12, "color": "#9b5de5", "group": 5, "isSub": true},
    {"id": "n16", "name": "16. Evaluaci\u00f3n de Prompts en Masa", "desc": "Evaluaci\u00f3n de Prompts en Masa", "val": 32, "color": "#9b5de5", "icon": "\ud83d\udc51", "group": 5},
    {"id": "n16_mission_17", "name": "Laboratorio de prompts y evaluaci\u00f3n: Mejora sin romper", "desc": "Gestiona un sistema documental con 15+ prompts versionados, ejecutando suites de regresi\u00f3n para garantizar que ninguna mejora cause drift aguas abajo.", "val": 12, "color": "#9b5de5", "group": 5, "isSub": true},
    {"id": "n17", "name": "17. Defensa T\u00e9cnica de Arquitectura", "desc": "Defensa T\u00e9cnica de Arquitectura", "val": 32, "color": "#9b5de5", "icon": "\ud83d\udc51", "group": 5},
    {"id": "n17_mission_18", "name": "Capstone Expert: Centro de Operaciones de Agentes (Operations Intelligence Desk)", "desc": "Construye un sistema multiagente de grado industrial: 15+ prompts, 8+ agentes, 3+ capabilities, 2+ subflows, Fork/Join, Human Gate, retries, 10 escenarios de caos y defensa t\u00e9cnica oral.", "val": 12, "color": "#9b5de5", "group": 5, "isSub": true},
  ],
  links: [
    {"source": "center", "target": "n1", "name": "core_competency"},
    {"source": "n1", "target": "n1_mission_00", "name": "evaluates_with"},
    {"source": "center", "target": "n2", "name": "core_competency"},
    {"source": "n2", "target": "n2_mission_01", "name": "evaluates_with"},
    {"source": "n2", "target": "n2_mission_02", "name": "evaluates_with"},
    {"source": "center", "target": "n3", "name": "core_competency"},
    {"source": "n3", "target": "n3_mission_03", "name": "evaluates_with"},
    {"source": "n3", "target": "n3_mission_07", "name": "evaluates_with"},
    {"source": "center", "target": "n4", "name": "core_competency"},
    {"source": "n4", "target": "n4_mission_04", "name": "evaluates_with"},
    {"source": "center", "target": "n5", "name": "core_competency"},
    {"source": "n5", "target": "n5_mission_05", "name": "evaluates_with"},
    {"source": "center", "target": "n6", "name": "core_competency"},
    {"source": "n6", "target": "n6_mission_06", "name": "evaluates_with"},
    {"source": "n6", "target": "n6_mission_17", "name": "evaluates_with"},
    {"source": "center", "target": "n7", "name": "core_competency"},
    {"source": "n7", "target": "n7_mission_08", "name": "evaluates_with"},
    {"source": "center", "target": "n8", "name": "core_competency"},
    {"source": "n8", "target": "n8_mission_09", "name": "evaluates_with"},
    {"source": "center", "target": "n9", "name": "core_competency"},
    {"source": "n9", "target": "n9_mission_10", "name": "evaluates_with"},
    {"source": "center", "target": "n10", "name": "core_competency"},
    {"source": "n10", "target": "n10_mission_11", "name": "evaluates_with"},
    {"source": "center", "target": "n11", "name": "core_competency"},
    {"source": "n11", "target": "n11_mission_12", "name": "evaluates_with"},
    {"source": "center", "target": "n12", "name": "core_competency"},
    {"source": "n12", "target": "n12_mission_13", "name": "evaluates_with"},
    {"source": "center", "target": "n13", "name": "core_competency"},
    {"source": "n13", "target": "n13_mission_14", "name": "evaluates_with"},
    {"source": "center", "target": "n14", "name": "core_competency"},
    {"source": "center", "target": "n15", "name": "core_competency"},
    {"source": "n15", "target": "n15_mission_16", "name": "evaluates_with"},
    {"source": "center", "target": "n16", "name": "core_competency"},
    {"source": "n16", "target": "n16_mission_17", "name": "evaluates_with"},
    {"source": "center", "target": "n17", "name": "core_competency"},
    {"source": "n17", "target": "n17_mission_18", "name": "evaluates_with"},
    {"source": "n1", "target": "n2", "name": "prerequisite"},
    {"source": "n2", "target": "n3", "name": "prerequisite"},
    {"source": "n2", "target": "n4", "name": "prerequisite"},
    {"source": "n4", "target": "n5", "name": "prerequisite"},
    {"source": "n3", "target": "n6", "name": "prerequisite"},
    {"source": "n3", "target": "n7", "name": "prerequisite"},
    {"source": "n7", "target": "n8", "name": "prerequisite"},
    {"source": "n4", "target": "n9", "name": "prerequisite"},
    {"source": "n8", "target": "n9", "name": "prerequisite"},
    {"source": "n8", "target": "n10", "name": "prerequisite"},
    {"source": "n6", "target": "n11", "name": "prerequisite"},
    {"source": "n11", "target": "n12", "name": "prerequisite"},
    {"source": "n4", "target": "n12", "name": "prerequisite"},
    {"source": "n3", "target": "n13", "name": "prerequisite"},
    {"source": "n12", "target": "n13", "name": "prerequisite"},
    {"source": "n14", "target": "n15", "name": "prerequisite"},
    {"source": "n6", "target": "n15", "name": "prerequisite"},
    {"source": "n15", "target": "n16", "name": "prerequisite"},
    {"source": "n16", "target": "n17", "name": "prerequisite"},
    {"source": "n10", "target": "n17", "name": "prerequisite"},
  ]
};

export function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance<GraphSkillNode, GraphSkillLink> | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphSkillNode | null>(() => gData.nodes.find(n => n.id === 'center') || null);
  const [nodeHistory, setNodeHistory] = useState<GraphSkillNode[]>([]);

  const selectNode = (node: GraphSkillNode | null) => {
    if (node === null) {
      setSelectedNode(null);
      setNodeHistory([]);
    } else {
      if (selectedNode && selectedNode.id !== node.id) {
        setNodeHistory(prev => [...prev, selectedNode]);
      }
      setSelectedNode(node);
    }
  };

  const handleBack = () => {
    if (nodeHistory.length > 0) {
      const newHistory = [...nodeHistory];
      const prevNode = newHistory.pop();
      setSelectedNode(prevNode || null);
      setNodeHistory(newHistory);
      
      if (prevNode && typeof prevNode.x === 'number' && typeof prevNode.y === 'number' && typeof prevNode.z === 'number') {
        if (graphRef.current) {
          const hyp = Math.hypot(prevNode.x, prevNode.y, prevNode.z);
          const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
          graphRef.current.cameraPosition(
            { x: prevNode.x * distRatio, y: prevNode.y * distRatio, z: prevNode.z * distRatio },
            prevNode as unknown as { x: number; y: number; z: number },
            2000
          );
        }
      }
    } else {
      selectNode(null);
    }
  };
  const [activeTab, setActiveTab] = useState<'info' | 'competencias' | 'sistema' | 'progreso'>('info');
  const [contextFilter, setContextFilter] = useState('FlowArchitect AI');
  const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');

  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);


  const globalScore = props.masteryRecords && props.masteryRecords.length > 0
    ? Math.round((props.masteryRecords.reduce((acc, r) => acc + (r.mastery_score || 0), 0) / props.masteryRecords.length) * 100)
    : 68;
  const masteredCount = props.masteryRecords && props.masteryRecords.length > 0
    ? props.masteryRecords.filter(r => r.state === 'MASTERED').length
    : 46;
  const practicingCount = props.masteryRecords && props.masteryRecords.length > 0
    ? props.masteryRecords.filter(r => r.state === 'INDEPENDENT' || r.state === 'COMPETENT').length
    : 12;
  const unstartedCount = props.masteryRecords && props.masteryRecords.length > 0
    ? props.masteryRecords.filter(r => r.state === 'NOVICE').length
    : 18;
  const reviewCount = props.masteryRecords && props.masteryRecords.length > 0
    ? props.masteryRecords.filter(r => r.state === 'UNKNOWN').length
    : 4;
  const blockedCount = props.masteryRecords && props.masteryRecords.length > 0
    ? props.masteryRecords.filter(r => r.attempts > 0 && r.successes === 0).length
    : 2;

  const selectedRecord = props.masteryRecords?.find((m) => m.skill_id === selectedNode?.id);
  const selectedScore = selectedRecord
    ? Math.round(selectedRecord.mastery_score * 100)
    : (selectedNode?.val ? Math.min(100, selectedNode.val * 2) : 74);

  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const handleLaunchMission = (targetId: string) => {
    const launchFn = propsRef.current.onLaunchMission;
    if (!launchFn) return;
    const currentMissions = propsRef.current.missions || [];
    const cleanTargetId = targetId.includes('_mission_') ? targetId.substring(targetId.indexOf('_') + 1) : targetId;
    const matched = currentMissions.find((m) => m.id === cleanTargetId || m.skills_trained?.includes(cleanTargetId));
    const finalId = matched ? matched.id : (currentMissions[0]?.id || targetId);
    launchFn(finalId);
  };

  useEffect(() => {
    if (props.selectedSkillId && graphRef.current) {
      const liveData = graphRef.current.graphData() as { nodes: GraphSkillNode[]; links: GraphSkillLink[] };
      if (liveData && liveData.nodes) {
        const found = liveData.nodes.find((n) => n.id === props.selectedSkillId);
        if (found) {
          selectNode(found);
          setActiveTab('info');
          if (typeof found.x === 'number' && typeof found.y === 'number' && typeof found.z === 'number') {
            const hyp = Math.hypot(found.x, found.y, found.z);
            const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
            graphRef.current.cameraPosition(
              { x: found.x * distRatio, y: found.y * distRatio, z: found.z * distRatio },
              found as unknown as { x: number; y: number; z: number },
              2000
            );
          }
        }
      }
    }
  }, [props.selectedSkillId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialGraphData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = JSON.parse(JSON.stringify(gData));

    const renderCustomNode = (node: GraphSkillNode) => {
      if (node.isSub) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const text = `📘  ${node.name}`;
        ctx.font = "28px Inter, sans-serif";
        const textWidth = ctx.measureText(text).width;
        const canvasWidth = Math.max(300, textWidth + 80);
        const canvasHeight = 80;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = "#141923";
        ctx.beginPath();
        ctx.roundRect(10, 10, canvasWidth - 20, 60, 30);
        ctx.fill();

        ctx.strokeStyle = node.color || "#ffffff";
        ctx.lineWidth = 4;
        ctx.shadowColor = node.color || "#ffffff";
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.font = "28px Inter, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;
        ctx.fillText(text, canvasWidth / 2, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(canvasWidth / 10, 8, 1);
        return sprite;
      } else {
        const group = new THREE.Group();
        const sphereRadius = (node.val || 10) * 0.4;
        
        const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: node.color || "#ffffff", 
            transparent: false, 
            opacity: 1.0
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        group.add(sphere);

        if (node.icon) {
            const iconCanvas = document.createElement("canvas");
            const iconCtx = iconCanvas.getContext("2d");
            if(iconCtx) {
              iconCanvas.width = 128;
              iconCanvas.height = 128;
              iconCtx.font = "bold 64px sans-serif";
              iconCtx.fillStyle = "#ffffff";
              iconCtx.textAlign = "center";
              iconCtx.textBaseline = "middle";
              iconCtx.fillText(node.icon, 64, 64);
              
              const iconTex = new THREE.CanvasTexture(iconCanvas);
              const iconMat = new THREE.SpriteMaterial({ map: iconTex, depthTest: false });
              const iconSprite = new THREE.Sprite(iconMat);
              iconSprite.scale.set(sphereRadius, sphereRadius, 1);
              iconSprite.renderOrder = 1;
              group.add(iconSprite);
            }
        }

        const textCanvas = document.createElement("canvas");
        const textCtx = textCanvas.getContext("2d");
        if(textCtx) {
          textCanvas.width = 512;
          textCanvas.height = 256;
          textCtx.fillStyle = "#ffffff";
          textCtx.textAlign = "center";
          textCtx.textBaseline = "top";
          
          textCtx.font = "bold 36px Inter, sans-serif";
          textCtx.shadowColor = "rgba(0,0,0,0.8)";
          textCtx.shadowBlur = 10;
          const lines = node.name.split("\n");
          lines.forEach((line: string, i: number) => {
              textCtx.fillText(line, 256, 10 + (i * 45));
          });

          if(node.desc) {
              textCtx.font = "24px Inter, sans-serif";
              textCtx.fillStyle = "#cbd5e1";
              const descLines = node.desc.split("\n");
              descLines.forEach((line: string, i: number) => {
                  textCtx.fillText(line, 256, 10 + (lines.length * 45) + (i * 30));
              });
          }

          const textTex = new THREE.CanvasTexture(textCanvas);
          const textMat = new THREE.SpriteMaterial({ map: textTex, transparent: true, depthTest: false });
          const textSprite = new THREE.Sprite(textMat);
          textSprite.scale.set(60, 30, 1);
          textSprite.position.set(0, -(sphereRadius + 12), 0);
          group.add(textSprite);
        }

        return group;
      }
    };

    const getSourceNode = (source: string | GraphSkillNode): GraphSkillNode | undefined => {
      if (typeof source === 'object' && source !== null) return source;
      return initialGraphData.nodes.find((n) => n.id === source);
    };

    const getTargetNode = (target: string | GraphSkillNode): GraphSkillNode | undefined => {
      if (typeof target === 'object' && target !== null) return target;
      return initialGraphData.nodes.find((n) => n.id === target);
    };

    const createForceGraph = ForceGraph3D as unknown as () => (
      element: HTMLElement
    ) => ForceGraph3DInstance<GraphSkillNode, GraphSkillLink>;

    const graph = createForceGraph()(containerRef.current)
      .graphData(initialGraphData)
      .backgroundColor("#050814")
      .showNavInfo(false)
      .nodeThreeObject(renderCustomNode as (node: GraphSkillNode) => THREE.Object3D)
      .linkWidth((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0.5 : 2;
      })
      .linkColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? `${sourceNode.color}66` : "rgba(255,255,255,0.2)"; 
      })
      .linkDirectionalParticles((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0 : 3;
      })
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? (sourceNode.color || "#ffffff") : "#ffffff";
      })
      .linkThreeObjectExtend(true)
      .linkThreeObject((link: GraphSkillLink) => {
        if (!link.name) return null as unknown as THREE.Object3D;
        const sprite = new SpriteText(link.name);
        sprite.color = "#94a3b8";
        sprite.textHeight = 4;
        return sprite as unknown as THREE.Object3D;
      })
      .linkPositionUpdate((sprite: THREE.Object3D, { start, end }: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number } }) => {
        if(!sprite) return;
        const middlePos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2,
            z: start.z + (end.z - start.z) / 2
        };
        Object.assign(sprite.position, middlePos);
      });

    const d3ChargeForce = graph.d3Force("charge") as unknown as { strength?: (strength: number) => void } | undefined;
    if (d3ChargeForce && typeof d3ChargeForce.strength === 'function') {
      d3ChargeForce.strength(-400);
    }

    const d3LinkForce = graph.d3Force("link") as unknown as { distance?: (fn: (link: GraphSkillLink) => number) => void } | undefined;
    if (d3LinkForce && typeof d3LinkForce.distance === 'function') {
      d3LinkForce.distance((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 40 : 120;
      });
    }

    graph.onNodeClick((node: GraphSkillNode) => {
      selectNode(node);
      setActiveTab('info');
      // Optional: animate camera to node
      if (node && typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number') {
        const hyp = Math.hypot(node.x, node.y, node.z);
        const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
        graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node as unknown as { x: number; y: number; z: number },
          2000
        );
      }
      if (propsRef.current.onSelectSkill) {
        const rec = propsRef.current.masteryRecords?.find((m) => m.skill_id === node.id);
        propsRef.current.onSelectSkill(node as unknown as SkillGraphNode, rec);
      }
    });

    graph.onBackgroundClick(() => {
      selectNode(null);
    });

    graph.cameraPosition({ x: 0, y: -50, z: 350 });

    // Add subtle procedural stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 2000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x4a5568, size: 1.5, transparent: true, opacity: 0.4 });
    const starMesh = new THREE.Points(starGeo, starMat);
    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
    }

    const handleResize = () => {
      if(containerRef.current) {
        graph.width(containerRef.current.clientWidth);
        graph.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    setTimeout(handleResize, 100);

    graphRef.current = graph;

    return () => {
      window.removeEventListener("resize", handleResize);
      if (graphRef.current && typeof graphRef.current._destructor === 'function') {
        graphRef.current._destructor();
      }
    };
  }, []);
  // Camera Rotation
  useEffect(() => {
    let frameId: number;
    let angle = 0;
    const rotateCamera = () => {
      if(rotationOn && graphRef.current) {
        angle += 0.005 * rotationSpeed;
        const radius = isExpanded ? 300 : 500;
        graphRef.current.cameraPosition({
          x: radius * Math.sin(angle),
          z: radius * Math.cos(angle),
          y: isExpanded ? 200 : 350
        });
      }
      frameId = requestAnimationFrame(rotateCamera);
    };
    rotateCamera();
    return () => cancelAnimationFrame(frameId);
  }, [rotationOn, rotationSpeed, isExpanded]);

  // Context Filter Visibility
  useEffect(() => {
    if (graphRef.current) {
      if (contextFilter === 'all') {
        graphRef.current.nodeVisibility(() => true);
        graphRef.current.linkVisibility(() => true);
      } else {
        const groupNum = contextFilter === 'G1' ? 1 : contextFilter === 'G2' ? 2 : contextFilter === 'G3' ? 3 : 4;
        graphRef.current.nodeVisibility((n) => {
          if (n.id === 'center' || n.group === 0) return true;
          // Si es un nodo de skill (n.isSub es falso), muéstralo siempre o solo si coincide? Mostramos skills base
          if (!n.isSub) return true;
          // Para sub-nodos, filtramos por grupo
          return n.group === groupNum;
        });
        graphRef.current.linkVisibility((l) => {
           // Muestra los links centrales, oculta los orbitales que no sean del grupo
           const src = typeof l.source === 'object' ? l.source.id : l.source;
           const tgt = typeof l.target === 'object' ? l.target.id : l.target;
           if (src === 'center' || tgt === 'center') return true;
           return true; // En un escenario real aquí evaluamos si los nodos están visibles
        });
      }
    }
  }, [contextFilter]);

  // Expanded Mode handled by camera radius

  return (
    <div className="flex-1 relative flex flex-col bg-black overflow-hidden h-[calc(100vh-80px)] min-h-[700px]">
      
            {/* Graph Toolbar Overlay (Fila 1 a 5) */}
      <div className="absolute top-0 left-0 right-[340px] p-4 z-10 flex flex-col gap-4 pointer-events-none">
          {/* Fila 1 & 2 */}
          <div className="flex items-center gap-6 pointer-events-auto">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="text-gray-400 w-5 h-5" /> FLOW ARCHITECT AI - LAB
              </h1>
              
              {/* Fila 2: Progreso Global */}
              <div 
                onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                className="flex items-center gap-2 text-xs bg-[#161b22] hover:bg-[#1f242c] border border-gray-800 hover:border-gray-700 rounded-full px-3 py-1 cursor-pointer transition"
              >
                  <span className="text-gray-400">Progreso Global:</span>
                  <Target className="text-green-500 w-4 h-4" />
                  <span className="text-green-500 font-bold">{globalScore}%</span>
              </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-[-8px]">Explora, conecta y domina el conocimiento. Todo en un solo lugar.</p>

          {/* Fila 3: Controles de Animación y Expansión */}
          <div className="flex items-center gap-4 pointer-events-auto bg-gray-900/40 p-2 rounded-lg border border-gray-800/50 w-fit backdrop-blur-md">
            <span className="text-xs font-semibold text-gray-300">MODO 3D:</span>
            <button onClick={() => setIsExpanded(!isExpanded)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${isExpanded ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {isExpanded ? 'EXPANDIDO' : 'DENSO'}
            </button>
            <div className="w-px h-4 bg-gray-700 mx-2"></div>
            <span className="text-xs font-semibold text-gray-300">ANIMACIÓN:</span>
            <button onClick={() => setRotationOn(!rotationOn)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${rotationOn ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {rotationOn ? 'ON' : 'OFF'}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">Velocidad:</span>
              <input type="range" min="0.1" max="3" step="0.1" value={rotationSpeed} onChange={(e) => setRotationSpeed(parseFloat(e.target.value))} className="w-20 cursor-pointer accent-cyan-500" />
            </div>
          </div>

          {/* Fila 4: Tabs de Filtro Superiores */}
          <div className="flex items-center gap-6 pointer-events-auto mt-2">
              <div className="flex gap-4 text-xs font-medium pb-1 border-b border-gray-800 w-fit pr-8">
                  {['Habilidades', 'Competencias', 'Relaciones', 'Progreso'].map(tab => (
                    <span 
                      key={tab}
                      onClick={() => { 
                        setActiveTopFilter(tab); 
                        if(tab === 'Progreso') setActiveTab('progreso');
                        else if(tab === 'Competencias') setActiveTab('competencias');
                        else setActiveTab('info');
                      }}
                      className={activeTopFilter === tab ? "green-text-active pb-1 cursor-pointer transition-colors relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-green-500" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}
                    >
                      {tab}
                    </span>
                  ))}
              </div>
          </div>

          {/* Fila 5: Selector de Contexto */}
          <div className="flex items-center gap-3 pointer-events-auto mt-2 bg-gray-900/60 p-2 rounded-lg border border-gray-800 w-fit">
              <span className="text-xs text-gray-400">CONTEXTO:</span>
              <select 
                value={contextFilter} 
                onChange={(e) => setContextFilter(e.target.value)}
                className="bg-black text-cyan-400 border border-gray-700 rounded px-2 py-1 text-xs outline-none cursor-pointer font-medium"
              >
                  <option value="all" className="bg-[#161b22] text-white">Todos los Contextos</option>
                  <option value="G1" className="bg-[#161b22] text-white">G1 - Agentic Framework</option>
                  <option value="G2" className="bg-[#161b22] text-white">G2 - Data Ontology</option>
              </select>
          </div>
      </div>
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0"></div>

      {/* Right Sidebar (Detalles de Habilidad & Tabs) */}
            <aside className="w-[320px] bg-black border-l border-gray-800 flex flex-col z-20 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl pointer-events-auto">
          
          <div className="flex-none bg-black z-10 border-b border-gray-800">
            <div className="p-4 flex justify-between items-center">
                <h2 className="text-base font-bold text-white">
                  {activeTab === 'info' && 'Detalles de habilidad'}
                  {activeTab === 'competencias' && 'Competencias por habilidad'}
                  {activeTab === 'sistema' && 'Sistema de aprendizaje'}
                  {activeTab === 'progreso' && 'Estado de tu progreso'}
                </h2>
                {selectedNode && activeTab === 'info' && (
                  <button 
                    onClick={() => selectNode(null)} 
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-900"
                    title="Cerrar detalles"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
            </div>

            {/* Custom Tab Bar */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-2 text-[11px] font-medium border-none">
                <button 
                  type="button"
                  onClick={() => { setActiveTab('info'); setActiveTopFilter('Habilidades'); }}
                  className={`flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ${activeTab === 'info' ? 'blue-pill-tab-active' : 'blue-pill-tab-inactive'}`}
                >
                  Detalles
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('competencias'); setActiveTopFilter('Competencias'); }}
                  className={`flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ${activeTab === 'competencias' ? 'blue-pill-tab-active' : 'blue-pill-tab-inactive'}`}
                >
                  Habilidades
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('sistema'); setActiveTopFilter('Aprendizaje'); }}
                  className={`flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ${activeTab === 'sistema' ? 'blue-pill-tab-active' : 'blue-pill-tab-inactive'}`}
                >
                  Sistema
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                  className={`flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ${activeTab === 'progreso' ? 'blue-pill-tab-active' : 'blue-pill-tab-inactive'}`}
                >
                  Progreso
                </button>
            </div>


            {activeTab === 'info' && selectedNode && (
                <div className="p-4 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border"
                          style={{
                            backgroundColor: selectedNode.color ? `${selectedNode.color}22` : '#161b22',
                            borderColor: selectedNode.color || '#374151',
                            color: selectedNode.color || '#38bdf8',
                            boxShadow: selectedNode.color ? `0 0 10px ${selectedNode.color}33` : undefined
                          }}
                        >
                            {selectedNode.icon ? (
                              <span>{selectedNode.icon}</span>
                            ) : (
                              <Code2 className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight">
                              {selectedNode.name ? selectedNode.name.replace(/\n/g, ' ') : 'Detalle del Nodo'}
                            </h3>
                            <span className="bg-[#161b22] border border-gray-700 text-cyan-400 text-xs px-2 py-0.5 rounded mt-1 inline-block">
                              {selectedNode.isSub ? 'Competencia' : 'Habilidad Principal'}
                            </span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Progreso</span>
                            <span className="text-white font-bold">
                              {selectedScore}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full" 
                              style={{ 
                                width: `${selectedScore}%`,
                                backgroundColor: selectedNode.color || '#22c55e'
                              }}
                            ></div>
                        </div>
                    </div>

                    <div className="text-sm">
                        <p>
                          <span className="text-gray-400">Nivel:</span>{' '}
                          <span style={{ color: selectedNode.color || '#22c55e' }}>
                            {selectedNode.isSub ? 'En práctica' : 'Intermedio'}
                          </span>
                        </p>
                        <p className="text-gray-400 mt-2 leading-relaxed whitespace-pre-line">
                            {selectedNode.desc || 'Habilidad base para el desarrollo de software, modelado de sistemas y resolución práctica de problemas tecnológicos.'}
                        </p>
                    </div>

                </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'info' && !selectedNode && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 my-auto">
                <div className="w-12 h-12 rounded-full border border-dashed border-gray-700 flex items-center justify-center mb-3 text-gray-400">
                  <Target className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-base font-medium text-gray-300">Selecciona un nodo para ver sus detalles</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Haz clic sobre cualquier habilidad o competencia en el grafo 3D para visualizar su descripción, nivel y actividades recomendadas.
                </p>
              </div>
            )}
            
            {activeTab === 'info' && selectedNode && (
              <>
                <div className="p-4 flex flex-col gap-4">
                    <hr className="border-gray-800" />

                    {/* Competencias */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                          {selectedNode.isSub ? 'Habilidad Asociada' : 'Sub-competencias'}
                        </h4>
                        {(() => {
                          const relatedNodes = selectedNode.isSub
                            ? gData.nodes.filter(n => !n.isSub && n.group === selectedNode.group)
                            : gData.nodes.filter(n => n.isSub && n.group === selectedNode.group);
                          
                          if (relatedNodes.length === 0) {
                            return (
                              <p className="text-xs text-gray-500 italic">Nodo raíz del sistema agéntico FlowArchitect.</p>
                            );
                          }
                          return (
                            <ul className="text-xs flex flex-col gap-1.5">
                              {relatedNodes.map((sub, idx) => (
                                <li 
                                  key={sub.id} 
                                  onClick={() => {
                                    selectNode(sub);
                                    if (graphRef.current && typeof sub.x === 'number' && typeof sub.y === 'number' && typeof sub.z === 'number') {
                                      const hyp = Math.hypot(sub.x, sub.y, sub.z);
                                      const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
                                      graphRef.current.cameraPosition(
                                        { x: sub.x * distRatio, y: sub.y * distRatio, z: sub.z * distRatio },
                                        sub as unknown as { x: number; y: number; z: number },
                                        2000
                                      );
                                    }
                                  }}
                                  className="flex justify-between items-center hover:bg-white/5 p-1 rounded cursor-pointer transition"
                                >
                                  <span className="flex items-center gap-2 truncate pr-2">
                                    <span style={{ color: sub.color || '#22c55e' }}>
                                      {idx === 0 ? <CheckCircle className="w-3 h-3 shrink-0" /> : idx === 1 ? <Play className="w-3 h-3 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                                    </span>
                                    <span className="truncate">{sub.name.replace(/\n/g, ' ')}</span>
                                  </span>
                                  <span className="text-[11px] shrink-0 font-medium" style={{ color: sub.color || '#22c55e' }}>
                                    {idx === 0 ? 'Dominada' : idx === 1 ? 'En práctica' : 'Por iniciar'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                    </div>

                    <hr className="border-gray-800" />

                    {/* Relaciones */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Relaciones Semánticas</h4>
                        {(() => {
                          const relatedLinks = gData.links.filter(l => {
                            const sId = typeof l.source === 'object' && l.source !== null ? (l.source as GraphSkillNode).id : l.source;
                            const tId = typeof l.target === 'object' && l.target !== null ? (l.target as GraphSkillNode).id : l.target;
                            return (sId === selectedNode.id || tId === selectedNode.id) && l.name;
                          });

                          if (relatedLinks.length === 0) {
                            return (
                              <p className="text-xs text-gray-500 italic">Sin relaciones transversales directas.</p>
                            );
                          }

                          return (
                            <ul className="text-xs flex flex-col gap-1.5 text-gray-400">
                              {relatedLinks.map((l, i) => {
                                const sId = typeof l.source === 'object' && l.source !== null ? (l.source as GraphSkillNode).id : l.source;
                                const tId = typeof l.target === 'object' && l.target !== null ? (l.target as GraphSkillNode).id : l.target;
                                const isSource = sId === selectedNode.id;
                                const otherId = isSource ? tId : sId;
                                const otherNode = gData.nodes.find(n => n.id === otherId);
                                return (
                                  <li 
                                    key={i} 
                                    onClick={() => {
                                      if (otherNode) {
                                        selectNode(otherNode);
                                        if (graphRef.current && typeof otherNode.x === 'number' && typeof otherNode.y === 'number' && typeof otherNode.z === 'number') {
                                          const hyp = Math.hypot(otherNode.x, otherNode.y, otherNode.z);
                                          const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
                                          graphRef.current.cameraPosition(
                                            { x: otherNode.x * distRatio, y: otherNode.y * distRatio, z: otherNode.z * distRatio },
                                            otherNode as unknown as { x: number; y: number; z: number },
                                            2000
                                          );
                                        }
                                      }
                                    }}
                                    className="flex items-center gap-2 hover:bg-white/5 p-1 rounded cursor-pointer transition"
                                  >
                                    <span className="text-gray-600">&rarr;</span>
                                    <span className="text-cyan-400 font-medium shrink-0">{l.name}</span>
                                    <span className="text-gray-600">&rarr;</span>
                                    <span className="text-gray-300 truncate" title={otherNode?.name.replace(/\n/g, ' ')}>
                                      {otherNode?.name.replace(/\n/g, ' ') || otherId}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        })()}
                    </div>

                    <hr className="border-gray-800" />

                    {/* Misiones relacionadas */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Misiones relacionadas</h4>
                        <ul className="text-xs flex flex-col gap-1.5 text-gray-300">
                            <li className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer transition">
                              <Target className="text-gray-500 w-3 h-3" /> Reto: {selectedNode.name ? selectedNode.name.replace(/\n/g, ' ') : 'Misión Práctica'}
                            </li>
                            <li className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer transition">
                              <Target className="text-gray-500 w-3 h-3" /> Laboratorio interactivo aplicado
                            </li>
                        </ul>
                        <button 
                          onClick={() => handleLaunchMission(selectedNode?.id || 'mission_id')}
                          className="w-full mt-3 py-1.5 rounded border border-gray-700 hover:bg-gray-800 active:scale-95 transition-transform text-sm text-gray-400"
                        >
                          Ver detalles completos
                        </button>
                        <button 
                          onClick={() => handleBack()}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>
                    </div>
                </div>
              </>
            )}

          {/* TAB 2: Competencias */}
          {activeTab === 'competencias' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="bg-[#0d1117]/85 backdrop-blur-md border border-[#30363d] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Competencias por habilidad ({gData.nodes.filter(n => !n.isSub && n.id !== 'center').length})
                  </h3>
                  <div className="flex flex-col gap-2 text-xs max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
                    {gData.nodes
                      .filter((n) => !n.isSub && n.id !== 'center')
                      .sort((a, b) => (a.group || 0) - (b.group || 0))
                      .map((skill) => {
                        const subSkills = gData.nodes.filter((n) => n.isSub && n.group === skill.group);
                        const isSelected = selectedNode?.id === skill.id;
                        return (
                          <div
                            key={skill.id}
                            onClick={() => {
                              selectNode(skill);
                              setActiveTab('info');
                              if (graphRef.current && typeof skill.x === 'number' && typeof skill.y === 'number' && typeof skill.z === 'number') {
                                const hyp = Math.hypot(skill.x, skill.y, skill.z);
                                const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
                                graphRef.current.cameraPosition(
                                  { x: skill.x * distRatio, y: skill.y * distRatio, z: skill.z * distRatio },
                                  skill as unknown as { x: number; y: number; z: number },
                                  2000
                                );
                              }
                            }}
                            className={`flex justify-between items-center p-2 rounded cursor-pointer transition ${
                              isSelected ? 'bg-white/10 text-white border border-blue-500/40' : 'hover:bg-white/5 text-gray-300 border border-transparent'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate pr-2">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black shrink-0"
                                style={{ backgroundColor: skill.color || '#3b82f6' }}
                              >
                                {skill.group}
                              </span>
                              <span className="truncate" title={skill.name.replace(/\n/g, ' ')}>
                                {skill.name.replace(/\n/g, ' ')}
                              </span>
                            </span>
                            <span className="text-gray-500 text-[11px] shrink-0 font-medium">
                              {subSkills.length} comp.
                            </span>
                          </div>
                        );
                      })}
                  </div>
              </div>
            </div>
          )}

          {/* TAB 3: Sistema Adaptativo */}
          {activeTab === 'sistema' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="bg-[#0d1117]/85 backdrop-blur-md border border-[#30363d] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Sistema de aprendizaje adaptativo</h3>
                  <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-gray-800">
                          <div className="w-8 h-8 rounded border border-gray-600 bg-[#0d1117] flex items-center justify-center text-cyan-400 shrink-0"><Crosshair className="w-4 h-4" /></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-200 block">Diagnóstico Inicial</span>
                            <span className="text-xs text-gray-400 leading-tight mt-0.5 block">Evalúa conocimientos y estilo de aprendizaje</span>
                          </div>
                      </div>
                      <div className="flex justify-center -my-1">
                          <ChevronRight className="text-gray-600 w-4 h-4 rotate-90" />
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-gray-800">
                          <div className="w-8 h-8 rounded border border-gray-600 bg-[#0d1117] flex items-center justify-center text-green-400 shrink-0"><Route className="w-4 h-4" /></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-200 block">Ruta personalizada</span>
                            <span className="text-xs text-gray-400 leading-tight mt-0.5 block">Selecciona contenidos y actividades</span>
                          </div>
                      </div>
                      <div className="flex justify-center -my-1">
                          <ChevronRight className="text-gray-600 w-4 h-4 rotate-90" />
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-gray-800">
                          <div className="w-8 h-8 rounded border border-gray-600 bg-[#0d1117] flex items-center justify-center text-purple-400 shrink-0"><Zap className="w-4 h-4" /></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-200 block">Aprendizaje activo</span>
                            <span className="text-xs text-gray-400 leading-tight mt-0.5 block">Proyectos, laboratorios y retos reales</span>
                          </div>
                      </div>
                      <div className="flex justify-center -my-1">
                          <ChevronRight className="text-gray-600 w-4 h-4 rotate-90" />
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-gray-800">
                          <div className="w-8 h-8 rounded border border-gray-600 bg-[#0d1117] flex items-center justify-center text-blue-400 shrink-0"><TrendingUp className="w-4 h-4" /></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-200 block">Seguimiento</span>
                            <span className="text-xs text-gray-400 leading-tight mt-0.5 block">Analiza progreso y ajusta la ruta</span>
                          </div>
                      </div>
                      <div className="flex justify-center -my-1">
                          <ChevronRight className="text-gray-600 w-4 h-4 rotate-90" />
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-gray-800">
                          <div className="w-8 h-8 rounded border border-gray-600 bg-[#0d1117] flex items-center justify-center text-orange-400 shrink-0"><Shield className="w-4 h-4" /></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-200 block">Evaluación continua</span>
                            <span className="text-xs text-gray-400 leading-tight mt-0.5 block">Mide competencias y certifica logros</span>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* TAB 4: Estado de tu Progreso */}
          {activeTab === 'progreso' && (
            <div className="p-4 flex flex-col gap-4">
              <div className="bg-[#0d1117]/85 backdrop-blur-md border border-[#30363d] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 text-center">Estado de tu progreso</h3>
                  <div className="relative w-24 h-24 mx-auto mb-4">
                      <svg viewBox="0 0 36 36" className="w-full h-full text-green-500 stroke-current">
                          <path className="text-gray-700 stroke-current" strokeWidth={3} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path strokeDasharray={`${globalScore}, 100`} strokeWidth={3} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-white">{globalScore}%</span>
                          <span className="text-xs text-gray-400">Mastery</span>
                      </div>
                  </div>
                  <div className="flex flex-col gap-2.5 text-sm border-t border-gray-800 pt-3">
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Dominadas</span> <span className="text-white font-medium">{masteredCount}</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> En práctica</span> <span className="text-white font-medium">{practicingCount}</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Por iniciar</span> <span className="text-white font-medium">{unstartedCount}</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> En revisión</span> <span className="text-white font-medium">{reviewCount}</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-300"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Bloqueadas</span> <span className="text-white font-medium">{blockedCount}</span></div>
                  </div>
              </div>
            </div>
          )}
          </div>

          {/* Próxima recomendación panel */}
          {activeTab === 'info' && selectedNode && (
                <div className="flex-none mt-auto border-t border-gray-800 p-4 bg-black">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Próxima recomendación</h4>
                    <div className="bg-[#161b22] border border-blue-900 rounded-lg p-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500 opacity-5"></div>
                        <div className="relative z-10 flex gap-3">
                            <div className="w-8 h-8 rounded bg-blue-900 border border-blue-700 flex items-center justify-center text-blue-400 shrink-0">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-white">
                                  FLOW ARCHITECT AI - LAB
                                </h5>
                                <p className="text-xs text-gray-400 mt-1 mb-2 leading-tight">
                                  Completa la práctica para avanzar en este nodo del grafo.
                                </p>
                                <button 
                                  onClick={() => handleLaunchMission(selectedNode.id)}
                                  className="w-full bg-[#1f6feb] hover:bg-blue-600 text-white text-sm py-1 rounded transition"
                                >
                                  Ir a la misión &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
          )}
      </aside>
    </div>
  );
}
