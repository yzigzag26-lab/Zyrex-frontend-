import { useEffect, useRef, useState, useId } from "react";
import { useZyrex } from "../../store/ZyrexProvider";
import { Icon } from "../ui/Icons";
import { UserMessage } from "./UserMessage";
import { ZyrexMessage } from "./ZyrexMessage";

export function ChatWindow() {
  const {
    activeConversation,
    messages,
    sendMessage,
    isStreaming,
    startNewConversation,
  } = useZyrex();

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [input]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length, isStreaming]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#212121] text-white overflow-hidden">
      {/* Top Bar inside Chat View */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f] bg-[#171717] text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">
            {hasMessages ? activeConversation?.title : "ZYREX AI"}
          </span>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2f2f2f] hover:bg-[#383838] text-white border border-[#424242] transition-colors"
        >
          + New chat
        </button>
      </div>

      {/* Center Column Timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 w-full text-white"
      >
        {hasMessages ? (
          <div className="space-y-6 w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className="w-full max-w-2xl md:max-w-3xl mx-auto flex gap-4 items-start text-white"
              >
                {message.role === "user" ? (
                  <UserMessage message={message} />
                ) : (
                  <ZyrexMessage message={message} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full max-w-2xl md:max-w-3xl mx-auto flex flex-col items-center justify-center h-full min-h-[340px] text-center text-white">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Welcom linkuxboss
            </h1>
            <p className="text-sm text-[#b4b4b4]">
              Ask ZYREX AI anything about your trading, risk, psychology, or market setups.
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Blue Circling Indicator */}
      {isStreaming && (
        <div className="py-2.5 flex items-center justify-center shrink-0">
          <div className="w-3 h-3 bg-[#007bff] rounded-full animate-pulse shadow-[0_0_12px_rgba(0,123,255,0.8)]" />
        </div>
      )}

      {/* Bottom Chat Console */}
      <div className="p-4 bg-[#212121] shrink-0">
        <div className="max-w-2xl md:max-w-3xl mx-auto relative flex items-center bg-[#2f2f2f] rounded-2xl border border-[#424242] shadow-sm px-3 py-2">
          <label htmlFor={inputId} className="sr-only">
            Send a message to ZYREX
          </label>
          <textarea
            id={inputId}
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isStreaming}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Message ZYREX..."
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-white placeholder-[#b4b4b4] focus:outline-none max-h-[168px] min-h-[24px]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            className="p-1.5 rounded-xl bg-white text-[#212121] hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 ml-2"
          >
            <Icon name="arrowUp" size={16} />
          </button>
        </div>
        <p className="text-[11px] text-center text-[#8e8e8e] mt-2">
          ZYREX AI can make mistakes. Verify important financial analysis.
        </p>
      </div>
    </div>
  );
}
