import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import db
from backend.schemas.academy import EvidenceRecord, EvidenceType


class EvidenceService:
    """
    Evidence Service manages immutable, auditable evidence records
    demonstrating authentic competence across 11 verification types.
    """

    @classmethod
    def record_evidence(
        cls,
        user_id: str,
        skill_id: str,
        mission_id: str,
        session_id: str,
        evidence_type: EvidenceType,
        source: str,
        payload: Dict[str, Any],
        confidence: float = 1.0
    ) -> EvidenceRecord:
        now_str = datetime.now(timezone.utc).isoformat()
        evidence_id = f"evi_{uuid.uuid4().hex[:12]}"

        # Compute SHA256 integrity hash
        hash_payload = f"{user_id}:{skill_id}:{mission_id}:{session_id}:{evidence_type}:{json.dumps(payload, sort_keys=True)}"
        validation_hash = hashlib.sha256(hash_payload.encode("utf-8")).hexdigest()

        evidence_dict = {
            "id": evidence_id,
            "user_id": user_id,
            "skill_id": skill_id,
            "mission_id": mission_id,
            "session_id": session_id,
            "evidence_type": evidence_type,
            "source": source,
            "validation_hash": validation_hash,
            "payload": payload,
            "confidence": confidence,
            "created_at": now_str
        }

        db.evidence_insert(evidence_dict)
        return EvidenceRecord(**evidence_dict)

    @classmethod
    def get_user_evidence(cls, user_id: str, skill_id: Optional[str] = None) -> List[EvidenceRecord]:
        records = db.evidence_user(user_id, skill_id)
        return [EvidenceRecord(**r) for r in records]

    @classmethod
    def verify_evidence_chain(cls, evidence_ids: List[str]) -> bool:
        """Verifies integrity of a collection of evidence hashes."""
        for eid in evidence_ids:
            with db._lock, db._conn() as conn:
                row = conn.execute("SELECT * FROM evidence_ledger WHERE id = ?", (eid,)).fetchone()
            if not row:
                return False
            payload = json.loads(row["payload"])
            hash_payload = f"{row['user_id']}:{row['skill_id']}:{row['mission_id']}:{row['session_id']}:{row['evidence_type']}:{json.dumps(payload, sort_keys=True)}"
            expected_hash = hashlib.sha256(hash_payload.encode("utf-8")).hexdigest()
            if expected_hash != row["validation_hash"]:
                return False
        return True
