import React, { useState, useRef, useEffect } from 'react';
import { useTTSStore } from '../../lib/ttsStore';
import { Robot, SpeakerHigh, StopCircle, X, PaperPlaneRight } from '@phosphor-icons/react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export const FlowBoardCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { play, stop, isActive, currentSection } = useTTSStore();

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  // Manejo Global de Drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;
      
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragState.current.hasMoved = true;
      }
      
      setPosition({
        x: dragState.current.initialX + dx,
        y: dragState.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input') && !(e.target as HTMLElement).closest('.close-btn')) {
      return;
    }
    
    e.preventDefault(); // Evita selección de texto
    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false
    };
    setIsDragging(true);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 340),
        y: Math.min(prev.y, window.innerHeight - 420)
      }));
    } else {
      stop();
    }
  };

  const handleClick = () => {
    if (!dragState.current.hasMoved) {
      toggleOpen();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/builder/flowboard/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!response.ok) throw new Error('Error en la red');

      const data = await response.json();
      const aiContent = data.reply || data.response || data.message || 'Listo.';
      const msgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, { id: msgId, role: 'assistant', content: aiContent }]);
      play(aiContent, msgId);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Error de conexión.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{ left: position.x, top: position.y }}
      className="fixed z-[100] flex flex-col shadow-2xl transition-shadow"
    >
      {!isOpen ? (
        <div
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#001c24] text-cyan-400 border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-[#002a3a] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all duration-300 cursor-pointer active:cursor-grabbing"
          title="FlowBoard Copilot (Clic para abrir)"
        >
          <Robot size={30} weight="fill" />
        </div>
      ) : (
        <div className="flex flex-col w-[320px] h-[400px] bg-[#000c14] border border-cyan-800 rounded-lg overflow-hidden text-gray-300 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <div 
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between p-3 bg-[#001724] border-b border-cyan-800 text-cyan-400 font-bold cursor-grab active:cursor-grabbing"
          >
            <span className="flex items-center gap-2 pointer-events-none drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
              <Robot size={20} weight="fill" />
              FlowBoard AI
            </span>
            <button 
              onClick={handleClick} 
              className="close-btn text-cyan-700 hover:text-cyan-400 transition-colors z-10" 
              title="Minimizar"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#00080a] custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-cyan-800 text-sm mt-10">
                <Robot size={40} className="mx-auto mb-2 opacity-50" />
                ¿Cómo te ayudo a construir hoy?
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cyan-900/30 text-cyan-50 rounded-tr-sm border border-cyan-800'
                      : 'bg-[#00121a] border border-cyan-900/50 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className="mt-1 flex items-center">
                    <button
                      onClick={() => isActive && currentSection === msg.id ? stop() : play(msg.content, msg.id)}
                      className={`text-xs p-1 rounded transition-colors ${
                        isActive && currentSection === msg.id 
                          ? 'text-red-400 hover:bg-red-900/30' 
                          : 'text-gray-500 hover:bg-gray-800 hover:text-cyan-400'
                      }`}
                    >
                      {isActive && currentSection === msg.id ? <StopCircle size={16} weight="fill" /> : <SpeakerHigh size={16} weight="bold" />}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 text-sm bg-[#00121a] border border-cyan-900/50 text-cyan-500 rounded-tl-sm flex items-center gap-1">
                  <Robot size={16} weight="fill" className="animate-pulse" />
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-[#00111a] border-t border-cyan-900/50 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Pregúntale al modelo..."
              className="flex-1 bg-[#000a14] border border-cyan-900/60 rounded-md py-2 px-3 text-sm text-gray-200 focus:outline-none focus:border-cyan-600 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-600 disabled:opacity-50 transition-colors"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
