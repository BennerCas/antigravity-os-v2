export interface Intent {
  goal: string;
  success_criteria: string[];
}

export interface Requirements {
  trigger: string;
  assumptions: Record<string, any>[];
  constraints: Record<string, any>[];
}

export interface ArchitectureStateContract {
  input: Record<string, any>;
  shared: Record<string, any>;
  output: Record<string, any>;
}

export interface ArchitectureStep {
  id: string;
  kind: string;
  name?: string;
  description?: string;
  input_bindings: Record<string, any>[];
  input_schema_ref?: string;
  output_schema_ref?: string;
  configuration: Record<string, any>;
  execution_policy?: Record<string, any>;
  failure_policy?: Record<string, any>;
  security_policy?: Record<string, any>;
  observability?: Record<string, any>;
  provenance: Record<string, any>[];
}

export interface ArchitectureTransition {
  id: string;
  from: string;
  to: string;
  kind: string;
  route?: Record<string, any>;
  source_handle?: string;
  target_handle?: string;
  provenance: Record<string, any>[];
}

export interface FailurePolicy {
  retry: Record<string, any>;
  dead_letter: Record<string, any>;
  human_escalation: Record<string, any>;
}

export interface ArchitectureSpec {
  schema_version: "architect/v1";
  id: string;
  revision: number;
  intent: Intent;
  requirements: Requirements;
  state_contract: ArchitectureStateContract;
  steps: ArchitectureStep[];
  transitions: ArchitectureTransition[];
  failure_policy?: FailurePolicy;
  test_suite: Record<string, any>[];
  provenance: Record<string, any>[];
}
