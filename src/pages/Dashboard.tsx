import {
  emptyCopy,
  integrations,
  onboardingSteps,
} from "../data/appConfig";
import {
  equityCurve,
  metrics,
  patternInsights,
  psychologyFindings,
  sessionPerformance,
  setupPerformance,
  trades,
} from "../data/dataset";
import { useZyrex } from "../store/ZyrexProvider";
import { EquityCurve } from "../components/charts/EquityCurve";
import { HBarChart } from "../components/charts/Bars";
import { formatR } from "../utils/format";
import { PageShell } from "../components/layout/PageShell";
import { PerformanceGrid } from "../components/intelligence/PerformanceCard";
import { PatternCard } from "../components/intelligence/PatternCard";
import { TradeTable } from "../components/intelligence/TradeTable";
import { Badge, Button, Panel, PanelHeader } from "../components/ui/Controls";
import { ChartPlaceholder, ConnectionPill, DataUnavailable } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";

/** Onboarding checklist shown while no trading data exists. */
function OnboardingPanel() {
  const { navigate } = useZyrex();

  return (
    <Panel className="z-rise">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div>
          <ConnectionPill state="disconnected" label="No trading data found" />
          <h2 className="mt-4 text-xl font-semibold text-ink sm:text-[1.625rem]">
            {emptyCopy.dashboard.title}
          </h2>
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-ink2">
            ZYREX AI is ready to analyze your trading. Metrics, analytics and pattern detection
            activate automatically once trade history exists — nothing is estimated in the meantime.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" icon="download" onClick={() => navigate("journal")}>
              Import trades
            </Button>
          </div>
        </div>

        <div>
          <p className="z-eyebrow mb-3.5">To begin</p>
          <ol className="space-y-2.5">
            {onboardingSteps.map((step) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => navigate(step.target)}
                  className="group flex w-full items-start gap-3.5 rounded-xl border border-line bg-surface/60 p-3.5 text-left transition-all hover:border-accent/40 hover:bg-surface2"
                >
                  <span className="z-num grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-[11px] font-semibold text-ink2">
                    {step.index}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">{step.title}</span>
                      <Icon
                        name="arrowRight"
                        size={12}
                        className="text-muted transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-ink2">
                      {step.detail}
                    </span>
                  </span>
                  <Icon name={step.icon} size={15} className="mt-0.5 shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Panel>
  );
}

/** Integration status panel — states what the workspace is waiting on. */
function IntegrationPanel() {
  const list = Object.values(integrations);
  return (
    <Panel>
      <PanelHeader
        title="Connections"
        subtitle="What this workspace is waiting on"
        icon="cpu"
        actions={<Badge tone="neutral">{list.length} integrations</Badge>}
      />
      <ul className="divide-y divide-line">
        {list.map((integration) => (
          <li key={integration.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-muted">
              <Icon
                name={integration.id === "ai" ? "spark" : integration.id === "tradeData" ? "layers" : integration.id === "account" ? "user" : "bell"}
                size={14}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-ink">{integration.label}</p>
                <ConnectionPill state={integration.state} label={integration.statusLabel} />
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">{integration.detail}</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                Enables: {integration.requiredFor}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function Dashboard() {
  const { navigate, hasTradeData } = useZyrex();

  return (
    <PageShell
      eyebrow="Performance Overview"
      title="Dashboard"
      subtitle={
        hasTradeData
          ? "Aggregate performance across your connected trading data."
          : "Your trading intelligence workspace is ready and waiting for data."
      }
      wide
      actions={
        <>
          <ConnectionPill state="disconnected" label="No data source" className="hidden sm:inline-flex" />
          <Button variant="subtle" size="sm" icon="download" onClick={() => navigate("journal")}>
            Import trades
          </Button>
        </>
      }
    >
      {!hasTradeData && <OnboardingPanel />}

      <PerformanceGrid metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Equity Curve"
            subtitle="Cumulative account equity"
            eyebrow="Account"
            icon="trendUp"
            actions={
              <Badge tone="neutral" icon="info">
                {emptyCopy.chart.title}
              </Badge>
            }
          />
          <div className="p-4 sm:p-5">
            {equityCurve.length > 1 ? (
              <EquityCurve data={equityCurve} height={260} />
            ) : (
              <ChartPlaceholder
                title={emptyCopy.chart.title}
                hint={emptyCopy.chart.hint}
                height={260}
                icon="trendUp"
              />
            )}
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader
            title="ZYREX Intelligence"
            subtitle="Signals detected in your journal"
            eyebrow="Pattern Detection"
            icon="spark"
            actions={<ConnectionPill state="disconnected" label="Offline" />}
          />
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            {patternInsights.length > 0 ? (
              patternInsights.map((insight) => (
                <PatternCard key={insight.id} insight={insight} variant="inline" />
              ))
            ) : (
              <>
                <DataUnavailable
                  title="No patterns detected"
                  hint="ZYREX AI detects patterns once trade history and the analysis backend are connected."
                  icon="target"
                  size="sm"
                  className="flex-1"
                />
                <div className="rounded-xl border border-dashed border-line bg-surface2/40 p-3">
                  <p className="z-eyebrow mb-2">Pattern detection requires</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-[11px] text-ink2">
                      <Icon name="layers" size={12} className="text-muted" />
                      Imported trade history
                    </li>
                    <li className="flex items-center gap-2 text-[11px] text-ink2">
                      <Icon name="spark" size={12} className="text-muted" />
                      Connected ZYREX AI backend
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Session Performance" subtitle="Expectancy by trading session" icon="clock" />
          <div className="p-4 sm:p-5">
            {sessionPerformance.length > 0 ? (
              <HBarChart
                data={sessionPerformance.map((group) => ({
                  label: group.label,
                  value: group.expectancy,
                  display: formatR(group.expectancy),
                  tone: (group.expectancy >= 0.5
                    ? "pos"
                    : group.expectancy >= 0
                      ? "warn"
                      : "neg") as "pos" | "neg" | "warn",
                  meta: `${group.trades} trades`,
                }))}
              />
            ) : (
              <>
                <DataUnavailable
                  title={emptyCopy.metrics.title}
                  hint={emptyCopy.metrics.hint}
                  icon="clock"
                  size="sm"
                />
                <p className="mt-3 text-center text-[10.5px] text-muted">
                  Asia · London · New York breakdowns appear here
                </p>
              </>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Setup Performance" subtitle="Expectancy by setup type" icon="target" />
          <div className="p-4 sm:p-5">
            {setupPerformance.length > 0 ? (
              <HBarChart
                data={setupPerformance.map((group) => ({
                  label: group.label,
                  value: group.expectancy,
                  display: formatR(group.expectancy),
                  tone: (group.expectancy >= 0.5
                    ? "pos"
                    : group.expectancy >= 0
                      ? "warn"
                      : "neg") as "pos" | "neg" | "warn",
                  meta: `${group.trades} trades`,
                }))}
              />
            ) : (
              <>
                <DataUnavailable
                  title={emptyCopy.metrics.title}
                  hint={emptyCopy.metrics.hint}
                  icon="target"
                  size="sm"
                />
                <p className="mt-3 text-center text-[10.5px] text-muted">
                  Setup rankings appear here once trades are tagged
                </p>
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IntegrationPanel />

        <Panel>
          <PanelHeader
            title="Psychology Readiness"
            subtitle="What is required for psychology scoring"
            icon="brain"
          />
          <div className="space-y-3 p-4 sm:p-5">
            <DataUnavailable
              title="No psychology data yet"
              hint="Confidence and discipline are scored from your own journal entries. Nothing is assumed."
              icon="brain"
              size="sm"
            />
            <ul className="space-y-2">
              {[
                "Log emotion before, during and after each trade",
                "Score discipline and confidence per entry",
                "Once scored, ZYREX correlates them with results",
              ].map((item, index) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="z-num mt-px grid size-5 shrink-0 place-items-center rounded-md border border-line bg-surface2 text-[10px] font-semibold text-ink2">
                    {index + 1}
                  </span>
                  <span className="text-[11.5px] leading-relaxed text-ink2">{item}</span>
                </li>
              ))}
            </ul>
            {psychologyFindings.length === 0 && (
              <p className="text-[10.5px] text-muted">
                No psychology findings calculated · 0 scored entries
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Recent Journal Entries"
          subtitle="Latest trades from your journal"
          icon="book"
          actions={
            <Button size="xs" variant="subtle" iconRight="arrowRight" onClick={() => navigate("journal")}>
              Open journal
            </Button>
          }
        />
        <div className="p-2 sm:p-3">
          {trades.length > 0 ? (
            <TradeTable trades={trades} onSelect={() => navigate("journal")} />
          ) : (
            <DataUnavailable
              title={emptyCopy.journal.title}
              hint={emptyCopy.journal.hint}
              icon="book"
              action={
                <>
                  <Button size="sm" variant="primary" icon="download" onClick={() => navigate("journal")}>
                    Import trades
                  </Button>
                  <Button size="sm" variant="subtle" icon="plus" onClick={() => navigate("journal")}>
                    New journal entry
                  </Button>
                </>
              }
            />
          )}
        </div>
      </Panel>
    </PageShell>
  );
}
