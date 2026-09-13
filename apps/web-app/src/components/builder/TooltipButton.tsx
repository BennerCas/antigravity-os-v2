
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
  return (
    <div className="relative group inline-flex items-center justify-center">
      <button 
        onClick={onClick}
        className={className}
      >
        {icon} {label}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-[#0a0a0a] border border-blue-500/50 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none">
        <div className="text-[11px] font-bold text-blue-400 mb-1 flex items-center gap-1 uppercase tracking-wider">{icon} {label}</div>
        <div className="text-[10.5px] text-gray-300 leading-relaxed whitespace-normal break-words">{description}</div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-blue-500/50"></div>
      </div>
    </div>
  );
};
