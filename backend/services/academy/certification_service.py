import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import db
from backend.schemas.academy import CertificationRecord, CertificationLevel
from backend.services.academy.evidence_service import EvidenceService


class CertificationService:
    """
    Certification Service for Antigravity Academy V3.
    Issues cryptographically auditable, evidence-based certifications:
    Foundation, Builder, Operator, Architect, and Expert.
    """

    CERT_REQUIREMENTS = {
        "foundation": {
            "title": "Antigravity Certified Foundation Practitioner",
            "required_missions": ["mission_00", "mission_01", "mission_02", "mission_03"],
            "minimum_overall_mastery": 0.50,
            "required_transfers": 0,
            "requires_capstone_defense": False
        },
        "builder": {
            "title": "Antigravity Certified Workflow Builder",
            "required_missions": ["mission_04", "mission_05", "mission_06", "mission_07"],
            "minimum_overall_mastery": 0.65,
            "required_transfers": 1,
            "requires_capstone_defense": False
        },
        "operator": {
            "title": "Antigravity Certified Systems Operator",
            "required_missions": ["mission_08", "mission_09", "mission_10", "mission_11"],
            "minimum_overall_mastery": 0.75,
            "required_transfers": 2,
            "requires_capstone_defense": False
        },
        "architect": {
            "title": "Antigravity Certified Agent Architect",
            "required_missions": ["mission_12", "mission_13", "mission_14", "mission_15"],
            "minimum_overall_mastery": 0.82,
            "required_transfers": 3,
            "requires_capstone_defense": False
        },
        "expert": {
            "title": "Antigravity Distinguished Expert Architect",
            "required_missions": ["mission_16", "mission_17", "mission_18"],
            "minimum_overall_mastery": 0.90,
            "required_transfers": 3,
            "requires_capstone_defense": True
        }
    }

    @classmethod
    def audit_eligibility(cls, user_id: str, level: CertificationLevel) -> Dict[str, Any]:
        reqs = cls.CERT_REQUIREMENTS.get(level)
        if not reqs:
            raise ValueError(f"Invalid certification level: {level}")

        sessions = db.mission_sessions_user(user_id)
        completed_mission_ids = {s["mission_id"] for s in sessions if s.get("status") in ["passed", "mastered"]}
        missing_missions = [m for m in reqs["required_missions"] if m not in completed_mission_ids]
        
        mastery_records = db.skill_mastery_all(user_id)
        avg_mastery = (
            sum(m.get("mastery_score", 0.0) for m in mastery_records) / len(mastery_records)
            if mastery_records else 0.0
        )
        mastery_met = avg_mastery >= reqs["minimum_overall_mastery"]

        # Transfer challenges gate
        user_evidence = db.evidence_user(user_id)
        transfer_evidence = [e for e in user_evidence if e.get("evidence_type") == "transfer"]
        transfers_count = len(transfer_evidence)
        transfers_met = transfers_count >= reqs.get("required_transfers", 0)

        # Capstone technical defense gate
        defense_evidence = [e for e in user_evidence if e.get("evidence_type") == "defense"]
        defense_met = (not reqs.get("requires_capstone_defense")) or (len(defense_evidence) > 0)

        is_eligible = (len(missing_missions) == 0) and mastery_met and transfers_met and defense_met

        return {
            "level": level,
            "title": reqs["title"],
            "is_eligible": is_eligible,
            "required_missions": reqs["required_missions"],
            "completed_missions": list(completed_mission_ids),
            "missing_missions": missing_missions,
            "average_mastery": round(avg_mastery, 2),
            "required_mastery": reqs["minimum_overall_mastery"],
            "mastery_met": mastery_met,
            "transfers_completed": transfers_count,
            "transfers_required": reqs.get("required_transfers", 0),
            "transfers_met": transfers_met,
            "requires_capstone_defense": reqs.get("requires_capstone_defense", False),
            "capstone_defense_passed": defense_met
        }

    @classmethod
    def issue_certification(cls, user_id: str, level: CertificationLevel) -> CertificationRecord:
        audit = cls.audit_eligibility(user_id, level)
        if not audit["is_eligible"]:
            raise ValueError(
                f"El usuario no cumple los requisitos multi-gate para {level}. "
                f"Misiones pendientes: {audit['missing_missions']}. "
                f"Maestría: {audit['average_mastery']}/{audit['required_mastery']}. "
                f"Retos de transferencia: {audit['transfers_completed']}/{audit['transfers_required']}. "
                f"Defensa de Capstone aprobada: {audit['capstone_defense_passed']}."
            )

        # Collect user evidence records and compute cryptographic Merkle root
        evidence_list = db.evidence_user(user_id)
        evidence_hashes = [e.get("validation_hash", "") for e in evidence_list if e.get("validation_hash")]
        evidence_chain_hash = EvidenceService.compute_certification_merkle_root(evidence_hashes)

        cert_id = f"cert_{level}_{user_id}_{uuid.uuid4().hex[:6]}"
        token = f"AG-CERT-{level.upper()}-{uuid.uuid4().hex[:8].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()

        metadata = {
            "issuer": "Antigravity Academy Learning Operating System",
            "title": audit["title"],
            "audited_missions_count": len(audit["completed_missions"]),
            "evidence_records_count": len(evidence_list),
            "transfers_completed": audit["transfers_completed"],
            "average_mastery": audit["average_mastery"],
            "signature_authority": "Antigravity OS Industrial Accreditation Authority"
        }

        cert_dict = {
            "id": cert_id,
            "user_id": user_id,
            "level": level,
            "title": audit["title"],
            "verification_token": token,
            "evidence_chain_hash": evidence_chain_hash,
            "issued_at": now_str,
            "metadata": metadata
        }

        db.certification_issue(cert_dict)

        # Update profile level
        db.learning_profile_update(user_id, {"level": level})

        return CertificationRecord(**cert_dict)

    @classmethod
    def get_user_certifications(cls, user_id: str) -> List[CertificationRecord]:
        rows = db.certifications_user(user_id)
        return [CertificationRecord(**r) for r in rows]

    @classmethod
    def verify_token(cls, token: str) -> Optional[Dict[str, Any]]:
        cert = db.certification_verify(token)
        if not cert:
            return None
        return {
            "verified": True,
            "certification": cert,
            "status": "VALID",
            "verified_at": datetime.now(timezone.utc).isoformat()
        }
