from __future__ import annotations

from typing import Any, Literal

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
    "defense",
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
    prerequisites: list[str] = Field(default_factory=list)
    unlocked_by: list[str] = Field(default_factory=list)


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
    target_role: str | None = "ai_systems_architect"
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
    clue_type: Literal[
        "question", "concept", "specific", "partial_solution", "explanation_patch"
    ]
    patch_preview: dict[str, Any] | None = None


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
    suggested_action: str | None = None


class MissionStep(BaseModel):
    step_number: int
    title: str
    instructions: str
    validation_code: str | None = None
    expected_artifact: str | None = None


class TransferChallenge(BaseModel):
    id: str
    title: str
    scenario_description: str
    variation_focus: str
    starter_delta: dict[str, Any] = Field(default_factory=dict)
    success_criteria: list[str] = Field(default_factory=list)


class MissionDefinition(BaseModel):
    id: str
    version: str = "1.0.0"
    track: str
    stage: int
    title: str
    brief: str
    mode: MissionMode
    learning_objectives: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    difficulty: Literal["beginner", "intermediate", "advanced", "expert"] = "beginner"
    instructions: list[MissionStep] = Field(default_factory=list)
    starter_flow: dict[str, Any] = Field(default_factory=dict)
    starter_architecture_spec: dict[str, Any] | None = None
    required_evidence: list[EvidenceType] = Field(default_factory=list)
    rubric: list[RubricCriterion] = Field(default_factory=list)
    hints: list[HintItem] = Field(default_factory=list)
    transfer_challenge: TransferChallenge | None = None
    unlock_rewards: list[str] = Field(default_factory=list)


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
    ai_score: float | None = None
    ai_feedback: str | None = None


class MissionSession(BaseModel):
    id: str
    user_id: str
    mission_id: str
    status: SessionStatus = "started"
    current_step: int = 1
    sandbox_flow: dict[str, Any] = Field(default_factory=dict)
    hints_revealed: list[int] = Field(default_factory=list)
    reflections: list[ReflectionSubmission] = Field(default_factory=list)
    rubric_results: dict[str, Any] = Field(default_factory=dict)
    findings: list[ValidationFinding] = Field(default_factory=list)
    started_at: str
    completed_at: str | None = None


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
    prev_hash: str = "GENESIS_ROOT"
    payload: dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    created_at: str


# ─── Failure Lab Scenarios ───────────────────────────────────────────────────


class FailureScenario(BaseModel):
    id: str
    title: str
    category: str
    description: str
    symptom: str
    flow_patch: dict[str, Any]
    error_log_sample: str
    root_cause_explanation: str
    expected_repair_description: str
    validation_rule_id: str


# ─── Architecture Drift ──────────────────────────────────────────────────────


class ArchitectureDriftFinding(BaseModel):
    id: str
    severity: Literal["info", "warning", "blocker"]
    category: Literal[
        "missing_step",
        "unhandled_route",
        "contract_mismatch",
        "security_gap",
        "missing_hitl",
        "policy_drift",
    ]
    architecture_ref: str
    builder_ref: str | None = None
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
    metadata: dict[str, Any] = Field(default_factory=dict)


class PortfolioItem(BaseModel):
    id: str
    user_id: str
    item_type: Literal[
        "workflow", "blueprint", "runtime_trace", "certification", "capstone"
    ]
    title: str
    description: str
    artifact_ref: str
    evidence_refs: list[str] = Field(default_factory=list)
    published_at: str
    preview_data: dict[str, Any] = Field(default_factory=dict)
