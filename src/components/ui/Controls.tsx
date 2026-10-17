import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Icon, type IconName } from "./Icons";

/* ------------------------------------------------------------------- Panel */

interface PanelProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
  interactive?: boolean;
  ariaLabel?: string;
}

export function Panel({ children, className, as = "section", interactive, ariaLabel }: PanelProps) {
  const Tag = as;
  return (
    <Tag
      aria-label={ariaLabel}
      className={cn(
        "z-panel relative overflow-hidden",
        interactive &&
          "transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-linestrong",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: IconName;
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, subtitle, eyebrow, icon, actions, className }: PanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-accent">
            <Icon name={icon} size={16} />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="z-eyebrow mb-1">{eyebrow}</div>}
          <h3 className="truncate text-[0.9375rem] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-ink2">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "subtle" | "ghost" | "outline" | "danger";
type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
  block?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black hover:bg-neutral-200 border border-transparent shadow-sm",
  subtle: "bg-surface2 text-ink border border-line hover:border-linestrong hover:bg-surface3",
  ghost: "bg-transparent text-ink2 border border-transparent hover:bg-surface2 hover:text-ink",
  outline: "bg-transparent text-ink border border-line hover:border-linestrong hover:bg-surface2",
  danger: "bg-neg/10 text-neg border border-neg/30 hover:bg-neg/20",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[11px] gap-1.5 rounded-lg",
  sm: "h-9 px-3 text-xs gap-1.5 rounded-xl",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
};

export function Button({
  variant = "subtle",
  size = "sm",
  icon,
  iconRight,
  children,
  className,
  block,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "md" ? 16 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "md" ? 16 : 14} />}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  name: IconName;
  label: string;
  size?: number;
  tone?: "default" | "accent" | "danger" | "success";
  active?: boolean;
}

export function IconButton({
  name,
  label,
  size = 18,
  tone = "default",
  active,
  className,
  ...rest
}: IconButtonProps) {
  const tones = {
    default: "text-ink2 hover:text-ink hover:bg-surface2 border border-transparent hover:border-line",
    accent: "text-accent border border-line bg-surface2 hover:bg-surface3",
    danger: "text-neg hover:bg-neg/10 border border-transparent",
    success: "text-pos hover:bg-pos/10 border border-transparent",
  } as const;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        tones[tone],
        active && "border-line bg-surface3 text-ink",
        className,
      )}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

/* ------------------------------------------------------------------- Badge */

interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "pos" | "neg" | "warn" | "accent";
  icon?: IconName;
  className?: string;
}

const badgeTones = {
  neutral: "bg-surface2 text-ink2 border-line",
  pos: "bg-pos/10 text-pos border-pos/25",
  neg: "bg-neg/10 text-neg border-neg/25",
  warn: "bg-warn/10 text-warn border-warn/25",
  accent: "bg-accent/10 text-accent border-accent/30",
} as const;

export function Badge({ children, tone = "neutral", icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/** Small status dot + label — never relies on colour alone. */
export function StatusDot({
  tone,
  children,
}: {
  tone: "pos" | "neg" | "warn" | "accent" | "neutral";
  children: ReactNode;
}) {
  const dot = {
    pos: "bg-pos",
    neg: "bg-neg",
    warn: "bg-warn",
    accent: "bg-accent",
    neutral: "bg-muted",
  }[tone];
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-medium text-ink2">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Toggle */

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-surface2",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink2">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors duration-300",
          checked ? "border-accent/50 bg-accent/25" : "border-line bg-surface3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4.5 rounded-full transition-all duration-300",
            checked
              ? "left-[1.4rem] bg-accent shadow-[0_0_10px] shadow-accent/60"
              : "left-0.5 bg-muted",
          )}
        />
      </button>
    </label>
  );
}

/* ------------------------------------------------------------------ Select */

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  label: string;
  className?: string;
}

export function Select({ value, onChange, options, label, className }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-xl border border-line bg-surface2 pr-8 pl-3 text-xs font-medium text-ink transition-colors hover:border-linestrong"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

/* -------------------------------------------------------------------- Tabs */

interface TabsProps<T extends string> {
  tabs: { id: T; label: string; icon?: IconName }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs<T extends string>({ tabs, active, onChange, className, size = "sm" }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "z-no-bar flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface2 p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200",
              size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
              isActive
                ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                : "text-ink2 hover:bg-surface3 hover:text-ink",
            )}
          >
            {tab.icon && <Icon name={tab.icon} size={14} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  tone = "accent",
  className,
  label,
}: {
  value: number;
  tone?: "accent" | "pos" | "neg" | "warn";
  className?: string;
  label?: string;
}) {
  const fill = {
    accent: "bg-gradient-to-r from-orange-400 to-amber-500",
    pos: "bg-pos",
    neg: "bg-neg",
    warn: "bg-warn",
  }[tone];
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink2">
          <span>{label}</span>
          <span className="z-num">{Math.round(value)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "progress"}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface3"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fill)}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon = "info",
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-surface2 text-muted">
        <Icon name={icon} size={20} />
      </span>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
