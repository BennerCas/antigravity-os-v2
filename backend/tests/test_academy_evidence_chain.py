import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import db
from services.academy.evidence_service import EvidenceService


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()
    with db._lock, db._conn() as conn:
        conn.execute("DELETE FROM evidence_ledger WHERE user_id LIKE 'learner_%'")


def test_cryptographic_evidence_chain_continuity():
    uid = "learner_crypto_test_01"

    # Block 0: Genesis
    ev0 = EvidenceService.record_evidence(
        user_id=uid,
        skill_id="skill_syntax",
        mission_id="mission_00",
        session_id="sess_0",
        evidence_type="graph",
        source="canvas",
        payload={"step": "genesis"}
    )
    assert ev0.prev_hash == "GENESIS_ROOT"

    # Block 1
    ev1 = EvidenceService.record_evidence(
        user_id=uid,
        skill_id="skill_branching",
        mission_id="mission_03",
        session_id="sess_1",
        evidence_type="contract",
        source="validator",
        payload={"branches": 2}
    )
    assert ev1.prev_hash == ev0.validation_hash

    # Block 2
    ev2 = EvidenceService.record_evidence(
        user_id=uid,
        skill_id="skill_idempotency",
        mission_id="mission_09",
        session_id="sess_2",
        evidence_type="runtime",
        source="simulator",
        payload={"side_effects": 1}
    )
    assert ev2.prev_hash == ev1.validation_hash

    # Full chain audit
    audit = EvidenceService.verify_learner_chain(uid)
    assert audit["valid"] is True
    assert audit["count"] == 3
    assert audit["chain_head"] == ev2.validation_hash
    assert len(audit["merkle_root"]) == 64


def test_cryptographic_evidence_tamper_detection():
    uid = "learner_tamper_victim_02"

    ev0 = EvidenceService.record_evidence(
        user_id=uid,
        skill_id="skill_syntax",
        mission_id="mission_00",
        session_id="sess_0",
        evidence_type="graph",
        source="canvas",
        payload={"authentic": True}
    )

    ev1 = EvidenceService.record_evidence(
        user_id=uid,
        skill_id="skill_branching",
        mission_id="mission_03",
        session_id="sess_1",
        evidence_type="runtime",
        source="simulator",
        payload={"score": 100}
    )

    # Legitimate chain passes
    initial_audit = EvidenceService.verify_learner_chain(uid)
    assert initial_audit["valid"] is True

    # Malicious actor tampers with payload of Block 0 in database
    with db._lock, db._conn() as conn:
        conn.execute(
            "UPDATE evidence_ledger SET payload = ? WHERE id = ?",
            ('{"authentic": false, "tampered": true}', ev0.id)
        )

    # Auditing the chain now must immediately detect tampering!
    tampered_audit = EvidenceService.verify_learner_chain(uid)
    assert tampered_audit["valid"] is False
    assert tampered_audit["broken_at_index"] == 0
    assert tampered_audit["record_id"] == ev0.id
