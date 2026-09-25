import { useEffect, useRef } from 'react';
import { useTTSStore } from '../lib/ttsStore';

export function GlobalTTSListener() {
  const isMouseDown = useRef(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isMouseDown.current) {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text) {
          e.preventDefault();
          useTTSStore.getState().play(text, 'Lectura Seleccionada');
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
