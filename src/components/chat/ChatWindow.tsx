import { useEffect, useRef } from "react";
import { emptyCopy, product } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import { ZyrexLogo } from "../brand/ZyrexLogo";
import { Badge, Button, IconButton } from "../ui/Controls";
import { ConnectionPill } from "../ui/EmptyStates";
import { Icon } from "../ui/Icons";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { PromptInput } from "./PromptInput";
import { StarterCards } from "./StarterCards";
import { UserMessage } from "./UserMessage";
import { ZyrexMessage } from "./ZyrexMessage";

/** Empty chat state — ZYREX introduces itself and reports its real status. */
function HeroState() {
  return (
    <div className="flex flex-col items-center py-4 text-center sm:py-10">
      <div className="relative">
        <span className="absolute inset-0 -z-10 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        <ZyrexLogo size={64} orbit state="off" />
      </div>
      <h1 className="mt-6 max-w-xl text-balance text-xl leading-snug font-semibold text-ink sm:text-[1.75rem] sm:leading-tight">
        How can I help you understand your trading?
      </h1>
      <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-ink2 sm:text-sm">
        Analyze your performance, risk, psychology, patterns and trading history.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Badge tone="accent" icon="spark">
          {product.name}
        </Badge>
        <ConnectionPill state="connected" label="Groq Ready" />
      </div>

      <div className="mt-8 w-full">
        <p className="z-eyebrow mb-3 text-left sm:text-center">Suggested prompts</p>
        <StarterCards />
      </div>
    </div>
  );
}

export function ChatWindow() {
  const {
    activeConversation,
    phase,
    clearActiveConversation,
    startNewConversation,
    hasTradeData,
    mode,
  } = useZyrex();

  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length, phase]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-elev/60 px-3 py-2.5 backdrop-blur sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon name="spark" size={15} className="shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-semibold text-ink">
              {hasMessages ? activeConversation?.title : "ZYREX AI Session"}
            </p>
            <p className="truncate text-[10.5px] text-muted">
              {mode.name}
              {hasMessages ? ` · ${messages.length} messages` : " · No session active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ConnectionPill state="connected" label="Groq" className="hidden sm:inline-flex" />
          <IconButton
            name="trash"
            label="Clear conversation"
            tone="danger"
            onClick={clearActiveConversation}
            disabled={!hasMessages}
          />
          <Button size="xs" variant="subtle" icon="plus" onClick={startNewConversation}>
            <span className="hidden sm:inline">New session</span>
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="z-scroll relative min-h-0 flex-1 overflow-y-auto">
        <div
          className="z-aurora pointer-events-none absolute inset-x-0 top-0 h-72 opacity-40"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-3xl px-3 py-5 sm:px-5 sm:py-8">
          {hasMessages ? (
            <div className="space-y-7">
              {messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <ZyrexMessage key={message.id} message={message} />
                ),
              )}
              {phase === "connecting" && <ConnectionIndicator />}
            </div>
          ) : (
            <>
              <HeroState />
              {phase === "connecting" && <ConnectionIndicator />}
              {!hasTradeData && (
                <p className="mt-6 text-center text-[10.5px] leading-relaxed text-muted">
                  {emptyCopy.journal.title} — {emptyCopy.journal.hint}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className="border-t border-line bg-elev/70 px-3 pt-3 backdrop-blur-xl sm:px-5"
        style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
      >
        <PromptInput />
      </div>
    </div>
  );
}
