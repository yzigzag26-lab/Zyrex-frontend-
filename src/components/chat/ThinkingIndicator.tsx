import { useZyrex } from "../../store/ZyrexProvider";
import { ZyrexLogo } from "../brand/ZyrexLogo";

/**
 * Live activity state — shows what the agent is doing while it works
 * ("Thinking…", "Searching market data…", "Checking live price…").
 * The label comes from the store: staged while waiting, and driven by
 * backend tool-call frames when the backend sends them.
 */
export function ThinkingIndicator() {
  const { generationActivity } = useZyrex();
  const label = generationActivity ?? "Thinking…";

  return (
    <div className="z-rise flex items-start gap-3" role="status" aria-live="polite">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2">
        <ZyrexLogo size={26} state="thinking" orbit />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface/70 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="hermes-stream-dot" />
          <span className="animate-pulse text-[0.8125rem] font-medium text-ink">{label}</span>
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface3">
          <div
            className="h-full w-1/3 rounded-full bg-blue"
            style={{ animation: "z-scan 1.6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
