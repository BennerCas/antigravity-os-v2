import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import db
from backend.schemas.academy import PortfolioItem


class PortfolioService:
    """
    Portfolio Service compiles an authentic, evidence-backed showcase
    of verified workflows, blueprints, execution traces, and certifications.
    """

    @classmethod
    def get_learner_portfolio(cls, user_id: str) -> Dict[str, Any]:
        profile = db.learning_profile_get_or_create(user_id)
        certifications = db.certifications_user(user_id)
        published_items = db.portfolio_items_user(user_id)
        evidence_records = db.evidence_user(user_id)
        mastery = db.skill_mastery_all(user_id)

        # Auto-compile items if empty
        if not published_items:
            # Check completed missions
            sessions = db.mission_sessions_user(user_id)
            for s in sessions:
                if s.get("status") in ["passed", "mastered"]:
                    flow = s.get("sandbox_flow", {})
                    nodes = flow.get("nodes", [])
                    item_id = f"port_{s['mission_id']}_{uuid.uuid4().hex[:6]}"
                    auto_item = {
                        "id": item_id,
                        "user_id": user_id,
                        "item_type": "workflow",
                        "title": f"Solución Verificada: {s['mission_id'].replace('_', ' ').title()}",
                        "description": f"Flujo construido y verificado con {len(nodes)} nodos y cero bloqueantes.",
                        "artifact_ref": f"sandbox://session/{s['id']}",
                        "evidence_refs": [f"evi_{s['mission_id']}"],
                        "published_at": s.get("completed_at") or datetime.now(timezone.utc).isoformat(),
                        "preview_data": {"nodes_count": len(nodes), "status": "VERIFIED"}
                    }
                    db.portfolio_item_upsert(auto_item)
            published_items = db.portfolio_items_user(user_id)

        return {
            "user_id": user_id,
            "level": profile.get("level", "foundation"),
            "current_track": profile.get("current_track", "builder"),
            "certifications": certifications,
            "portfolio_items": published_items,
            "mastery_summary": mastery,
            "evidence_count": len(evidence_records),
            "signature": "HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®"
        }

    @classmethod
    def publish_item(cls, user_id: str, item_data: Dict[str, Any]) -> PortfolioItem:
        item_id = item_data.get("id") or f"port_{uuid.uuid4().hex[:10]}"
        now_str = datetime.now(timezone.utc).isoformat()

        record = {
            "id": item_id,
            "user_id": user_id,
            "item_type": item_data.get("item_type", "workflow"),
            "title": item_data.get("title", "Untitled Portfolio Item"),
            "description": item_data.get("description", ""),
            "artifact_ref": item_data.get("artifact_ref", ""),
            "evidence_refs": item_data.get("evidence_refs", []),
            "published_at": now_str,
            "preview_data": item_data.get("preview_data", {})
        }

        db.portfolio_item_upsert(record)
        return PortfolioItem(**record)
