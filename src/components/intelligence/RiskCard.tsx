import type { RiskMetric } from "../../types";
import { cn } from "../../utils/cn";
import { Icon, type IconName } from "../ui/Icons";
import { Panel, PanelHeader } from "../ui/Controls";
import { DataUnavailable } from "../ui/EmptyStates";

const toneStyles = {
  pos: "border-pos/25 bg-pos/10 text-pos",
  neg: "border-neg/25 bg-neg/10 text-neg",
  warn: "border-warn/25 bg-warn/10 text-warn",
  neutral: "border-line bg-surface2 text-ink2",
} as const;

const toneIcons: Record<RiskMetric["tone"], IconName> = {
  pos: "check",
  neg: "alert",
  warn: "alert",
  neutral: "info",
};

/** Risk findings — list form used by both the Analytics page and AI responses. */
export function RiskCard({
  items,
  title = "Risk Analysis",
  subtitle = "Sizing, exposure and drawdown behaviour",
  variant = "card",
}: {
  items: RiskMetric[];
  title?: string;
  subtitle?: string;
  variant?: "card" | "inline";
}) {
  if (items.length === 0) {
    if (variant === "inline") {
      return (
        <DataUnavailable
          inline
          icon="shield"
          title="No risk data available"
          hint="Import trades to begin analysis"
        />
      );
    }
    return (
      <Panel>
        <PanelHeader title={title} subtitle={subtitle} icon="shield" />
        <DataUnavailable
          icon="shield"
          size="lg"
          title="No risk data available"
          hint="Risk metrics are calculated from your closed trades. Import a trade history or start journalling to populate this view."
        />
      </Panel>
    );
  }

  const body = (
    <ul className={cn("space-y-2", variant === "card" && "p-4 sm:p-5")}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-surface2"
        >
          <span
            className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border",
              toneStyles[item.tone],
            )}
          >
            <Icon name={toneIcons[item.tone]} size={13} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[12.5px] font-medium text-ink">{item.label}</span>
              <span className="z-num text-[12.5px] font-semibold text-ink">{item.value}</span>
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-ink2">{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );

  if (variant === "inline") return body;

  return (
    <Panel>
      <PanelHeader title={title} subtitle={subtitle} icon="shield" />
      {body}
    </Panel>
  );
}
