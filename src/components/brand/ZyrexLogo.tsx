import { useId } from "react";
import { cn } from "../../utils/cn";

export type CoreState = "idle" | "thinking" | "responding" | "off";

interface ZyrexLogoProps {
  /** Pixel size of the square mark (works at 20 – 64px). */
  size?: number;
  /** Energy animation of the core. */
  state?: CoreState;
  /** Show the orbiting ring (used for larger placements). */
  orbit?: boolean;
  className?: string;
  title?: string;
}

/**
 * ZYREX AI mark — a geometric Z stepped like an energy bolt, wrapped in a
 * partial orbit ring. Pure SVG so it scales from 20px favicon to 64px hero.
 */
export function ZyrexLogo({
  size = 28,
  state = "idle",
  orbit = true,
  className,
  title = "ZYREX AI",
}: ZyrexLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `z-grad-${uid}`;
  const glowId = `z-glow-${uid}`;

  const coreClass =
    state === "thinking"
      ? "z-core-thinking"
      : state === "responding"
        ? "z-core-responding"
        : state === "off"
          ? ""
          : "z-core-idle";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="48%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {orbit && (
        <>
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="88 44"
            opacity="0.5"
            className="z-core-orbit"
          />
          <circle
            cx="24"
            cy="24"
            r="16.5"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="12 22"
            opacity="0.35"
            className="z-core-dash"
          />
        </>
      )}

      <g filter={`url(#${glowId})`} className={coreClass}>
        <path
          d="M13.5 15.5h21L25 26.5v6h8.5"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="34.6" cy="15.5" r="2.1" fill="#EC4899" opacity="0.9" className={coreClass} />
    </svg>
  );
}

interface ZyrexWordmarkProps {
  size?: number;
  showTagline?: boolean;
  state?: CoreState;
  className?: string;
}

/** Horizontal lockup: mark + ZYREX AI wordmark + tagline. */
export function ZyrexWordmark({
  size = 32,
  showTagline = true,
  state = "idle",
  className,
}: ZyrexWordmarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ZyrexLogo size={size} state={state} />
      <div className="min-w-0 leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tracking-[0.16em] text-ink">ZYREX</span>
          <span
            className="text-[15px] font-semibold tracking-[0.16em]"
            style={{
              backgroundImage: "linear-gradient(90deg,#22D3EE,#3B82F6,#8B5CF6)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <div className="mt-1 truncate text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
            Trading Intelligence
          </div>
        )}
      </div>
    </div>
  );
}
