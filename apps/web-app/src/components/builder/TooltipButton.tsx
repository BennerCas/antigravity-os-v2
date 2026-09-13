import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export const TooltipButton = ({ 
  onClick, 
  icon, 
  label, 
  description, 
  className 
}: { 
  onClick: () => void, 
  icon: string, 
  label: string, 
  description: string, 
  className?: string 
}) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    }
    setShow(true);
  };

  return (
    <>
      <button 
        ref={btnRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
        className={className}
      >
        {icon} {label}
      </button>
      {show && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[99999] w-64 p-3 bg-[#0a0a0a] border border-blue-500/50 rounded-lg shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="text-[12px] font-bold text-blue-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider">{icon} {label}</div>
          <div className="text-[11px] text-gray-300 leading-relaxed whitespace-normal break-words">{description}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-blue-500/50"></div>
        </div>,
        document.body
      )}
    </>
  );
};
