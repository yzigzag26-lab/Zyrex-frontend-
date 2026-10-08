import { cn } from "../../utils/cn";

/* --------------------------------------------------------------------- donut */

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Win / loss / breakeven composition ring. */
export function DonutChart({
  segments,
  size = 148,
  centerLabel,
  centerValue,
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-6", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 140 140"
          width={size}
          height={size}
          role="img"
          aria-label="Win / loss split"
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-surface3"
            strokeWidth="14"
          />
          {segments.map((segment) => {
            const length = (segment.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const rotation = (offset / circumference) * 360;
            offset += length;
            return (
              <circle
                key={segment.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeLinecap="butt"
                transform={`rotate(${rotation - 90} 70 70)`}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="z-num text-xl font-semibold text-ink">{centerValue}</span>
          <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2.5 text-xs">
            <span className="size-2.5 rounded-sm" style={{ background: segment.color }} />
            <span className="text-ink2">{segment.label}</span>
            <span className="z-num font-semibold text-ink">{segment.value}</span>
            <span className="z-num text-muted">{Math.round((segment.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- scatter */

export interface ScatterPoint {
  x: number;
  y: number;
  tone: "pos" | "neg" | "neutral";
}

/** Discipline vs outcome correlation plot. */
export function ScatterChart({
  points,
  xLabel,
  yLabel,
  yUnit = "R",
  className,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  yUnit?: string;
  className?: string;
}) {
  const width = 320;
  const height = 190;
  const pad = 26;
  const xMax = 10;
  const yValues = points.map((p) => p.y);
  const yMin = Math.min(...yValues, -1);
  const yMax = Math.max(...yValues, 1);
  const px = (v: number) => pad + (v / xMax) * (width - pad * 2);
  const py = (v: number) => height - pad - ((v - yMin) / (yMax - yMin || 1)) * (height - pad * 2);
  const zeroY = py(0);

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${xLabel} vs ${yLabel}`}
      >
        <line
          x1={pad}
          x2={width - pad}
          y1={zeroY}
          y2={zeroY}
          stroke="currentColor"
          className="text-linestrong"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x={pad} y={zeroY - 6} className="fill-muted" style={{ fontSize: 9 }}>
          0{yUnit}
        </text>
        {points.map((point, index) => (
          <circle
            key={index}
            cx={px(point.x)}
            cy={py(point.y)}
            r="4.5"
            className={
              point.tone === "pos"
                ? "fill-pos/70"
                : point.tone === "neg"
                  ? "fill-neg/70"
                  : "fill-muted/60"
            }
          />
        ))}
        <text
          x={width / 2}
          y={height - 4}
          textAnchor="middle"
          className="fill-muted"
          style={{ fontSize: 9 }}
        >
          {xLabel}
        </text>
        <text x={6} y={pad - 10} className="fill-muted" style={{ fontSize: 9 }}>
          {yLabel}
        </text>
      </svg>
    </div>
  );
}
