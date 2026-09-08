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

        system_prompt = (
            f"Eres el mentor de aprendizaje de Antigravity Academy V3.\n"
            f"Tu rol actual: {role_instruction}\n"
            f"Misión activa: '{mission_title}'.\n"
            f"Contexto de la misión: {mission_brief}\n"
            f"Reglas estrictas de pedagogía:\n"
            f"1. Guía con preguntas socráticas o pistas conceptuales; no entregues la respuesta final directamente a menos que sea una explicación teórica.\n"
            f"2. Basa tus comentarios en los nodos, edges y contratos del usuario.\n"
            f"3. Responde en español, de forma clara, profesional y concisa.\n"
            f"4. Separa claramente: [Hecho Observado], [Concepto Pedagógico] y [Siguiente Acción Sugerida]."
        )

        flow = session.get("sandbox_flow", {})
        findings = session.get("findings", [])
        
        user_context = (
            f"Estado actual del flujo: {len(flow.get('nodes', []))} nodos, {len(flow.get('edges', []))} edges.\n"
            f"Hallazgos actuales del validador: {json.dumps([f.get('message') for f in findings], ensure_ascii=False)}\n"
            f"Pregunta del alumno: {user_message}"
        )

        try:
            from routers.builder_actions import call_ai
            reply, _ = await call_ai(system_prompt, user_context)
            if not reply or len(reply.strip()) == 0:
                raise Exception("Empty AI response")
            return {
                "role": preferred_role,
                "reply": reply,
                "source": "ai_copilot"
            }
        except Exception as e:
            # Resilient deterministic fallback
            fallback_response = (
                f"**[Hecho Observado]** El flujo tiene {len(flow.get('nodes', []))} nodos y {len(findings)} observaciones del validador.\n\n"
                f"**[Concepto Pedagógico]** En la misión '{mission_title}', el objetivo clave es asegurar que los datos fluyan con esquemas compatibles y rutas completas.\n\n"
                f"**[Siguiente Acción Sugerida]** Revisa el panel de validaciones. "
                + (f"Atiende primero: {findings[0].get('message')}" if findings else "Ejecuta una simulación en el sandbox para comprobar la salida.")
            )
            return {
                "role": preferred_role,
                "reply": fallback_response,
                "source": "deterministic_fallback"
            }
