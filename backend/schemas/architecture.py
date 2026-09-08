from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal

class Intent(BaseModel):
    goal: str
    success_criteria: List[str] = Field(default_factory=list)

class Requirements(BaseModel):
    trigger: str
    assumptions: List[Dict[str, Any]] = Field(default_factory=list)
    constraints: List[Dict[str, Any]] = Field(default_factory=list)

class ArchitectureStateContract(BaseModel):
    input: Dict[str, Any]
    shared: Dict[str, Any] = Field(default_factory=dict)
    output: Dict[str, Any]

class ArchitectureStep(BaseModel):
    id: str
    kind: str
    name: Optional[str] = None
    description: Optional[str] = None
    input_bindings: List[Dict[str, Any]] = Field(default_factory=list)
    input_schema_ref: Optional[str] = None
    output_schema_ref: Optional[str] = None
    configuration: Dict[str, Any] = Field(default_factory=dict)
    execution_policy: Optional[Dict[str, Any]] = None
    failure_policy: Optional[Dict[str, Any]] = None
    security_policy: Optional[Dict[str, Any]] = None
    observability: Optional[Dict[str, Any]] = None
    provenance: List[Dict[str, Any]] = Field(default_factory=list)

class ArchitectureTransition(BaseModel):
    id: str
    from_step: str = Field(alias="from")
    to_step: str = Field(alias="to")
    kind: str = "route"
    route: Optional[Dict[str, Any]] = None
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None
    provenance: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        populate_by_name = True

class FailurePolicy(BaseModel):
    retry: Dict[str, Any] = Field(default_factory=dict)
    dead_letter: Dict[str, Any] = Field(default_factory=dict)
    human_escalation: Dict[str, Any] = Field(default_factory=dict)

class ArchitectureSpec(BaseModel):
    schema_version: Literal["architect/v1"] = "architect/v1"
    id: str
    revision: int
    intent: Intent
    requirements: Requirements
    state_contract: ArchitectureStateContract
    steps: List[ArchitectureStep] = Field(default_factory=list)
    transitions: List[ArchitectureTransition] = Field(default_factory=list)
    failure_policy: Optional[FailurePolicy] = None
    test_suite: List[Dict[str, Any]] = Field(default_factory=list)
    provenance: List[Dict[str, Any]] = Field(default_factory=list)
