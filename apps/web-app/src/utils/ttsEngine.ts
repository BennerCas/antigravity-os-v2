/**
 * Antigravity Academy - TTS Engine (Síntesis de Voz en Español)
 * Proporciona reproducción de audio pedagógica para los nodos del Knowledge Graph 3D.
 * Conforme a las reglas de audio: voces en español nativas y control de reproducción.
 */

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSkillId: string | null;
  rate: number;
}

type TTSListener = (state: TTSState) => void;

class AcademyTTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<TTSListener> = new Set();
  private state: TTSState = {
    isPlaying: false,
    isPaused: false,
    currentSkillId: null,
    rate: 1.0,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public getState(): TTSState {
    return { ...this.state };
  }

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach(fn => fn(s));
  }

  public setRate(rate: number): void {
    this.state.rate = Math.max(0.5, Math.min(2.0, rate));
    if (this.currentUtterance && this.state.isPlaying) {
      this.currentUtterance.rate = this.state.rate;
    }
    this.notify();
  }

  /**
   * Obtiene la mejor voz en español disponible en el sistema.
   * Prioriza es-ES, es-MX, es-US y voces neuronales/naturales.
   */
  public getBestSpanishVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
    if (spanishVoices.length === 0) return null;

    const naturalVoice = spanishVoices.find(v => 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('online') ||
      v.name.toLowerCase().includes('neural')
    );
    if (naturalVoice) return naturalVoice;

    const preferredLang = spanishVoices.find(v => 
      v.lang.toLowerCase() === 'es-es' || v.lang.toLowerCase() === 'es-mx'
    );
    if (preferredLang) return preferredLang;

    return spanishVoices[0];
  }

  /**
   * Genera el guion pedagógico en español para una habilidad.
   */
  public generateScript(
    skill: { id: string; name: string; category: string; description?: string; prerequisites?: string[] },
    score?: number,
    state?: string
  ): string {
    const trackLabels: Record<string, string> = {
      foundation: 'Fundamentos del Grafo',
      builder: 'Constructor de Agentes y Lógica',
      operator: 'Operador de Fiabilidad e Idempotencia',
      architect: 'Arquitectura y Composición Modular',
      expert: 'Orquestación Experta Multiagente',
    };

    const trackName = trackLabels[skill.category.toLowerCase()] || skill.category;
    const scoreVal = score !== undefined ? Math.round(score) : 0;
    const stateVal = state || 'Desconocido';

    let script = `Habilidad: ${skill.name}. `;
    script += `Ruta formativa: ${trackName}. `;

    if (skill.description) {
      script += `${skill.description} `;
    }

    if (skill.prerequisites && skill.prerequisites.length > 0) {
      script += `Prerrequisitos requeridos: ${skill.prerequisites.join(', ')}. `;
    } else {
      script += `Habilidad de entrada sin prerrequisitos previos. `;
    }

    script += `Tu estado de maestría actual es ${stateVal}, con un puntaje de ${scoreVal} por ciento en la evaluación multidimensional.`;

    return script;
  }

  /**
   * Reproduce la explicación de una habilidad mediante síntesis de voz.
   */
  public speakSkill(
    skill: { id: string; name: string; category: string; description?: string; prerequisites?: string[] },
    score?: number,
    state?: string,
    onEndCallback?: () => void
  ): void {
    if (!this.synth) {
      console.warn('[TTS] Web Speech API no soportada en este entorno.');
      return;
    }

    // Si ya está reproduciendo la misma habilidad, pausar o detener
    if (this.state.isPlaying && this.state.currentSkillId === skill.id) {
      this.stop();
      return;
    }

    this.stop();

    const textToSpeak = this.generateScript(skill, score, state);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voice = this.getBestSpanishVoice();

    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = voice ? voice.lang : 'es-ES';
    utterance.rate = this.state.rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.state.currentSkillId = skill.id;
      this.notify();
    };

    utterance.onend = () => {
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.currentSkillId = null;
      this.notify();
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('[TTS] Error en síntesis de voz:', e);
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.currentSkillId = null;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentSkillId = null;
    this.notify();
  }

  public pause(): void {
    if (this.synth && this.state.isPlaying) {
      this.synth.pause();
      this.state.isPaused = true;
      this.notify();
    }
  }

  public resume(): void {
    if (this.synth && this.state.isPaused) {
      this.synth.resume();
      this.state.isPaused = false;
      this.notify();
    }
  }
}

export const ttsEngine = new AcademyTTSEngine();
