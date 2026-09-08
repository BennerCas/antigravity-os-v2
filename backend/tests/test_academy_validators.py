import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.academy.validator_service import ValidatorService


def test_validator_detects_missing_start():
    flow = {
        "nodes": [
            {"id": "ag_1", "type": "action", "data": {"title": "Worker", "role": "agent"}},
            {"id": "end_1", "type": "action", "data": {"title": "End", "role": "end"}}
        ],
        "edges": [{"id": "e1", "source": "ag_1", "target": "end_1"}]
    }
    findings = ValidatorService.validate_flow(flow)
    codes = [f.code for f in findings]
    assert "VAL-TOP-001" in codes  # Missing start


def test_validator_detects_missing_end():
    flow = {
        "nodes": [
            {"id": "start_1", "type": "action", "data": {"title": "Start", "role": "start"}},
            {"id": "ag_1", "type": "action", "data": {"title": "Worker", "role": "agent"}}
        ],
        "edges": [{"id": "e1", "source": "start_1", "target": "ag_1"}]
    }
    findings = ValidatorService.validate_flow(flow)
    codes = [f.code for f in findings]
    assert "VAL-TOP-002" in codes  # Missing end


def test_validator_detects_contract_type_mismatch():
    flow = {
        "nodes": [
            {"id": "start_1", "type": "action", "data": {"title": "Start", "role": "start", "output_type": "string"}},
            {"id": "erp_1", "type": "action", "data": {"title": "ERP", "role": "tool", "input_type": "number"}}
        ],
        "edges": [{"id": "e1", "source": "start_1", "target": "erp_1"}]
    }
    findings = ValidatorService.validate_flow(flow)
    codes = [f.code for f in findings]
    assert "VAL-CON-001" in codes  # String to number mismatch


def test_validator_detects_unhandled_condition_branch():
    flow = {
        "nodes": [
            {"id": "start_1", "type": "action", "data": {"title": "Start", "role": "start"}},
            {"id": "cond_1", "type": "condition", "data": {"title": "Is VIP?", "expression": "vip == True"}},
            {"id": "vip_action", "type": "action", "data": {"title": "VIP Action", "role": "agent"}}
        ],
        "edges": [
            {"id": "e1", "source": "start_1", "target": "cond_1"},
            {"id": "e2", "source": "cond_1", "target": "vip_action", "label": "true"}
        ]
    }
    findings = ValidatorService.validate_flow(flow)
    codes = [f.code for f in findings]
    assert "VAL-CTL-001" in codes  # Missing False branch


def test_validator_detects_missing_idempotency_key():
    flow = {
        "nodes": [
            {"id": "start_1", "type": "action", "data": {"title": "Start", "role": "start"}},
            {"id": "charge_tool", "type": "action", "data": {"title": "Charge Card", "role": "tool", "side_effect": True}},
            {"id": "end_1", "type": "action", "data": {"title": "End", "role": "end"}}
        ],
        "edges": [
            {"id": "e1", "source": "start_1", "target": "charge_tool"},
            {"id": "e2", "source": "charge_tool", "target": "end_1"}
        ]
    }
    findings = ValidatorService.validate_flow(flow)
    codes = [f.code for f in findings]
    assert "VAL-REL-001" in codes  # Side effect missing idempotency


def test_validator_clean_flow_passes():
    flow = {
        "nodes": [
            {"id": "start_clean", "type": "action", "data": {"title": "Start", "role": "start"}},
            {"id": "agent_clean", "type": "action", "data": {"title": "Agent", "role": "agent"}},
            {"id": "end_clean", "type": "action", "data": {"title": "End", "role": "end"}}
        ],
        "edges": [
            {"id": "e1", "source": "start_clean", "target": "agent_clean"},
            {"id": "e2", "source": "agent_clean", "target": "end_clean"}
        ]
    }
    findings = ValidatorService.validate_flow(flow)
    blockers = [f for f in findings if f.severity == "blocking"]
    assert len(blockers) == 0
