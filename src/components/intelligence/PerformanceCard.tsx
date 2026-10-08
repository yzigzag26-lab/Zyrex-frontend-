import type { MetricRow, PerformanceMetrics } from "../../types";
import { Icon, type IconName } from "../ui/Icons";
import { MetricRowItem, MetricTile } from "./MetricTile";

/** Tile definitions — labels and icons only; values come from the dataset. */
const metricTiles: {
  label: string;
  icon: IconName;
  format: (metrics: PerformanceMetrics) => string;
  tone: (metrics: PerformanceMetrics) => "pos" | "neg" | "warn" | "neutral";
}[] = [
  {
    label: "Total Trades",
    icon: "layers",
    format: (m) => String(m.totalTrades),
    tone: () => "neutral",
  },
  {
    label: "Win Rate",
    icon: "target",
    format: (m) => `${m.winRate}%`,
    tone: (m) => (m.winRate >= 50 ? "pos" : "neg"),
  },
  {
    label: "Net PnL",
    icon: "trendUp",
    format: (m) => `${m.netPnl >= 0 ? "+" : "−"}$${Math.abs(Math.round(m.netPnl)).toLocaleString()}`,
    tone: (m) => (m.netPnl >= 0 ? "pos" : "neg"),
  },
  {
    label: "Profit Factor",
    icon: "chart",
    format: (m) => m.profitFactor.toFixed(2),
    tone: (m) => (m.profitFactor >= 1 ? "pos" : "neg"),
  },
  {
    label: "Average R",
    icon: "zap",
    format: (m) => `${m.averageR >= 0 ? "+" : "−"}${Math.abs(m.averageR).toFixed(2)}R`,
    tone: (m) => (m.averageR >= 0 ? "pos" : "neg"),
  },
  {
    label: "Max Drawdown",
    icon: "trendDown",
    format: (m) => `${m.maxDrawdown.toFixed(1)}R`,
    tone: () => "warn",
  },
  {
    label: "Average Risk",
    icon: "shield",
    format: (m) => `${m.averageRiskPct.toFixed(1)}%`,
    tone: () => "neutral",
  },
  {
    label: "Expectancy",
    icon: "cpu",
    format: (m) => `${m.expectancy >= 0 ? "+" : "−"}${Math.abs(m.expectancy).toFixed(2)}R`,
    tone: (m) => (m.expectancy >= 0 ? "pos" : "neg"),
  },
];

/**
 * Metric grid. Pass `metrics: null` (the current state) and every tile reports
 * that no data is available rather than showing an invented figure.
 */
export function PerformanceGrid({ metrics }: { metrics: PerformanceMetrics | null }) {
  return (
    <div className="z-stagger grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
      {metricTiles.map((tile) => (
        <MetricTile
          key={tile.label}
          label={tile.label}
          icon={tile.icon}
          empty={metrics === null}
          value={metrics ? tile.format(metrics) : undefined}
          tone={metrics ? tile.tone(metrics) : "neutral"}
          hint={metrics?.reviewPeriod}
        />
      ))}
    </div>
  );
}

/** Compact metric block used inside AI responses. */
export function MetricsBlock({
  title,
  rows,
  className,
}: {
  title: string;
  rows: MetricRow[];
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface/60 p-3.5 sm:p-4 ${className ?? ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h4>
        <Icon name="chart" size={13} className="text-muted" />
      </div>
      <div className="grid gap-x-8 sm:grid-cols-2">
        {rows.map((row) => (
          <MetricRowItem key={row.label} label={row.label} value={row.value} tone={row.tone} hint={row.hint} />
        ))}
      </div>
    </div>
  );
}


