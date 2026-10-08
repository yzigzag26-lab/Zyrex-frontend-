import { navItems, product } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { ZyrexLogo } from "../brand/ZyrexLogo";
import { IconButton } from "../ui/Controls";
import { Icon } from "../ui/Icons";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { page, navigate, phase } = useZyrex();

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => navigate("dashboard")}
          className="flex min-w-0 items-center gap-2.5 rounded-xl text-left"
          aria-label="ZYREX AI home"
        >
          <ZyrexLogo size={34} state={phase === "idle" ? "idle" : "thinking"} />
          <span className="min-w-0">
            <span className="block text-[14px] leading-none font-semibold tracking-[0.16em] text-ink">
              ZYREX <span className="text-accent">AI</span>
            </span>
            <span className="mt-1.5 block text-[9.5px] leading-none font-medium tracking-[0.16em] text-muted uppercase">
              {product.tagline}
            </span>
          </span>
        </button>
        {onNavigate && (
          <IconButton name="close" label="Close navigation" onClick={onNavigate} className="lg:hidden" />
        )}
      </div>



      <nav aria-label="Primary" className="px-2.5">
        <p className="z-eyebrow px-2 pb-1.5">Workspace</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = page === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(item.id);
                    onNavigate?.();
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200",
                    isActive
                      ? "bg-surface2 text-ink ring-1 ring-line"
                      : "text-ink2 hover:bg-surface2/70 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-full transition-all duration-300",
                      isActive ? "bg-gradient-to-b from-orange-400 to-amber-500" : "bg-transparent",
                    )}
                  />
                  <Icon
                    name={item.icon}
                    size={16}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-ink" : "text-muted group-hover:text-ink2",
                    )}
                  />
                  <span className="text-[0.8125rem] font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[10px] leading-relaxed text-muted">
          <span className="font-semibold text-ink2">Awaiting connection.</span> No exchange, data
          source or AI backend is linked to this workspace yet.
        </p>
      </div>
    </div>
  );
}

/** Desktop sidebar / mobile slide-out drawer. */
export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, isMobile } = useZyrex();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-full w-[264px] shrink-0 overflow-hidden border-r border-line lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            sidebarOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!sidebarOpen}
          inert={!sidebarOpen}
        >
          <div
            role="presentation"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            role="dialog"
            aria-label="Navigation"
            className={cn(
              "absolute inset-y-0 left-0 w-[min(19rem,84vw)] border-r border-line shadow-2xl transition-transform duration-300 ease-out",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
