import { useId, useState } from "react";
import type { EquityPoint } from "../../types";
import { formatCurrency } from "../../utils/format";
import { useElementWidth } from "../../hooks/useElementSize";
import { cn } from "../../utils/cn";

interface EquityCurveProps {
  data: EquityPoint[];
  height?: number;
  className?: string;
  showGrid?: boolean;
  ariaLabel?: string;
}

/** Equity curve rendered as a crisp SVG area/line chart with hover readout. */
export function EquityCurve({
  data,
  height = 240,
  className,
  showGrid = true,
  ariaLabel = "Equity curve",
}: EquityCurveProps) {
  const { setNode, width } = useElementWidth<HTMLDivElement>();
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const padTop = 16;
  const padBottom = 26;
  const padLeft = 8;
  const padRight = 8;
  const plotWidth = Math.max(80, width - padLeft - padRight);
  const plotHeight = height - padTop - padBottom;

  const values = data.map((d) => d.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const yMin = min - span * 0.12;
  const yMax = max + span * 0.12;

  const x = (i: number) => padLeft + (plotWidth * i) / Math.max(1, data.length - 1);
  const y = (v: number) => padTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.equity)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${padTop + plotHeight} L${padLeft},${padTop + plotHeight} Z`;

  const tickCount = width < 420 ? 4 : 7;
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((i * (data.length - 1)) / (tickCount - 1)),
  );
  const gridLines = showGrid ? [0.25, 0.5, 0.75, 1] : [];
  const active = hover ?? data.length - 1;

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = event.clientX - rect.left - padLeft;
    const step = plotWidth / Math.max(1, data.length - 1);
    const index = Math.round(relative / step);
    setHover(Math.max(0, Math.min(data.length - 1, index)));
  };

  return (
    <div ref={setNode} className={cn("relative w-full", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          className="touch-pan-y select-none"
        >
          <defs>
            <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="55%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLines.map((ratio) => {
            const gy = padTop + plotHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={padLeft}
                x2={padLeft + plotWidth}
                y1={gy}
                y2={gy}
                stroke="currentColor"
                className="text-line"
                strokeWidth="1"
                strokeDasharray="3 6"
              />
            );
          })}

          <path d={areaPath} fill={`url(#fill-${uid})`} />
          <path
            d={linePath}
            fill="none"
            stroke={`url(#stroke-${uid})`}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <line
            x1={x(active)}
            x2={x(active)}
            y1={padTop}
            y2={padTop + plotHeight}
            stroke="currentColor"
            className="text-muted"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <circle cx={x(active)} cy={y(data[active].equity)} r="4.5" className="fill-surface" />
          <circle
            cx={x(active)}
            cy={y(data[active].equity)}
            r="4"
            fill="#22D3EE"
            stroke="#3B82F6"
            strokeWidth="1.5"
          />

          {ticks.map((index) => (
            <text
              key={index}
              x={x(index)}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
              className="fill-muted"
              style={{ fontSize: 10, fontWeight: 500 }}
            >
              {data[index].label}
            </text>
          ))}

          <text
            x={padLeft + plotWidth}
            y={padTop - 4}
            textAnchor="end"
            className="fill-ink2"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {formatCurrency(data[active].equity)}
          </text>
        </svg>
      )}
    </div>
  );
}
