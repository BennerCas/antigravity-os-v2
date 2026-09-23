import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

const PomodoroTimer: React.FC = () => {
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Auto-switch mode or just stop
      setIsActive(false);
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        setMode('focus');
        setTimeLeft(FOCUS_TIME);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(FOCUS_TIME);
  };

  const switchToBreak = () => {
    setIsActive(false);
    setMode('break');
    setTimeLeft(BREAK_TIME);
  };

  const switchToFocus = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(FOCUS_TIME);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  const progressFraction = timeLeft / totalTime;
  
  const radius = 70; // 140px diameter, fits in w-44 (176px)
  const circumference = 2 * Math.PI * radius;
  
  const focusArc = circumference * (25 / 30);
  const breakArc = circumference * (5 / 30);

  const focusBgDash = `${focusArc} ${circumference}`;
  const breakBgDash = `${breakArc} ${circumference}`;
  
  const activeLength = mode === 'focus' ? focusArc * progressFraction : breakArc * progressFraction;
  const activeDash = `${activeLength} ${circumference}`;
  const activeOffset = mode === 'focus' ? 0 : -focusArc;
  const activeColor = mode === 'focus' ? 'text-orange-500' : 'text-cyan-500';

  return (
    <div className="flex flex-col items-center p-4 bg-zinc-950 rounded-xl shadow-lg border border-zinc-800 w-full max-w-[250px]">
      <div className="flex w-full justify-between mb-4">
        <button 
          onClick={switchToFocus}
          className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${mode === 'focus' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          FOCUS
        </button>
        <button 
          onClick={switchToBreak}
          className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${mode === 'break' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Coffee size={12} /> BREAK
        </button>
      </div>
      
      <div className="relative w-44 h-44 flex items-center justify-center mb-6">
        {/* Background Circle */}
        <svg className="absolute w-full h-full transform -rotate-90">
          {/* Focus Background Segment */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={focusBgDash}
            className="text-zinc-800"
          />
          {/* Break Background Segment */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={breakBgDash}
            strokeDashoffset={-focusArc}
            className="text-cyan-600"
          />
          
          {/* Progress Circle */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={activeDash}
            strokeDashoffset={activeOffset}
            className={`${activeColor} transition-all duration-1000 ease-linear`}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-light text-zinc-100 tracking-wider font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className={`text-[10px] uppercase tracking-widest mt-2 font-bold ${mode === 'focus' ? 'text-orange-500/80' : 'text-cyan-500/80'}`}>
            {mode === 'focus' ? 'DEEP WORK' : 'REST'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTimer}
          className={`flex items-center justify-center w-12 h-12 rounded-full text-black transition-colors ${mode === 'focus' ? 'bg-orange-600 hover:bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.3)]'}`}
        >
          {isActive ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
        </button>
        <button 
          onClick={resetTimer}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
