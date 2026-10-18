import { useEffect, type ReactNode } from "react";
import { cn } from "../../utils/cn";

export function Dialog({
  open,
  title,
  children,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "z-panel relative z-10 w-full overflow-hidden",
          wide ? "max-w-lg" : "max-w-md",
        )}
      >
        {children}
      </div>
    </div>
  );
}
