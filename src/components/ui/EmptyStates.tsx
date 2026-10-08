import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Icon, type IconName } from "./Icons";

/**
 * Shared "awaiting data" surfaces.
 *
 * These are used everywhere a number, chart, list or table would normally
 * appear. They never render placeholder values.
 */

/* ----------------------------------------------------------- generic block */

interface DataUnavailableProps {
  title: string;
  hint?: string;
  icon?: IconName;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Compact inline variant for use inside cards and lists. */
  inline?: boolean;
}

export function DataUnavailable({
  title,
  hint,
  icon = "info",
  action,
  size = "md",
  className,
  inline,
}: DataUnavailableProps) {
  const iconSize = size === "lg" ? 22 : size === "sm" ? 16 : 18;
  const titleSize =
    size === "lg"
      ? "text-base sm:text-lg"
      : size === "sm"
        ? "text-[11.5px]"
        : "text-[13px] sm:text-sm";

  if (inline) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface2/40 px-3 py-4 text-center",
          className,
        )}
      >
        <Icon name={icon} size={14} className="shrink-0 text-muted" />
        <span className="text-[11.5px] font-medium text-ink2">{title}</span>
        {hint && <span className="text-[11px] text-muted">· {hint}</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-5 text-center",
        size === "lg" ? "py-12 sm:py-16" : size === "sm" ? "py-6" : "py-9",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-2xl border border-dashed border-line bg-surface2/50 text-muted",
          size === "lg" ? "size-14" : size === "sm" ? "size-9" : "size-11",
        )}
      >
        <Icon name={icon} size={iconSize} />
      </span>
      <h4 className={cn("mt-4 font-semibold text-ink", titleSize)}>{title}</h4>
      {hint && (
        <p className="mt-1.5 max-w-sm text-[11.5px] leading-relaxed text-ink2 sm:text-xs">{hint}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------- chart placeholder */

interface ChartPlaceholderProps {
  title: string;
  hint?: string;
  height?: number;
  icon?: IconName;
  className?: string;
  /** Draw axis ticks to suggest the chart's future shape. */
  axes?: boolean;
}

export function ChartPlaceholder({
  title,
  hint,
  height = 220,
  icon = "chart",
  className,
  axes = true,
}: ChartPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-dashed border-line bg-surface2/30",
        className,
      )}
      style={{ height }}
      role="status"
      aria-label={`${title}${hint ? ` — ${hint}` : ""}`}
    >
      <div className="absolute inset-0 z-grid-bg opacity-50" aria-hidden="true" />

      {axes && (
        <>
          <span
            className="absolute top-1/2 right-3 left-3 border-t border-dashed border-linestrong"
            aria-hidden="true"
          />
          <span
            className="absolute top-3 bottom-3 left-1/2 border-l border-dashed border-linestrong"
            aria-hidden="true"
          />
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="absolute rounded-full bg-muted/30"
              style={{
                width: 4,
                height: 4,
                left: `${14 + index * 22}%`,
                top: `${28 + (index % 3) * 18}%`,
              }}
              aria-hidden="true"
            />
          ))}
        </>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <Icon name={icon} size={16} className="text-muted" />
        <p className="text-[11.5px] font-semibold text-ink2">{title}</p>
        {hint && <p className="max-w-[16rem] text-[10.5px] leading-relaxed text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ list placeholder */

/** Repeating skeleton rows used where a list will eventually render. */
export function ListPlaceholder({
  rows = 4,
  label = "No entries yet",
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-label={label} role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface2/30 px-3 py-3"
        >
          <span className="size-7 shrink-0 rounded-lg bg-surface2" />
          <span className="h-2 flex-1 rounded-full bg-surface2" style={{ maxWidth: `${70 - index * 8}%` }} />
          <span className="h-2 w-10 shrink-0 rounded-full bg-surface2" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ status pill */

export function ConnectionPill({
  state,
  label,
  className,
}: {
  state: "connected" | "disconnected" | "connecting" | "error";
  label: string;
  className?: string;
}) {
  const tone =
    state === "connected"
      ? "border-pos/30 bg-pos/10 text-pos"
      : state === "connecting"
        ? "border-accent/30 bg-accent/10 text-accent"
        : state === "error"
          ? "border-neg/30 bg-neg/10 text-neg"
          : "border-line bg-surface2 text-ink2";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tone,
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            state === "connected" ? "bg-pos" : state === "disconnected" ? "bg-muted" : "bg-accent",
            state !== "connected" && state !== "disconnected" && "z-core-idle",
          )}
        />
        <span
          className={cn(
            "size-1.5 rounded-full",
            state === "connected" ? "bg-pos" : state === "disconnected" ? "bg-muted" : "bg-accent",
          )}
        />
      </span>
      {label}
    </span>
  );
}
