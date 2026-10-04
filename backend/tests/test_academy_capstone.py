import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import db
from services.academy.capstone_service import CapstoneService


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()


def test_curriculum_source_gap_capstone_02():
    gap_info = CapstoneService.get_curriculum_gap_info()
    assert gap_info["gap_id"] == "CURRICULUM_SOURCE_GAP-CAPSTONE-02"
    assert gap_info["status"] == "DOCUMENTED_SOURCE_ABSENT"
    assert gap_info["directive"] == "STRICT_NO_FABRICATION"


def test_capstone_architecture_audit_and_defense():
    uid = "learner_capstone_hero_01"

    # Build compliant Capstone flow:
    # 8 agents, 2 subflows, fork/join reducer, expiring human gate, prompts
    nodes = [
        {
            "id": "node_start",
            "type": "start",
            "data": {"title": "Ingest Orchestrator", "role": "start"},
        },
        {
            "id": "fork_node",
            "type": "action",
            "data": {"title": "Router Splitter", "role": "action"},
        },
    ]
    # 8 agents
    for i in range(8):
        nodes.append(
            {
                "id": f"agent_{i}",
                "type": "action",
                "data": {
                    "title": f"Specialist Agent {i}",
                    "role": "agent",
                    "prompt": f"You are expert agent {i}. Adhere to safety and idempotency.",
                    "variants": [f"variant_{i}_v1", f"variant_{i}_v2"],
                },
            }
        )
    # 2 subflows
    nodes.append(
        {
            "id": "subflow_1",
            "type": "subflow",
            "data": {"title": "Financial Audit Subflow", "role": "subflow"},
        }
    )
    nodes.append(
        {
            "id": "subflow_2",
            "type": "subflow",
            "data": {"title": "Compliance Vault Subflow", "role": "subflow"},
        }
    )
    # Reducer join node
    nodes.append(
        {
            "id": "reducer_join",
            "type": "action",
            "data": {"title": "State Reducer", "role": "action"},
        }
    )
    # Expiring human gate
    nodes.append(
        {
            "id": "gate_human",
            "type": "human",
            "data": {
                "title": "C-Level Approval Gate",
                "role": "human",
                "timeout_seconds": 3600,
                "timeout_action": "escalate",
            },
        }
    )
    # End
    nodes.append(
        {
            "id": "node_end",
            "type": "end",
            "data": {"title": "Terminal Complete", "role": "end"},
        }
    )

    # Connect edges
    edges = [
        {"id": "e_start", "source": "node_start", "target": "fork_node"},
        # Fork to agents
        {"id": "e_f1", "source": "fork_node", "target": "agent_0"},
        {"id": "e_f2", "source": "fork_node", "target": "agent_1"},
        # Join into reducer
        {"id": "e_j1", "source": "agent_0", "target": "reducer_join"},
        {"id": "e_j2", "source": "agent_1", "target": "reducer_join"},
        # Connect rest sequentially
        {"id": "e_sub1", "source": "reducer_join", "target": "subflow_1"},
        {"id": "e_sub2", "source": "subflow_1", "target": "subflow_2"},
        {"id": "e_gate", "source": "subflow_2", "target": "gate_human"},
        {"id": "e_end", "source": "gate_human", "target": "node_end"},
    ]

    capstone_flow = {"nodes": nodes, "edges": edges}

    # Step 1: Initial submission
    res = CapstoneService.submit_and_evaluate(
        user_id=uid,
        capstone_id="mission_18",
        flow=capstone_flow,
        spec={"architecture": "Distributed Multi-Agent Mesh"},
    )
    assert res["architecture_audit"]["is_valid"] is True
    assert res["status"] == "under_defense"

    submission_id = res["submission_id"]

    # Step 2: Generate technical defense inquiry
    inquiry = CapstoneService.generate_defense_inquiry(submission_id)
    assert len(inquiry["questions"]) == 3

    # Step 3: Submit substantive technical defense
    defense_answers = {
        "q1_topology_tradeoff": "Se eligió una topología desacoplada donde cada agente posee aislamiento de fallas y un contrato estricto, mitigando la sobrecarga de contexto y latencia que sufriría un único orquestador monolítico.",
        "q2_concurrency_reducer": "El nodo reductor implementa deduplicación basada en idempotencia con llaves de negocio y backoff exponencial, garantizando consistencia eventual aún si una de las ramas experimenta degradación temporal.",
        "q3_hitl_timeout_policy": "La compuerta humana tiene un timeout de 3600 segundos; tras la expiración ejecuta una política de escalacion segura hacia la cola de auditoría sin autorizar transacciones a ciegas.",
    }

    final_eval = CapstoneService.submit_and_evaluate(
        user_id=uid,
        capstone_id="mission_18",
        flow=capstone_flow,
        spec={"architecture": "Distributed Multi-Agent Mesh"},
        defense_answers=defense_answers,
    )

    assert final_eval["is_passed"] is True
    assert final_eval["status"] == "passed"
    assert final_eval["defense_score"] >= 0.85
    assert final_eval["evidence_id"] is not None
