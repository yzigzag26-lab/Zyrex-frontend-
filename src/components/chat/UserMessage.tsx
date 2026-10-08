import { workspace } from "../../data/appConfig";
import type { ChatMessage } from "../../types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <article className="z-rise flex justify-end gap-3" aria-label="Your message">
      <div className="min-w-0 max-w-[min(42rem,88%)]">
        <div className="rounded-2xl rounded-tr-md border border-line bg-surface2 px-3.5 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink">{message.text}</p>
        </div>
        <p className="mt-1 pr-1 text-right text-[10px] text-muted">
          {workspace.name} · {formatTime(message.createdAt)}
        </p>
      </div>
      <span className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 text-[11px] font-bold text-white sm:grid">
        {workspace.initials}
      </span>
    </article>
  );
}
