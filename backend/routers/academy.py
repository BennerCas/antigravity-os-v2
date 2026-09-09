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


# ─── High-Level REST API Aliases for Frontend Client (academyApi.ts) ──────────

@router.get("/tracks")
def get_tracks_list():
    CatalogService.seed_catalog()
    raw_tracks = CatalogService.get_tracks()
    formatted = []
    for i, t in enumerate(raw_tracks):
        formatted.append({
            "id": t["id"],
            "title": t.get("name", t.get("title", t["id"])),
            "name": t.get("name", t.get("title", t["id"])),
            "description": t.get("description", ""),
            "category": t.get("target_level", "general"),
            "order": i + 1,
            "color": "#22C55E",
            "mission_count": len(t.get("mission_ids", [])),
            "mission_ids": t.get("mission_ids", [])
        })
    return formatted


@router.get("/missions")
def get_missions_list(track_id: Optional[str] = None):
    CatalogService.seed_catalog()
    all_m = CatalogService.get_all_missions()
    res = []
    for m in all_m:
        m_dict = m.model_dump()
        m_dict["track_id"] = m_dict.get("track", m_dict.get("track_id", ""))
        m_dict["problem_statement"] = m_dict.get("brief") or m_dict.get("problem_statement", "")
        m_dict["skills_trained"] = m_dict.get("skills") or m_dict.get("skills_developed") or []
        m_dict["estimated_minutes"] = 10 + (m_dict.get("stage", 1) * 5)
        m_dict["success_criteria"] = [r.get("description") for r in m_dict.get("rubric", [])] if m_dict.get("rubric") else ["Completar topología requerida"]
        if track_id:
            if m_dict.get("track_id") == track_id or m_dict.get("track") == track_id:
                res.append(m_dict)
        else:
            res.append(m_dict)
    return res


@router.get("/missions/{mission_id}")
def get_mission_detail(mission_id: str):
    CatalogService.seed_catalog()
    m = CatalogService.get_mission(mission_id)
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    m_dict = m.model_dump()
    m_dict["track_id"] = m_dict.get("track", m_dict.get("track_id", ""))
    m_dict["problem_statement"] = m_dict.get("brief") or m_dict.get("problem_statement", "")
    m_dict["skills_trained"] = m_dict.get("skills") or m_dict.get("skills_developed") or []
    m_dict["estimated_minutes"] = 10 + (m_dict.get("stage", 1) * 5)
    return m_dict


@router.get("/skills/graph")
def get_skills_graph_api():
    CatalogService.seed_catalog()
    skills = CatalogService.get_skills()
    nodes = []
    links = []
    for sid, s in skills.items():
        nodes.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "prerequisites": s.prerequisites,
            "depth": getattr(s, "depth", 0)
        })
        for pre in s.prerequisites:
            links.append({"source": pre, "target": s.id})
    return {"nodes": nodes, "links": links}


@router.get("/profile/{user_id}")
def get_profile_by_user_id(user_id: str):
    return db.learning_profile_get_or_create(user_id)


@router.put("/profile/{user_id}")
def update_profile_by_user_id(user_id: str, data: Dict[str, Any] = Body(...)):
    return db.learning_profile_update(user_id, data)


class SandboxStartPayload(BaseModel):
    user_id: str
    mission_id: str


@router.post("/sandbox/start")
def start_sandbox_session_alias(payload: SandboxStartPayload):
    CatalogService.seed_catalog()
    session = SandboxService.start_session(payload.user_id, payload.mission_id)
    return session.model_dump()


@router.get("/sandbox/{session_id}")
def get_sandbox_session_alias(session_id: str):
    s = SandboxService.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s.model_dump()


@router.put("/sandbox/{session_id}/flow")
def put_sandbox_flow_alias(session_id: str, flow: Dict[str, Any] = Body(...)):
    s = SandboxService.update_flow(session_id, flow)
    return s.model_dump()


@router.post("/sandbox/{session_id}/validate")
def post_sandbox_validate_alias(session_id: str):
    return AssessmentService.evaluate_session(session_id)


@router.post("/sandbox/{session_id}/simulate")
def post_sandbox_simulate_alias(session_id: str, body: Dict[str, Any] = Body(...)):
    payload = body.get("input_payload", {})
    return SandboxService.run_simulation(session_id, payload)


@router.post("/sandbox/{session_id}/hint")
def post_sandbox_hint_alias(session_id: str, body: Dict[str, Any] = Body(...)):
    lvl = body.get("level", 1)
    hint = CopilotService.get_next_hint(session_id)
    return {
        "level": lvl,
        "hint_text": hint.get("text", "Revisa tus conexiones hacia el nodo End."),
        "penalty_warning": "Pistas de nivel 3 o superior reducen la puntuación de independencia."
    }


@router.post("/sandbox/{session_id}/copilot")
async def post_sandbox_copilot_alias(session_id: str, body: Dict[str, Any] = Body(...)):
    query = body.get("user_query", "")
    role = body.get("pedagogical_role", "mission_coach")
    res = await CopilotService.mentor_chat(session_id, query, role)
    return {
        "role": role,
        "message": res.get("reply", ""),
        "hint_level": 1,
        "pedagogical_mode": "socratic",
        "actionable_step": "Inspecciona los hallazgos en el panel de validación."
    }


@router.post("/sandbox/{session_id}/chaos/inject")
def post_sandbox_chaos_alias(session_id: str, body: Dict[str, Any] = Body(...)):
    sc_id = body.get("scenario_id", "fail_schema_mismatch")
    return FailureLabService.inject_scenario(session_id, sc_id)


@router.post("/sandbox/{session_id}/reflection")
def post_sandbox_reflection_alias(session_id: str, body: Dict[str, Any] = Body(...)):
    text = body.get("reflection_text", "")
    prompt = body.get("prompt", "¿Por qué diseñaste esta arquitectura?")
    return AssessmentService.submit_reflection(session_id, text, prompt)


@router.post("/sandbox/{session_id}/complete")
def post_sandbox_complete_alias(session_id: str):
    return AssessmentService.complete_mission(session_id)


@router.post("/sandbox/{session_id}/clone-to-workspace")
def post_sandbox_clone_alias(session_id: str):
    return SandboxService.clone_to_workspace(session_id)


@router.post("/drift/compare")
def post_drift_compare_alias(body: Dict[str, Any] = Body(...)):
    spec = body.get("spec", {})
    builder = body.get("builder_flow", {})
    findings = DriftEngine.analyze_drift(spec, builder)
    blockers = [f for f in findings if f.severity == "blocker"]
    return {
        "is_compliant": len(blockers) == 0,
        "total_drifts": len(findings),
        "drifts": [f.model_dump() for f in findings]
    }


@router.get("/mastery/{user_id}")
def get_mastery_by_user_id(user_id: str):
    return db.skill_mastery_all(user_id)


@router.get("/evidence/{user_id}")
def get_evidence_by_user_id(user_id: str):
    return db.evidence_user(user_id)


@router.get("/certification/audit/{user_id}/{level}")
def get_cert_audit_alias(user_id: str, level: str):
    return CertificationService.audit_eligibility(user_id, level)


@router.get("/portfolio/{user_id}")
def get_portfolio_by_user_id_alias(user_id: str):
    return PortfolioService.get_learner_portfolio(user_id)


@router.post("/portfolio/{user_id}/compile")
def post_portfolio_compile_alias(user_id: str):
    return PortfolioService.get_learner_portfolio(user_id)

