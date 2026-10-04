import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import db
from services.academy.assessment_service import AssessmentService
from services.academy.catalog_service import CatalogService
from services.academy.certification_service import CertificationService
from services.academy.evidence_service import EvidenceService
from services.academy.failure_lab_service import FailureLabService
from services.academy.portfolio_service import PortfolioService
from services.academy.sandbox_service import SandboxService


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()
    CatalogService.seed_catalog()


def test_academy_v4_full_industrial_lifecycle_e2e():
    uid = "student_industrial_v4_master"

    # 1. Start Mission 00 session
    session = SandboxService.start_session(uid, "mission_00")
    assert session.status == "started"

    # Provide valid flow for Mission 00 (Connect Start to End)
    valid_flow = {
        "nodes": [
            {
                "id": "node_start",
                "type": "start",
                "data": {"title": "Inicio", "role": "start"},
            },
            {"id": "node_end", "type": "end", "data": {"title": "Fin", "role": "end"}},
        ],
        "edges": [{"id": "e_main", "source": "node_start", "target": "node_end"}],
    }
    session = SandboxService.update_flow(session.id, valid_flow)

    # 2. Test In-Place Chaos Injection on learner's flow
    chaos_res = FailureLabService.inject_scenario(session.id, "fail_rate_limit")
    assert chaos_res["status"] == "injected"

    # Restore valid flow after fixing failure
    session = SandboxService.update_flow(session.id, valid_flow)

    # 3. True Graph Runtime Engine Simulation
    sim_res = SandboxService.run_simulation(session.id)
    assert sim_res["status"] == "success"
    assert len(sim_res["execution_trace"]) >= 2

    # 4. Submit Socratic Reflection
    refl_res = AssessmentService.submit_reflection(
        session.id,
        "Diseñé este flujo con un contrato directo entre inicio y fin para validar la topología básica de ejecución.",
        "¿Por qué diseñaste esta arquitectura?",
    )
    assert refl_res["status"] == "success"

    # 5. Complete Mission
    comp_res = AssessmentService.complete_mission(session.id)
    assert comp_res["status"] == "completed"

    # 6. Complete missions 01, 02, 03 to qualify for Foundation Certificate
    for mid in ["mission_01", "mission_02", "mission_03"]:
        s = SandboxService.start_session(uid, mid)
        m = CatalogService.get_mission(mid)
        # Use starter flow or simple valid flow
        SandboxService.update_flow(s.id, valid_flow)
        AssessmentService.complete_mission(s.id)

    # 7. Cryptographic Evidence Chain Verification
    audit_chain = EvidenceService.verify_learner_chain(uid)
    assert audit_chain["valid"] is True
    assert audit_chain["count"] >= 4
    assert len(audit_chain["merkle_root"]) == 64

    # 8. Multi-Gate Certification Audit and Issuance (Foundation Level)
    cert_audit = CertificationService.audit_eligibility(uid, "foundation")
    assert cert_audit["is_eligible"] is True

    cert_rec = CertificationService.issue_certification(uid, "foundation")
    assert cert_rec.verification_token.startswith("AG-CERT-FOUNDATION-")
    assert len(cert_rec.evidence_chain_hash) == 64

    # 9. Verify Token
    verify_res = CertificationService.verify_token(cert_rec.verification_token)
    assert verify_res["verified"] is True
    assert verify_res["status"] == "VALID"

    # 10. Portfolio Showcase with Authentic Evidence References
    portfolio = PortfolioService.get_learner_portfolio(uid)
    assert portfolio["user_id"] == uid
    assert portfolio["level"] == "foundation"
    assert len(portfolio["certifications"]) >= 1
    assert len(portfolio["portfolio_items"]) >= 1

    # Verify that portfolio items link to authentic evi_<uuid> records (NOT hardcoded evi_mission_00)
    first_item = portfolio["portfolio_items"][0]
    for ref in first_item["evidence_refs"]:
        assert ref.startswith("evi_")
        assert len(ref) > 10
        # Verify that each referenced evidence exists in the ledger
        ev_row = db.evidence_by_id(ref)
        assert ev_row is not None
