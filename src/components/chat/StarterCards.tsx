import { starterCards } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icons";

/**
 * Suggested prompts. Each card states the integration it needs — sending one
 * while disconnected returns the connection notice rather than an answer.
 */
export function StarterCards() {
  const { sendMessage } = useZyrex();

  return (
    <div className="z-stagger grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3 mt-6">
      {starterCards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => sendMessage(card.prompt)}
          className={cn(
            "group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface/80 p-3.5 text-left transition-all duration-300",
            "hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface2 hover:shadow-[0_16px_36px_-24px_rgba(234,88,12,0.55)]",
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2 text-base">
            {card.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[0.8125rem] font-semibold text-ink">{card.title}</span>
            </span>
            <span className="mt-1 block text-[11.5px] leading-relaxed text-ink2">{card.prompt}</span>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-1.5 py-0.5 text-[9.5px] font-medium tracking-wide text-muted uppercase">
              <Icon name="info" size={10} />
              Requires {card.requires === "ai" ? "AI backend" : "trade data"}
            </span>
          </span>
          <Icon
            name="arrowRight"
            size={14}
            className="mt-1 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
          />
        </button>
      ))}
    </div>
  );
}
