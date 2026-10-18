import { cn } from "../../utils/cn";
import logo from "../../assets/hermes-logo.jpg";

interface HermesLogoProps {
  size?: number;
  className?: string;
  rounded?: "md" | "lg" | "full";
  alt?: string;
}

/** Official HERMES AI mark — uploaded brand asset. */
export function HermesLogo({
  size = 36,
  className,
  rounded = "lg",
  alt = "HERMES AI",
}: HermesLogoProps) {
  const radius = rounded === "full" ? "rounded-full" : rounded === "md" ? "rounded-md" : "rounded-xl";
  return (
    <img
      src={logo}
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain bg-white", radius, className)}
      style={{ width: size, height: size }}
    />
  );
}

export function HermesWordmark({
  size = 36,
  showTagline = true,
  className,
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <HermesLogo size={size} />
      <div className="min-w-0 leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tracking-[0.14em] text-ink">HERMES</span>
          <span className="text-[15px] font-semibold tracking-[0.14em] text-gold">AI</span>
        </div>
        {showTagline && (
          <div className="mt-1 truncate text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
            Private AI Trading
          </div>
        )}
      </div>
    </div>
  );
}
