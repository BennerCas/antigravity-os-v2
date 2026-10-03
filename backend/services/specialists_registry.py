import re
from typing import Any, Dict, List

SPECIALIST_PACKS: List[Dict[str, Any]] = [
    {
        "id": "vibecoding-product-squad",
        "name": "VibeCoding Product Squad",
        "category": "Product",
        "description": "Convierte ideas en flujos visibles, UX operable y contratos de entrega.",
        "keywords": ["product", "ux", "chat", "flujo", "board", "vibecoding", "artefacto"],
        "agents": [
            {
                "id": "product-architect",
                "name": "Product Architect",
                "role": "Diseña el flujo end-to-end y la experiencia operativa.",
                "description": "Eres un arquitecto de producto para vibecoding. Defiendes claridad de flujo, UX visible y criterios de cierre verificables.",
                "tools": ["board-map", "ux-contracts"],
                "contract": "OUT: Markdown"
            },
            {
                "id": "interaction-designer",
                "name": "Interaction Designer",
                "role": "Diseña interacciones fluidas y artefactos entendibles.",
                "description": "Optimizas chat, paneles, handoffs y affordances para que el sistema se sienta vivo y continuo.",
                "tools": ["artifact-design", "ui-review"],
                "contract": "OUT: Markdown"
            },
            {
                "id": "delivery-governor",
                "name": "Delivery Governor",
                "role": "Verifica DoD y evita humo de producto.",
                "description": "Tu prioridad es verificar criterio por criterio y bloquear claims sin evidencia.",
                "tools": ["checklist", "acceptance"],
                "contract": "OUT: JSON"
            },
        ],
    },
    {
        "id": "local-rag-atlas-cell",
        "name": "Local RAG Atlas Cell",
        "category": "Knowledge",
        "description": "Especialistas en Atlas Forge, RAG local, biblioteca viva y memoria utilizable.",
        "keywords": ["atlas", "rag", "knowledge", "memoria", "epub", "pdf", "library", "ingesta"],
        "agents": [
            {
                "id": "atlas-librarian",
                "name": "Atlas Librarian",
                "role": "Curador de fuentes y taxonomía de conocimiento.",
                "description": "Clasificas, nombras y limpias fuentes para que Atlas sea consistente y útil para agentes.",
                "tools": ["taxonomy", "source-curation"],
                "contract": "OUT: Markdown"
            },
            {
                "id": "rag-engineer",
                "name": "RAG Engineer",
                "role": "Optimiza chunking, retrieval y memoria de runtime.",
                "description": "Diseñas retrieval útil para modelos 8B locales con precisión y bajo ruido contextual.",
                "tools": ["vector-search", "chunking"],
                "contract": "OUT: JSON"
            },
            {
                "id": "knowledge-distiller",
                "name": "Knowledge Distiller",
                "role": "Transmuta información cruda en playbooks utilitarios.",
                "description": "Extraes lo accionable y lo conviertes en conocimiento utilizable por agentes, no en texto decorativo.",
                "tools": ["summarization", "playbook"],
                "contract": "OUT: Markdown"
            },
        ],
    },
    {
        "id": "quantum-devsecops-hive",
        "name": "Quantum DevSecOps Hive",
        "category": "Engineering",
        "description": "Especialistas para runtime, seguridad, validación y observabilidad sobre Hermes local.",
        "keywords": ["devsecops", "security", "runtime", "logs", "observability", "contracts", "validation", "8b"],
        "agents": [
            {
                "id": "runtime-operator",
                "name": "Runtime Operator",
                "role": "Hace operable el sistema y sus automatizaciones.",
                "description": "Construyes runtimes visibles, estados, jobs, telemetría y control operacional.",
                "tools": ["runtime", "scheduler"],
                "contract": "OUT: JSON"
            },
            {
                "id": "contract-auditor",
                "name": "Contract Auditor",
                "role": "Evalúa contratos de entrada/salida y disciplina estructural.",
                "description": "Detectas cuando un agente incumple JSON, markdown, HTML o formatos exigidos por el flujo.",
                "tools": ["schema-check", "eval"],
                "contract": "OUT: JSON"
            },
            {
                "id": "security-hardener",
                "name": "Security Hardener",
                "role": "Reduce superficie de riesgo en herramientas, memoria y runtime.",
                "description": "Blindas fallbacks, filtrado, acceso a herramientas y fugas de contexto en sistemas locales agentic.",
                "tools": ["risk-review", "guardrails"],
                "contract": "OUT: Markdown"
            },
        ],
    },
    {
        "id": "local-media-lab",
        "name": "Local Media Lab",
        "category": "Media",
        "description": "Especialistas en artefactos vivos, capturas, voz, interfaces visuales y multimedia local-first.",
        "keywords": ["artifact", "image", "voice", "screen", "browser", "window", "podcast", "media"],
        "agents": [
            {
                "id": "artifact-composer",
                "name": "Artifact Composer",
                "role": "Diseña dashboards y piezas UI ejecutables.",
                "description": "Forjas artefactos editables, renderizables y listos para iteración viva.",
                "tools": ["artifact-design", "html-preview"],
                "contract": "OUT: HTML"
            },
            {
                "id": "media-orchestrator",
                "name": "Media Orchestrator",
                "role": "Orquesta voz, captura y activos multimedia locales.",
                "description": "Alineas ingestión audiovisual, captura en tiempo real y salidas multimedia con el flujo del sistema.",
                "tools": ["screen-capture", "tts"],
                "contract": "OUT: Markdown"
            },
            {
                "id": "character-systems-designer",
                "name": "Character Systems Designer",
                "role": "Diseña identidades, personajes y rooms conversacionales robustas.",
                "description": "Transformas personajes y experiencias de voz/chat en sistemas consistentes y gobernables.",
                "tools": ["persona-design", "dialogue"],
                "contract": "OUT: Markdown"
            },
        ],
    },
]


