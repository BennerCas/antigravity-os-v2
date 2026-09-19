from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal, Union

class DataContract(BaseModel):
    schema_ref: str

class NodeExecutionPolicy(BaseModel):
    timeout_ms: Optional[int] = 30000
    retry: Optional[Dict[str, Any]] = None
    idempotency_scope: Optional[str] = None

class NodeFailurePolicy(BaseModel):
    retryable: Optional[List[str]] = []
    on_schema_error: Optional[str] = "failure"
    on_terminal_error: Optional[str] = "failure"
    on_evaluation_error: Optional[str] = "failure"

class NodeSecurityPolicy(BaseModel):
    data_classification: Optional[str] = "internal"
    allow_providers: Optional[List[str]] = []
    redact_paths: Optional[List[str]] = []

class BaseBuilderNode(BaseModel):
    id: str
    kind: str
    name: str
    config: Dict[str, Any] = Field(default_factory=dict)
    input_contract: Optional[DataContract] = None
    output_contracts: Dict[str, DataContract] = Field(default_factory=dict)
    execution_policy: Optional[NodeExecutionPolicy] = None
    failure_policy: Optional[NodeFailurePolicy] = None
    security_policy: Optional[NodeSecurityPolicy] = None
    provenance: Optional[Dict[str, Any]] = None
    ui: Dict[str, Any] = Field(default_factory=dict)

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
    StartNode, AgentNode, TransformNode, DecisionNode, 
    ClassifierNode, ToolNode, HumanGateNode, SubflowNode, 
    ForkNode, JoinNode, EndNode, ErrorSinkNode
]

class RouteCondition(BaseModel):
    selector: Optional[str] = None
    expression: Optional[str] = None

class BuilderEdge(BaseModel):
    id: str
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    kind: str = "route"
    label: Optional[str] = None
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None
    route: Optional[RouteCondition] = None
    ui: Dict[str, Any] = Field(default_factory=dict)
    provenance: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True

class FlowStateContract(BaseModel):
    input_schema_ref: str
    output_schema_ref: str

class FlowPolicies(BaseModel):
    default_timeout_ms: int = 30000
    default_retry_policy_ref: Optional[str] = None

class Flow(BaseModel):
    schema_version: Literal["builder/v1"] = "builder/v1"
    id: str
    revision: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)
    state_contract: Optional[FlowStateContract] = None
    nodes: List[BuilderNode] = Field(default_factory=list)
    edges: List[BuilderEdge] = Field(default_factory=list)
    policies: Optional[FlowPolicies] = None
    ui: Dict[str, Any] = Field(default_factory=dict)

class RuntimeGraph(BaseModel):
    schema_version: Literal["runtime/v1"] = "runtime/v1"
    id: str
    revision: int
    flow_hash: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    manifest: Dict[str, Any]
