import { create } from 'zustand';

interface TTSState {
  isActive: boolean;
  isPaused: boolean;
  currentSection: string;
  volume: number;
  speed: number;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;

  // Actions
  initVoices: () => void;
  play: (text: string, section?: string) => void;
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
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/#+\s*/g, '') // headers
    .replace(/`{1,3}[^`\n]*`{1,3}/g, '') // code blocks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/[^\w\s\.,áéíóúÁÉÍÓÚñÑüÜ¿?¡!:-]/g, ' ') // solo letras y puntuación
    .replace(/\s+/g, ' ')
    .trim();
};

export const useTTSStore = create<TTSState>((set, get) => ({
  isActive: false,
  isPaused: false,
  currentSection: '',
  volume: 1,
  speed: 1,
  voices: [],
  selectedVoiceURI: null,

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

  play: (text: string, section: string = 'Texto General') => {
    const { volume, speed, voices, selectedVoiceURI } = get();
    if (!('speechSynthesis' in window)) return;
    
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

    utterance.onstart = () => set({ isActive: true, isPaused: false, currentSection: section });
    utterance.onend = () => set({ isActive: false, isPaused: false, currentSection: '' });
    utterance.onerror = () => set({ isActive: false, isPaused: false, currentSection: '' });

    window.speechSynthesis.speak(utterance);
    set({ isActive: true, isPaused: false, currentSection: section });
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
    set({ isActive: false, isPaused: false, currentSection: '' });
  },

  setVolume: (v: number) => {
    set({ volume: v });
  },
  
  setSpeed: (s: number) => {
    set({ speed: s });
  },

  setVoice: (uri: string) => {
    set({ selectedVoiceURI: uri });
  }
}));
