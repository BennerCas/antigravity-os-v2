from typing import Any

import db

from backend.schemas.academy import MasteryState, SkillMasteryRecord


class MasteryEngine:
    """
    Multidimensional Mastery Engine with False Mastery Detection.
    Evaluates 8 competency dimensions:
    - Correctness: topological & syntactic validity
    - Independence: inversely proportional to hint reliance (Levels 4 & 5 penalize)
    - Transfer: success in alternative contexts / challenge variants
    - Reliability: robust error handling, retries, idempotency
    - Comprehension: quality of architectural reasoning reflections
    - Consistency: performance across sequential tasks over time
    - Complexity: depth of graphs, agent teams, subflows
    - Safety: adherence to least privilege, no secrets exposed, HITL
    """

    DIMENSION_WEIGHTS = {
        "correctness": 0.20,
        "independence": 0.15,
        "transfer": 0.15,
        "reliability": 0.15,
        "comprehension": 0.10,
        "consistency": 0.10,
        "complexity": 0.05,
        "safety": 0.10,
    }

    @classmethod
    def compute_mastery_state(
        cls, overall_score: float, has_transfer: bool, hints_used: int
    ) -> MasteryState:
        if overall_score >= 0.95 and has_transfer and hints_used == 0:
            return "EXPERT"
        elif overall_score >= 0.85 and has_transfer:
            return "TRANSFER_VALIDATED"
        elif overall_score >= 0.80 and hints_used <= 1:
            return "MASTERED"
        elif overall_score >= 0.70 and hints_used <= 2:
            return "INDEPENDENT"
        elif overall_score >= 0.60:
            return "COMPETENT"
        elif overall_score >= 0.40:
            return "PRACTICING"
        elif overall_score >= 0.20:
            return "GUIDED"
        elif overall_score > 0.0:
            return "INTRODUCED"
        return "UNKNOWN"

    @classmethod
    def update_skill_mastery(
        cls,
        user_id: str,
        skill_id: str,
        passed_cleanly: bool,
        hints_used: list[int],
        has_transfer: bool = False,
        has_reflection: bool = False,
        has_safety_checks: bool = True,
        complexity_score: float = 0.5,
    ) -> SkillMasteryRecord:
        current = db.skill_mastery_get(user_id, skill_id)
        dims = current.get("dimensions", {})
        is_first_attempt = not bool(dims) or current.get("state") == "UNKNOWN"

        # 1. Correctness: 1.0 if passed cleanly without blocking findings
        c_score = 1.0 if passed_cleanly else 0.4
        new_correctness = (
            c_score
            if is_first_attempt
            else (dims.get("correctness", 0.0) * 0.3) + (c_score * 0.7)
        )

        # 2. Independence: False Mastery penalty for hint abuse
        max_hint_level = max(hints_used) if hints_used else 0
        if max_hint_level >= 4:
            indep_factor = 0.35  # Severe penalty for asking for full solution / patch
        elif max_hint_level >= 2:
            indep_factor = 0.65
        elif max_hint_level == 1:
            indep_factor = 0.85
        else:
            indep_factor = 1.0  # Completely autonomous
        new_independence = (
            indep_factor
            if is_first_attempt
            else (dims.get("independence", 0.0) * 0.3) + (indep_factor * 0.7)
        )

        # 3. Transfer
        trans_factor = (
            1.0
            if has_transfer
            else (0.4 if is_first_attempt else dims.get("transfer", 0.0))
        )
        new_transfer = (
            trans_factor
            if is_first_attempt
            else (dims.get("transfer", 0.0) * 0.4) + (trans_factor * 0.6)
        )

        # 4. Reliability
        rel_score = 1.0 if (passed_cleanly and max_hint_level <= 2) else 0.6
        new_reliability = (
            rel_score
            if is_first_attempt
            else (dims.get("reliability", 0.0) * 0.3) + (rel_score * 0.7)
        )

        # 5. Comprehension
        comp_score = 0.95 if has_reflection else 0.4
        new_comprehension = (
            comp_score
            if is_first_attempt
            else (dims.get("comprehension", 0.0) * 0.3) + (comp_score * 0.7)
        )

        # 6. Consistency
        consistency_score = (
            0.85
            if is_first_attempt and passed_cleanly
            else min(
                1.0, dims.get("consistency", 0.3) + (0.2 if passed_cleanly else -0.1)
            )
        )

        # 7. Complexity
        new_complexity = (
            complexity_score
            if is_first_attempt
            else max(dims.get("complexity", 0.0), complexity_score)
        )

        # 8. Safety
        new_safety = 1.0 if has_safety_checks else 0.5

        # Weighted calculation
        overall = (
            new_correctness * cls.DIMENSION_WEIGHTS["correctness"]
            + new_independence * cls.DIMENSION_WEIGHTS["independence"]
            + new_transfer * cls.DIMENSION_WEIGHTS["transfer"]
            + new_reliability * cls.DIMENSION_WEIGHTS["reliability"]
            + new_comprehension * cls.DIMENSION_WEIGHTS["comprehension"]
            + consistency_score * cls.DIMENSION_WEIGHTS["consistency"]
            + new_complexity * cls.DIMENSION_WEIGHTS["complexity"]
            + new_safety * cls.DIMENSION_WEIGHTS["safety"]
        )
        overall = round(min(1.0, max(0.0, overall)), 3)

        new_state = cls.compute_mastery_state(overall, has_transfer, len(hints_used))

        new_dims = {
            "correctness": round(new_correctness, 2),
            "independence": round(new_independence, 2),
            "transfer": round(new_transfer, 2),
            "reliability": round(new_reliability, 2),
            "comprehension": round(new_comprehension, 2),
            "consistency": round(consistency_score, 2),
            "complexity": round(new_complexity, 2),
            "safety": round(new_safety, 2),
        }

        saved = db.skill_mastery_upsert(user_id, skill_id, overall, new_state, new_dims)
        return SkillMasteryRecord(**saved)

    @classmethod
    def get_learner_mastery_graph(cls, user_id: str) -> list[dict[str, Any]]:
        return db.skill_mastery_all(user_id)
