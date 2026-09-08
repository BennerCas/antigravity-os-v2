import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.academy.drift_engine import DriftEngine


def test_drift_detects_missing_step():
    spec = {
        "intent": {"goal": "Procesar Facturas"},
        "steps": [
            {"id": "step_extract", "kind": "agent", "name": "Extraer Datos"},
            {"id": "step_audit", "kind": "agent", "name": "Auditar Impuestos"}
        ],
        "transitions": []
    }
    # Builder flow only has step_extract
    builder_flow = {
        "nodes": [
            {"id": "step_extract", "data": {"title": "Extraer Datos", "role": "agent"}}
        ],
        "edges": []
    }

    findings = DriftEngine.analyze_drift(spec, builder_flow)
    assert len(findings) > 0
    categories = [f.category for f in findings]
    assert "missing_step" in categories


def test_drift_detects_missing_hitl():
    spec = {
        "intent": {"goal": "Transferencia de Fondos"},
        "requirements": {
            "constraints": ["Aprobación obligatoria por gerencia para montos > 10,000"]
        },
        "steps": [
            {"id": "s1", "kind": "start"},
            {"id": "s2", "kind": "agent", "name": "Evaluar"}
        ]
    }
    builder_flow = {
        "nodes": [
            {"id": "s1", "data": {"title": "Start", "role": "start"}},
            {"id": "s2", "data": {"title": "Evaluar", "role": "agent"}}
        ],
        "edges": []
    }

    findings = DriftEngine.analyze_drift(spec, builder_flow)
    categories = [f.category for f in findings]
    assert "missing_hitl" in categories
