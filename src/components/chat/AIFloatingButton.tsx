import { cn } from "../../utils/cn";

interface AIFloatingButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function AIFloatingButton({ onClick, isOpen = false }: AIFloatingButtonProps) {
  return (
    <>
      {/* Button */}
      <button
        type="button"
        onClick={onClick}
        aria-label="Open ZYREX AI"
        aria-expanded={isOpen}
        className="ai-fab relative size-[66px] cursor-pointer rounded-full border-0 p-0 text-white grid place-items-center"
      >
        {/* Rotating aura */}
        <div className="absolute inset-[-10px] -z-10 rounded-full bg-conic-gradient opacity-62 blur-[16px] animate-spin" />

        {/* Pulse rings */}
        <div className="ring absolute inset-0 rounded-full border-2 border-[rgba(255,159,28,0.8)] pointer-events-none animate-ping" />
        <div className="ring absolute inset-0 rounded-full border-2 border-[rgba(255,122,0,0.75)] pointer-events-none animate-ping" style={{ animationDelay: '1.3s' }} />

        {/* Spark icon */}
        <div className={cn("ico ico-spark absolute inset-0 grid place-items-center transition-all duration-300", isOpen && "opacity-0 rotate-90 scale-55")}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-[30px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.32)]">
            <path d="M12 2.6l1.85 5.1a2 2 0 001.2 1.2l5.15 1.8a.7.7 0 010 1.32l-5.15 1.8a2 2 0 00-1.2 1.2L12 20.12a.7.7 0 01-1.32 0l-1.8-5.1a2 2 0 00-1.2-1.2L2.6 12.02a.7.7 0 010-1.32l5.1-1.8a2 2 0 001.2-1.2L10.7 2.6a.7.7 0 011.3 0z"/>
            <path d="M19.2 2.2l.5 1.4a1 1 0 00.6.6l1.4.5a.35.35 0 010 .66l-1.4.5a1 1 0 00-.6.6l-.5 1.4a.35.35 0 01-.66 0l-.5-1.4a1 1 0 00-.6-.6l-1.4-.5a.35.35 0 010-.66l1.4-.5a1 1 0 00.6-.6l.5-1.4a.35.35 0 01.66 0z"/>
          </svg>
        </div>

        {/* Close icon */}
        <div className={cn("ico ico-x absolute inset-0 grid place-items-center transition-all duration-300", !isOpen && "opacity-0 -rotate-90 scale-55")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="size-[30px]">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </div>
      </button>

      {/* Tooltip */}
      <div className={cn("ai-tip absolute right-[calc(100%+14px)] top-[33px] -translate-y-1/2 whitespace-nowrap text-[13px] font-semibold opacity-0 translate-x-2 pointer-events-none transition-all", isOpen && "opacity-0")}>
        Ask ZYREX AI
      </div>
    </>
  );
}
