/**
 * Gestor global y reactivo de tareas de análisis de Lógica IA.
 * Permite ejecutar llamadas streaming a Ollama en segundo plano
 * manteniendo el proceso activo aunque el usuario navegue a otros módulos.
 */

export interface LogicTaskState {
  key: string;
  isRunning: boolean;
  progress: number;
  timeLeft: string;
  result: string;
  error?: string;
}

type Listener = (state: LogicTaskState) => void;

class LogicTaskManager {
  private tasks: Map<string, LogicTaskState> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  constructor() {
    try {
      const stored = localStorage.getItem('global_logic_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.keys(parsed).forEach((k) => {
          this.tasks.set(k, {
            key: k,
            isRunning: false,
            progress: 100,
            timeLeft: 'Listo',
            result: parsed[k]
          });
        });
      }
    } catch {}
  }

  public getState(key: string): LogicTaskState {
    if (!this.tasks.has(key)) {
      let cachedResult = '';
      try {
        const globalCache = JSON.parse(localStorage.getItem('global_logic_cache') || '{}');
        cachedResult = globalCache[key] || '';
      } catch {}

      this.tasks.set(key, {
        key,
        isRunning: false,
        progress: cachedResult ? 100 : 0,
        timeLeft: cachedResult ? 'Listo' : '',
        result: cachedResult
      });
    }
    return this.tasks.get(key)!;
  }

  public subscribe(key: string, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    listener(this.getState(key));

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  private notify(key: string) {
    const state = this.getState(key);
    const set = this.listeners.get(key);
    if (set) {
      set.forEach((l) => l(state));
    }
  }

  public async startTask(key: string, content: string, title?: string): Promise<void> {
    const current = this.getState(key);
    if (current.isRunning) return;
    if (current.result && current.result.length > 50) return;

    const state: LogicTaskState = {
      key,
      isRunning: true,
      progress: 0,
      timeLeft: 'Calculando...',
      result: ''
    };
    this.tasks.set(key, state);
    this.notify(key);

    const startTime = Date.now();
    const estimatedTotalTokens = 350;
    let tokens = 0;
    let accumulatedText = '';

    try {
      const prompt = `Eres un Arquitecto e Ingeniero de Inteligencia Artificial de Élite. Analiza exhaustivamente el siguiente contenido (${title ? `"${title}"` : 'instrucción'}), explicando a fondo su lógica interna, arquitectura de control, flujo de ejecución y propósito principal de forma clara, profesional y estructurada en Markdown.\n\nContenido:\n${content}`;

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt,
          stream: true
        })
      });

      if (!res.ok || !res.body) {
        throw new Error('Error al conectar con Ollama');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.trim() !== '');

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              accumulatedText += parsed.response;
              tokens++;

              const progress = Math.min(96, Math.floor((tokens / estimatedTotalTokens) * 100));
              const elapsedMs = Date.now() - startTime;
              let timeLeftStr = 'Calculando...';

              if (elapsedMs > 1000) {
                const tokensPerMs = tokens / elapsedMs;
                const remainingTokens = Math.max(0, estimatedTotalTokens - tokens);
                const remainingSecs = Math.ceil((remainingTokens / tokensPerMs) / 1000);
                timeLeftStr = remainingSecs > 60
                  ? `${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s restantes`
                  : `${remainingSecs}s restantes`;
              }

              state.progress = progress;
              state.timeLeft = timeLeftStr;
              state.result = accumulatedText;
              this.notify(key);
            }
          } catch {}
        }
      }

      state.isRunning = false;
      state.progress = 100;
      state.timeLeft = '¡Completado!';
      state.result = accumulatedText;
      this.notify(key);

      try {
        const globalCache = JSON.parse(localStorage.getItem('global_logic_cache') || '{}');
        globalCache[key] = accumulatedText;
        localStorage.setItem('global_logic_cache', JSON.stringify(globalCache));
      } catch {}

    } catch (err: any) {
      console.error('Logic task error:', err);
      state.isRunning = false;
      state.error = err.message || 'Error al generar análisis de lógica';
      state.result = 'No se pudo generar la explicación de lógica. Verifica la conexión con Ollama local.';
      this.notify(key);
    }
  }
}

export const logicTaskManager = new LogicTaskManager();
