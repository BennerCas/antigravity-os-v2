import json
from typing import Dict, Any, List, Optional
import db
from backend.schemas.academy import HintItem
from backend.services.academy.catalog_service import CatalogService
from backend.services.academy.validator_service import ValidatorService


class CopilotService:
    """
    Contextual Pedagogical AI Mentor for Antigravity Academy V3.
    Provides 9 specialized pedagogical personas, structured outputs,
    a 5-level progressive hint ladder, and deterministic fallback if AI is offline.
    """

    ROLES = {
        "mission_coach": "Coach de Misión: Enfócate en el objetivo inmediato, restricciones y siguiente paso.",
        "concept_tutor": "Tutor Conceptual: Enseña el porqué de los contratos de datos, políticas de error y arquitectura.",
        "graph_reviewer": "Revisor de Grafo: Analiza topología, conexiones, ramas ambiguas y nodos huérfanos.",
        "data_tutor": "Tutor de Datos: Inspecciona schemas, compatibilidad de tipos (string vs number) y transforms.",
        "prompt_tutor": "Tutor de Prompts: Evalúa contratos de prompts, especificidad, restricciones y tests.",
        "reliability_reviewer": "Revisor de Fiabilidad: Evalúa idempotencia, retries con backoff y dead-letters.",
        "security_reviewer": "Revisor de Seguridad: Supervisa capabilities, credenciales por referencia y cero secretos en código.",
        "debugging_tutor": "Tutor de Depuración: Guía la interpretación del Run Inspector sin regalar la solución.",
        "assessment_evaluator": "Evaluador: Analiza la rúbrica con evidencia objetiva y señala brechas restantes."
    }

    @classmethod
    def get_next_hint(cls, session_id: str) -> Dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        mission_id = session["mission_id"]
        mission = CatalogService.get_mission(mission_id)
        if not mission or not mission.hints:
            return {
                "level": 1,
                "title": "Consejo General",
                "text": "Revisa los objetivos de la misión y verifica que tus nodos estén conectados al nodo End.",
                "clue_type": "question"
            }

        revealed = session.get("hints_revealed", [])
        current_level = max(revealed) if revealed else 0
        next_level = current_level + 1

        # Look for hint at next level
        matching_hint = next((h for h in mission.hints if h.level == next_level), None)
        if not matching_hint:
            # If past max hints, return level 5 or last
            matching_hint = mission.hints[-1]

        # Record revealed hint in DB
        new_revealed = list(set(revealed + [matching_hint.level]))
        db.mission_session_update(session_id, {"hints_revealed": sorted(new_revealed)})

        # Update stats
        profile = db.learning_profile_get_or_create(session["user_id"])
        stats = profile.get("stats", {})
        stats["hints_used_count"] = stats.get("hints_used_count", 0) + 1
        db.learning_profile_update(session["user_id"], {"stats": stats})

        return matching_hint.model_dump()

    @classmethod
    def assemble_context_packs(cls, session: Dict[str, Any], mission: Any) -> Dict[str, Any]:
        user_id = session.get("user_id", "default_learner")
        flow = session.get("sandbox_flow", {})
        nodes = flow.get("nodes", [])
        edges = flow.get("edges", [])
        findings = session.get("findings", [])

        # 1. LearnerContext
        profile = db.learning_profile_get_or_create(user_id)
        mastery_list = db.skill_mastery_all(user_id)
        learner_ctx = {
            "user_id": user_id,
            "level": profile.get("level", "foundation"),
            "current_track": profile.get("current_track", "builder"),
            "skills_tracked_count": len(mastery_list),
            "stats": profile.get("stats", {})
        }

        # 2. MissionContext
        mission_ctx = {
            "id": mission.id if mission else session.get("mission_id"),
            "title": mission.title if mission else "Misión de Aprendizaje",
            "stage": getattr(mission, "stage", 0),
            "mode": getattr(mission, "mode", "standard"),
            "target_skills": getattr(mission, "skills", [])
        }

        # 3. GraphContext
        node_roles = [n.get("data", {}).get("role", n.get("type", "node")) for n in nodes]
        graph_ctx = {
            "node_count": len(nodes),
            "edge_count": len(edges),
            "node_roles": node_roles,
            "has_start": any(r in ["start", "trigger"] for r in node_roles),
            "has_end": any(r in ["end", "sink"] for r in node_roles)
        }

        # 4. EvidenceContext
        evidence_records = db.evidence_user(user_id)
        latest_ev = db.evidence_latest(user_id)
        evidence_ctx = {
            "total_evidence_blocks": len(evidence_records),
            "latest_validation_hash": latest_ev["validation_hash"] if latest_ev else "GENESIS_ROOT",
            "evidence_types_recorded": list({e.get("evidence_type") for e in evidence_records})
        }

        # 5. RuntimeContext
        blockers = [f for f in findings if f.get("severity") == "blocking"]
        runtime_ctx = {
            "findings_count": len(findings),
            "blockers_count": len(blockers),
            "status": session.get("status", "started"),
            "rubric_results": session.get("rubric_results", {})
        }

        # 6. RubricContext
        rubric_items = getattr(mission, "rubric", []) if mission else []
        rubric_ctx = {
            "criteria_count": len(rubric_items),
            "dimensions": [getattr(r, "dimension", "general") for r in rubric_items]
        }

        return {
            "learner_context": learner_ctx,
            "mission_context": mission_ctx,
            "graph_context": graph_ctx,
            "evidence_context": evidence_ctx,
            "runtime_context": runtime_ctx,
            "rubric_context": rubric_ctx
        }

    @classmethod
    async def mentor_chat(
        cls,
        session_id: str,
        user_message: str,
        preferred_role: str = "mission_coach"
    ) -> Dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        mission = CatalogService.get_mission(session["mission_id"])
        mission_title = mission.title if mission else session["mission_id"]
        mission_brief = mission.brief if mission else ""

        role_instruction = cls.ROLES.get(preferred_role, cls.ROLES["mission_coach"])
        context_packs = cls.assemble_context_packs(session, mission)

        system_prompt = (
            f"Eres el mentor de aprendizaje e inteligencia de Antigravity Academy V4 (Learning Operating System).\n"
            f"Tu rol actual: {role_instruction}\n"
            f"Misión activa: '{mission_title}'.\n"
            f"Contexto pedagógico: {mission_brief}\n\n"
            f"Reglas no negociables de pedagogía e interacción:\n"
            f"1. Guía con preguntas socráticas o pistas conceptuales; no regales la solución final directamente.\n"
            f"2. Basa tus observaciones en los 6 Context Packs inyectados (Learner, Mission, Graph, Evidence, Runtime, Rubric).\n"
            f"3. Responde en español, con precisión técnica y profesionalismo.\n"
            f"4. Estructura siempre tu respuesta con: [Hecho Observado], [Concepto Pedagógico] y [Siguiente Acción Sugerida]."
        )

        user_context = (
            f"=== 6 PEDAGOGICAL CONTEXT PACKS ===\n"
            f"{json.dumps(context_packs, ensure_ascii=False, indent=2)}\n\n"
            f"=== PREGUNTA DEL ALUMNO ===\n"
            f"{user_message}"
        )

        flow = session.get("sandbox_flow", {})
        findings = session.get("findings", [])

        try:
            from routers.builder_actions import call_ai
            reply, _ = await call_ai(system_prompt, user_context)
            if not reply or len(reply.strip()) == 0:
                raise Exception("Empty AI response")
            return {
                "role": preferred_role,
                "reply": reply,
                "source": "ai_copilot",
                "context_packs": context_packs
            }
        except Exception:
            # Resilient deterministic fallback
            blockers = [f for f in findings if f.get("severity") == "blocking"]
            fallback_response = (
                f"**[Hecho Observado]** El flujo tiene {len(flow.get('nodes', []))} nodos, {len(flow.get('edges', []))} conexiones y {len(findings)} observaciones del validador ({len(blockers)} bloqueantes).\n\n"
                f"**[Concepto Pedagógico]** En la misión '{mission_title}', el diseño robusto exige que cada nodo defina esquemas compatibles y que no existan ramas huérfanas en las bifurcaciones de control.\n\n"
                f"**[Siguiente Acción Sugerida]** "
                + (f"Resuelve la primera observación bloqueante: {blockers[0].get('message')}" if blockers else "Ejecuta una simulación en el sandbox y verifica la traza de ejecución.")
            )
            return {
                "role": preferred_role,
                "reply": fallback_response,
                "source": "deterministic_fallback",
                "context_packs": context_packs
            }
