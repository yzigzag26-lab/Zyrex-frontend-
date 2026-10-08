import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: "start" | "end";
  widthClass?: string;
  label?: string;
}

/** Accessible lightweight popover: closes on outside click and Escape. */
export function Popover({ trigger, children, align = "end", widthClass = "w-64", label }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      {trigger({ open, toggle: () => setOpen((prev) => !prev) })}
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={cn(
            "z-panel z-slide-right z-glass absolute top-[calc(100%+8px)] overflow-hidden p-1.5 shadow-2xl",
            align === "end" ? "right-0" : "left-0",
            widthClass,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}
