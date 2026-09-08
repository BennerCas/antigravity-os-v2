from typing import Dict, Any, Optional, List
import db


class LearningEventBridge:
    """
    Event-driven Learning Integration Bridge.
    Listens to signals from Builder, FlowArchitect, and Runtime
    to propose non-intrusive, contextual micro-learning moments.
    """

    RECOMMENDATION_RULES = {
        "VAL-CTL-001": {
            "mission_id": "mission_04",
            "title": "Decisiones deterministas: Ruta de prioridad",
            "reason": "Detectamos una decisión sin ambas ramas (True/False). Practica cómo modelar condiciones exhaustivas."
        },
        "VAL-CON-001": {
            "mission_id": "mission_03",
            "title": "Variables y transforms: De texto a dato útil",
            "reason": "Detectamos incompatibilidad de tipos entre puertos. Practica cómo usar TransformNodes."
        },
        "VAL-REL-001": {
            "mission_id": "mission_09",
            "title": "Retry e idempotencia: No envíes dos veces",
            "reason": "Detectamos un nodo con efectos secundarios sin idempotency_key. Aprende a evitar duplicados."
        },
        "VAL-HITL-001": {
            "mission_id": "mission_10",
            "title": "Human-in-the-loop: Aprobación con vencimiento",
            "reason": "Detectamos una compuerta humana sin expiración. Practica el diseño de pausas durables."
        },
        "VAL-PAR-001": {
            "mission_id": "mission_15",
            "title": "Paralelismo y joins: Investiga sin pisar datos",
            "reason": "Detectamos bifurcaciones concurrentes sin consolidar. Practica Forks, Joins y Reducers."
        }
    }

    @classmethod
    def emit_event(cls, user_id: str, event_type: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Log to database
        db.learning_event_log(user_id, event_type, payload)

        # Check for contextual recommendations
        recommendation: Optional[Dict[str, Any]] = None

        if event_type == "builder.validation_failed":
            finding_code = payload.get("finding_code") or payload.get("code")
            if finding_code in cls.RECOMMENDATION_RULES:
                recommendation = cls.RECOMMENDATION_RULES[finding_code]

        elif event_type == "runtime.run_failed":
            error_class = payload.get("error_class", "")
            if "duplicate" in error_class.lower() or "idempotency" in error_class.lower():
                recommendation = cls.RECOMMENDATION_RULES["VAL-REL-001"]
            elif "timeout" in error_class.lower() and "human" in str(payload).lower():
                recommendation = cls.RECOMMENDATION_RULES["VAL-HITL-001"]

        return recommendation
