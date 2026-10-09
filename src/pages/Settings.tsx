import { aiModes, defaultSettings, integrations, product } from "../data/appConfig";
import { trades } from "../data/dataset";
import { useZyrex } from "../store/ZyrexProvider";
import { PageShell } from "../components/layout/PageShell";
import { Badge, Button, Panel, PanelHeader, Select, Toggle } from "../components/ui/Controls";
import { ConnectionPill } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";
import { cn } from "../utils/cn";

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 py-3 last:border-0">
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
    theme,
    toggleTheme,
    aiStatus,
    aiStatusDetail,
    aiStatusLabel,
    aiBackendUrl,
    recheckAiConnection,
  } = useZyrex();

  /**
   * The AI row reports the live probe result; every other integration is
   * still genuinely unconnected and says so.
   */
  const liveIntegrations = Object.values(integrations).map((integration) =>
    integration.id === "ai"
      ? { ...integration, state: aiStatus, statusLabel: aiStatusLabel, detail: aiStatusDetail }
      : integration,
  );

  return (
    <PageShell
      eyebrow="Workspace"
      title="Settings"
      subtitle="Preferences are stored locally in your browser. No backend settings service is used."
      actions={
        <>
          <Badge tone="neutral" icon="info">
            {product.version}
          </Badge>
          <Button variant="subtle" size="sm" icon="refresh" onClick={resetSettings}>
            Reset defaults
          </Button>
        </>
      }
    >
      <Panel>
        <PanelHeader
          title="Connections"
          subtitle="Integration status for this workspace"
          icon="cpu"
          actions={<Badge tone="neutral">{trades.length} trades available</Badge>}
        />
        <ul className="divide-y divide-line">
          {liveIntegrations.map((integration) => (
            <li key={integration.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-ink">{integration.label}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink2">{integration.detail}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                  Enables: {integration.requiredFor}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ConnectionPill state={integration.state} label={integration.statusLabel} />
                {integration.id === "ai" ? (
                  <Button
                    size="xs"
                    variant="subtle"
                    icon="refresh"
                    onClick={recheckAiConnection}
                    disabled={aiStatus === "connecting"}
                  >
                    Re-check
                  </Button>
                ) : (
                  <Button size="xs" variant="subtle" icon="external" disabled>
                    Connect
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-3 text-[10.5px] leading-relaxed text-muted sm:px-5">
          ZYREX AI backend: <span className="z-num text-ink2">{aiBackendUrl}</span> — status is
          measured live, never assumed. Other integrations have no backend attached yet, so their
          connect actions stay disabled.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Appearance" subtitle="Theme and visual density" icon="sun" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2.5">
              {(["dark", "light"] as const).map((option) => {
                const isActive = theme === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (theme !== option) toggleTheme();
                    }}
                    aria-pressed={isActive}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      isActive
                        ? "border-accent/40 bg-accent/10"
                        : "border-line bg-surface/60 hover:border-linestrong hover:bg-surface2",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-lg border",
                        isActive
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-line bg-surface2 text-ink2",
                      )}
                    >
                      <Icon name={option === "dark" ? "moon" : "sun"} size={16} />
                    </span>
                    <span>
                      <span className="block text-[12.5px] font-semibold text-ink capitalize">
                        {option}
                      </span>
                      <span className="block text-[10.5px] text-muted">
                        {option === "dark" ? "Default terminal" : "High contrast daylight"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <Toggle
              label="Accent glow"
              description="Animated energy glow around the ZYREX prompt."
              checked={settings.appearance.accentGlow}
              onChange={(value) => updateSettings("appearance", { accentGlow: value })}
            />
            <Toggle
              label="Interface animations"
              description="Card, drawer and message transitions. Reduced-motion is always respected."
              checked={settings.appearance.animations}
              onChange={(value) => updateSettings("appearance", { animations: value })}
            />
            <Toggle
              label="Compact mode"
              description="Tighter spacing across tables and cards."
              checked={settings.appearance.compactMode}
              onChange={(value) => updateSettings("appearance", { compactMode: value })}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Interface" subtitle="Layout and landing behaviour" icon="panelLeft" />
          <div className="space-y-1 p-4 sm:p-5">
            <Toggle
              label="Show equity curve"
              description="Display the equity curve panel on the dashboard."
              checked={settings.interface.showEquityCurve}
              onChange={(value) => updateSettings("interface", { showEquityCurve: value })}
            />
            <Toggle
              label="Pin sidebar"
              description="Keep navigation expanded on desktop screens."
              checked={settings.interface.sidebarPinned}
              onChange={(value) => updateSettings("interface", { sidebarPinned: value })}
            />
            <Toggle
              label="Monospace numbers"
              description="Use tabular monospace figures for prices, PnL and R-multiples."
              checked={settings.interface.monospaceNumbers}
              onChange={(value) => updateSettings("interface", { monospaceNumbers: value })}
            />
            <div className="pt-3">
              <span className="z-eyebrow mb-2 block">Default landing page</span>
              <Select
                label="Default landing page"
                value={settings.interface.defaultLanding}
                onChange={(value) =>
                  updateSettings("interface", {
                    defaultLanding: value as "dashboard" | "journal" | "ai",
                  })
                }
                options={["dashboard", "journal", "ai"]}
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="AI Preferences" subtitle="Presentation modes and response style" icon="spark" />
          <div className="space-y-1 p-4 sm:p-5">
            <div className="pb-3">
              <span className="z-eyebrow mb-2 block">Default mode</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {aiModes.map((mode) => {
                  const isActive = settings.aiPreferences.defaultMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateSettings("aiPreferences", { defaultMode: mode.id })}
                      aria-pressed={isActive}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        isActive
                          ? "border-accent/40 bg-accent/10"
                          : "border-line bg-surface/60 hover:border-linestrong hover:bg-surface2",
                      )}
                    >
                      <span className="block text-[12px] font-semibold text-ink">{mode.name}</span>
                      <span className="mt-1 block text-[10.5px] leading-relaxed text-muted">
                        {mode.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="py-2">
              <span className="z-eyebrow mb-2 block">Response detail</span>
              <Select
                label="Response detail"
                value={settings.aiPreferences.responseDetail}
                onChange={(value) =>
                  updateSettings("aiPreferences", {
                    responseDetail: value as "concise" | "balanced" | "deep",
                  })
                }
                options={["concise", "balanced", "deep"]}
              />
            </div>
            <Toggle
              label="Show pattern confidence"
              description="Display confidence scoring on detected patterns."
              checked={settings.aiPreferences.showConfidence}
              onChange={(value) => updateSettings("aiPreferences", { showConfidence: value })}
            />
            <Toggle
              label="Auto-analyze after journaling"
              description="Queue a ZYREX review whenever a new trade is logged."
              checked={settings.aiPreferences.autoAnalyzeAfterTrade}
              onChange={(value) => updateSettings("aiPreferences", { autoAnalyzeAfterTrade: value })}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Trading Preferences" subtitle="Units and defaults" icon="chart" />
          <div className="p-4 sm:p-5">
            <SettingRow label="Base currency">
              <Select
                label="Base currency"
                value={settings.tradingPreferences.baseCurrency}
                onChange={(value) => updateSettings("tradingPreferences", { baseCurrency: value })}
                options={["USD", "EUR", "USDT"]}
                className="w-24"
              />
            </SettingRow>
            <SettingRow label="Risk unit">
              <Select
                label="Risk unit"
                value={settings.tradingPreferences.riskUnit}
                onChange={(value) =>
                  updateSettings("tradingPreferences", { riskUnit: value as "R" | "USD" | "Percent" })
                }
                options={["R", "USD", "Percent"]}
                className="w-28"
              />
            </SettingRow>
            <SettingRow label="Default session">
              <Select
                label="Default session"
                value={settings.tradingPreferences.defaultSession}
                onChange={(value) =>
                  updateSettings("tradingPreferences", {
                    defaultSession: value as "All" | "Asia" | "London" | "New York",
                  })
                }
                options={["All", "Asia", "London", "New York"]}
                className="w-32"
              />
            </SettingRow>
            <Toggle
              label="Include fees in PnL"
              description="Net figures subtract commissions and funding."
              checked={settings.tradingPreferences.includeFeesInPnl}
              onChange={(value) => updateSettings("tradingPreferences", { includeFeesInPnl: value })}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Notifications"
            subtitle="Preferences only — no delivery channel is connected"
            icon="bell"
          />
          <div className="space-y-1 p-4 sm:p-5">
            <Toggle
              label="Weekly review"
              description="Monday summary of the previous trading week."
              checked={settings.notifications.weeklyReview}
              onChange={(value) => updateSettings("notifications", { weeklyReview: value })}
            />
            <Toggle
              label="Drawdown alerts"
              description="Notify when approaching your weekly loss limit."
              checked={settings.notifications.drawdownAlerts}
              onChange={(value) => updateSettings("notifications", { drawdownAlerts: value })}
            />
            <Toggle
              label="Pattern detected"
              description="Alert when a pattern crosses your confidence threshold."
              checked={settings.notifications.patternDetected}
              onChange={(value) => updateSettings("notifications", { patternDetected: value })}
            />
            <Toggle
              label="Research updates"
              description="Alert when a research project reaches a new stage."
              checked={settings.notifications.researchUpdates}
              onChange={(value) => updateSettings("notifications", { researchUpdates: value })}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Data Display" subtitle="How journal data is presented" icon="layers" />
          <div className="p-4 sm:p-5">
            <SettingRow label="Trades per page">
              <Select
                label="Trades per page"
                value={String(settings.dataDisplay.tradesPerPage)}
                onChange={(value) => updateSettings("dataDisplay", { tradesPerPage: Number(value) })}
                options={["5", "10", "15", "20"]}
                className="w-20"
              />
            </SettingRow>
            <SettingRow label="Timezone">
              <Select
                label="Timezone"
                value={settings.dataDisplay.timezone}
                onChange={(value) => updateSettings("dataDisplay", { timezone: value })}
                options={["UTC", "Europe/London", "America/New_York", "Asia/Singapore"]}
                className="w-44"
              />
            </SettingRow>
            <SettingRow label="Date format">
              <Select
                label="Date format"
                value={settings.dataDisplay.dateFormat}
                onChange={(value) => updateSettings("dataDisplay", { dateFormat: value })}
                options={["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]}
                className="w-36"
              />
            </SettingRow>
            <Toggle
              label="Hide sub-$50 PnL entries"
              description="Filter very small results out of table views."
              checked={settings.dataDisplay.hideSmallPnl}
              onChange={(value) => updateSettings("dataDisplay", { hideSmallPnl: value })}
            />
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Data & Privacy" subtitle="What this build stores" icon="shield" />
        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-[12.5px] leading-relaxed text-ink2">
            This is a frontend shell. No trades, analytics, patterns or AI responses are available
            because no backend is connected. Preferences are saved to{" "}
            <code className="z-num rounded-md border border-line bg-surface2 px-1.5 py-0.5 text-[11px]">
              localStorage
            </code>{" "}
            in your browser. Nothing is sent to a server, exchange or model provider.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral" icon="info">
              No backend
            </Badge>
            <Badge tone="neutral" icon="info">
              No API keys
            </Badge>
            <Badge tone="neutral" icon="info">
              No exchange integration
            </Badge>
            <Badge tone="neutral" icon="info">
              No authentication
            </Badge>
            <Badge tone="neutral" icon="info">
              No simulated data
            </Badge>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Default mode: <span className="text-ink2">{defaultSettings.aiPreferences.defaultMode}</span>
          </p>
        </div>
      </Panel>
    </PageShell>
  );
}
