import { useZyrex } from "../../store/ZyrexProvider";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "../../pages/Dashboard";
import { JournalPage } from "../../pages/Journal";
import { SettingsPage } from "../../pages/Settings";
import { AIPage } from "../../pages/AI";
import { StrategiesPage } from "../../pages/Strategies";
import { Icon } from "../ui/Icons";

export function AppShell() {
  const { page, isMobile, setSidebarOpen, feedback, clearFeedback } = useZyrex();

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-bg text-ink">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg">
        {isMobile && page !== "ai" && (
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="grid size-9 place-items-center rounded-lg text-ink2 hover:bg-surface2"
            >
              <Icon name="menu" size={18} />
            </button>
            <span className="text-sm font-semibold capitalize">{page}</span>
          </div>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {page === "ai" ? (
            <AIPage />
          ) : page === "dashboard" ? (
            <div className="z-scroll h-full overflow-y-auto">
              <Dashboard />
            </div>
          ) : page === "strategies" ? (
            <div className="z-scroll h-full overflow-y-auto">
              <StrategiesPage />
            </div>
          ) : page === "journal" ? (
            <div className="z-scroll h-full overflow-y-auto">
              <JournalPage />
            </div>
          ) : (
            <div className="z-scroll h-full overflow-y-auto">
              <SettingsPage />
            </div>
          )}
        </div>
      </main>

      {feedback && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-[70] max-w-sm rounded-xl border border-line bg-surface px-4 py-3 text-[12.5px] shadow-lg"
        >
          <p className={feedback.tone === "error" ? "text-neg" : feedback.tone === "success" ? "text-pos" : "text-ink2"}>
            {feedback.message}
          </p>
          <button
            type="button"
            className="mt-2 text-[11px] text-muted hover:text-ink"
            onClick={clearFeedback}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
