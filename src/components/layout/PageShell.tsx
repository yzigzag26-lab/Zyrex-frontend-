import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Badge } from "../ui/Controls";

interface PageShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

/** Standard page frame: header + responsive content column. */
export function PageShell({ title, subtitle, eyebrow, actions, children, wide }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-3 py-5 sm:px-5 sm:py-7 lg:px-8",
        wide ? "max-w-[1600px]" : "max-w-[1320px]",
      )}
    >
      <header className="z-rise mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          {eyebrow && <p className="z-eyebrow mb-1.5">{eyebrow}</p>}
          <h1 className="text-xl font-semibold text-ink sm:text-[1.625rem]">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink2 sm:text-[13px]">
            {subtitle}
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="space-y-4 sm:space-y-5">{children}</div>
      <footer className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Badge tone="neutral" icon="info">
          No data source connected
        </Badge>
        <p className="text-[10.5px] leading-relaxed text-muted">
          ZYREX AI frontend shell — no exchange, data source or AI backend is linked to this
          workspace.
        </p>
      </footer>
    </div>
  );
}
