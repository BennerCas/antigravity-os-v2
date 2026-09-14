from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field

class JsonPatchOp(BaseModel):
    op: Literal["add", "remove", "replace", "move", "copy", "test"]
    path: str
    value: Optional[Any] = None
    from_: Optional[str] = Field(None, alias="from")

class ChatSection(BaseModel):
    markdown: str
    citations: List[Dict[str, Any]] = Field(default_factory=list)

class RiskAssessment(BaseModel):
    cost_delta_usd_per_1k_runs: float
    latency_delta_ms_p50: float
    new_capabilities_required: List[str]
    security_flags: List[str]
    confidence: float

class AuthoringIntent(BaseModel):
    protocol: Literal["authoring.v1"] = "authoring.v1"
    turn_id: str
    rev_base: int
    chat: ChatSection
    patch: List[JsonPatchOp]
    risk: RiskAssessment
    questions: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)

class CommandEnvelope(BaseModel):
    cmd_id: str
    actor: Dict[str, str]
    expected_rev: int
    reason: Optional[str] = None
    cmd: Dict[str, Any]
