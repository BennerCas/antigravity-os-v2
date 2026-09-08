export interface BuilderNodePayload {
  title: string;
  content: string;
  role?: string;
  framework?: string;
  llm_model?: string;
  temperature?: number;
  variables?: string;
  output_schema?: string;
  key?: string;
  category?: string;
}

export interface BuilderInjectionPayload {
  prompt?: BuilderNodePayload | any;
  agent?: BuilderNodePayload | any;
  promptChain?: (BuilderNodePayload | any)[];
  agentChain?: (BuilderNodePayload | any)[];
  templateFlow?: any;
  restoreFlow?: any;
  promptKey?: string;
  agentKey?: string;
  restoreCanvas?: boolean;
}

const STORAGE_KEY = 'builder_pending_injections';

/**
 * Sends one or multiple prompts/agents to Builder.
 * Guarantees delivery even if Builder is already mounted (display: none) or not yet mounted.
 */
export const sendToBuilderBridge = (
  navigate: (to: string, options?: any) => void,
  payload: BuilderInjectionPayload
) => {
  // 1. Queue into localStorage so Builder can drain it on mount or visibility change
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({
      payload,
      timestamp: Date.now()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error queuing builder injection:', e);
  }

  // 2. Dispatch custom DOM event for active listeners
  try {
    window.dispatchEvent(new CustomEvent('builder:inject', { detail: payload }));
  } catch (e) {
    console.error('Error dispatching builder:inject event:', e);
  }

  // 3. Navigate to /builder with state
  navigate('/builder', { state: payload });
};

/**
 * Drains all pending injections from localStorage.
 */
export const drainPendingBuilderInjections = (): BuilderInjectionPayload[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    localStorage.removeItem(STORAGE_KEY);
    const queue = JSON.parse(raw);
    return Array.isArray(queue) ? queue.map((item: any) => item.payload) : [];
  } catch (e) {
    console.error('Error draining builder injections:', e);
    return [];
  }
};
