import type { EvidenceShot, Trade } from "../../types";
import { cn } from "../../utils/cn";
import { Badge } from "../ui/Controls";
import { Icon } from "../ui/Icons";

/** Locked evidence stages — the schema, not captured files. */
const evidenceStages: { label: EvidenceShot["label"]; hint: string }[] = [
  { label: "Before", hint: "Pre-entry structure" },
  { label: "During", hint: "In-position state" },
  { label: "After", hint: "Post-exit result" },
];

/**
 * Evidence slots for a journal entry.
 * Screenshot storage is not connected, so each slot reports its state
 * instead of rendering an image.
 */
export function EvidenceCard({ trade }: { trade: Trade }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="z-eyebrow">Evidence</span>
        <Badge tone="neutral" icon="info">
          {trade.evidence.filter((shot) => shot.present).length} / 3 attached
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {evidenceStages.map((stage) => {
          const shot = trade.evidence.find((item) => item.label === stage.label);
          const present = shot?.present ?? false;
          return (
            <div
              key={stage.label}
              className={cn(
                "rounded-xl border border-dashed border-line bg-surface2/40 p-3",
                present && "border-solid",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-ink2 uppercase">
                  {stage.label}
                </span>
                <span className="text-[9.5px] text-muted">{stage.hint}</span>
              </div>
              <div className="mt-2.5 flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-surface/60 py-3 text-center">
                <Icon name="panelLeft" size={15} className="text-muted" />
                <span className="text-[10.5px] font-medium text-ink2">
                  {present ? (shot?.source ?? "Attached") : "Not attached"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-[10.5px] leading-relaxed text-muted">
        Screenshot storage is not connected. Slots populate once evidence capture is enabled.
      </p>
    </div>
  );
}
