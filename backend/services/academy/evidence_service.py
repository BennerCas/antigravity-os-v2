import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import db

from backend.schemas.academy import EvidenceRecord, EvidenceType


class EvidenceService:
    """
    Evidence Service manages immutable, auditable evidence records
    demonstrating authentic competence across 11 verification types.
    """

    @classmethod
    def compute_hash(
        cls,
        prev_hash: str,
        user_id: str,
        skill_id: str,
        mission_id: str,
        session_id: str,
        evidence_type: str,
        payload: dict[str, Any],
    ) -> str:
        """Computes deterministic SHA256 integrity hash including prev_hash."""
        canonical_payload = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        hash_input = f"{prev_hash}:{user_id}:{skill_id}:{mission_id}:{session_id}:{evidence_type}:{canonical_payload}"
        return hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

    @classmethod
    def record_evidence(
        cls,
        user_id: str,
        skill_id: str,
        mission_id: str,
        session_id: str,
        evidence_type: EvidenceType,
        source: str,
        payload: dict[str, Any],
        confidence: float = 1.0,
    ) -> EvidenceRecord:
        now_str = datetime.now(timezone.utc).isoformat()
        evidence_id = f"evi_{uuid.uuid4().hex[:12]}"

        # Retrieve previous evidence record for this learner to form an unbroken cryptographic chain
        latest_record = db.evidence_latest(user_id)
        prev_hash = (
            latest_record["validation_hash"] if latest_record else "GENESIS_ROOT"
        )

        # Compute SHA256 integrity hash linked to previous block
        validation_hash = cls.compute_hash(
            prev_hash=prev_hash,
            user_id=user_id,
            skill_id=skill_id,
            mission_id=mission_id,
            session_id=session_id,
            evidence_type=str(evidence_type),
            payload=payload,
        )

        evidence_dict = {
            "id": evidence_id,
            "user_id": user_id,
            "skill_id": skill_id,
            "mission_id": mission_id,
            "session_id": session_id,
            "evidence_type": evidence_type,
            "source": source,
            "validation_hash": validation_hash,
            "prev_hash": prev_hash,
            "payload": payload,
            "confidence": confidence,
            "created_at": now_str,
        }

        db.evidence_insert(evidence_dict)
        return EvidenceRecord(**evidence_dict)

    @classmethod
    def get_user_evidence(
        cls, user_id: str, skill_id: str | None = None
    ) -> list[EvidenceRecord]:
        records = db.evidence_user(user_id, skill_id)
        return [EvidenceRecord(**r) for r in records]

    @classmethod
    def compute_certification_merkle_root(cls, hashes: list[str]) -> str:
        """
        Computes a cryptographic Merkle Root from a list of validation hashes.
        If empty, returns SHA256 of empty root.
        """
        if not hashes:
            return hashlib.sha256(b"EMPTY_MERKLE_TREE").hexdigest()

        current_level = list(hashes)
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                combined = hashlib.sha256((left + right).encode("utf-8")).hexdigest()
                next_level.append(combined)
            current_level = next_level

        return current_level[0]

    @classmethod
    def verify_learner_chain(cls, user_id: str) -> dict[str, Any]:
        """
        Performs industrial cryptographic audit on the complete evidence ledger for a learner.
        Verifies:
        1. Genesis integrity (prev_hash == GENESIS_ROOT for block 0)
        2. Unbroken chain links (prev_hash[i] == validation_hash[i-1])
        3. Tamper-evident hash integrity on all payloads
        """
        records = db.evidence_user(user_id)
        if not records:
            return {
                "valid": True,
                "count": 0,
                "chain_head": None,
                "merkle_root": cls.compute_certification_merkle_root([]),
            }

        all_hashes = []
        for i, rec in enumerate(records):
            expected_prev = (
                "GENESIS_ROOT" if i == 0 else records[i - 1]["validation_hash"]
            )
            if rec.get("prev_hash") != expected_prev:
                return {
                    "valid": False,
                    "error": "Chain linkage broken",
                    "broken_at_index": i,
                    "record_id": rec.get("id"),
                    "expected_prev_hash": expected_prev,
                    "found_prev_hash": rec.get("prev_hash"),
                }

            expected_hash = cls.compute_hash(
                prev_hash=rec.get("prev_hash", "GENESIS_ROOT"),
                user_id=rec["user_id"],
                skill_id=rec["skill_id"],
                mission_id=rec["mission_id"],
                session_id=rec["session_id"],
                evidence_type=str(rec["evidence_type"]),
                payload=rec["payload"],
            )

            if expected_hash != rec["validation_hash"]:
                return {
                    "valid": False,
                    "error": "Payload tampered or hash mismatch",
                    "broken_at_index": i,
                    "record_id": rec.get("id"),
                    "expected_hash": expected_hash,
                    "found_hash": rec.get("validation_hash"),
                }

            all_hashes.append(rec["validation_hash"])

        merkle_root = cls.compute_certification_merkle_root(all_hashes)
        return {
            "valid": True,
            "count": len(records),
            "chain_head": records[-1]["validation_hash"],
            "merkle_root": merkle_root,
        }

    @classmethod
    def verify_evidence_chain(cls, evidence_ids: list[str]) -> bool:
        """Verifies integrity of a collection of individual evidence IDs."""
        for eid in evidence_ids:
            row = db.evidence_by_id(eid)
            if not row:
                return False
            expected_hash = cls.compute_hash(
                prev_hash=row.get("prev_hash", "GENESIS_ROOT"),
                user_id=row["user_id"],
                skill_id=row["skill_id"],
                mission_id=row["mission_id"],
                session_id=row["session_id"],
                evidence_type=str(row["evidence_type"]),
                payload=row["payload"],
            )
            if expected_hash != row["validation_hash"]:
                return False
        return True
