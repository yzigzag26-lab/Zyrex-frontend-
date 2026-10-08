import { aiModes, emptyCopy } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icons";

/** Conversation history — empty until the user starts a session. */
export function ChatHistory() {
  const { conversations, activeConversationId, selectConversation, deleteConversation, startNewConversation } =
    useZyrex();

  return (
    <div className="z-scroll min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface/85 px-1.5 py-2 backdrop-blur-sm">
        <span className="z-eyebrow">Recent</span>
        <span className="z-num text-[10px] text-muted">{conversations.length}</span>
      </div>

      {conversations.length === 0 ? (
        <div className="mt-1 rounded-xl border border-dashed border-line bg-surface2/30 px-3 py-5 text-center">
          <p className="text-[11.5px] font-semibold text-ink2">{emptyCopy.conversation.title}</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{emptyCopy.conversation.hint}</p>
          <button
            type="button"
            onClick={startNewConversation}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface2 px-2.5 py-1.5 text-[10.5px] font-medium text-ink2 transition-colors hover:text-ink"
          >
            <Icon name="plus" size={12} />
            Start a session
          </button>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const mode = aiModes.find((m) => m.id === conversation.mode);
            return (
              <li key={conversation.id} className="group/item relative">
                <button
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 pr-8 text-left transition-colors",
                    isActive
                      ? "bg-accent/10 text-ink ring-1 ring-accent/25"
                      : "text-ink2 hover:bg-surface2 hover:text-ink",
                  )}
                >
                  <Icon
                    name={mode?.icon === "brain" ? "brain" : mode?.icon === "search" ? "search" : "chart"}
                    size={14}
                    className={isActive ? "text-accent" : "text-muted"}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium">{conversation.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted">
                      {conversation.messages.length} msg · {conversation.updatedAt}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${conversation.title}`}
                  title="Remove conversation"
                  onClick={() => deleteConversation(conversation.id)}
                  className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted opacity-0 transition-all hover:bg-neg/10 hover:text-neg focus-visible:opacity-100 group-hover/item:opacity-100"
                >
                  <Icon name="trash" size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
