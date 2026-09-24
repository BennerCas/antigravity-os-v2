import React, { useEffect, useState } from 'react';
import { useStudioStore } from '../stores/useStudioStore';

export const GlobalAudioPlayer: React.FC = () => {
  const {
    audioText,
    isPlaying,
    setIsPlaying,
    audioRate,
    setAudioRate,
    selectedVoiceURI,
    setSelectedVoiceURI,
  } = useStudioStore();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const spanishVoices = allVoices.filter((v) => v.lang.includes('es'));
      setVoices(spanishVoices);

      if (!selectedVoiceURI && spanishVoices.length > 0) {
        setSelectedVoiceURI(spanishVoices[0].voiceURI);
      }
    };

    updateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceURI, setSelectedVoiceURI]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    };
  }, [setIsPlaying]);

  const handlePlayPause = () => {
    if (!audioText) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        const utterance = new SpeechSynthesisUtterance(audioText);
        utterance.rate = audioRate;

        if (selectedVoiceURI) {
          const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
          if (voice) {
            utterance.voice = voice;
          }
        }

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const rates = [1, 1.25, 1.5];

  if (!audioText) return null;

  return (
    <div className="flex flex-col gap-3 w-full border-t border-[var(--stroke-subtle)] pt-4 mt-2">
      <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--theme-border)] mb-1 flex items-center justify-between">
        <span>AureliOS TTS</span>
        {isPlaying && <span className="w-1.5 h-1.5 bg-[var(--theme-border)] rounded-full animate-pulse"></span>}
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[var(--text-secondary)]">Voice (Spanish Only)</label>
        <select
          className="bg-[var(--surface-card)] border border-[var(--stroke-subtle)] rounded text-sm p-1.5 focus:outline-none focus:border-[var(--theme-border)] text-[var(--text-primary)]"
          value={selectedVoiceURI || ''}
          onChange={(e) => setSelectedVoiceURI(e.target.value)}
        >
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center bg-[var(--theme-border)] hover:bg-[var(--theme-border)] text-[var(--text-primary)] rounded-full w-10 h-10 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button
            onClick={handleStop}
            className="flex items-center justify-center bg-[var(--surface-elevated)] hover:bg-[var(--surface-canvas)] text-[var(--text-primary)] rounded-full w-10 h-10 transition-colors"
            title="Stop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex bg-[var(--surface-card)] rounded-lg p-1 border border-[var(--stroke-subtle)]">
          {rates.map((r) => (
            <button
              key={r}
              onClick={() => setAudioRate(r)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                audioRate === r 
                  ? 'bg-[var(--theme-border)] text-[var(--text-primary)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


