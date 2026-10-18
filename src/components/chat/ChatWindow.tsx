import { useEffect, useRef, useState } from "react";
import { useZyrex } from "../../store/ZyrexProvider";
import { HermesLogo } from "../brand/HermesLogo";
import { Icon } from "../ui/Icons";
import { Popover } from "../ui/Popover";
import { ConnectionPill } from "../ui/EmptyStates";
import { Composer } from "./Composer";
import { UserMessage } from "./UserMessage";
import { ZyrexMessage } from "./ZyrexMessage";
import { Dialog } from "../ui/Dialog";

export function ChatWindow() {
  const {
    activeConversation,
    messages,
    isStreaming,
    generationState,
    startNewConversation,
    shareConversation,
    togglePin,
    addActiveToJournal,
    setFeedback,
    aiStatus,
    aiStatusLabel,
    isMobile,
    setSidebarOpen,
  } = useZyrex();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalTitle, setJournalTitle] = useState("");
  const [menuNotice, setMenuNotice] = useState<string | null>(null);

  const hasMessages = messages.length > 0;
  const last = messages[messages.length - 1];
  const streamingLast =
    isStreaming && last?.role !== "user" && (generationState === "processing" || generationState === "streaming");

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {isMobile && (
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="grid size-9 place-items-center rounded-lg text-ink2 hover:bg-surface2 hover:text-ink"
            >
              <Icon name="menu" size={18} />
            </button>
          )}
          <h1 className="truncate text-sm font-semibold text-ink">
            {hasMessages ? activeConversation?.title : "HERMES AI"}
          </h1>
          {activeConversation?.pinned && <Icon name="pin" size={12} className="text-gold" />}
        </div>
        <div className="flex items-center gap-1.5">
          <ConnectionPill state={aiStatus} label={aiStatusLabel} className="hidden sm:inline-flex" />
          <Popover
            label="Conversation actions"
            widthClass="w-56"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                aria-label="Conversation menu"
                aria-expanded={open}
                onClick={toggle}
                className="grid size-9 place-items-center rounded-full border border-line text-ink2 hover:bg-surface2 hover:text-ink"
              >
                <Icon name="moreH" size={16} />
              </button>
            )}
          >
            {({ close }) => (
              <div className="py-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-surface2"
                  onClick={() => {
                    const result = shareConversation();
                    setMenuNotice(result.message);
                    setFeedback(result);
                    close();
                  }}
                >
                  <Icon name="share" size={14} />
                  Share
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-surface2"
                  onClick={() => {
                    if (activeConversation) togglePin(activeConversation.id);
                    close();
                  }}
                  disabled={!activeConversation}
                >
                  <Icon name="pin" size={14} />
                  {activeConversation?.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-surface2"
                  onClick={() => {
                    setJournalTitle(activeConversation?.title ?? "");
                    setJournalOpen(true);
                    close();
                  }}
                >
                  <Icon name="book" size={14} />
                  Add to Journal
                </button>
              </div>
            )}
          </Popover>
          <button
            type="button"
            onClick={startNewConversation}
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink hover:bg-surface2 sm:inline-flex"
          >
            <Icon name="plus" size={12} />
            New
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="z-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {hasMessages ? (
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.map((message, index) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <UserMessage message={message} />
                ) : (
                  <ZyrexMessage
                    message={message}
                    streaming={streamingLast && index === messages.length - 1}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex h-full min-h-[280px] w-full max-w-3xl flex-col items-center justify-center text-center">
            <HermesLogo size={64} />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink">HERMES AI</h2>
            <p className="mt-2 max-w-md text-sm text-ink2">
              Private trading intelligence. Ask about structure, risk, or discipline — answers stream from the
              connected AI service.
            </p>
          </div>
        )}
      </div>

      {menuNotice && (
        <p className="px-4 pb-1 text-center text-[11px] text-muted" role="status">
          {menuNotice}
        </p>
      )}

      <Composer />

      <Dialog open={journalOpen} title="Add to Journal" onClose={() => setJournalOpen(false)}>
        <div className="p-5">
          <h3 className="text-base font-semibold text-ink">Add to Journal</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-ink2">
            Saves this conversation as an AI analysis. This is not an executed trade.
          </p>
          <label className="mt-4 block text-[12px] font-medium text-ink2" htmlFor="journal-title">
            Title
          </label>
          <input
            id="journal-title"
            value={journalTitle}
            onChange={(e) => setJournalTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setJournalOpen(false)}
              className="h-9 rounded-lg px-3 text-xs font-medium text-ink2 hover:bg-surface2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const result = addActiveToJournal(journalTitle);
                setFeedback(result);
                setMenuNotice(result.message);
                setJournalOpen(false);
              }}
              className="h-9 rounded-lg bg-gold px-3 text-xs font-semibold text-accentink"
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
