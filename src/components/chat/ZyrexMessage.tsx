import type { ChatMessage } from "../../types";
import { HermesLogo } from "../brand/HermesLogo";
import { Markdown } from "./Markdown";
import { ResponseActions } from "./ResponseActions";
import { useZyrex } from "../../store/ZyrexProvider";
import { responseToText } from "../../utils/responseText";

export function ZyrexMessage({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const { sendMessage, isStreaming, generationActivity } = useZyrex();
  const text =
    message.text ||
    (message.blocks && message.blocks.length > 0
      ? message.blocks
          .map((block) => ("text" in block ? block.text : ""))
          .filter(Boolean)
          .join("\n\n")
      : message.title) ||
    "";

  const copyText = text || responseToText(message.title ?? "HERMES Analysis", message.blocks ?? []);
  const showOffline = message.kind === "offline";
  const showCancelled = message.kind === "cancelled";

  return (
    <div className="flex w-full items-start gap-3">
      <HermesLogo size={28} rounded="full" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {showOffline ? (
          <div className="rounded-xl border border-neg/30 bg-neg/5 px-3 py-2 text-sm text-neg">
            {message.title || "The AI service could not complete this request."}
          </div>
        ) : showCancelled && !text ? (
          <p className="text-sm text-muted">Generation cancelled.</p>
        ) : (
          <div className="ai-reply text-[15px] leading-relaxed text-ink">
            {text ? (
              <Markdown>{text}</Markdown>
            ) : streaming ? (
              <span className="inline-flex items-center gap-2 text-muted" aria-live="polite">
                <span className="hermes-stream-dot" />
                <span className="animate-pulse">{generationActivity ?? "Thinking…"}</span>
              </span>
            ) : null}
          </div>
        )}

        {streaming && text && (
          <span className="mt-2 inline-flex items-center gap-2 text-[12px] text-blue" aria-live="polite">
            <span className="hermes-stream-dot" />
            <span className={generationActivity ? "animate-pulse" : undefined}>
              {generationActivity ?? "Generating…"}
            </span>
          </span>
        )}

        {message.options && message.options.length > 0 && !streaming && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={isStreaming}
                onClick={() => sendMessage(option.label)}
                className="rounded-full border border-line bg-surface2 px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-blue/50 hover:bg-surface3"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {!streaming && text && <div className="mt-2"><ResponseActions text={copyText} /></div>}
      </div>
    </div>
  );
}
