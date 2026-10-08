import { aiModes, emptyCopy, integrations, product, workspace } from "../../data/appConfig";
import { notifications } from "../../data/dataset";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { ZyrexLogo } from "../brand/ZyrexLogo";
import { Badge, IconButton } from "../ui/Controls";
import { Icon } from "../ui/Icons";
import { Popover } from "../ui/Popover";
import { ModeDropdown } from "./ModeDropdown";

const pageTitles: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Performance overview" },
  journal: { title: "Journal", sub: "Trade entries and reviews" },
  recent: { title: "Recent", sub: "Recent activity" },
  settings: { title: "Settings", sub: "Workspace preferences" },
};

export function TopBar() {
  const { page, navigate, mode, setMode, setSidebarOpen, isMobile } = useZyrex();
  const meta = pageTitles[page] ?? pageTitles.dashboard;

  return (
    <header className="z-glass sticky top-0 z-40 border-b border-line">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-5">
        {isMobile && (
          <IconButton name="menu" label="Open navigation" onClick={() => setSidebarOpen(true)} />
        )}

        <button
          type="button"
          onClick={() => navigate("dashboard")}
          className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-opacity hover:opacity-80"
          aria-label="ZYREX AI home"
        >
          <ZyrexLogo size={isMobile ? 26 : 30} orbit />
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block text-[13px] leading-none font-semibold tracking-[0.15em] text-ink">
              ZYREX <span className="text-accent">AI</span>
            </span>
            <span className="mt-1 block text-[9.5px] leading-none font-medium tracking-[0.16em] text-muted uppercase">
              Trading Intelligence
            </span>
          </span>
        </button>

        <div className="mx-auto hidden min-w-0 md:block">
          <ModeDropdown modes={aiModes} active={mode} onChange={setMode} />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <div className="mr-1 hidden max-w-[42vw] flex-col items-end lg:flex">
            <span className="truncate text-[0.8125rem] font-semibold text-ink">{meta.title}</span>
            <span className="truncate text-[10.5px] text-muted">{meta.sub}</span>
          </div>

          <Popover
            label="Notifications"
            widthClass="w-[min(20rem,calc(100vw-2rem))]"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label="Notifications"
                aria-expanded={open}
                className={cn(
                  "relative grid size-9 place-items-center rounded-xl border border-transparent text-ink2 transition-all hover:border-line hover:bg-surface2 hover:text-ink",
                  open && "border-line bg-surface2 text-ink",
                )}
              >
                <Icon name="bell" size={18} />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
              </button>
            )}
          >
            {() => (
              <div>
                <div className="flex items-center justify-between px-2.5 py-2">
                  <p className="z-eyebrow">Notifications</p>
                  <Badge tone="neutral">{integrations.notifications.statusLabel}</Badge>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-2.5 py-4 text-center">
                    <p className="text-[11.5px] font-semibold text-ink2">{emptyCopy.notifications.title}</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                      {emptyCopy.notifications.hint}
                    </p>
                  </div>
                ) : (
                <ul className="space-y-1">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface2"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-1 size-1.5 shrink-0 rounded-full",
                            notification.tone === "pos"
                              ? "bg-pos"
                              : notification.tone === "warn"
                                ? "bg-warn"
                                : "bg-muted",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink">{notification.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-ink2">{notification.body}</p>
                          <p className="mt-1 text-[10px] text-muted">{notification.time}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                )}
                <p className="border-t border-line px-2.5 py-2 text-[10px] text-muted">
                  {integrations.notifications.detail}
                </p>
              </div>
            )}
          </Popover>

          <Popover
            label="Account"
            widthClass="w-[min(19rem,calc(100vw-2rem))]"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label="Account menu"
                aria-expanded={open}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-transparent py-1 pr-1.5 pl-1 transition-all hover:border-line hover:bg-surface2",
                  open && "border-line bg-surface2",
                )}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 text-[11px] font-bold text-white">
                  {workspace.initials}
                </span>
                <Icon name="chevronDown" size={13} className="hidden text-muted sm:block" />
              </button>
            )}
          >
            {() => (
              <div>
                <div className="flex items-center gap-3 px-2.5 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 text-xs font-bold text-white">
                    {workspace.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{workspace.name}</p>
                    <p className="truncate text-[11px] text-muted">{workspace.subtitle}</p>
                  </div>
                </div>
                <div className="border-t border-line px-2.5 py-2.5">
                  <p className="z-eyebrow mb-1.5">Linked accounts</p>
                  <p className="flex items-center gap-2 text-[11px] text-muted">
                    <Icon name="layers" size={12} />
                    {integrations.account.detail}
                  </p>
                </div>
                <div className="border-t border-line p-1.5">
                  <button
                    type="button"
                    onClick={() => navigate("settings")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ink2 transition-colors hover:bg-surface2 hover:text-ink"
                  >
                    <Icon name="settings" size={14} /> Workspace settings
                  </button>
                  <p className="px-2.5 py-2 text-[10px] leading-relaxed text-muted">
                    {product.version} · Frontend preview, no account system connected.
                  </p>
                </div>
              </div>
            )}
          </Popover>
        </div>
      </div>

      <div className="border-t border-line px-3 py-2 md:hidden">
        <ModeDropdown modes={aiModes} active={mode} onChange={setMode} />
      </div>
    </header>
  );
}
