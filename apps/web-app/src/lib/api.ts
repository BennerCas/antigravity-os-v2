/**
 * URL base del backend FastAPI.
 * Configurable con VITE_BACKEND_URL (ej. "http://localhost:8001").
 * Por defecto apunta al backend v2 local en el puerto 8001.
 */
const BACKEND_ORIGIN: string =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';

export const API_URL = `${BACKEND_ORIGIN}/api/v1`;

/** URL WebSocket del runtime de ejecución. */
export const WS_EXECUTE_URL =
  (BACKEND_ORIGIN ? BACKEND_ORIGIN.replace(/^http/, 'ws') : `ws://${window.location.host}`) + '/api/v1/ws/execute';
export const WS_STUDIO_ACTIVITY_URL = (BACKEND_ORIGIN ? BACKEND_ORIGIN.replace(/^http/, 'ws') : `ws://${window.location.host}`) + '/api/v1/studio/ws/activity';

