import { useZyrex } from "../../store/ZyrexProvider";
import type { PageId } from "../../types";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Dashboard } from "../../pages/Dashboard";
import { JournalPage } from "../../pages/Journal";
import { Recent } from "../../pages/Recent";
import { SettingsPage } from "../../pages/Settings";
import { Analytics } from "../../pages/Analytics";
import { Research } from "../../pages/Research";
import { AIPage } from "../../pages/AI";
import { AIFloatingButton } from "../chat/AIFloatingButton";
import { AIPanel } from "../chat/AIPanel";
import { cn } from "../../utils/cn";

/**
 * Every PageId maps to its own screen. Typing the parameter means a new page
 * cannot be added to navigation without being routed here.
 */
function renderPage(page: PageId) {
  switch (page) {
    case "journal":
      return <JournalPage />;
    case "recent":
      return <Recent />;
    case "settings":
      return <SettingsPage />;
    case "analytics":
      return <Analytics />;
    case "research":
      return <Research />;
    case "ai":
      return <AIPage />;
    case "dashboard":
      return <Dashboard />;
  }
}

export function AppShell() {
  const { page, aiPopupOpen, toggleAIPopup } = useZyrex();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-xs focus:text-ink"
      >
        Skip to content
      </a>
      <TopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main
          id="main"
          key={page}
          className="z-scroll z-fade min-h-0 min-w-0 flex-1 overflow-y-auto"
          aria-live="polite"
        >
          {renderPage(page)}
        </main>
      </div>
      <div className={cn("ai-dock", aiPopupOpen && "open")}>
        <AIFloatingButton onClick={toggleAIPopup} isOpen={aiPopupOpen} />
        <AIPanel isOpen={aiPopupOpen} onClose={toggleAIPopup} />
      </div>
    </div>
  );
}
