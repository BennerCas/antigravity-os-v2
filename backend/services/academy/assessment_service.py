from datetime import datetime, timezone
from typing import Any

import db

from backend.services.academy.catalog_service import CatalogService
from backend.services.academy.evidence_service import EvidenceService
from backend.services.academy.mastery_engine import MasteryEngine
from backend.services.academy.validator_service import ValidatorService


class AssessmentService:
    """
    Assessment Service orchestrates deterministic evaluation, rubric scoring,
    reflection capture, evidence generation, and mastery graduation in Antigravity Academy V3.
    """

    @classmethod
    def evaluate_session(cls, session_id: str) -> dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        mission_id = session["mission_id"]
        mission = CatalogService.get_mission(mission_id)
        flow = session.get("sandbox_flow", {})

        # 1. Deterministic validation
        findings = ValidatorService.validate_flow(flow, mission_id)
        findings_dicts = [f.model_dump() for f in findings]
        has_blockers = any(f.severity == "blocking" for f in findings)

        # 2. Rubric scoring
        rubric_results: dict[str, Any] = {}
        total_score = 0.0
        max_possible = 0.0

        if mission and mission.rubric:
            for criterion in mission.rubric:
                max_possible += criterion.max_points
                # If there are blockers affecting this criterion, score is reduced
                if has_blockers:
                    score = 3.0
                elif findings:
                    score = 7.0
                else:
                    score = float(criterion.max_points)

                rubric_results[criterion.id] = {
                    "title": criterion.title,
                    "dimension": criterion.dimension,
                    "score": score,
                    "max_points": criterion.max_points,
                    "passed": score >= (criterion.max_points * 0.7),
                }
                total_score += score

        normalized_score = (
            round(total_score / max_possible, 2) if max_possible > 0 else 1.0
        )

        # Update session in DB
        db.mission_session_update(
            session_id,
            {
                "findings": findings_dicts,
                "rubric_results": rubric_results,
                "status": "evaluating" if not has_blockers else "blocked",
            },
        )

        return {
            "session_id": session_id,
            "is_valid": not has_blockers,
            "score": normalized_score,
            "findings": findings_dicts,
            "rubric_results": rubric_results,
        }

    @classmethod
    def submit_reflection(
        cls,
        session_id: str,
        reflection_text: str,
        prompt: str = "¿Por qué diseñaste esta arquitectura?",
    ) -> dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        now_str = datetime.now(timezone.utc).isoformat()

        # Simple heuristics + length score (quality indicator)
        ai_score = 0.9 if len(reflection_text.strip()) > 30 else 0.5
        ai_feedback = (
            "Explicación clara y concisa que justifica la selección de componentes."
            if ai_score >= 0.8
            else "La explicación es breve; elabora más los trade-offs considerados."
        )

        submission = {
            "prompt": prompt,
            "response": reflection_text,
            "submitted_at": now_str,
            "ai_score": ai_score,
            "ai_feedback": ai_feedback,
        }

        reflections = session.get("reflections", [])
        reflections.append(submission)

        db.mission_session_update(session_id, {"reflections": reflections})

        # Record reasoning evidence
        mission = CatalogService.get_mission(session["mission_id"])
        primary_skill = (
            mission.skills[0] if (mission and mission.skills) else "comprehension"
        )

        EvidenceService.record_evidence(
            user_id=session["user_id"],
            skill_id=primary_skill,
            mission_id=session["mission_id"],
            session_id=session_id,
            evidence_type="reasoning",
            source="reflection_modal",
            payload={"reflection": reflection_text, "score": ai_score},
            confidence=0.9,
        )

        # Update stats
        profile = db.learning_profile_get_or_create(session["user_id"])
        stats = profile.get("stats", {})
        stats["reflections_submitted"] = stats.get("reflections_submitted", 0) + 1
        db.learning_profile_update(session["user_id"], {"stats": stats})

        return {"status": "success", "submission": submission}

    @classmethod
    def complete_mission(cls, session_id: str) -> dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        mission_id = session["mission_id"]
        mission = CatalogService.get_mission(mission_id)
        user_id = session["user_id"]

        # 1. Run evaluation
        eval_result = cls.evaluate_session(session_id)
        if not eval_result["is_valid"]:
            raise ValueError(
                "No se puede completar la misión: existen errores bloqueantes en el flujo."
            )

        # 2. Record graph and runtime evidence
        primary_skill = mission.skills[0] if (mission and mission.skills) else "general"

        EvidenceService.record_evidence(
            user_id=user_id,
            skill_id=primary_skill,
            mission_id=mission_id,
            session_id=session_id,
            evidence_type="graph",
            source="builder_canvas",
            payload={
                "nodes_count": len(session.get("sandbox_flow", {}).get("nodes", []))
            },
            confidence=1.0,
        )
        EvidenceService.record_evidence(
            user_id=user_id,
            skill_id=primary_skill,
            mission_id=mission_id,
            session_id=session_id,
            evidence_type="runtime",
            source="sandbox_simulator",
            payload={"simulation_passed": True, "score": eval_result["score"]},
            confidence=1.0,
        )

        # 3. Update Mastery across all mission skills
        hints_used = session.get("hints_revealed", [])
        has_reflection = len(session.get("reflections", [])) > 0
        user_evidence = db.evidence_user(user_id)

        mastery_results = []
        for s_id in (mission.skills if mission else [primary_skill]):
            has_transfer = any(
                e.get("evidence_type") == "transfer"
                and (e.get("skill_id") == s_id or e.get("mission_id") == mission_id)
                for e in user_evidence
            )
            m_record = MasteryEngine.update_skill_mastery(
                user_id=user_id,
                skill_id=s_id,
                passed_cleanly=eval_result["is_valid"],
                hints_used=hints_used,
                has_transfer=has_transfer,
                has_reflection=has_reflection,
            )
            mastery_results.append(m_record.model_dump())

        # 4. Mark session completed in DB
        now_str = datetime.now(timezone.utc).isoformat()
        db.mission_session_update(
            session_id, {"status": "passed", "completed_at": now_str}
        )

        # 5. Update learner profile
        profile = db.learning_profile_get_or_create(user_id)
        stats = profile.get("stats", {})
        stats["missions_completed"] = stats.get("missions_completed", 0) + 1
        db.learning_profile_update(user_id, {"stats": stats})

        # 6. Log learning event
        db.learning_event_log(
            user_id,
            "mission_completed",
            {
                "mission_id": mission_id,
                "session_id": session_id,
                "score": eval_result["score"],
            },
        )

        return {
            "status": "completed",
            "message": f"¡Misión '{mission.title if mission else mission_id}' completada con éxito!",
            "rubric_results": eval_result["rubric_results"],
            "mastery_updates": mastery_results,
            "unlock_rewards": mission.unlock_rewards if mission else [],
        }
