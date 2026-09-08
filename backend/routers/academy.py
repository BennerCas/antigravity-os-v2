from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

import db
from backend.services.academy.catalog_service import CatalogService
from backend.services.academy.sandbox_service import SandboxService
from backend.services.academy.validator_service import ValidatorService
from backend.services.academy.drift_engine import DriftEngine
from backend.services.academy.failure_lab_service import FailureLabService
from backend.services.academy.mastery_engine import MasteryEngine
from backend.services.academy.evidence_service import EvidenceService
from backend.services.academy.copilot_service import CopilotService
from backend.services.academy.assessment_service import AssessmentService
from backend.services.academy.certification_service import CertificationService
from backend.services.academy.portfolio_service import PortfolioService
from backend.services.academy.event_bridge import LearningEventBridge

router = APIRouter(tags=["Academy LOS"])


# ─── Request Models ──────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    level: Optional[str] = None
    current_track: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None


class FlowUpdateRequest(BaseModel):
    flow: Dict[str, Any]


class ReflectionRequest(BaseModel):
    prompt: Optional[str] = "¿Por qué diseñaste esta arquitectura?"
    reflection_text: str


class SimulationRequest(BaseModel):
    input_payload: Optional[Dict[str, Any]] = None


class FailureInjectRequest(BaseModel):
    session_id: str
    scenario_id: str


class DriftAnalysisRequest(BaseModel):
    architecture_spec: Dict[str, Any]
    builder_flow: Dict[str, Any]


class CertificationIssueRequest(BaseModel):
    level: str


class PortfolioPublishRequest(BaseModel):
    item_type: str = "workflow"
    title: str
    description: str
    artifact_ref: str
    evidence_refs: List[str] = []
    preview_data: Dict[str, Any] = {}


class LearningEventRequest(BaseModel):
    event_type: str
    payload: Dict[str, Any]


class CopilotChatRequest(BaseModel):
    session_id: str
    message: str
    role: Optional[str] = "mission_coach"


# ─── Profile & Diagnostic ───────────────────────────────────────────────────

@router.get("/profile")
def get_profile(user_id: str = Query(default="default_learner")):
    """Get or initialize learner profile."""
    profile = db.learning_profile_get_or_create(user_id)
    return {"status": "success", "profile": profile}


@router.post("/profile")
def update_profile(
    user_id: str = Query(default="default_learner"),
    req: ProfileUpdateRequest = Body(...)
):
    """Update learner profile, preferences, or diagnostic."""
    updates = req.model_dump(exclude_unset=True)
    updated = db.learning_profile_update(user_id, updates)
    return {"status": "success", "profile": updated}


# ─── Catalog & Skills Graph ──────────────────────────────────────────────────

@router.get("/catalog")
def get_catalog(user_id: str = Query(default="default_learner")):
    """Get tracks, missions, and completion indicators for the learner."""
    # Ensure seed is loaded
    CatalogService.seed_catalog()
    
    tracks = CatalogService.get_tracks()
    missions = CatalogService.get_all_missions()
    sessions = db.mission_sessions_user(user_id)

    completed_ids = {s["mission_id"]: s["status"] for s in sessions if s.get("status") in ["passed", "mastered"]}
    active_sessions = {s["mission_id"]: s["id"] for s in sessions if s.get("status") in ["started", "in_progress", "evaluating", "blocked"]}

    missions_with_status = []
    for m in missions:
        m_dict = m.model_dump()
        m_dict["completion_status"] = completed_ids.get(m.id, "not_started")
        m_dict["active_session_id"] = active_sessions.get(m.id)
        missions_with_status.append(m_dict)

    return {
        "status": "success",
        "tracks": tracks,
        "missions": missions_with_status
    }


@router.get("/skills")
def get_skills_graph(user_id: str = Query(default="default_learner")):
    """Get skill graph with learner mastery overlay."""
    skills_map = CatalogService.get_skills()
    mastery_records = db.skill_mastery_all(user_id)
    mastery_by_id = {m["skill_id"]: m for m in mastery_records}

    skill_tree = []
    for sid, s in skills_map.items():
        s_dict = s.model_dump()
        s_dict["mastery"] = mastery_by_id.get(sid, {
            "mastery_score": 0.0,
            "state": "UNKNOWN",
            "dimensions": {}
        })
        skill_tree.append(s_dict)

    return {
        "status": "success",
        "skills": skill_tree
    }


# ─── Mission Sessions & Sandbox ──────────────────────────────────────────────

@router.post("/missions/{mission_id}/start")
def start_mission_session(
    mission_id: str,
    user_id: str = Query(default="default_learner")
):
    """Start or resume a mission session with an isolated sandbox."""
    CatalogService.seed_catalog()
    try:
        session = SandboxService.start_session(user_id, mission_id)
        return {"status": "success", "session": session.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}")
def get_session_details(session_id: str):
    """Get detailed state of an active mission session."""
    session = SandboxService.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    mission = CatalogService.get_mission(session.mission_id)
    return {
        "status": "success",
        "session": session.model_dump(),
        "mission": mission.model_dump() if mission else None
    }


