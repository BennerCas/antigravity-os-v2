from typing import Any, Literal, Union

from pydantic import BaseModel, Field


class DataContract(BaseModel):
    schema_ref: str


class NodeExecutionPolicy(BaseModel):
    timeout_ms: int | None = 30000
    retry: dict[str, Any] | None = None
    idempotency_scope: str | None = None


class NodeFailurePolicy(BaseModel):
    retryable: list[str] | None = []
    on_schema_error: str | None = "failure"
    on_terminal_error: str | None = "failure"
    on_evaluation_error: str | None = "failure"


class NodeSecurityPolicy(BaseModel):
    data_classification: str | None = "internal"
    allow_providers: list[str] | None = []
    redact_paths: list[str] | None = []


class BaseBuilderNode(BaseModel):
    id: str
    kind: str
    name: str
    config: dict[str, Any] = Field(default_factory=dict)
    input_contract: DataContract | None = None
    output_contracts: dict[str, DataContract] = Field(default_factory=dict)
    execution_policy: NodeExecutionPolicy | None = None
    failure_policy: NodeFailurePolicy | None = None
    security_policy: NodeSecurityPolicy | None = None
    provenance: dict[str, Any] | None = None
    ui: dict[str, Any] = Field(default_factory=dict)


class StartNode(BaseBuilderNode):
    kind: Literal["start"] = "start"


class AgentNode(BaseBuilderNode):
    kind: Literal["agent"] = "agent"


class TransformNode(BaseBuilderNode):
    kind: Literal["transform"] = "transform"


class DecisionNode(BaseBuilderNode):
    kind: Literal["decision"] = "decision"


class ClassifierNode(BaseBuilderNode):
    kind: Literal["classifier"] = "classifier"


class ToolNode(BaseBuilderNode):
    kind: Literal["tool"] = "tool"


class HumanGateNode(BaseBuilderNode):
    kind: Literal["human_gate"] = "human_gate"


class SubflowNode(BaseBuilderNode):
    kind: Literal["subflow"] = "subflow"


class ForkNode(BaseBuilderNode):
    kind: Literal["fork"] = "fork"


class JoinNode(BaseBuilderNode):
    kind: Literal["join"] = "join"


class EndNode(BaseBuilderNode):
    kind: Literal["end"] = "end"


class ErrorSinkNode(BaseBuilderNode):
    kind: Literal["error_sink"] = "error_sink"


BuilderNode = Union[
    StartNode,
    AgentNode,
    TransformNode,
    DecisionNode,
    ClassifierNode,
    ToolNode,
    HumanGateNode,
    SubflowNode,
    ForkNode,
    JoinNode,
    EndNode,
    ErrorSinkNode,
]


class RouteCondition(BaseModel):
    selector: str | None = None
    expression: str | None = None


class BuilderEdge(BaseModel):
    id: str
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    kind: str = "route"
    label: str | None = None
    source_handle: str | None = None
    target_handle: str | None = None
    route: RouteCondition | None = None
    ui: dict[str, Any] = Field(default_factory=dict)
    provenance: dict[str, Any] | None = None

    class Config:
        populate_by_name = True


class FlowStateContract(BaseModel):
    input_schema_ref: str
    output_schema_ref: str


class FlowPolicies(BaseModel):
    default_timeout_ms: int = 30000
    default_retry_policy_ref: str | None = None


class Flow(BaseModel):
    schema_version: Literal["builder/v1"] = "builder/v1"
    id: str
    revision: int = 1
    metadata: dict[str, Any] = Field(default_factory=dict)
    state_contract: FlowStateContract | None = None
    nodes: list[BuilderNode] = Field(default_factory=list)
    edges: list[BuilderEdge] = Field(default_factory=list)
    policies: FlowPolicies | None = None
    ui: dict[str, Any] = Field(default_factory=dict)


class RuntimeGraph(BaseModel):
    schema_version: Literal["runtime/v1"] = "runtime/v1"
    id: str
    revision: int
    flow_hash: str
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    manifest: dict[str, Any]
