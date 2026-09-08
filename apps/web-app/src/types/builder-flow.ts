export interface DataContract {
  schema_ref: string;
}

export interface NodeExecutionPolicy {
  timeout_ms?: number;
  retry?: Record<string, any>;
  idempotency_scope?: string;
}

export interface NodeFailurePolicy {
  retryable?: string[];
  on_schema_error?: string;
  on_terminal_error?: string;
  on_evaluation_error?: string;
}

export interface NodeSecurityPolicy {
  data_classification?: string;
  allow_providers?: string[];
  redact_paths?: string[];
}

export interface BaseBuilderNode {
  id: string;
  kind: string;
  name: string;
  config: Record<string, any>;
  input_contract?: DataContract;
  output_contracts: Record<string, DataContract>;
  execution_policy?: NodeExecutionPolicy;
  failure_policy?: NodeFailurePolicy;
  security_policy?: NodeSecurityPolicy;
  provenance?: Record<string, any>;
  ui: Record<string, any>;
}

export interface StartNode extends BaseBuilderNode { kind: "start"; }
export interface AgentNode extends BaseBuilderNode { kind: "agent"; }
export interface TransformNode extends BaseBuilderNode { kind: "transform"; }
export interface DecisionNode extends BaseBuilderNode { kind: "decision"; }
export interface ClassifierNode extends BaseBuilderNode { kind: "classifier"; }
export interface ToolNode extends BaseBuilderNode { kind: "tool"; }
export interface HumanGateNode extends BaseBuilderNode { kind: "human_gate"; }
export interface SubflowNode extends BaseBuilderNode { kind: "subflow"; }
export interface ForkNode extends BaseBuilderNode { kind: "fork"; }
export interface JoinNode extends BaseBuilderNode { kind: "join"; }
export interface EndNode extends BaseBuilderNode { kind: "end"; }
export interface ErrorSinkNode extends BaseBuilderNode { kind: "error_sink"; }

export type BuilderNode = 
  StartNode | AgentNode | TransformNode | DecisionNode | 
  ClassifierNode | ToolNode | HumanGateNode | SubflowNode | 
  ForkNode | JoinNode | EndNode | ErrorSinkNode;

export interface RouteCondition {
  selector?: string;
  expression?: string;
}

export interface BuilderEdge {
  id: string;
  from: string;
  to: string;
  kind: string;
  label?: string;
  source_handle?: string;
  target_handle?: string;
  route?: RouteCondition;
  ui: Record<string, any>;
  provenance?: Record<string, any>;
}

export interface FlowStateContract {
  input_schema_ref: string;
  output_schema_ref: string;
}

export interface FlowPolicies {
  default_timeout_ms: number;
  default_retry_policy_ref?: string;
}

export interface BuilderFlow {
  schema_version: "builder/v1";
  id: string;
  revision: number;
  metadata: Record<string, any>;
  state_contract?: FlowStateContract;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  policies?: FlowPolicies;
  ui: Record<string, any>;
}

export interface RuntimeGraph {
  schema_version: "runtime/v1";
  id: string;
  revision: number;
  flow_hash: string;
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  manifest: Record<string, any>;
}
