import { DataUnavailable } from "../ui/EmptyStates";
import type { PieSlice } from "../../types";

interface PieChartProps {
  title: string;
  source: string;
  slices: PieSlice[];
  size?: number;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${e.x} ${e.y} A ${r} ${r} 0 ${large} 1 ${s.x} ${s.y} Z`;
}

/** True pie chart. Renders nothing invented — empty when values are missing. */
export function PieChart({ title, source, slices, size = 168 }: PieChartProps) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const hasData = slices.length > 0 && total > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-[11px] text-muted">Source: {source}</p>
      </div>
      {!hasData ? (
        <DataUnavailable
          title="No allocation data"
          hint="Proportions are calculated from verified holdings only."
          icon="chart"
          size="sm"
        />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
            {(() => {
              let cursor = 0;
              return slices.map((slice) => {
                const sweep = (slice.value / total) * 360;
                const start = cursor;
                const end = cursor + sweep;
                cursor = end;
                return (
                  <path key={slice.label} d={arcPath(size / 2, size / 2, size / 2 - 4, start, end)} fill={slice.color} />
                );
              });
            })()}
          </svg>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: slice.color }} />
                  <span className="truncate text-ink2">{slice.label}</span>
                </span>
                <span className="z-num text-ink">{((slice.value / total) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
