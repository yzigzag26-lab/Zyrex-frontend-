import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Icon, type IconName } from "../ui/Icons";

export interface MetricTileProps {
  label: string;
  value?: string;
  hint?: string;
  tone?: "pos" | "neg" | "warn" | "neutral";
  icon?: IconName;
  trend?: number[];
  /** When true the tile reports that no value exists yet. */
  empty?: boolean;
  emptyHint?: string;
  className?: string;
}

/**
 * A single metric tile.
 * With no data it renders an em dash and states why — it never shows a
 * placeholder number.
 */
export function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
  empty,
  emptyHint = "Import trades to begin analysis",
  className,
}: MetricTileProps) {
  const valueTone =
    tone === "pos"
      ? "text-pos"
      : tone === "neg"
        ? "text-neg"
        : tone === "warn"
          ? "text-warn"
          : "text-ink";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-surface/80 p-3.5 transition-all duration-300 hover:border-linestrong hover:bg-surface2",
        empty && "border-dashed",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10.5px] leading-tight font-semibold tracking-wider text-muted uppercase">
          {label}
        </span>
        {icon && <Icon name={icon} size={14} className={empty ? "text-muted/60" : "text-muted"} />}
      </div>

      <div
        className={cn(
          "z-num mt-2 text-[1.375rem] leading-none font-semibold sm:text-2xl",
          empty ? "text-muted" : valueTone,
        )}
      >
        {empty ? "—" : value}
      </div>

      <div
        className={cn(
          "mt-1.5 text-[11px] leading-relaxed",
          empty ? "text-muted" : "text-ink2",
        )}
      >
        {empty ? <span className="font-medium">No data available</span> : hint}
      </div>

      {empty && (
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted/80">{emptyHint}</p>
      )}
    </div>
  );
}

/** Simple label / value row used inside cards and AI responses. */
export function MetricRowItem({
  label,
  value,
  tone = "neutral",
  hint,
  children,
}: {
  label: string;
  value?: string;
  tone?: "pos" | "neg" | "warn" | "neutral";
  hint?: string;
  children?: ReactNode;
}) {
  const valueTone =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 py-2 last:border-0">
      <span className="min-w-0 text-[12.5px] text-ink2">
        {label}
        {hint && <span className="ml-1.5 text-[10px] text-muted">{hint}</span>}
      </span>
      <span className={cn("z-num shrink-0 text-[12.5px] font-semibold", valueTone)}>
        {value ?? children}
      </span>
    </div>
  );
}
