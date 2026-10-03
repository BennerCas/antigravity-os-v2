export const DEFAULT_LOCAL_MODEL = 'hermes3:unlocked';
export const HF_HERMES_Q8_MODEL = 'hf.co/mlabonne/Hermes-3-Llama-3.1-8B-lorablated-GGUF:Q8_0';
export const DEFAULT_AURELIOS_MODEL = `ollama/${DEFAULT_LOCAL_MODEL}`;
export const DEFAULT_CLOUD_MODEL = 'anthropic/claude-3.5-sonnet';
export const LEGACY_LOCAL_DEFAULTS = new Set(['hermes3:8b', 'hermes3:latest']);
export const CLOUD_MODEL_OPTIONS = [DEFAULT_CLOUD_MODEL, 'openai/gpt-4o', 'meta-llama/llama-3.1-70b-instruct', 'qwen/qwen-2.5-72b-instruct'];
export const LOCAL_MODEL_OPTIONS = Array.from(new Set([DEFAULT_LOCAL_MODEL, HF_HERMES_Q8_MODEL, 'hermes3:8b', 'llama3.1:8b', 'mistral', 'qwen2.5:7b', 'phi3:3.8b', 'qwen2.5:3b', 'qwen2.5:1.5b']));
function stripModelProvider(model?: string | null): string { if (!model) return ''; const clean = model.trim(); if (clean.startsWith('ollama/')) return clean.slice(7); if (clean.startsWith('free.ai/')) return clean.slice(8); return clean; }
export function isLocalModel(model?: string | null): boolean { const clean = stripModelProvider(model); return Boolean(clean) && (LOCAL_MODEL_OPTIONS.includes(clean) || clean.startsWith('hf.co/') || clean.includes(':')); }
export function normalizeLocalModel(model?: string | null): string { const clean = stripModelProvider(model); if (!clean || clean === 'auto' || LEGACY_LOCAL_DEFAULTS.has(clean)) return DEFAULT_LOCAL_MODEL; return clean; }
export function normalizeAureliosModel(model?: string | null): string { const clean = (model || '').trim(); if (!clean || clean === 'free.ai/auto') return DEFAULT_AURELIOS_MODEL; if (clean.startsWith('ollama/')) return `ollama/${normalizeLocalModel(clean)}`; if (LEGACY_LOCAL_DEFAULTS.has(clean)) return DEFAULT_AURELIOS_MODEL; return clean; }
export function resolvePreferredLocalModel(model?: string | null): string { return isLocalModel(model) ? normalizeLocalModel(model) : DEFAULT_LOCAL_MODEL; }
