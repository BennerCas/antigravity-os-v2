from __future__ import annotations
from typing import Dict, Any, List, Optional, Literal, Union
from pydantic import BaseModel, Field


# ─── Mastery & Skill Types ───────────────────────────────────────────────────

MasteryState = Literal[
    "UNKNOWN",
    "INTRODUCED",
    "GUIDED",
    "PRACTICING",
    "COMPETENT",
    "INDEPENDENT",
    "MASTERED",
    "TRANSFER_VALIDATED",
    "EXPERT",
]

EvidenceType = Literal[
    "graph",
    "contract",
    "runtime",
    "test",
    "reasoning",
    "review",
    "transfer",
    "project",
    "architecture",
    "security",
    "reliability",
]


class MasteryDimensions(BaseModel):
    correctness: float = Field(default=0.0, ge=0.0, le=1.0)
    independence: float = Field(default=0.0, ge=0.0, le=1.0)
    transfer: float = Field(default=0.0, ge=0.0, le=1.0)
    reliability: float = Field(default=0.0, ge=0.0, le=1.0)
    comprehension: float = Field(default=0.0, ge=0.0, le=1.0)
    consistency: float = Field(default=0.0, ge=0.0, le=1.0)
    complexity: float = Field(default=0.0, ge=0.0, le=1.0)
    safety: float = Field(default=0.0, ge=0.0, le=1.0)


class Skill(BaseModel):
    id: str
    name: str
    category: str
    description: str
    track: str
    prerequisites: List[str] = Field(default_factory=list)
    unlocked_by: List[str] = Field(default_factory=list)


class SkillMasteryRecord(BaseModel):
    user_id: str
    skill_id: str
    mastery_score: float = Field(default=0.0, ge=0.0, le=1.0)
    state: MasteryState = "UNKNOWN"
    dimensions: MasteryDimensions = Field(default_factory=MasteryDimensions)
    updated_at: str


# ─── Learner Profile ─────────────────────────────────────────────────────────

CertificationLevel = Literal["foundation", "builder", "operator", "architect", "expert"]


class LearningPreferences(BaseModel):
    mode: Literal["adaptive", "guided", "exploratory", "rigorous"] = "adaptive"
    target_role: Optional[str] = "ai_systems_architect"
    preferred_language: str = "es"
    accessibility_mode: bool = False
    reduced_motion: bool = False


class LearnerStats(BaseModel):
    missions_completed: int = 0
    failures_resolved: int = 0
    hints_used_count: int = 0
    reflections_submitted: int = 0
    capstones_passed: int = 0
    current_streak_days: int = 1


class LearningProfile(BaseModel):
    user_id: str
    level: CertificationLevel = "foundation"
    current_track: str = "builder"
    preferences: LearningPreferences = Field(default_factory=LearningPreferences)
    stats: LearnerStats = Field(default_factory=LearnerStats)
    created_at: str
    updated_at: str


# ─── Mission Models ──────────────────────────────────────────────────────────

MissionMode = Literal["explore", "guided", "practice", "challenge", "project"]


class HintItem(BaseModel):
    level: int  # 1 to 5
    title: str
    text: str
    clue_type: Literal["question", "concept", "specific", "partial_solution", "explanation_patch"]
    patch_preview: Optional[Dict[str, Any]] = None


class RubricCriterion(BaseModel):
    id: str
    title: str
    description: str
    dimension: str
    max_points: int = 10
    required: bool = True


class ValidationFinding(BaseModel):
    code: str
    severity: Literal["info", "warning", "error", "blocking"]
    category: str
    entity_ref: str
    message: str
    suggested_action: Optional[str] = None


class MissionStep(BaseModel):
    step_number: int
    title: str
    instructions: str
    validation_code: Optional[str] = None
    expected_artifact: Optional[str] = None


class TransferChallenge(BaseModel):
    id: str
    title: str
    scenario_description: str
    variation_focus: str
    starter_delta: Dict[str, Any] = Field(default_factory=dict)
    success_criteria: List[str] = Field(default_factory=list)


class MissionDefinition(BaseModel):
    id: str
    version: str = "1.0.0"
    track: str
    stage: int
    title: str
    brief: str
    mode: MissionMode
    learning_objectives: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    difficulty: Literal["beginner", "intermediate", "advanced", "expert"] = "beginner"
    instructions: List[MissionStep] = Field(default_factory=list)
    starter_flow: Dict[str, Any] = Field(default_factory=dict)
    starter_architecture_spec: Optional[Dict[str, Any]] = None
    required_evidence: List[EvidenceType] = Field(default_factory=list)
    rubric: List[RubricCriterion] = Field(default_factory=list)
    hints: List[HintItem] = Field(default_factory=list)
    transfer_challenge: Optional[TransferChallenge] = None
    unlock_rewards: List[str] = Field(default_factory=list)


# ─── Mission Session & Runtime Interaction ───────────────────────────────────

SessionStatus = Literal[
    "not_started",
    "started",
    "in_progress",
    "blocked",
    "evaluating",
    "passed",
    "failed",
    "mastered",
]


class ReflectionSubmission(BaseModel):
    prompt: str
    response: str
    submitted_at: str
    ai_score: Optional[float] = None
    ai_feedback: Optional[str] = None


class MissionSession(BaseModel):
    id: str
    user_id: str
    mission_id: str
    status: SessionStatus = "started"
    current_step: int = 1
    sandbox_flow: Dict[str, Any] = Field(default_factory=dict)
    hints_revealed: List[int] = Field(default_factory=list)
    reflections: List[ReflectionSubmission] = Field(default_factory=list)
    rubric_results: Dict[str, Any] = Field(default_factory=dict)
    findings: List[ValidationFinding] = Field(default_factory=list)
    started_at: str
    completed_at: Optional[str] = None


# ─── Evidence & Audit Ledger ─────────────────────────────────────────────────

class EvidenceRecord(BaseModel):
    id: str
    user_id: str
    skill_id: str
    mission_id: str
    session_id: str
    evidence_type: EvidenceType
    source: str
    validation_hash: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    created_at: str


# ─── Failure Lab Scenarios ───────────────────────────────────────────────────

class FailureScenario(BaseModel):
    id: str
    title: str
    category: str
    description: str
    symptom: str
    flow_patch: Dict[str, Any]
    error_log_sample: str
    root_cause_explanation: str
    expected_repair_description: str
    validation_rule_id: str


# ─── Architecture Drift ──────────────────────────────────────────────────────

class ArchitectureDriftFinding(BaseModel):
    id: str
    severity: Literal["info", "warning", "blocker"]
    category: Literal["missing_step", "unhandled_route", "contract_mismatch", "security_gap", "missing_hitl", "policy_drift"]
    architecture_ref: str
    builder_ref: Optional[str] = None
    description: str
    remediation_hint: str


# ─── Certification & Portfolio ───────────────────────────────────────────────

class CertificationRequirement(BaseModel):
    skill_id: str
    minimum_mastery: float = 0.8
    required_evidence_count: int = 1


class CertificationRecord(BaseModel):
    id: str
    user_id: str
    level: CertificationLevel
    title: str
    verification_token: str
    evidence_chain_hash: str
    issued_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioItem(BaseModel):
    id: str
    user_id: str
    item_type: Literal["workflow", "blueprint", "runtime_trace", "certification", "capstone"]
    title: str
    description: str
    artifact_ref: str
    evidence_refs: List[str] = Field(default_factory=list)
    published_at: str
    preview_data: Dict[str, Any] = Field(default_factory=dict)
