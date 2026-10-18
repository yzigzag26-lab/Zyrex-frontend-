import { useState } from "react";
import { useZyrex } from "../../store/ZyrexProvider";
import { Icon } from "../ui/Icons";

interface ResponseActionsProps {
  text: string;
}

export function ResponseActions({ text }: ResponseActionsProps) {
  const { regenerate, phase } = useZyrex();
  const [copied, setCopied] = useState(false);
  const busy = phase === "thinking" || phase === "connecting";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
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
    </div>
  );
}
