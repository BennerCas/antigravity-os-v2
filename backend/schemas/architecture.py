from typing import Any, Literal

from pydantic import BaseModel, Field


class Intent(BaseModel):
    goal: str
    success_criteria: list[str] = Field(default_factory=list)


class Requirements(BaseModel):
    trigger: str
    assumptions: list[dict[str, Any]] = Field(default_factory=list)
    constraints: list[dict[str, Any]] = Field(default_factory=list)


class ArchitectureStateContract(BaseModel):
    input: dict[str, Any]
    shared: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any]


class ArchitectureStep(BaseModel):
    id: str
    kind: str
    name: str | None = None
    description: str | None = None
    input_bindings: list[dict[str, Any]] = Field(default_factory=list)
    input_schema_ref: str | None = None
    output_schema_ref: str | None = None
    configuration: dict[str, Any] = Field(default_factory=dict)
    execution_policy: dict[str, Any] | None = None
    failure_policy: dict[str, Any] | None = None
    security_policy: dict[str, Any] | None = None
    observability: dict[str, Any] | None = None
    provenance: list[dict[str, Any]] = Field(default_factory=list)


class ArchitectureTransition(BaseModel):
    id: str
    from_step: str = Field(alias="from")
    to_step: str = Field(alias="to")
    kind: str = "route"
    route: dict[str, Any] | None = None
    source_handle: str | None = None
    target_handle: str | None = None
    provenance: list[dict[str, Any]] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class FailurePolicy(BaseModel):
    retry: dict[str, Any] = Field(default_factory=dict)
    dead_letter: dict[str, Any] = Field(default_factory=dict)
    human_escalation: dict[str, Any] = Field(default_factory=dict)


class ArchitectureSpec(BaseModel):
    schema_version: Literal["architect/v1"] = "architect/v1"
    id: str
    revision: int
    intent: Intent
    requirements: Requirements
    state_contract: ArchitectureStateContract
    steps: list[ArchitectureStep] = Field(default_factory=list)
    transitions: list[ArchitectureTransition] = Field(default_factory=list)
    failure_policy: FailurePolicy | None = None
    test_suite: list[dict[str, Any]] = Field(default_factory=list)
    provenance: list[dict[str, Any]] = Field(default_factory=list)