@router.post("/sessions/{session_id}/flow")
def update_session_flow(session_id: str, req: FlowUpdateRequest):
    """Update sandbox flow in real-time and run deterministic checks."""
    try:
        updated = SandboxService.update_flow(session_id, req.flow)
        return {"status": "success", "session": updated.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/evaluate")
def evaluate_session(session_id: str):
    """Execute deterministic validators and compute rubric score."""
    try:
        res = AssessmentService.evaluate_session(session_id)
        return {"status": "success", **res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/hint")
def request_hint(session_id: str):
    """Request the next progressive hint level (1 to 5)."""
    try:
        hint = CopilotService.get_next_hint(session_id)
        return {"status": "success", "hint": hint}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/reflect")
def submit_reflection(session_id: str, req: ReflectionRequest):
    """Submit learner architectural reasoning reflection."""
    try:
        res = AssessmentService.submit_reflection(
            session_id=session_id,
            reflection_text=req.reflection_text,
            prompt=req.prompt or "¿Por qué diseñaste esta arquitectura?"
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/run")
def run_sandbox_simulation(session_id: str, req: SimulationRequest):
    """Execute flow simulation through isolated sandbox runner."""
    try:
        res = SandboxService.run_simulation(session_id, req.input_payload)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/reset")
def reset_session(session_id: str):
    """Reset sandbox flow to the mission's starter state."""
    try:
        res = SandboxService.reset_session(session_id)
        return {"status": "success", "session": res.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/complete")
def complete_mission(session_id: str):
    """Verify all rubric gates, record evidence, update mastery, and graduate."""
    try:
        res = AssessmentService.complete_mission(session_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/clone-to-workspace")
def clone_to_workspace(session_id: str):
    """Promote validated flow from learning sandbox to production workspace."""
    try:
        res = SandboxService.clone_to_workspace(session_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Failure Lab ─────────────────────────────────────────────────────────────

@router.get("/failure-lab/scenarios")
def list_failure_scenarios():
    """List all available chaos and error injection scenarios."""
    scenarios = FailureLabService.list_scenarios()
    return {"status": "success", "scenarios": [s.model_dump() for s in scenarios]}


@router.post("/failure-lab/inject")
def inject_failure(req: FailureInjectRequest):
    """Inject a deterministic failure scenario into an active session."""
    try:
        res = FailureLabService.inject_scenario(req.session_id, req.scenario_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Architecture Drift ──────────────────────────────────────────────────────

@router.post("/drift/analyze")
def analyze_architecture_drift(req: DriftAnalysisRequest):
    """Diff FlowArchitect ArchitectureSpec vs BuilderFlow canvas."""
    findings = DriftEngine.analyze_drift(req.architecture_spec, req.builder_flow)
    return {
        "status": "success",
        "findings": [f.model_dump() for f in findings],
        "has_blockers": any(f.severity == "blocker" for f in findings)
    }


# ─── Certifications & Portfolio ──────────────────────────────────────────────

@router.get("/certifications")
def get_certifications(user_id: str = Query(default="default_learner")):
    """List earned certifications and eligibility audits across all 5 levels."""
    issued = CertificationService.get_user_certifications(user_id)
    levels = ["foundation", "builder", "operator", "architect", "expert"]
    audits = [CertificationService.audit_eligibility(user_id, lvl) for lvl in levels]

    return {
        "status": "success",
        "issued_certifications": [c.model_dump() for c in issued],
        "eligibility_audits": audits
    }


@router.post("/certifications/issue")
def issue_certification(
    req: CertificationIssueRequest,
    user_id: str = Query(default="default_learner")
):
    """Issue verifiable, evidence-backed certification."""
    try:
        cert = CertificationService.issue_certification(user_id, req.level)
        return {"status": "success", "certification": cert.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/certifications/verify/{token}")
def verify_certification_token(token: str):
    """Public verification endpoint for certification tokens."""
    res = CertificationService.verify_token(token)
    if not res:
        raise HTTPException(status_code=404, detail="Token no válido o no encontrado.")
    return {"status": "success", **res}


@router.get("/portfolio")
def get_portfolio(user_id: str = Query(default="default_learner")):
    """Get public-ready portfolio with verified workflows and credentials."""
    portfolio = PortfolioService.get_learner_portfolio(user_id)
    return {"status": "success", "portfolio": portfolio}


@router.post("/portfolio/publish")
def publish_portfolio_item(
    req: PortfolioPublishRequest,
    user_id: str = Query(default="default_learner")
):
    """Publish an item to the learner's public portfolio."""
    item = PortfolioService.publish_item(user_id, req.model_dump())
    return {"status": "success", "item": item.model_dump()}


# ─── Event-Driven Learning & Copilot ─────────────────────────────────────────

@router.post("/events")
def record_learning_event(
    req: LearningEventRequest,
    user_id: str = Query(default="default_learner")
):
    """Ingest Builder/FlowArchitect/Runtime events and return recommendations."""
    recommendation = LearningEventBridge.emit_event(user_id, req.event_type, req.payload)
    return {
        "status": "success",
        "recommendation": recommendation
    }


@router.post("/copilot/chat")
async def copilot_chat(req: CopilotChatRequest):
    """Pedagogical AI mentor chat with role-based guidance and fallback."""
    res = await CopilotService.mentor_chat(
        session_id=req.session_id,
        user_message=req.message,
        preferred_role=req.role or "mission_coach"
    )
    return {"status": "success", **res}
