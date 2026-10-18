import { emptyCopy, integrations } from "../data/appConfig";
import { trades } from "../data/dataset";
import { useZyrex } from "../store/ZyrexProvider";
import { PageShell } from "../components/layout/PageShell";
import { PieChart } from "../components/charts/PieChart";
import { Badge, Panel, PanelHeader } from "../components/ui/Controls";
import { ConnectionPill, DataUnavailable } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";
import type { ServiceStatus } from "../types";

const accountFields = [
  { id: "balance", label: "Total balance", value: "Not connected", hint: "Requires a verified broker connection" },
  { id: "available", label: "Available funds", value: "Not connected", hint: "Requires a verified broker connection" },
  { id: "equity", label: "Total equity", value: "Not connected", hint: "Requires a verified broker connection" },
  { id: "realized", label: "Realized profit/loss", value: "No data yet", hint: "No closed trades in this workspace" },
  { id: "unrealized", label: "Unrealized profit/loss", value: "No data yet", hint: "No open positions reported" },
  { id: "positions", label: "Active positions", value: "No data yet", hint: "Broker is not connected" },
  { id: "orders", label: "Open orders", value: "No data yet", hint: "Broker is not connected" },
] as const;

const activityGroups = [
  { id: "trades", label: "Recent trades", icon: "chart" as const },
  { id: "orders", label: "Recent orders", icon: "layers" as const },
  { id: "analyses", label: "Recent analyses", icon: "spark" as const },
  { id: "journal", label: "Recent journal entries", icon: "book" as const },
  { id: "system", label: "Recent system events", icon: "cpu" as const },
];

function statusLabel(state: ServiceStatus): string {
  switch (state) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting";
    case "error":
      return "Error";
    case "not_configured":
      return "Not configured";
    default:
      return "Disconnected";
  }
}

export function Dashboard() {
  const { aiStatus, aiStatusLabel, aiStatusDetail, settings, journal } = useZyrex();
  const tradingMode = settings.tradingSafety.tradingMode;

  const services: { id: string; label: string; state: ServiceStatus; detail: string }[] = [
    { id: "ai", label: "AI service", state: aiStatus, detail: aiStatusDetail },
    {
      id: "ws",
      label: "WebSocket connection",
      state: aiStatus,
      detail: "Same channel as the AI service — status is measured, not assumed.",
    },
    {
      id: "market",
      label: "Market-data service",
      state: "not_configured",
      detail: integrations.marketData.detail,
    },
    {
      id: "broker",
      label: "Connected broker",
      state: "disconnected",
      detail: integrations.account.detail,
    },
    {
      id: "mode",
      label: "Trading mode",
      state: tradingMode === "not_configured" ? "not_configured" : "disconnected",
      detail:
        tradingMode === "not_configured"
          ? "No live or paper execution is configured."
          : `Preference stored as ${tradingMode}. Execution is not connected.`,
    },
  ];

  return (
    <PageShell
      eyebrow="Overview"
      title="Dashboard"
      subtitle="Account, allocation and system status. Figures appear only from verified sources."
      wide
    >
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Account overview</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {accountFields.map((field) => (
            <Panel key={field.id} className="p-4">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{field.label}</p>
              <p className="mt-2 text-lg font-semibold text-ink2">{field.value}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{field.hint}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Financial analysis</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="p-5">
            <PieChart
              title="Portfolio allocation by asset"
              source="Connected broker holdings — none linked"
              slices={[]}
            />
          </Panel>
          <Panel className="p-5">
            <PieChart
              title="Allocation by market"
              source="Connected broker holdings — none linked"
              slices={[]}
            />
          </Panel>
          <Panel className="p-5">
            <PieChart
              title="Allocation by strategy"
              source="Executed strategy fills — none recorded"
              slices={[]}
            />
          </Panel>
        </div>
      </section>

      <section>
        <Panel>
          <PanelHeader
            title="Market overview"
            subtitle="Selected instruments"
            icon="trendUp"
            actions={<Badge tone="neutral">Not configured</Badge>}
          />
          <div className="p-5">
            <DataUnavailable
              title={emptyCopy.market.title}
              hint={emptyCopy.market.hint}
              icon="trendUp"
              size="sm"
            />
          </div>
        </Panel>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent activity</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activityGroups.map((group) => {
            const journalCount = group.id === "journal" ? journal.length : 0;
            const analysisCount = group.id === "analyses" ? journal.filter((e) => e.source === "ai-analysis").length : 0;
            const count = group.id === "journal" ? journalCount : group.id === "analyses" ? analysisCount : trades.length;
            return (
              <Panel key={group.id} className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name={group.icon} size={15} className="text-muted" />
                  <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
                </div>
                {count === 0 ? (
                  <p className="text-[12px] text-muted">{emptyCopy.activity.hint}</p>
                ) : group.id === "journal" ? (
                  <ul className="space-y-2">
                    {journal.slice(0, 4).map((entry) => (
                      <li key={entry.id} className="truncate text-[12.5px] text-ink2">
                        {entry.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-muted">{emptyCopy.activity.hint}</p>
                )}
              </Panel>
            );
          })}
        </div>
      </section>

      <section>
        <Panel>
          <PanelHeader title="System status" subtitle="Verified connections only" icon="cpu" />
          <ul className="divide-y divide-line">
            {services.map((service) => (
              <li key={service.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{service.label}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink2">{service.detail}</p>
                </div>
                <ConnectionPill
                  state={service.state === "not_configured" ? "disconnected" : service.state}
                  label={service.id === "ai" ? aiStatusLabel : statusLabel(service.state)}
                />
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </PageShell>
  );
}
