import { ZyrexLogo } from "../brand/ZyrexLogo";

/**
 * Connection check shown while a prompt is being resolved.
 * This is a transport state, not a simulated "thinking" state.
 */
export function ConnectionIndicator() {
  return (
    <div className="z-rise flex items-start gap-3" role="status" aria-live="polite">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2">
        <ZyrexLogo size={26} state="thinking" orbit />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface/70 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.8125rem] font-semibold text-ink">Checking ZYREX AI connection…</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface3">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"
            style={{ animation: "z-scan 1.4s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
