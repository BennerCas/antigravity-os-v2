from typing import Any, Literal

from pydantic import BaseModel, Field


class JsonPatchOp(BaseModel):
    op: Literal["add", "remove", "replace", "move", "copy", "test"]
    path: str
    value: Any | None = None
    from_: str | None = Field(None, alias="from")


class ChatSection(BaseModel):
    markdown: str
    citations: list[dict[str, Any]] = Field(default_factory=list)


class RiskAssessment(BaseModel):
    cost_delta_usd_per_1k_runs: float
    latency_delta_ms_p50: float
    new_capabilities_required: list[str]
    security_flags: list[str]
    confidence: float


class AuthoringIntent(BaseModel):
    protocol: Literal["authoring.v1"] = "authoring.v1"
    turn_id: str
    rev_base: int
    chat: ChatSection
    patch: list[JsonPatchOp]
    risk: RiskAssessment
    questions: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)


class CommandEnvelope(BaseModel):
    cmd_id: str
    actor: dict[str, str]
    expected_rev: int
    reason: str | None = None
    cmd: dict[str, Any]
