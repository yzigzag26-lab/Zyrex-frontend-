import { cn } from "../../utils/cn";

/* ------------------------------------------------------------- horizontal */

export interface HBarDatum {
  label: string;
  value: number;
  display: string;
  tone: "pos" | "neg" | "warn" | "accent";
  meta?: string;
}

interface HBarChartProps {
  data: HBarDatum[];
  className?: string;
  showZeroLine?: boolean;
}

/** Horizontal comparison bars — readable from 320px up to ultrawide. */
export function HBarChart({ data, className, showZeroLine = true }: HBarChartProps) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 0.0001);
  const hasNegative = data.some((d) => d.value < 0);

  const barColor = (tone: HBarDatum["tone"]) =>
    ({
      pos: "bg-gradient-to-r from-emerald-500/70 to-emerald-400",
      neg: "bg-gradient-to-r from-rose-500/70 to-rose-400",
      warn: "bg-gradient-to-r from-amber-500/70 to-amber-400",
      accent: "bg-gradient-to-r from-orange-400 to-amber-500",
    })[tone];

  const textColor = (tone: HBarDatum["tone"]) =>
    ({ pos: "text-pos", neg: "text-neg", warn: "text-warn", accent: "text-ink" })[tone];

  return (
    <ul className={cn("space-y-3.5", className)}>
      {data.map((datum) => {
        const magnitude = (Math.abs(datum.value) / max) * 100;
        const negative = datum.value < 0;
        return (
          <li key={datum.label} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-ink">
                <span className="truncate">{datum.label}</span>
                {datum.meta && <span className="z-num shrink-0 text-[10px] text-muted">{datum.meta}</span>}
              </span>
              <span className={cn("z-num shrink-0 text-xs font-semibold", textColor(datum.tone))}>
                {datum.display}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface3">
              {hasNegative && showZeroLine && (
                <span className="absolute top-0 bottom-0 left-1/2 w-px bg-linestrong" />
              )}
              <span
                className={cn(
                  "absolute top-0 h-full rounded-full transition-[width] duration-700 ease-out",
                  barColor(datum.tone),
                )}
                style={
                  hasNegative
                    ? {
                        left: negative ? `${50 - magnitude / 2}%` : "50%",
                        width: `${magnitude / 2}%`,
                      }
                    : { left: 0, width: `${magnitude}%` }
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------- distribution */

export interface VBarDatum {
  label: string;
  count: number;
  tone: "pos" | "neg" | "warn" | "neutral";
}

export function DistributionChart({ data, className }: { data: VBarDatum[]; className?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barColor = (tone: VBarDatum["tone"]) =>
    ({
      pos: "bg-gradient-to-t from-cyan-500/30 to-emerald-400",
      neg: "bg-gradient-to-t from-rose-500/25 to-rose-500",
      warn: "bg-gradient-to-t from-amber-500/25 to-amber-400",
      neutral: "bg-gradient-to-t from-slate-500/25 to-slate-400",
    })[tone];

  return (
    <div className={cn("flex w-full items-end gap-1.5 sm:gap-2.5", className)}>
      {data.map((datum) => {
        const pct = (datum.count / max) * 100;
        return (
          <div key={datum.label} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="z-num text-[10px] font-semibold text-ink2">{datum.count}</span>
            <div className="flex h-28 w-full items-end sm:h-36" aria-hidden="true">
              <div
                className={cn(
                  "w-full rounded-t-md transition-[height] duration-700 ease-out group-hover:opacity-80",
                  barColor(datum.tone),
                )}
                style={{ height: `${Math.max(3, pct)}%` }}
              />
            </div>
            <span className="w-full truncate text-center text-[9px] leading-tight text-muted sm:text-[10px]">
              {datum.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- stacked row */

export function StackedBar({
  segments,
  className,
}: {
  segments: { label: string; value: number; tone: "pos" | "neg" | "neutral" }[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const tones = {
    pos: "bg-pos",
    neg: "bg-neg",
    neutral: "bg-muted/50",
  } as const;
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface3">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={cn("h-full transition-[width] duration-700", tones[segment.tone])}
            style={{ width: `${(segment.value / total) * 100}%` }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <span key={segment.label} className="flex items-center gap-1.5 text-[11px] text-ink2">
            <span className={cn("size-1.5 rounded-full", tones[segment.tone])} />
            {segment.label}
            <span className="z-num font-semibold text-ink">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