def list_specialist_packs() -> List[Dict[str, Any]]:
    return SPECIALIST_PACKS


def _score_pack(pack: Dict[str, Any], objective: str) -> int:
    words = re.findall(r"\w+", (objective or "").lower())
    score = 0
    haystack = " ".join([pack.get("name", ""), pack.get("description", ""), " ".join(pack.get("keywords", []))]).lower()
    for word in words:
        if len(word) < 4:
            continue
        if word in haystack:
            score += 4
    return score


def build_template_for_pack(pack_id: str) -> Dict[str, Any]:
    pack = next((pack for pack in SPECIALIST_PACKS if pack["id"] == pack_id), None)
    if not pack:
        raise KeyError(pack_id)
    nodes = []
    edges = []
    agent_cards = []
    x = 120
    y = 120
    prev_node_id = None
    for idx, agent in enumerate(pack["agents"], start=1):
        node_id = f"{pack_id}_{agent['id']}"
        nodes.append({
            "id": node_id,
            "type": "agent",
            "position": {"x": x + ((idx - 1) * 280), "y": y},
            "data": {
                "id": agent["id"],
                "label": agent["name"],
                "name": agent["name"],
                "kind": "agent",
                "description": agent["description"],
                "role": agent["role"],
                "tools": agent.get("tools", []),
                "inputOutputContract": agent.get("contract", ""),
                "inputPort": "context" if idx > 1 else "objective",
                "outputPort": "artifact" if idx == len(pack["agents"]) else "handoff",
                "status": "",
                "color": "#3b82f6",
                "systemPrompt": agent["description"],
            }
        })
        if prev_node_id:
            edges.append({
                "id": f"e_{prev_node_id}_{node_id}",
                "source": prev_node_id,
                "target": node_id,
                "type": "smoothstep",
            })
        prev_node_id = node_id
        agent_cards.append({
            "id": agent["id"],
            "name": agent["name"],
            "role": agent["role"],
            "description": agent["description"],
            "genes": [
                {"kind": "domain", "value": pack.get("category", "specialist")},
                {"kind": "format", "value": agent.get("contract", "") or "structured-output"},
            ],
            "noveltyScore": 0.92,
            "evalStatus": "PASS",
            "color": "#3b82f6",
            "inputOutputContract": agent.get("contract", ""),
            "requiredTools": agent.get("tools", []),
            "health": "green",
            "systemPrompt": agent["description"],
        })
    return {
        "pack": pack,
        "nodes": nodes,
        "edges": edges,
        "agentCards": agent_cards,
    }


def recommend_specialist_packs(objective: str, limit: int = 3) -> List[Dict[str, Any]]:
    ranked = []
    for pack in SPECIALIST_PACKS:
        ranked.append(( _score_pack(pack, objective), pack ))
    ranked.sort(key=lambda item: item[0], reverse=True)
    chosen = [pack for score, pack in ranked if score > 0][:limit]
    if not chosen:
        chosen = SPECIALIST_PACKS[:limit]
    return chosen
