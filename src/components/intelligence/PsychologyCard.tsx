import type { PsychologyFinding } from "../../types";
import { cn } from "../../utils/cn";
import { DataUnavailable } from "../ui/EmptyStates";
import { Panel, PanelHeader } from "../ui/Controls";
import { Icon } from "../ui/Icons";

function emotionTone(avgR: number): "pos" | "neg" | "warn" {
  if (avgR > 0.5) return "pos";
  if (avgR >= 0) return "warn";
  return "neg";
}

const toneClasses = {
  pos: "text-pos border-pos/25 bg-pos/10",
  neg: "text-neg border-neg/25 bg-neg/10",
  warn: "text-warn border-warn/25 bg-warn/10",
} as const;

/** Empty state — psychology scoring requires real, self-scored entries. */
const emptyPsychology = {
  title: "No psychology data yet",
  hint: "Confidence and discipline are scored from your own journal entries. Nothing is assumed.",
};

/**
 * Psychology findings.
 * Discipline is only shown when it has actually been scored — never estimated.
 */
export function PsychologyCard({
  findings,
  variant = "card",
  title = "Psychology Correlation",
  subtitle = "Emotional state at entry vs outcome",
}: {
  findings: PsychologyFinding[];
  variant?: "card" | "inline";
  title?: string;
  subtitle?: string;
}) {
  if (findings.length === 0) {
    if (variant === "inline") {
      return <DataUnavailable inline title={emptyPsychology.title} hint={emptyPsychology.hint} icon="brain" />;
    }
    return (
      <Panel>
        <PanelHeader title={title} subtitle={subtitle} icon="brain" />
        <DataUnavailable
          title={emptyPsychology.title}
          hint={emptyPsychology.hint}
          icon="brain"
          size="lg"
        />
      </Panel>
    );
  }

  const body = (
    <ul className="space-y-2">
      {findings.map((finding) => {
        const tone = emotionTone(finding.avgR);
        const discipline = finding.discipline;
        return (
          <li
            key={finding.emotion}
            className="rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-surface2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
                <span className={cn("grid size-6 place-items-center rounded-md border", toneClasses[tone])}>
                  <Icon name="brain" size={12} />
                </span>
                {finding.emotion}
              </span>
              <span className="flex items-center gap-3">
                <span className="z-num text-[10.5px] text-muted">{finding.trades} trades</span>
                <span className="z-num text-[11px] font-semibold text-ink2">{finding.winRate}% WR</span>
                <span
                  className={cn(
                    "z-num text-[12px] font-semibold",
                    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-warn",
                  )}
                >
                  {finding.avgR > 0 ? "+" : "−"}
                  {Math.abs(finding.avgR).toFixed(2)}R
                </span>
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="w-20 shrink-0 text-[10px] tracking-wider text-muted uppercase">
                Discipline
              </span>
              {discipline === null ? (
                <span className="text-[10.5px] text-muted">Not scored</span>
              ) : (
                <>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface3">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                      style={{ width: `${discipline * 10}%` }}
                    />
                  </span>
                  <span className="z-num w-9 shrink-0 text-right text-[10.5px] font-semibold text-ink2">
                    {discipline.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            {finding.note && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink2">{finding.note}</p>
            )}
          </li>
        );
      })}
    </ul>
  );

  if (variant === "inline") return body;

  return (
    <Panel>
      <PanelHeader title={title} subtitle={subtitle} icon="brain" />
      <div className="p-4 sm:p-5">{body}</div>
    </Panel>
  );
}
