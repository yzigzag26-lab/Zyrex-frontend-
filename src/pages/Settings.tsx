import { useRef, useState } from "react";
import { connectors as connectorCatalog, product } from "../data/appConfig";
import { useZyrex } from "../store/ZyrexProvider";
import { useAuth } from "../auth/AuthProvider";
import { DEV_AUTH_NOTICE } from "../auth/devAuth";
import { PageShell } from "../components/layout/PageShell";
import { Badge, Button, Panel, PanelHeader, Select, Toggle } from "../components/ui/Controls";
import { ConnectionPill } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";
import { cn } from "../utils/cn";
import { HermesLogo } from "../components/brand/HermesLogo";
import type { Theme } from "../types";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE = 4 * 1024 * 1024;

function SettingRow({ label, children }: { label: string; children: import("react").ReactNode }) {
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
    setTheme,
    aiStatus,
    aiStatusDetail,
    aiStatusLabel,
    recheckAiConnection,
    profile,
    updateProfile,
    setFeedback,
    exportLocalData,
    deleteLocalData,
  } = useZyrex();
  const { signOut, session: authSession } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setUploadError("Use PNG, JPEG or WebP.");
      return;
    }
    if (file.size > MAX_IMAGE) {
      setUploadError("Image must be 4MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFile(file);
      const result = updateProfile({
        imageDataUrl: dataUrl,
        imageName: file.name,
        imageUpdatedAt: new Date().toISOString(),
      });
      setFeedback(result);
    } catch {
      setUploadError("Could not read that image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      eyebrow="Workspace"
      title="Settings"
      subtitle="Preferences are stored on this device until Supabase is connected. Unimplemented actions do not fake success."
      actions={
        <>
          <Badge tone="neutral">{product.version}</Badge>
          <Button variant="subtle" size="sm" icon="refresh" onClick={resetSettings}>
            Reset defaults
          </Button>
        </>
      }
    >
      <Panel>
        <PanelHeader title="Profile" subtitle="Admin identity for this private workspace" icon="user" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            {profile.imageDataUrl ? (
              <img src={profile.imageDataUrl} alt="" className="size-24 rounded-2xl object-cover" />
            ) : (
              <span className="grid size-24 place-items-center rounded-2xl border border-line bg-surface2">
                <HermesLogo size={56} />
              </span>
            )}
            <Button size="xs" variant="subtle" icon="camera" onClick={() => fileRef.current?.click()}>
              {uploading ? "Reading…" : "Replace"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                void onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <p className="max-w-[12rem] text-center text-[10.5px] leading-relaxed text-muted">
              {profile.imageDataUrl
                ? "Preview saved on this device. Supabase Storage is not connected, so this is not a permanent cloud copy."
                : "No image stored."}
            </p>
            {uploadError && <p className="text-[11px] text-neg">{uploadError}</p>}
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-[12px] font-medium text-ink2" htmlFor="display-name">
              Display name
            </label>
            <input
              id="display-name"
              value={profile.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              className="mt-1 h-10 w-full max-w-sm rounded-xl border border-line bg-surface2 px-3 text-sm"
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Appearance" subtitle="Theme preference" icon="sun" />
        <div className="grid gap-2 p-4 sm:grid-cols-3 sm:p-5">
          {(["dark", "light", "system"] as Theme[]).map((option) => {
            const active = theme === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(option)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left",
                  active ? "border-gold/40 bg-gold/10" : "border-line hover:bg-surface2",
                )}
              >
                <Icon name={option === "light" ? "sun" : option === "dark" ? "moon" : "cpu"} size={16} />
                <span>
                  <span className="block text-[13px] font-semibold capitalize">{option}</span>
                  <span className="block text-[11px] text-muted">
                    {option === "system" ? "Follow device setting" : `${option} interface`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="AI preferences" subtitle="Response behaviour" icon="spark" />
          <div className="space-y-3 p-4 sm:p-5">
            <SettingRow label="Response detail">
              <Select
                label="Response detail"
                value={settings.aiPreferences.responseDetail}
                onChange={(value) =>
                  updateSettings("aiPreferences", { responseDetail: value as "concise" | "balanced" | "deep" })
                }
                options={["concise", "balanced", "deep"]}
                className="w-32"
              />
            </SettingRow>
            <SettingRow label="Analysis detail">
              <Select
                label="Analysis detail"
                value={settings.aiPreferences.analysisDetail}
                onChange={(value) =>
                  updateSettings("aiPreferences", {
                    analysisDetail: value as "overview" | "standard" | "exhaustive",
                  })
                }
                options={["overview", "standard", "exhaustive"]}
                className="w-36"
              />
            </SettingRow>
            <Toggle
              label="Show pattern confidence"
              description="Display confidence scoring when the backend provides it."
              checked={settings.aiPreferences.showConfidence}
              onChange={(value) => updateSettings("aiPreferences", { showConfidence: value })}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Market preferences" subtitle="Defaults for this workspace" icon="target" />
          <div className="space-y-3 p-4 sm:p-5">
            <label className="block text-[12px] font-medium text-ink2">Preferred instruments</label>
            <input
              value={settings.marketPreferences.preferredInstruments}
              onChange={(e) => updateSettings("marketPreferences", { preferredInstruments: e.target.value })}
              placeholder="e.g. BTCUSDT, EURUSD — stored as a preference only"
              className="h-10 w-full rounded-xl border border-line bg-surface2 px-3 text-sm"
            />
            <SettingRow label="Default market">
              <Select
                label="Default market"
                value={settings.marketPreferences.defaultMarket}
                onChange={(value) => updateSettings("marketPreferences", { defaultMarket: value })}
                options={["Not set", "Cryptocurrency", "Forex", "Stocks", "Gold"]}
                className="w-40"
              />
            </SettingRow>
            <SettingRow label="Timezone">
              <Select
                label="Timezone"
                value={settings.marketPreferences.timezone}
                onChange={(value) => updateSettings("marketPreferences", { timezone: value })}
                options={["UTC", "Africa/Lagos", "Europe/London", "America/New_York", "Asia/Singapore"]}
                className="w-44"
              />
            </SettingRow>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Connectors"
          subtitle="Broker and exchange integrations. Credentials are never collected here."
          icon="layers"
        />
        <ul className="divide-y divide-line">
          {connectorCatalog.map((connector) => (
            <li key={connector.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface2 text-[11px] font-bold">
                  {connector.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{connector.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink2">{connector.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionPill state="disconnected" label="Not connected" />
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() =>
                    setFeedback({
                      tone: "info",
                      message: `${connector.name} cannot be connected from this frontend. Broker credentials must be handled by a secure backend.`,
                    })
                  }
                >
                  Connect
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-3 text-[11px] text-muted sm:px-5">
          Binance is listed first. Additional venues appear only when they are genuinely supported.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Notifications" subtitle="Preferences only — no delivery channel" icon="bell" />
          <div className="p-4 sm:p-5">
            <Toggle
              label="Weekly review"
              description="Would send a Monday summary once a channel exists."
              checked={settings.notifications.weeklyReview}
              onChange={(value) => updateSettings("notifications", { weeklyReview: value })}
            />
            <Toggle
              label="Drawdown alerts"
              description="Would notify near a loss limit once a channel exists."
              checked={settings.notifications.drawdownAlerts}
              onChange={(value) => updateSettings("notifications", { drawdownAlerts: value })}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Privacy" subtitle="Local data controls" icon="shield" />
          <div className="space-y-3 p-4 sm:p-5">
            <Toggle
              label="Allow sharing"
              description="Sharing is unavailable until a secure sharing service exists."
              checked={settings.privacy.allowSharing}
              onChange={(value) => updateSettings("privacy", { allowSharing: value })}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="subtle" icon="download" onClick={exportLocalData}>
                Export local data
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon="trash"
                onClick={() => {
                  if (window.confirm("Delete journal, chats, strategies and profile cache on this device?")) {
                    setFeedback(deleteLocalData());
                  }
                }}
              >
                Delete local data
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Security" subtitle="Session and authentication" icon="lock" />
          <div className="space-y-3 p-4 sm:p-5">
            <p className="text-[12.5px] leading-relaxed text-ink2">{DEV_AUTH_NOTICE}</p>
            <p className="text-[12px] text-muted">
              Session started{" "}
              {authSession
                ? new Date(authSession.createdAt).toLocaleString()
                : "this visit"}
              . Stored in sessionStorage, not localStorage.
            </p>
            <Button size="sm" variant="subtle" icon="logout" onClick={signOut}>
              End session
            </Button>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Trading safety" subtitle="Execution is not connected" icon="alert" />
          <div className="p-4 sm:p-5">
            <SettingRow label="Trading mode">
              <Select
                label="Trading mode"
                value={settings.tradingSafety.tradingMode}
                onChange={(value) =>
                  updateSettings("tradingSafety", {
                    tradingMode: value as typeof settings.tradingSafety.tradingMode,
                  })
                }
                options={["not_configured", "paper", "live", "disabled"]}
                className="w-40"
              />
            </SettingRow>
            <Toggle
              label="Confirm live orders"
              description="A future execution layer should require confirmation. This toggle does not place orders."
              checked={settings.tradingSafety.confirmLiveOrders}
              onChange={(value) => updateSettings("tradingSafety", { confirmLiveOrders: value })}
            />
            <p className="text-[11px] text-muted">
              Changing mode only stores a preference. No broker orders are sent from this interface.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="AI service" subtitle="Existing WebSocket backend" icon="cpu" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[13px] font-semibold text-ink">HERMES AI backend</p>
            <p className="mt-1 text-[12px] text-ink2">{aiStatusDetail}</p>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionPill state={aiStatus} label={aiStatusLabel} />
            <Button
              size="xs"
              variant="subtle"
              icon="refresh"
              onClick={recheckAiConnection}
              disabled={aiStatus === "connecting"}
            >
              Re-check
            </Button>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
