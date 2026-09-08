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
            "minimum_overall_mastery": 0.50
        },
        "builder": {
            "title": "Antigravity Certified Workflow Builder",
            "required_missions": ["mission_04", "mission_05", "mission_06", "mission_07"],
            "minimum_overall_mastery": 0.65
        },
        "operator": {
            "title": "Antigravity Certified Systems Operator",
            "required_missions": ["mission_08", "mission_09", "mission_10", "mission_11"],
            "minimum_overall_mastery": 0.75
        },
        "architect": {
            "title": "Antigravity Certified Agent Architect",
            "required_missions": ["mission_12", "mission_13", "mission_14", "mission_15"],
            "minimum_overall_mastery": 0.82
        },
        "expert": {
            "title": "Antigravity Distinguished Expert Architect",
            "required_missions": ["mission_16", "mission_17", "mission_18"],
            "minimum_overall_mastery": 0.90
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
        is_eligible = (len(missing_missions) == 0) and mastery_met

        return {
            "level": level,
            "title": reqs["title"],
            "is_eligible": is_eligible,
            "required_missions": reqs["required_missions"],
            "completed_missions": list(completed_mission_ids),
            "missing_missions": missing_missions,
            "average_mastery": round(avg_mastery, 2),
            "required_mastery": reqs["minimum_overall_mastery"],
            "mastery_met": mastery_met
        }

    @classmethod
    def issue_certification(cls, user_id: str, level: CertificationLevel) -> CertificationRecord:
        audit = cls.audit_eligibility(user_id, level)
        if not audit["is_eligible"]:
            raise ValueError(
                f"El usuario no cumple los requisitos para {level}. "
                f"Misiones pendientes: {audit['missing_missions']}. "
                f"Maestría actual: {audit['average_mastery']} (Requerida: {audit['required_mastery']})"
            )

        # Collect user evidence records for this level
        evidence_list = db.evidence_user(user_id)
        evidence_chain_raw = "".join(e.get("validation_hash", "") for e in evidence_list)
        evidence_chain_hash = hashlib.sha256((evidence_chain_raw or user_id).encode("utf-8")).hexdigest()

        cert_id = f"cert_{level}_{user_id}_{uuid.uuid4().hex[:6]}"
        token = f"AG-CERT-{level.upper()}-{uuid.uuid4().hex[:8].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()

        metadata = {
            "issuer": "Antigravity Academy Learning Operating System",
            "title": audit["title"],
            "audited_missions_count": len(audit["completed_missions"]),
            "evidence_records_count": len(evidence_list),
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
