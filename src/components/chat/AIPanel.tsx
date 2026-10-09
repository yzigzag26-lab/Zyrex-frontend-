import { useState } from "react";
import { aiModes } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import type { ChatMessage, ConnectionState } from "../../types";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icons";
import { Markdown } from "./Markdown";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Status dot / label colours for the live backend state. */
const statusColors: Record<ConnectionState, { dot: string; text: string }> = {
  connected: { dot: "#34d399", text: "#8de8c7" },
  connecting: { dot: "#fbbf24", text: "#fcd34d" },
  error: { dot: "#ff6b6b", text: "#ffb3b3" },
  disconnected: { dot: "#9b8471", text: "#9b8471" },
};

/**
 * Flatten a ZYREX response into Markdown for the compact panel.
 * The panel shows the answer itself — not just its title.
 */
function answerToText(message: ChatMessage): string {
  if (message.kind === "offline") return message.title ?? "ZYREX AI is unavailable right now.";

  const parts: string[] = [];
  if (message.title) parts.push(`**${message.title}**`);

  for (const block of message.blocks ?? []) {
    switch (block.type) {
      case "summary":
      case "observation":
      case "note":
        parts.push(block.text);
        break;
      case "metrics":
        parts.push(block.rows.map((row) => `- **${row.label}:** ${row.value}`).join("\n"));
        break;
      case "risk":
        parts.push(
          block.items.map((item) => `- **${item.label}:** ${item.value} — ${item.detail}`).join("\n"),
        );
        break;
      case "psychology":
        parts.push(
          block.findings
            .map((f) => `- **${f.emotion}:** ${f.trades} trades, ${f.winRate}% win rate, ${f.avgR}R`)
            .join("\n"),
        );
        break;
      case "pattern":
        parts.push(`**${block.insight.title}**\n\n${block.insight.statement}`);
        break;
      case "actions":
        parts.push(block.items.map((item, index) => `${index + 1}. ${item}`).join("\n"));
        break;
      case "trades":
        if (block.tradeIds.length > 0) parts.push(`Trades: ${block.tradeIds.join(", ")}`);
        break;
    }
  }

  return parts.filter(Boolean).join("\n\n");
}

