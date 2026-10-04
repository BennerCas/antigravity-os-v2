import time
from typing import Any

from pydantic import BaseModel

from backend.services.academy.evidence_service import EvidenceService
from backend.services.academy.mastery_engine import MasteryEngine
from backend.services.academy.runtime_engine import RuntimeLearningEngine


class TransferTestCase(BaseModel):
    id: str
    name: str
    description: str
    input_payload: dict[str, Any]
    assertions: dict[
        str, Any
    ]  # e.g., {"classification": "auto_collision", "min_amount": 1000.0}


class TransferChallenge(BaseModel):
    id: str
    title: str
    source_mission: str
    target_skill: str
    domain_from: str
    domain_to: str
    description: str
    test_cases: list[TransferTestCase]


class TransferService:
    """
    Transfer Service evaluates authentic generalizability of student skills
    by executing workflows against unfamiliar secondary business domain fixtures.
    """

    CHALLENGES: dict[str, TransferChallenge] = {
        "transfer_triage_insurance": TransferChallenge(
            id="transfer_triage_insurance",
            title="Transferencia de Dominio: De Soporte Técnico a Reclamo de Seguros",
            source_mission="mission_03",
            target_skill="skill_branching",
            domain_from="Customer Support Triage",
            domain_to="Auto Insurance Claims Processing",
            description="El estudiante debe procesar un reclamo de siniestro vehicular clasificándolo con urgencia y verificando póliza activa.",
            test_cases=[
                TransferTestCase(
                    id="case_high_damage",
                    name="Siniestro Grave con Pérdida Parcial",
                    description="Reclamo por choque vehicular de alto valor ($4,500). Requiere clasificación 'facturacion' o 'tecnico' y monto >= 1000.",
                    input_payload={
                        "message": "Solicitud de cobro por choque lateral contra columna. Monto estimado USD 4,500.00.",
                        "amount": "USD 4,500.00",
                        "urgency_score": 9,
                        "is_valid": True,
                    },
                    assertions={
                        "must_reach_end": True,
                        "numeric_parsed": 4500.0,
                        "decision_branch": "true",
                    },
                ),
                TransferTestCase(
                    id="case_low_damage",
                    name="Reclamo Menor de Parabrisas",
                    description="Reclamo menor ($250). Requiere flujo estándar sin escalación urgente.",
                    input_payload={
                        "message": "Rotura de cristal delantero en autopista. Presupuesto taller: USD 250.00.",
                        "amount": "USD 250.00",
                        "urgency_score": 3,
                        "is_valid": True,
                    },
                    assertions={
                        "must_reach_end": True,
                        "numeric_parsed": 250.0,
                        "decision_branch": "false",
                    },
                ),
            ],
        ),
        "transfer_idempotency_hospital": TransferChallenge(
            id="transfer_idempotency_hospital",
            title="Transferencia de Fiabilidad: Integración Hospitalaria y Deduplicación",
            source_mission="mission_09",
            target_skill="skill_idempotency",
            domain_from="E-Commerce Payment Webhook",
            domain_to="Hospital Patient Admission & Lab Sync",
            description="El estudiante debe sincronizar la admisión médica garantizando que una doble llamada HL7 no duplique la orden de laboratorio.",
            test_cases=[
                TransferTestCase(
                    id="case_hl7_single",
                    name="Admisión HL7 Única",
                    description="Ingreso hospitalario con orden médica y clave de idempotencia 'PAT-2026-9081'.",
                    input_payload={
                        "message": "Admisión de paciente para tomografía urgente.",
                        "idempotency_key": "PAT-2026-9081",
                        "amount": "USD 1,200.00",
                        "urgency_score": 8,
                    },
                    assertions={"must_reach_end": True, "max_side_effects": 1},
                ),
                TransferTestCase(
                    id="case_hl7_duplicate",
                    name="Reenvío Duplicado de Red Hospitalaria",
                    description="Segundo intento con idéntica clave 'PAT-2026-9081'. Debe suprimir el efecto secundario.",
                    input_payload={
                        "message": "Reenvío HL7 de paciente para tomografía.",
                        "idempotency_key": "PAT-2026-9081",
                        "amount": "USD 1,200.00",
                        "urgency_score": 8,
                    },
                    assertions={
                        "must_reach_end": True,
                        "max_side_effects": 0,  # Deduplicated!
                    },
                ),
            ],
        ),
        "transfer_hitl_procurement": TransferChallenge(
            id="transfer_hitl_procurement",
            title="Transferencia HITL: Aprobación de Órdenes de Compra Enterprise",
            source_mission="mission_11",
            target_skill="skill_hitl",
            domain_from="Customer Refund Approval",
            domain_to="Enterprise Hardware Procurement",
            description="Compuerta de aprobación humana con manejo de expiración y ruta alternativa si el director no firma a tiempo.",
            test_cases=[
                TransferTestCase(
                    id="case_procurement_approved",
                    name="Compra Aprobada en Ventana Operativa",
                    description="Supera el umbral de $1,000 y se aprueba por supervisor.",
                    input_payload={
                        "message": "Compra de 10 servidores GPU por USD 50,000.00.",
                        "amount": "USD 50,000.00",
                        "urgency_score": 9,
                        "is_valid": True,
                    },
                    assertions={"must_reach_end": True, "human_approval": "approved"},
                )
            ],
        ),
    }

    @classmethod
    def list_challenges(cls) -> list[dict[str, Any]]:
        return [
            {
                "id": c.id,
                "title": c.title,
                "source_mission": c.source_mission,
                "target_skill": c.target_skill,
                "domain_from": c.domain_from,
                "domain_to": c.domain_to,
                "description": c.description,
                "test_case_count": len(c.test_cases),
            }
            for c in cls.CHALLENGES.values()
        ]

    @classmethod
    def get_challenge(cls, challenge_id: str) -> TransferChallenge | None:
        return cls.CHALLENGES.get(challenge_id)

    @classmethod
    def evaluate_transfer(
        cls, user_id: str, challenge_id: str, flow: dict[str, Any]
    ) -> dict[str, Any]:
        challenge = cls.get_challenge(challenge_id)
        if not challenge:
            raise ValueError(f"Transfer challenge '{challenge_id}' not found.")

        test_results = []
        passed_count = 0

        # Isolated session id for this transfer run
        transfer_session_id = f"transfer_{user_id}_{challenge_id}_{int(time.time())}"

        for tc in challenge.test_cases:
            run_res = RuntimeLearningEngine.execute_flow(
                flow=flow,
                input_payload=dict(tc.input_payload),
                session_id=transfer_session_id,
            )

            tc_passed = True
            failure_reasons = []

            # 1. Assertion: must reach terminal node
            if tc.assertions.get("must_reach_end"):
                if run_res.get("status") not in ["success", "completed"]:
                    tc_passed = False
                    failure_reasons.append(
                        f"El flujo no alcanzó el nodo de fin (status: {run_res.get('status')})"
                    )

            # 2. Assertion: numeric parsed
            if "numeric_parsed" in tc.assertions:
                expected_num = tc.assertions["numeric_parsed"]
                parsed_num = run_res.get("state", {}).get("parsed_number")
                if parsed_num != expected_num:
                    tc_passed = False
                    failure_reasons.append(
                        f"Número parseado {parsed_num} no coincide con {expected_num}"
                    )

            # 3. Assertion: decision branch
            if "decision_branch" in tc.assertions:
                expected_branch = tc.assertions["decision_branch"]
                actual_branch = run_res.get("state", {}).get("decision_result")
                if actual_branch != expected_branch:
                    tc_passed = False
                    failure_reasons.append(
                        f"Rama de decisión '{actual_branch}' no coincide con '{expected_branch}'"
                    )

            # 4. Assertion: side effects
            if "max_side_effects" in tc.assertions:
                max_se = tc.assertions["max_side_effects"]
                actual_se = run_res.get("side_effects_count", 0)
                if actual_se > max_se:
                    tc_passed = False
                    failure_reasons.append(
                        f"Efectos secundarios ({actual_se}) exceden el máximo esperado ({max_se})"
                    )

            # 5. Assertion: human approval
            if "human_approval" in tc.assertions:
                expected_appr = tc.assertions["human_approval"]
                actual_appr = run_res.get("state", {}).get("human_approval")
                if actual_appr != expected_appr:
                    tc_passed = False
                    failure_reasons.append(
                        f"Estado de aprobación '{actual_appr}' no coincide con '{expected_appr}'"
                    )

            if tc_passed:
                passed_count += 1

            test_results.append(
                {
                    "test_case_id": tc.id,
                    "name": tc.name,
                    "passed": tc_passed,
                    "failure_reasons": failure_reasons,
                    "duration_ms": run_res.get("duration_ms", 0),
                    "side_effects_count": run_res.get("side_effects_count", 0),
                }
            )

        total_cases = len(challenge.test_cases)
        transfer_score = (
            round(passed_count / total_cases, 2) if total_cases > 0 else 1.0
        )
        challenge_passed = transfer_score >= 0.80

        evidence_record = None
        mastery_record = None

        if challenge_passed:
            # Record authentic transfer evidence in cryptographic ledger
            evidence_record = EvidenceService.record_evidence(
                user_id=user_id,
                skill_id=challenge.target_skill,
                mission_id=challenge.source_mission,
                session_id=transfer_session_id,
                evidence_type="transfer",
                source="transfer_service_evaluator",
                payload={
                    "challenge_id": challenge.id,
                    "domain_from": challenge.domain_from,
                    "domain_to": challenge.domain_to,
                    "score": transfer_score,
                    "passed_cases": passed_count,
                    "total_cases": total_cases,
                },
                confidence=1.0,
            )

            # Update Skill Mastery with verified transfer competence
            mastery_record = MasteryEngine.update_skill_mastery(
                user_id=user_id,
                skill_id=challenge.target_skill,
                passed_cleanly=True,
                hints_used=[],
                has_transfer=True,
                has_reflection=True,
            )

        return {
            "status": "passed" if challenge_passed else "failed",
            "challenge_id": challenge.id,
            "title": challenge.title,
            "score": transfer_score,
            "passed_count": passed_count,
            "total_cases": total_cases,
            "challenge_passed": challenge_passed,
            "test_results": test_results,
            "evidence_id": evidence_record.id if evidence_record else None,
            "mastery_state": mastery_record.state if mastery_record else None,
        }
