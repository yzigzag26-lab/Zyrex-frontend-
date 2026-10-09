import { useEffect, useRef } from "react";
import { aiModes } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { ZyrexLogo } from "../brand/ZyrexLogo";
import { Icon } from "../ui/Icons";
import { PromptInput } from "./PromptInput";
import { AIMessage } from "./AIMessage";
import { UserMessage } from "./UserMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { StarterCards } from "./StarterCards";

interface AIPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIPopup({ isOpen, onClose }: AIPopupProps) {
  const { mode, setMode, messages, phase } = useZyrex();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const displayMessages = messages;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ZYREX AI Assistant"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl sm:h-[700px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <ZyrexLogo size={28} state={phase === "idle" ? "idle" : "thinking"} />
            <div>
              <h2 className="text-sm font-semibold text-ink">ZYREX AI</h2>
              <p className="text-[11px] text-muted">Trading Intelligence</p>
            </div>
          </div>

          {/* Mode Switch */}
          <div className="flex items-center gap-1 rounded-lg bg-surface2 p-1">
            {aiModes.map((aiMode) => (
              <button
                key={aiMode.id}
                type="button"
                onClick={() => setMode(aiMode.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  mode.id === aiMode.id
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink2 hover:text-ink",
                )}
              >
                <Icon name={aiMode.icon} size={14} />
                {aiMode.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="grid size-8 place-items-center rounded-lg text-ink2 transition-colors hover:bg-surface2 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {displayMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <ZyrexLogo size={48} state="idle" />
                <h3 className="mt-4 text-lg font-semibold text-ink">Ask ZYREX AI</h3>
                <p className="mt-2 text-sm text-ink2">
                  {mode.tagline}
                </p>
                <StarterCards />
              </div>
            ) : (
              <div className="space-y-4">
                {displayMessages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id} message={message} />
                  ) : (
                    <AIMessage key={message.id} message={message} />
                  )
                )}
                {phase === "thinking" && <ThinkingIndicator />}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-line bg-surface p-4 sm:p-6">
            <PromptInput autoFocus={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
