import type { PatternInsight } from "../../types";
import { cn } from "../../utils/cn";
import { Badge, Panel, PanelHeader, ProgressBar } from "../ui/Controls";
import { Icon } from "../ui/Icons";

const stateMeta: Record<PatternInsight["state"], { label: string; tone: "pos" | "warn" | "accent" }> = {
  confirmed: { label: "Confirmed", tone: "pos" },
  emerging: { label: "Emerging", tone: "accent" },
  watch: { label: "Under watch", tone: "warn" },
};

/** Pattern insight with confidence and evidence list. */
export function PatternCard({
  insight,
  variant = "card",
  showConfidence = true,
  title = "Pattern",
}: {
  insight: PatternInsight;
  variant?: "card" | "inline";
  showConfidence?: boolean;
  title?: string;
}) {
  const meta = stateMeta[insight.state];
  const confidenceTone =
    insight.confidence >= 75 ? "pos" : insight.confidence >= 60 ? "warn" : "warn";

  const body = (
    <div className="space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="z-eyebrow">{title}</span>
            <Badge tone={meta.tone} icon={meta.tone === "pos" ? "check" : "clock"}>
              {meta.label}
            </Badge>
          </div>
          <p className="text-[13px] leading-relaxed font-medium text-ink">{insight.statement}</p>
        </div>
      </div>

      {showConfidence && (
        <div className="flex items-center gap-3">
          <span className="w-[6.5rem] shrink-0 text-[10.5px] tracking-wider text-muted uppercase">
            Confidence
          </span>
          <ProgressBar value={insight.confidence} tone={confidenceTone} className="flex-1" />
          <span className="z-num w-11 shrink-0 text-right text-[13px] font-semibold text-ink">
            {insight.confidence}%
          </span>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="z-eyebrow">Evidence</span>
          <span className="z-num text-[10px] text-muted">n = {insight.sampleSize}</span>
        </div>
        <ul className="space-y-1.5">
          {insight.evidence.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-ink2">
              <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
              <span className="z-num">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {insight.state !== "confirmed" && (
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Icon name="info" size={12} className="mt-0.5 shrink-0" />
          Continue collecting data before treating this pattern as statistically reliable.
        </p>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("rounded-2xl border border-line bg-surface/60 p-3.5 sm:p-4")}>{body}</div>;
  }

  return (
    <Panel>
      <PanelHeader title={insight.title} subtitle={`Sample size ${insight.sampleSize} trades`} icon="target" />
      <div className="p-4 sm:p-5">{body}</div>
    </Panel>
  );
}
