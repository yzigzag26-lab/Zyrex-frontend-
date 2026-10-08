import { ZyrexLogo } from "../brand/ZyrexLogo";

const phases = [
  "Reading journal entries",
  "Clustering setups and sessions",
  "Scoring risk behaviour",
  "Composing findings",
];

/** ZYREX "thinking" state — an energy core with a staged analysis readout. */
export function ThinkingIndicator() {
  return (
    <div className="z-rise flex items-start gap-3" role="status" aria-live="polite">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2">
        <ZyrexLogo size={26} state="thinking" orbit />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface/70 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.8125rem] font-semibold text-ink">ZYREX is analyzing…</span>
          <span className="rounded-full border border-line bg-surface2 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-muted uppercase">
            Simulated
          </span>
        </div>

        <ul className="mt-2.5 space-y-1.5">
          {phases.map((phase, index) => (
            <li key={phase} className="flex items-center gap-2.5 text-[11.5px] text-ink2">
              <span className="relative flex size-3.5 shrink-0 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full border border-accent/40"
                  style={{
                    animation: `z-core-breathe 1.5s ease-in-out ${index * 0.22}s infinite`,
                  }}
                />
                <span
                  className="size-1.5 rounded-full bg-accent"
                  style={{ animation: `z-fade 1.5s ease-in-out ${index * 0.22}s infinite` }}
                />
              </span>
              {phase}
              <span className="z-num ml-auto hidden text-[10px] text-muted sm:inline">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface3">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"
            style={{ animation: "z-scan 1.6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
