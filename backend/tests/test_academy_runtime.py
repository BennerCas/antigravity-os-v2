import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from services.academy.runtime_engine import RuntimeLearningEngine


def test_runtime_sequential_execution():
    flow = {
        "nodes": [
            {
                "id": "node_start",
                "type": "start",
                "data": {"title": "Start", "role": "start"},
            },
            {
                "id": "node_agent",
                "type": "action",
                "data": {"title": "Processor", "role": "agent"},
            },
            {"id": "node_end", "type": "end", "data": {"title": "End", "role": "end"}},
        ],
        "edges": [
            {"id": "e1", "source": "node_start", "target": "node_agent"},
            {"id": "e2", "source": "node_agent", "target": "node_end"},
        ],
    }
    result = RuntimeLearningEngine.execute_flow(
        flow, {"message": "Test input"}, session_id="test_seq"
    )
    assert result["status"] == "success"
    assert len(result["execution_trace"]) >= 3
    assert result["nodes_executed_count"] == 3


def test_runtime_branching_conditional():
    flow = {
        "nodes": [
            {
                "id": "node_start",
                "type": "start",
                "data": {"title": "Start", "role": "start"},
            },
            {
                "id": "node_dec",
                "type": "condition",
                "data": {
                    "title": "Check Urgency",
                    "role": "decision",
                    "condition": "urgency_score >= 8",
                },
            },
            {
                "id": "node_urgent",
                "type": "action",
                "data": {"title": "Escalar a Senior", "role": "agent"},
            },
            {
                "id": "node_normal",
                "type": "action",
                "data": {"title": "Atención Estándar", "role": "agent"},
            },
            {"id": "node_end", "type": "end", "data": {"title": "Fin", "role": "end"}},
        ],
        "edges": [
            {"id": "e_in", "source": "node_start", "target": "node_dec"},
            {
                "id": "e_true",
                "source": "node_dec",
                "target": "node_urgent",
                "label": "true",
            },
            {
                "id": "e_false",
                "source": "node_dec",
                "target": "node_normal",
                "label": "false",
            },
            {"id": "e_u_end", "source": "node_urgent", "target": "node_end"},
            {"id": "e_n_end", "source": "node_normal", "target": "node_end"},
        ],
    }

    # Case 1: Urgency 9 -> should take True branch (node_urgent)
    res_urgent = RuntimeLearningEngine.execute_flow(
        flow, {"urgency_score": 9}, session_id="test_branch_true"
    )
    executed_urgent = [
        step.get("node_id")
        for step in res_urgent["execution_trace"]
        if step.get("node_id")
    ]
    assert "node_urgent" in executed_urgent
    assert "node_normal" not in executed_urgent
    assert res_urgent["status"] == "success"

    # Case 2: Urgency 3 -> should take False branch (node_normal)
    res_normal = RuntimeLearningEngine.execute_flow(
        flow, {"urgency_score": 3}, session_id="test_branch_false"
    )
    executed_normal = [
        step.get("node_id")
        for step in res_normal["execution_trace"]
        if step.get("node_id")
    ]
    assert "node_normal" in executed_normal
    assert "node_urgent" not in executed_normal
    assert res_normal["status"] == "success"


def test_runtime_numeric_transformation():
    flow = {
        "nodes": [
            {
                "id": "node_start",
                "type": "start",
                "data": {"title": "Start", "role": "start"},
            },
            {
                "id": "node_transform",
                "type": "transform",
                "data": {
                    "title": "Parse Amount",
                    "role": "transform",
                    "source_field": "amount",
                    "target_field": "parsed_number",
                },
            },
            {"id": "node_end", "type": "end", "data": {"title": "End", "role": "end"}},
        ],
        "edges": [
            {"id": "e1", "source": "node_start", "target": "node_transform"},
            {"id": "e2", "source": "node_transform", "target": "node_end"},
        ],
    }
    result = RuntimeLearningEngine.execute_flow(
        flow, {"amount": "USD 1,250.00"}, session_id="test_transform"
    )
    assert result["status"] == "success"
    assert result["state"]["parsed_number"] == 1250.0


def test_runtime_idempotency_enforcement():
    flow = {
        "nodes": [
            {
                "id": "node_start",
                "type": "start",
                "data": {"title": "Start", "role": "start"},
            },
            {
                "id": "node_slack",
                "type": "action",
                "data": {
                    "title": "Sandbox Slack Notifier",
                    "role": "tool",
                    "idempotency_key": "ORDER_12345",
                },
            },
            {"id": "node_end", "type": "end", "data": {"title": "End", "role": "end"}},
        ],
        "edges": [
            {"id": "e1", "source": "node_start", "target": "node_slack"},
            {"id": "e2", "source": "node_slack", "target": "node_end"},
        ],
    }

    sess = "sess_idem_test"
    # First execution: side effect is produced
    res1 = RuntimeLearningEngine.execute_flow(flow, {"order": "12345"}, session_id=sess)
    assert res1["status"] == "success"
    assert res1["side_effects_count"] == 1

    # Second execution: duplicate request with same idempotency_key -> side effect suppressed!
    res2 = RuntimeLearningEngine.execute_flow(flow, {"order": "12345"}, session_id=sess)
    assert res2["status"] == "success"
    assert res2["side_effects_count"] == 0  # Deduplicated!
