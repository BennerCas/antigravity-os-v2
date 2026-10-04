import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uuid

import db
from services.academy.assessment_service import AssessmentService
from services.academy.catalog_service import CatalogService
from services.academy.certification_service import CertificationService
from services.academy.failure_lab_service import FailureLabService
from services.academy.portfolio_service import PortfolioService
from services.academy.sandbox_service import SandboxService
from services.academy.validator_service import ValidatorService


@pytest.fixture(autouse=True)
def setup_environment():
    db.init_db()
    CatalogService.seed_catalog()


def test_full_learner_e2e_journey():
    user_id = f"real_learner_e2e_{uuid.uuid4().hex[:6]}"

    # 1. Diagnostic & Profile
    profile = db.learning_profile_get_or_create(user_id)
    assert profile["user_id"] == user_id
    assert profile["level"] == "foundation"

    # Update diagnostic preferences
    updated_profile = db.learning_profile_update(
        user_id,
        {"preferences": {"mode": "rigorous", "target_role": "enterprise_architect"}},
    )
    assert updated_profile["preferences"]["mode"] == "rigorous"

    # 2. Start Mission 1: Primer flujo funcional
    session = SandboxService.start_session(user_id, "mission_01")
    session_id = session.id
    assert session.mission_id == "mission_01"
    assert session.status == "started"

    # 3. Initial flow has missing edge to End
    starter_flow = session.sandbox_flow
    findings_initial = ValidatorService.validate_flow(starter_flow, "mission_01")
    # Must have findings because End is disconnected
    assert any(f.code in ["VAL-TOP-002", "VAL-TOP-005"] for f in findings_initial)

    # 4. Student connects Agent to End
    repaired_flow = {
        "nodes": [
            {
                "id": "node_start",
                "type": "action",
                "data": {"title": "Start", "role": "start"},
            },
            {
                "id": "node_agent",
                "type": "action",
                "data": {
                    "title": "Clasificador",
                    "role": "agent",
                    "output_type": "string",
                },
            },
            {
                "id": "node_end",
                "type": "action",
                "data": {"title": "End", "role": "end"},
            },
        ],
        "edges": [
            {"id": "edge_1", "source": "node_start", "target": "node_agent"},
            {"id": "edge_2", "source": "node_agent", "target": "node_end"},
        ],
    }
    updated_session = SandboxService.update_flow(session_id, repaired_flow)
    findings_repaired = ValidatorService.validate_flow(repaired_flow, "mission_01")
    blockers = [f for f in findings_repaired if f.severity == "blocking"]
    assert (
        len(blockers) == 0
    ), f"Expected 0 blockers, found: {[b.message for b in blockers]}"

    # 5. Run simulation in sandbox
    sim_result = SandboxService.run_simulation(
        session_id, {"message": "Problema con mi factura"}
    )
    assert sim_result["status"] == "success"
    assert len(sim_result["execution_trace"]) >= 4  # start, agent, end, completed

    # 6. Failure Lab test: Inject error -> observe -> resolve
    inject_res = FailureLabService.inject_scenario(session_id, "fail_schema_mismatch")
    assert inject_res["status"] == "injected"
    broken_session = db.mission_session_get(session_id)
    assert broken_session["status"] == "blocked"

    # Student restores repaired flow
    SandboxService.update_flow(session_id, repaired_flow)

    # 7. Submit Architectural Reflection
    ref_res = AssessmentService.submit_reflection(
        session_id=session_id,
        reflection_text="Conecté el nodo Start con el Agente Clasificador y la salida de este al nodo End para garantizar que la solicitud siempre alcance una ruta terminal.",
        prompt="¿Por qué diseñaste esta arquitectura?",
    )
    assert ref_res["status"] == "success"
    assert ref_res["submission"]["ai_score"] >= 0.8

    # 8. Complete Mission
    completion_res = AssessmentService.complete_mission(session_id)
    assert completion_res["status"] == "completed"
    assert len(completion_res["mastery_updates"]) > 0

    # 9. Verify Evidence Ledger and Mastery persistence
    evidence_records = db.evidence_user(user_id)
    assert len(evidence_records) >= 3  # graph, runtime, reasoning evidence

    mastery = db.skill_mastery_get(user_id, "graph_connections")
    assert mastery["mastery_score"] > 0.0
    assert mastery["state"] != "UNKNOWN"

    # 10. Clone to Production Workspace
    clone_res = SandboxService.clone_to_workspace(session_id)
    assert clone_res["status"] == "success"
    assert clone_res["flow_id"].startswith("flow_academy_")

    # Verify flow exists in production flows table
    ws_flows = db.flows_all()
    assert any(f["id"] == clone_res["flow_id"] for f in ws_flows)

    # 11. Complete Foundation Missions 0, 2, 3 to test Certification issuance
    m00_sess = SandboxService.start_session(user_id, "mission_00")
    AssessmentService.complete_mission(m00_sess.id)

    m02_sess = SandboxService.start_session(user_id, "mission_02")
    SandboxService.update_flow(
        m02_sess.id,
        {
            "nodes": [
                {
                    "id": "node_start",
                    "type": "action",
                    "data": {"title": "Start", "role": "start"},
                },
                {
                    "id": "node_fetch",
                    "type": "action",
                    "data": {
                        "title": "Fetch User",
                        "role": "agent",
                        "output_type": "json",
                        "output_schema": "user",
                    },
                },
                {
                    "id": "node_parse",
                    "type": "action",
                    "data": {
                        "title": "Parse User",
                        "role": "agent",
                        "input_type": "json",
                        "input_schema": "user",
                        "output_type": "string",
                    },
                },
                {
                    "id": "node_end",
                    "type": "action",
                    "data": {"title": "End", "role": "end"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "node_start", "target": "node_fetch"},
                {"id": "e2", "source": "node_fetch", "target": "node_parse"},
                {"id": "e3", "source": "node_parse", "target": "node_end"},
            ],
        },
    )
    AssessmentService.complete_mission(m02_sess.id)

    m03_sess = SandboxService.start_session(user_id, "mission_03")
    SandboxService.update_flow(
        m03_sess.id,
        {
            "nodes": [
                {
                    "id": "node_start",
                    "type": "action",
                    "data": {"title": "Start", "role": "start"},
                },
                {
                    "id": "node_decision",
                    "type": "decision",
                    "data": {
                        "title": "Score Check",
                        "role": "decision",
                        "condition": "score > 80",
                        "cases": ["true", "false"],
                    },
                },
                {
                    "id": "node_vip",
                    "type": "action",
                    "data": {
                        "title": "VIP Handler",
                        "role": "agent",
                        "output_type": "string",
                    },
                },
                {
                    "id": "node_std",
                    "type": "action",
                    "data": {
                        "title": "Standard Handler",
                        "role": "agent",
                        "output_type": "string",
                    },
                },
                {
                    "id": "node_end",
                    "type": "action",
                    "data": {"title": "End", "role": "end"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "node_start", "target": "node_decision"},
                {
                    "id": "e2",
                    "source": "node_decision",
                    "target": "node_vip",
                    "label": "true",
                    "data": {"case": "true"},
                },
                {
                    "id": "e3",
                    "source": "node_decision",
                    "target": "node_std",
                    "label": "false",
                    "data": {"case": "false"},
                },
                {"id": "e4", "source": "node_vip", "target": "node_end"},
                {"id": "e5", "source": "node_std", "target": "node_end"},
            ],
        },
    )
    AssessmentService.complete_mission(m03_sess.id)

    # Audit Certification eligibility for Foundation
    audit = CertificationService.audit_eligibility(user_id, "foundation")
    assert audit["is_eligible"] is True

    # Issue Certification
    cert = CertificationService.issue_certification(user_id, "foundation")
    assert cert.level == "foundation"
    assert cert.verification_token.startswith("AG-CERT-FOUNDATION-")

    # Verify Token
    verify_res = CertificationService.verify_token(cert.verification_token)
    assert verify_res is not None
    assert verify_res["status"] == "VALID"

    # 12. Check Portfolio Compilation
    portfolio = PortfolioService.get_learner_portfolio(user_id)
    assert portfolio["user_id"] == user_id
    assert len(portfolio["certifications"]) >= 1
    assert len(portfolio["portfolio_items"]) >= 1
    assert portfolio["signature"] == "HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®"
