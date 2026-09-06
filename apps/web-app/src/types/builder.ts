/** Datos de un nodo del Builder (agente IA configurable). */
export interface BuilderNodeData {
  title?: string;
  content?: string;
  role?: string;
  framework?: string;
  llm_model?: string;
  temperature?: number;
  variables?: string;
  output_schema?: string;
  isVariant?: boolean;
  selectedForPdf?: boolean;
  ai_reasoning?: string | null;
  prompt?: string;
  note?: string;
  color?: string;
  [key: string]: unknown;
}

/** Datos del nodo de dibujo libre / línea. */
export interface DrawingNodeData extends Record<string, unknown> {
  points?: number[][];
  color?: string;
  size?: number;
  type?: string;
}

/** Prompt entrante desde Atlas para encadenar en el Builder. */
export interface PromptChainItem {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  [key: string]: unknown;
}

/** Nodo actualizado por el Meta-Orquestador. */
export interface UpdatedNode {
  id: string;
  content?: string;
  role?: string;
  framework?: string;
  variables?: string;
}

/** Respuesta de /api/v1/execute/task. */
export interface ExecutionResult {
  framework: string;
  execution_plan: string;
  model_used: string;
  updated_nodes?: UpdatedNode[];
}

/** Flujo guardado en el backend (Nexus/Flows). */
export interface SavedFlow {
  id: string;
  name: string;
  description?: string;
  nodes?: unknown[] | number;
  edges?: unknown[];
  data?: { nodes?: unknown[] };
  engine?: string;
  lastActive?: string;
  status?: string;
}
