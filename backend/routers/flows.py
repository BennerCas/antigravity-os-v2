"""Router de Flows (Nexus) — persistencia SQLite con migración desde flows.json legacy."""

import json
import os
from typing import Any

import db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/flows", tags=["flows"])

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"
)
LEGACY_JSON = os.path.join(DATA_DIR, "flows.json")


class Flow(BaseModel):
    id: str
    name: str
    description: str
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


def _migrate_legacy_json() -> None:
    """Importa flows.json a SQLite una sola vez (renombra el archivo a .migrated)."""
    if not os.path.exists(LEGACY_JSON):
        return
    try:
        with open(LEGACY_JSON, "r", encoding="utf-8") as f:
            legacy = json.load(f)
        if isinstance(legacy, list):
            for flow in legacy:
                if isinstance(flow, dict) and flow.get("id"):
                    db.flow_upsert(flow)
        os.rename(LEGACY_JSON, LEGACY_JSON + ".migrated")
        print(f"[DB] Migrados {len(legacy)} flows desde flows.json")
    except Exception as e:
        print(f"[DB] Migración legacy falló: {e}")


db.init_db()
_migrate_legacy_json()


@router.get("")
def get_flows():
    return db.flows_all()


@router.post("")
def save_flow(flow: Flow):
    flow_dict = flow.model_dump()
    db.flow_upsert(flow_dict)
    return flow_dict


@router.delete("/{flow_id}")
def delete_flow(flow_id: str):
    if not db.flow_delete(flow_id):
        raise HTTPException(status_code=404, detail="Flow no encontrado")
    return {"message": "Flow deleted"}
