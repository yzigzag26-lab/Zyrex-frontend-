import { useState } from "react";
import { Icon } from "../ui/Icons";

/**
 * Copy + regenerate controls for a ZYREX message.
 * Regenerate stays disabled until an AI backend is connected.
 */
export function MessageActions({ text, canRegenerate = false }: { text: string; canRegenerate?: boolean }) {
  const [copied, setCopied] = useState(false);

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
        disabled
        title={canRegenerate ? "Regenerate response" : "Connect the AI backend to enable regeneration"}
        className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-muted/60"
      >
        <Icon name="refresh" size={13} />
        Regenerate
      </button>
    </div>
  );
}
