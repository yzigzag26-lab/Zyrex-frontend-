import { useState } from "react";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icons";

interface ResponseActionsProps {
  text: string;
}

/** Copy / regenerate controls attached to every ZYREX response. */
export function ResponseActions({ text }: ResponseActionsProps) {
  const { regenerate, phase } = useZyrex();
  const [copied, setCopied] = useState(false);
  const busy = phase === "thinking";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable — fall through to the confirmation state */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-ink"
      >
        <Icon name={copied ? "check" : "copy"} size={13} className={copied ? "text-pos" : undefined} />
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={regenerate}
        disabled={busy}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-surface2 hover:text-ink disabled:opacity-40"
      >
        <Icon name="refresh" size={13} />
        Regenerate
      </button>
      <span
        className={cn(
          "ml-1 hidden items-center gap-1.5 rounded-md border border-line px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wider text-muted uppercase sm:inline-flex",
        )}
      >
        Mock
      </span>
    </div>
  );
}