export function AIPanel({ isOpen, onClose }: AIPanelProps) {
  const {
    mode,
    setMode,
    sendMessage,
    phase,
    activeConversation,
    aiStatus,
    aiStatusDetail,
    aiStatusLabel,
  } = useZyrex();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  if (!isOpen) return null;

  const displayMessages = activeConversation?.messages || [];

  return (
    <div
      className="ai-panel w-[min(370px,calc(100vw-40px))] max-h-[min(560px,calc(100vh-140px))] flex flex-col origin-bottom-right rounded-[22px] border border-[var(--ai-line)] overflow-hidden"
      style={{
        color: "var(--ai-ink)",
        background: "linear-gradient(180deg, var(--ai-panel-1), var(--ai-panel-2))",
        backdropFilter: "blur(22px) saturate(1.3)",
        WebkitBackdropFilter: "blur(22px) saturate(1.3)",
        boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgb(var(--ai-glow) / 0.18)",
      }}
    >
      {/* Header */}
      <div
        className="ai-head flex items-center gap-3 px-4 py-3.5 border-b border-[var(--ai-line)]"
        style={{
          background: "linear-gradient(90deg, rgb(255 159 28 / 0.22), rgb(255 106 0 / 0.16) 55%, rgb(255 61 94 / 0.12))",
        }}
      >
        <div
          className="ai-orb size-8.5 rounded-xl grid place-items-center text-white"
          style={{
            background: "var(--ai-grad)",
            boxShadow: "0 6px 16px -4px rgb(var(--ai-glow) / 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
            animation: "ai-breathe 4s ease-in-out infinite",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
            <path d="M12 3v3M12 18v3M4.2 7.2l2.1 2.1M17.7 14.7l2.1 2.1M3 12h3M18 12h3M4.2 16.8l2.1-2.1M17.7 9.3l2.1-2.1"/>
            <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>
          </svg>
        </div>

        <div className="ai-head-text min-w-0">
          <h2 className="m-0 text-[14.5px] font-bold tracking-tight" style={{ color: "var(--ai-ink)" }}>
            ZYREX AI
          </h2>
          <div
            className="ai-status flex items-center gap-1.5 mt-0.5 text-[11.5px]"
            style={{ color: statusColors[aiStatus].text }}
            title={aiStatusDetail}
          >
            <i
              className={cn(
                "size-1.5 rounded-full",
                aiStatus === "connected" && "animate-blink",
              )}
              style={{
                background: statusColors[aiStatus].dot,
                boxShadow: `0 0 8px ${statusColors[aiStatus].dot}`,
              }}
            />
            <span>{aiStatusLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ai-close ml-auto size-7.5 rounded-xl border border-[var(--ai-line)] bg-[rgba(255,255,255,0.06)] cursor-pointer grid place-items-center transition-all"
          style={{ color: "var(--ai-muted)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-3.5">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>
      </div>

      {/* Mode Switch */}
      <div className="ai-actions flex gap-2 px-3.5 py-3 overflow-x-auto">
        {aiModes.map((aiMode) => (
          <button
            key={aiMode.id}
            type="button"
            onClick={() => setMode(aiMode.id)}
            className={cn(
              "ai-chip flex-none inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-full cursor-pointer border transition-all",
              mode.id === aiMode.id
                ? "border-[rgb(255_159_28/0.65)] bg-[linear-gradient(180deg,rgb(255_159_28/0.2),rgb(255_106_0/0.14))]"
                : "border-[var(--ai-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))]",
            )}
            style={{ color: "var(--ai-ink)" }}
          >
            <Icon name={aiMode.icon} size={14} style={{ color: "var(--ai-1)" }} />
            {aiMode.name}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="ai-log flex flex-col gap-2.5 p-3.5 overflow-y-auto">
        {displayMessages.length === 0 ? (
          <div className="ai-bubble bot text-[13.2px] leading-relaxed max-w-[88%] px-3 py-2.5 rounded-[14px] self-start" style={{
            color: "#f0e6dc",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid var(--ai-line)",
            borderBottomLeftRadius: "5px",
          }}>
            Hi! I'm ZYREX AI. How can I help you with your trading today?
          </div>
        ) : (
          displayMessages.map((message) =>
            message.role === "user" ? (
              <div
                key={message.id}
                className="ai-bubble text-[13.2px] leading-relaxed max-w-[88%] px-3 py-2.5 rounded-[14px] user self-end"
                style={{
                  color: "#fff6ec",
                  background:
                    "linear-gradient(135deg, rgb(255 106 0 / 0.6), rgb(255 61 94 / 0.42))",
                  border: "1px solid var(--ai-line)",
                  borderBottomRightRadius: "5px",
                  borderBottomLeftRadius: "14px",
                }}
              >
                {message.text}
              </div>
            ) : (
              <div
                key={message.id}
                className="ai-bubble text-[13.2px] leading-relaxed max-w-[96%] px-3 py-2.5 rounded-[14px] bot self-start"
                style={{
                  color: "#f0e6dc",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--ai-line)",
                  borderBottomRightRadius: "14px",
                  borderBottomLeftRadius: "5px",
                }}
              >
                <Markdown>{answerToText(message)}</Markdown>
              </div>
            ),
          )
        )}
        {phase === "thinking" && (
          <div className="ai-typing flex gap-1 self-start px-3 py-3" style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid var(--ai-line)",
            borderRadius: "14px",
            borderBottomLeftRadius: "5px",
          }}>
            <span className="size-1.5 rounded-full bg-[var(--ai-2)] animate-dot" />
            <span className="size-1.5 rounded-full bg-[var(--ai-2)] animate-dot" style={{ animationDelay: "0.15s" }} />
            <span className="size-1.5 rounded-full bg-[var(--ai-2)] animate-dot" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
      </div>

      {/* Input form */}
      <div className="ai-form flex items-center gap-2 px-3 py-2.5 border-t border-[var(--ai-line)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask ZYREX AI..."
          className="ai-input flex-1 min-w-0 text-[13.5px] px-3.5 py-3 rounded-[13px] outline-none transition-all"
          style={{
            color: "var(--ai-ink)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid var(--ai-line)",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || phase === "thinking"}
          className="ai-send size-11 rounded-none cursor-pointer grid place-items-center transition-all text-white"
          style={{
            background: "var(--ai-grad)",
            boxShadow: "0 8px 20px -6px rgb(var(--ai-glow) / 0.9)",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[19px]">
            <path d="M4 12l16-8-6 16-3-6z"/>
          </svg>
        </button>
      </div>

      <div className="ai-foot px-3.5 py-3 text-[11px]" style={{ color: "#9b8471" }}>
        ZYREX AI provides analysis based on available trading data.
      </div>
    </div>
  );
}
