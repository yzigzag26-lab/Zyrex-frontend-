import { useEffect, useId, useRef, useState } from "react";
import { product } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { ZyrexLogo, type CoreState } from "../brand/ZyrexLogo";
import { Icon } from "../ui/Icons";

const MAX_HEIGHT = 168;

type GlowState = "idle" | "typing" | "focused" | "connecting" | "thinking" | "disabled";

/**
 * The ZYREX prompt.
 *
 * The signature glow reacts to interaction and to the connection phase.
 * While the AI backend is offline the input stays usable — submitting a prompt
 * reports the connection status rather than inventing an answer.
 */
export function PromptInput({ autoFocus = false }: { autoFocus?: boolean }) {
  const { sendMessage, stopGeneration, phase, mode } = useZyrex();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hintTimer = useRef<number | null>(null);
  const inputId = useId();

  const busy = phase === "connecting" || phase === "thinking";
  const hasText = value.trim().length > 0;

  const glowState: GlowState = phase === "thinking"
    ? "thinking"
    : phase === "connecting"
      ? "connecting"
      : hasText
        ? "typing"
        : focused
          ? "focused"
          : "idle";

  const coreState: CoreState = busy ? "thinking" : focused || hasText ? "responding" : "idle";

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(min-width: 768px)").matches) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (hint === null) return;
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 2600);
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, [hint]);

  const submit = () => {
    if (!hasText || busy) return;
    sendMessage(value);
    setValue("");
    setListening(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const showHint = (message: string) => setHint(`${message} · frontend placeholder`);

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface2/70 px-2.5 py-1 text-[10.5px] font-medium text-ink2">
          <span className="size-1.5 rounded-full bg-muted" />
          {product.offlineTitle}
        </span>
        <span className="text-[10.5px] text-muted">{product.offlineDetail}</span>
      </div>

      <div
        className="z-glow-states mx-auto w-full max-w-3xl rounded-[27px]"
        data-state={glowState}
      >
        <div className="relative m-[1px] rounded-[25px] border border-line bg-[#1e1e24] shadow-lg backdrop-blur-xl focus-within:ring-1 focus-within:ring-accent/40">
          <div className="flex items-end gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
            <span className="mb-1 shrink-0 pl-0.5" aria-hidden="true">
              <ZyrexLogo size={24} state={coreState} orbit={false} />
            </span>

            <label htmlFor={inputId} className="sr-only">
              Ask ZYREX about your trading
            </label>
            <textarea
              id={inputId}
              ref={textareaRef}
              rows={1}
              value={value}
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={
                busy ? "Contacting ZYREX AI…" : `Ask ${mode.name} anything about your trading…`
              }
              className="z-scroll max-h-[168px] min-h-[40px] w-full flex-1 resize-none bg-transparent px-1.5 py-2 text-[0.875rem] leading-relaxed text-ink placeholder:text-muted focus:outline-none disabled:opacity-60 sm:text-sm"
              style={{ overflowY: value.length > 90 ? "auto" : "hidden" }}
            />

            <div className="flex shrink-0 items-center gap-0.5 pb-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => showHint("Attachment")}
                aria-label="Attach trade evidence (placeholder)"
                title="Attach trade evidence (placeholder)"
                className="grid size-9 place-items-center rounded-xl text-ink2 transition-colors hover:bg-surface2 hover:text-ink"
              >
                <Icon name="paperclip" size={17} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setListening((prev) => !prev);
                  showHint(listening ? "Microphone stopped" : "Voice capture");
                }}
                aria-label="Voice input (placeholder)"
                aria-pressed={listening}
                title="Voice input (placeholder)"
                className={cn(
                  "grid size-9 place-items-center rounded-xl transition-colors",
                  listening
                    ? "bg-neg/15 text-neg ring-1 ring-neg/30"
                    : "text-ink2 hover:bg-surface2 hover:text-ink",
                )}
              >
                <Icon name="mic" size={17} className={listening ? "z-core-thinking" : undefined} />
              </button>
              {busy ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  aria-label="Stop generating"
                  title="Stop"
                  className="ml-0.5 grid size-10 place-items-center rounded-full bg-blue text-white transition-all duration-300 hover:opacity-90 active:scale-95"
                >
                  <Icon name="stop" size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!hasText}
                  aria-label="Send message to ZYREX"
                  title="Send"
                  className={cn(
                    "ml-0.5 grid size-10 place-items-center rounded-full transition-all duration-300 active:scale-95",
                    hasText
                      ? "bg-blue text-white shadow-sm hover:opacity-90"
                      : "cursor-not-allowed bg-surface3 text-muted",
                  )}
                >
                  <Icon name="arrowUp" size={18} />
                </button>
              )}
            </div>
          </div>

          {(hint || listening) && (
            <div className="z-fade flex items-center gap-2 border-t border-line px-4 py-2 text-[11px] text-ink2">
              <Icon name="info" size={12} className="text-accent" />
              {listening
                ? "Listening simulation active — no microphone access requested."
                : hint}
            </div>
          )}
        </div>
      </div>

      <p className="mx-auto mt-2.5 max-w-3xl px-2 text-center text-[10.5px] leading-relaxed text-muted">
        {product.disclaimer}
      </p>
    </div>
  );
}
