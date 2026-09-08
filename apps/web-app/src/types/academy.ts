export type MasteryState = 'UNKNOWN' | 'NOVICE' | 'COMPETENT' | 'INDEPENDENT' | 'MASTERED';

export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'capstone';

export type MissionStatus = 'started' | 'validated' | 'evaluating' | 'reflection_pending' | 'completed' | 'blocked';

export type CopilotRole = 
  | 'socratic_guide' 
  | 'code_architect' 
  | 'failure_explainer' 
  | 'rubric_evaluator' 
  | 'drift_investigator' 
  | 'resilience_coach' 
  | 'capstone_defense_inquisitor' 
  | 'transfer_prompter' 
  | 'safety_advocate';

export interface LearningProfile {
  user_id: string;
  level: string;
  current_mission_id: string;
  completed_missions: string[];
  diagnostic_completed: boolean;
  preferences: {
    mode?: string;
    target_role?: string;
    language?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  category: string;
  order: number;
  color: string;
  mission_count: number;
  icon?: string;
}

export interface RubricItem {
  dimension: string;
  min_score: number;
  criteria: string;
}

export interface HintLadder {
  level_1_conceptual: string;
  level_2_directional: string;
  level_3_structural: string;
  level_4_solution_clue: string;
  level_5_code_snippet: string;
}

export interface MissionDefinition {
  id: string;
  track_id: string;
  sequence_order: number;
  title: string;
  difficulty: MissionDifficulty;
  estimated_minutes: number;
  prerequisites: string[];
  skills_trained: string[];
  problem_statement: string;
  success_criteria: string[];
  rubric: RubricItem[];
  hints: HintLadder;
  starter_flow: Record<string, any>;
  solution_flow: Record<string, any>;
  failure_scenarios: string[];
  verification_suite: Record<string, any>;
}

export interface ValidationFinding {
  code: string;
  severity: 'blocking' | 'warning' | 'info';
  category: string;
  entity_ref: string;
  message: string;
  suggested_action: string;
}

export interface MissionSession {
  id: string;
  user_id: string;
  mission_id: string;
  status: MissionStatus;
  sandbox_flow: {
    nodes: any[];
    edges: any[];
    [key: string]: any;
  };
  validation_state: {
    is_valid: boolean;
    blockers: ValidationFinding[];
    warnings: ValidationFinding[];
    all_findings: ValidationFinding[];
  };
  hints_unlocked: number[];
  reflection_submitted?: {
    prompt: string;
    text: string;
    ai_score: number;
    submitted_at: string;
  };
  score: number;
  started_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SkillDimensions {
  correctness: number;
  independence: number;
  transfer: number;
  reliability: number;
  comprehension: number;
  consistency: number;
  complexity: number;
  safety: number;
}

export interface SkillMasteryRecord {
  user_id: string;
  skill_id: string;
  dimensions: SkillDimensions;
  mastery_score: number;
  state: MasteryState;
  attempts: number;
  successes: number;
  hints_taken: number;
  last_evaluated_at: string;
}

export interface SkillGraphNode {
  id: string;
  name: string;
  category: string;
  prerequisites: string[];
  depth: number;
}

export interface EvidenceRecord {
  id: string;
  user_id: string;
  mission_id: string;
  artifact_type: string;
  payload: Record<string, any>;
  hash_sha256: string;
  prev_hash?: string;
  timestamp: string;
}

export interface FailureScenario {
  id: string;
  title: string;
  description: string;
  chaos_type: string;
  injected_fault: Record<string, any>;
}

export interface ArchitectureDriftFinding {
  type: string;
  severity: 'blocking' | 'warning' | 'info';
  spec_entity: string;
  builder_entity: string;
  description: string;
  suggested_action: string;
}

export interface DriftAnalysisResult {
  is_compliant: boolean;
  total_drifts: number;
  drifts: ArchitectureDriftFinding[];
}

export interface CertificationRecord {
  id: string;
  user_id: string;
  level: string;
  verification_token: string;
  issued_at: string;
  revoked: boolean;
  metadata?: Record<string, any>;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  architecture_summary: string;
  evidence_hashes: string[];
  public_url?: string;
  created_at: string;
}

export interface PortfolioCompilation {
  user_id: string;
  profile: LearningProfile;
  certifications: CertificationRecord[];
  portfolio_items: PortfolioItem[];
  signature: string;
}

export interface CopilotMessage {
  role: CopilotRole;
  message: string;
  hint_level: number;
  pedagogical_mode: string;
  actionable_step: string;
  code_sample?: string;
}

export interface SimulationResult {
  status: 'success' | 'failed' | 'error';
  execution_trace: Array<{
    step_id: string;
    step_name: string;
    status: string;
    duration_ms?: number;
    details?: any;
  }>;
  state: Record<string, any>;
  duration_ms: number;
  error?: string;
}
