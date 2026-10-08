import type { AiMode } from "../../types";
import { cn } from "../../utils/cn";
import { Icon, type IconName } from "../ui/Icons";
import { Popover } from "../ui/Popover";

const modeIcons: Record<AiMode["icon"], IconName> = {
  chart: "chart",
  brain: "brain",
  search: "search",
};

/** Frontend presentation mode switcher — no separate models involved. */
export function ModeDropdown({ modes, active, onChange }: {
  modes: AiMode[];
  active: AiMode;
  onChange: (id: AiMode["id"]) => void;
}) {
  return (
    <Popover
      label="Select ZYREX mode"
      widthClass="w-[min(20rem,calc(100vw-2rem))]"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            "group flex h-10 max-w-[62vw] items-center gap-2 rounded-xl border px-3 transition-all duration-200 sm:max-w-none",
            open
              ? "border-accent/40 bg-accent/10"
              : "border-line bg-surface2/70 hover:border-linestrong hover:bg-surface3",
          )}
        >
          <Icon name={modeIcons[active.icon]} size={15} className="text-accent" />
          <span className="truncate text-[0.8125rem] font-semibold text-ink">{active.name}</span>
          <Icon
            name="chevronDown"
            size={14}
            className={cn("text-muted transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      )}
    >
      {({ close }) => (
        <div className="space-y-1">
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="z-eyebrow">Intelligence Mode</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink2">
              Presentation modes only — the AI backend is not connected yet.
            </p>
          </div>
          {modes.map((mode) => {
            const isActive = mode.id === active.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onChange(mode.id);
                  close();
                }}
                aria-pressed={isActive}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                  isActive ? "bg-accent/10 ring-1 ring-accent/25" : "hover:bg-surface2",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border",
                    isActive ? "border-accent/40 bg-accent/15 text-accent" : "border-line bg-surface2 text-ink2",
                  )}
                >
                  <Icon name={modeIcons[mode.icon]} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[0.8125rem] font-semibold text-ink">{mode.name}</span>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-accent">
                        <Icon name="check" size={11} /> Active
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink2">{mode.tagline}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
