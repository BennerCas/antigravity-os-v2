import { create } from 'zustand';

interface TTSState {
  isActive: boolean;
  isPaused: boolean;
  currentSection: string;
  currentText: string;
  volume: number;
  speed: number;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;

  isRestarting: boolean;
  initVoices: () => void;
  play: (text: string, section?: string, isRestarting?: boolean) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  setSpeed: (s: number) => void;
  setVoice: (uri: string) => void;
}

const cleanTextForTTS = (text: string) => {
  if (!text) return '';
  return text
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/#+\s*/g, '')
    .replace(/`{1,3}[^`\n]*`{1,3}/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[^\w\s\.,áéíóúÁÉÍÓÚñÑüÜ¿?¡!:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const useTTSStore = create<TTSState>((set, get) => ({
  isActive: false,
  isPaused: false,
  currentSection: '',
  currentText: '',
  volume: 1,
  speed: 1,
  voices: [],
  selectedVoiceURI: null,
  isRestarting: false,

  initVoices: () => {
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const esVoices = allVoices.filter(v => v.lang.startsWith('es'));
      const voices = esVoices.length > 0 ? esVoices : allVoices;
      set({ voices, selectedVoiceURI: voices[0]?.voiceURI || null });
    };
    
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  },

  play: (text: string, section: string = 'Texto General', isRestart = false) => {
    const { volume, speed, voices, selectedVoiceURI } = get();
    if (!('speechSynthesis' in window)) return;
    
    if (isRestart) {
      set({ isRestarting: true });
    }
    window.speechSynthesis.cancel();
    
    const cleaned = cleanTextForTTS(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.volume = volume;
    utterance.rate = speed;
    utterance.lang = 'es-ES';
    
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      set({ isActive: true, isPaused: false, currentSection: section, currentText: text, isRestarting: false });
    };
    
    utterance.onend = () => {
      if (!get().isRestarting) {
        set({ isActive: false, isPaused: false, currentSection: '', currentText: '' });
      }
    };
    
    utterance.onerror = () => {
      if (!get().isRestarting) {
        set({ isActive: false, isPaused: false, currentSection: '', currentText: '' });
      }
    };

    window.speechSynthesis.speak(utterance);
    set({ isActive: true, isPaused: false, currentSection: section, currentText: text });
  },

  pause: () => {
    window.speechSynthesis.pause();
    set({ isPaused: true });
  },

  resume: () => {
    window.speechSynthesis.resume();
    set({ isPaused: false });
  },

  stop: () => {
    window.speechSynthesis.cancel();
    set({ isActive: false, isPaused: false, currentSection: '', currentText: '', isRestarting: false });
  },

  setVolume: (v: number) => {
    set({ volume: v });
    const { isActive, currentText, currentSection, play } = get();
    if (isActive && currentText) {
      clearTimeout((window as any)._ttsRestartTimer);
      (window as any)._ttsRestartTimer = setTimeout(() => play(currentText, currentSection, true), 300);
    }
  },
  
  setSpeed: (s: number) => {
    set({ speed: s });
    const { isActive, currentText, currentSection, play } = get();
    if (isActive && currentText) {
      clearTimeout((window as any)._ttsRestartTimer);
      (window as any)._ttsRestartTimer = setTimeout(() => play(currentText, currentSection, true), 300);
    }
  },

  setVoice: (uri: string) => {
    set({ selectedVoiceURI: uri });
  }
}));
