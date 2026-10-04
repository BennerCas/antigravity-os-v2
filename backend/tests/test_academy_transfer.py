import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import db
from services.academy.transfer_service import TransferService


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()


def test_transfer_challenge_execution_and_mastery():
    uid = "learner_transfer_tester_01"

    # Robust learner flow capable of parsing amount, deciding branch, and reaching end
    learner_flow = {
        "nodes": [
            {
                "id": "start_1",
                "type": "start",
                "data": {"title": "Start Ingest", "role": "start"},
            },
            {
                "id": "parse_node",
                "type": "transform",
                "data": {
                    "title": "Parse Amount",
                    "role": "transform",
                    "source_field": "amount",
                    "target_field": "parsed_number",
                },
            },
            {
                "id": "cond_node",
                "type": "condition",
                "data": {
                    "title": "Check Threshold",
                    "role": "decision",
                    "condition": "amount >= 1000",
                },
            },
            {
                "id": "agent_urgent",
                "type": "action",
                "data": {"title": "Adjuster Senior", "role": "agent"},
            },
            {
                "id": "agent_low",
                "type": "action",
                "data": {"title": "Express Pay", "role": "agent"},
            },
            {
                "id": "end_sink",
                "type": "end",
                "data": {"title": "Terminar", "role": "end"},
            },
        ],
        "edges": [
            {"id": "e1", "source": "start_1", "target": "parse_node"},
            {"id": "e2", "source": "parse_node", "target": "cond_node"},
            {
                "id": "e_true",
                "source": "cond_node",
                "target": "agent_urgent",
                "label": "true",
            },
            {
                "id": "e_false",
                "source": "cond_node",
                "target": "agent_low",
                "label": "false",
            },
            {"id": "e_u_end", "source": "agent_urgent", "target": "end_sink"},
            {"id": "e_l_end", "source": "agent_low", "target": "end_sink"},
        ],
    }

    res = TransferService.evaluate_transfer(
        uid, "transfer_triage_insurance", learner_flow
    )

    assert res["status"] == "passed"
    assert res["challenge_passed"] is True
    assert res["score"] == 1.0
    assert res["evidence_id"] is not None
    assert res["mastery_state"] in ["TRANSFER_VALIDATED", "EXPERT", "MASTERED"]
