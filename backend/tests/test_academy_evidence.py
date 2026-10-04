import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import db
from services.academy.evidence_service import EvidenceService


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()


def test_evidence_recording_and_hashing():
    record = EvidenceService.record_evidence(
        user_id="user_evidence_1",
        skill_id="graph_connections",
        mission_id="mission_01",
        session_id="sess_101",
        evidence_type="graph",
        source="builder_canvas",
        payload={"nodes_count": 3, "edges_count": 2},
        confidence=1.0,
    )
    assert record.id.startswith("evi_")
    assert len(record.validation_hash) == 64  # SHA256 hex string
    assert record.confidence == 1.0


def test_evidence_chain_verification():
    rec1 = EvidenceService.record_evidence(
        user_id="user_evidence_2",
        skill_id="conditions",
        mission_id="mission_04",
        session_id="sess_102",
        evidence_type="contract",
        source="validator",
        payload={"branches": ["true", "false"]},
    )
    rec2 = EvidenceService.record_evidence(
        user_id="user_evidence_2",
        skill_id="conditions",
        mission_id="mission_04",
        session_id="sess_102",
        evidence_type="runtime",
        source="simulator",
        payload={"exit_code": 0},
    )

    is_valid = EvidenceService.verify_evidence_chain([rec1.id, rec2.id])
    assert is_valid is True
