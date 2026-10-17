import { useZyrex } from "../../store/ZyrexProvider";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "../../pages/Dashboard";
import { JournalPage } from "../../pages/Journal";
import { SettingsPage } from "../../pages/Settings";
import { Analytics } from "../../pages/Analytics";
import { Research } from "../../pages/Research";
import { AIPage } from "../../pages/AI";

export function AppShell() {
  const { page } = useZyrex();

  return (
    <div className="h-screen w-screen flex bg-[#212121] overflow-hidden text-white font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-full min-w-0 flex flex-col bg-[#212121] overflow-hidden text-white">
        {page === "ai" || page === "journal" || page === "recent" ? (
          <AIPage />
        ) : page === "dashboard" ? (
          <Dashboard />
        ) : page === "analytics" ? (
          <Analytics />
        ) : page === "research" ? (
          <Research />
        ) : page === "settings" ? (
          <SettingsPage />
        ) : (
          <JournalPage />
        )}
      </main>
    </div>
  );
}
