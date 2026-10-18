import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PageShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export function PageShell({ title, subtitle, eyebrow, actions, children, wide }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        wide ? "max-w-[1440px]" : "max-w-[1120px]",
      )}
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="z-eyebrow mb-1.5">{eyebrow}</p>}
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink2">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
