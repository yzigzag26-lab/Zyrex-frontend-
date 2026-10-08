import { useState } from "react";
import { emptyCopy } from "../data/appConfig";
import {
  directionPerformance,
  disciplineScatter,
  equityCurve,
  metrics,
  psychologyFindings,
  rDistribution,
  riskMetrics,
  sessionPerformance,
  setupPerformance,
  symbolPerformance,
  winLossSplit,
} from "../data/dataset";
import { PageShell } from "../components/layout/PageShell";
import { EquityCurve } from "../components/charts/EquityCurve";
import { DistributionChart, HBarChart, StackedBar } from "../components/charts/Bars";
import { DonutChart, ScatterChart } from "../components/charts/Extras";
import { PerformanceGrid } from "../components/intelligence/PerformanceCard";
import { RiskCard } from "../components/intelligence/RiskCard";
import { PsychologyCard } from "../components/intelligence/PsychologyCard";
import { Badge, Panel, PanelHeader, Tabs } from "../components/ui/Controls";
import { ChartPlaceholder, DataUnavailable } from "../components/ui/EmptyStates";
import { formatR } from "../utils/format";
import type { GroupPerformance } from "../types";

/** Converts a performance group into comparison bars. */
function toBars(groups: GroupPerformance[]) {
  return groups.map((group) => ({
    label: group.label,
    value: group.expectancy,
    display: formatR(group.expectancy),
    tone: (group.expectancy >= 0.5 ? "pos" : group.expectancy >= 0 ? "warn" : "neg") as
      | "pos"
      | "neg"
      | "warn",
    meta: `${group.trades} trades · ${group.winRate}% WR`,
  }));
}

type AnalyticsTab = "overview" | "breakdown" | "risk" | "psychology";

/** Breakdown dimensions — each renders real data when the dataset has it. */
const breakdownGroups = [
  {
    title: "Session Performance",
    subtitle: "Expectancy by trading session",
    icon: "clock" as const,
    data: sessionPerformance,
  },
  {
    title: "Setup Performance",
    subtitle: "Expectancy by setup type",
    icon: "target" as const,
    data: setupPerformance,
  },
  {
    title: "Direction Performance",
    subtitle: "Long vs short edge",
    icon: "trendUp" as const,
    data: directionPerformance,
  },
  {
    title: "Symbol Performance",
    subtitle: "Net PnL by instrument",
    icon: "layers" as const,
    data: symbolPerformance,
  },
];

/** Primary empty state for the whole page. */
function AnalyticsUnavailable() {
  return (
    <Panel className="z-rise">
      <div className="flex flex-col items-center px-5 py-10 text-center sm:py-14">
        <span className="grid size-14 place-items-center rounded-2xl border border-dashed border-line bg-surface2/50 text-muted">
          <ChartGlyph />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-ink sm:text-xl">
          {emptyCopy.analytics.title}
        </h2>
        <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-ink2">
          {emptyCopy.analytics.hint}
        </p>
        <p className="mt-4 max-w-md text-[11px] leading-relaxed text-muted">
          Every chart on this page renders from your closed trades. Import a trade history or start
          journalling and the equity curve, distributions, session and setup breakdowns appear
          automatically.
        </p>
      </div>
    </Panel>
  );
}

function ChartGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 20h16" strokeLinecap="round" />
      <path d="M7 16V10" strokeLinecap="round" />
      <path d="M12 16V5" strokeLinecap="round" />
      <path d="M17 16v-4" strokeLinecap="round" />
    </svg>
  );
}

export function Analytics() {
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const hasTradeHistory = (metrics?.totalTrades ?? 0) > 0;

  return (
    <PageShell
      eyebrow="Performance Intelligence"
      title="Analytics"
      subtitle="Equity, distributions, session and setup breakdowns, risk and psychology correlation."
      wide
      actions={<Badge tone="neutral" icon="info">{metrics?.totalTrades ?? 0} trades available</Badge>}
    >
      <Tabs<AnalyticsTab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview", icon: "grid" },
          { id: "breakdown", label: "Breakdown", icon: "layers" },
          { id: "risk", label: "Risk", icon: "shield" },
          { id: "psychology", label: "Psychology", icon: "brain" },
        ]}
        className="max-w-2xl"
      />

      {!hasTradeHistory && <AnalyticsUnavailable />}

      {tab === "overview" && (
        <div className="space-y-4 sm:space-y-5">
          <PerformanceGrid metrics={hasTradeHistory ? metrics : null} />

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader title="Equity Curve" subtitle="Cumulative equity" icon="trendUp" />
              <div className="p-4 sm:p-5">
                {equityCurve.length > 1 ? (
                  <EquityCurve data={equityCurve} height={250} />
                ) : (
                  <ChartPlaceholder
                    title={emptyCopy.chart.title}
                    hint={emptyCopy.chart.hint}
                    height={250}
                    icon="trendUp"
                  />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Win / Loss Split" subtitle="Closed trades" icon="target" />
              <div className="p-5">
                {winLossSplit ? (
                  <>
                    <DonutChart
                      centerValue={`${metrics?.winRate ?? 0}%`}
                      centerLabel="Win rate"
                      segments={[
                        { label: "Wins", value: winLossSplit.wins, color: "#22C55E" },
                        { label: "Losses", value: winLossSplit.losses, color: "#EF4444" },
                        { label: "Breakeven", value: winLossSplit.breakeven, color: "#64748B" },
                      ]}
                    />
                    <div className="mt-5 border-t border-line pt-4">
                      <StackedBar
                        segments={[
                          { label: "Wins", value: winLossSplit.wins, tone: "pos" },
                          { label: "Losses", value: winLossSplit.losses, tone: "neg" },
                          { label: "Breakeven", value: winLossSplit.breakeven, tone: "neutral" },
                        ]}
                      />
                    </div>
                  </>
                ) : (
                  <ChartPlaceholder
                    title="No outcomes recorded"
                    hint="Win / loss / breakeven split appears here"
                    height={190}
                    icon="target"
                    axes={false}
                  />
                )}
              </div>
            </Panel>
          </div>

          <Panel>
            <PanelHeader title="R-Multiple Distribution" subtitle="Outcomes across risk units" icon="chart" />
            <div className="p-4 sm:p-5">
              {rDistribution.length > 0 ? (
                <DistributionChart data={rDistribution} />
              ) : (
                <ChartPlaceholder
                  title="No R-multiples yet"
                  hint="Distribution populates once trades with risk data exist"
                  height={200}
                  icon="chart"
                />
              )}
            </div>
          </Panel>
        </div>
      )}

      {tab === "breakdown" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {breakdownGroups.map((group) => (
            <Panel key={group.title}>
              <PanelHeader title={group.title} subtitle={group.subtitle} icon={group.icon} />
              <div className="p-4 sm:p-5">
                {group.data.length > 0 ? (
                  <HBarChart data={toBars(group.data)} />
                ) : (
                  <>
                    <DataUnavailable
                      title={emptyCopy.metrics.title}
                      hint={emptyCopy.metrics.hint}
                      icon={group.icon}
                      size="sm"
                    />
                    <p className="mt-3 text-center text-[10.5px] text-muted">
                      {group.title.replace(" Performance", "")} breakdowns appear here
                    </p>
                  </>
                )}
              </div>
            </Panel>
          ))}
          <Panel className="lg:col-span-2">
            <PanelHeader title="All Dimensions" subtitle="Win rate compared side by side" icon="chart" />
            <div className="grid gap-6 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
              {breakdownGroups.map((group) => (
                <div key={group.title}>
                  <p className="z-eyebrow mb-3">{group.title.replace(" Performance", "")}</p>
                  {group.data.length > 0 ? (
                    <HBarChart
                      data={group.data.map((item) => ({
                        label: item.label,
                        value: item.winRate,
                        display: `${item.winRate}%`,
                        tone: (item.winRate >= 55 ? "accent" : "warn") as "accent" | "warn",
                      }))}
                    />
                  ) : (
                    <ChartPlaceholder title="No data available" height={120} axes={false} />
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "risk" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <RiskCard items={riskMetrics} />
          </div>
          <Panel>
            <PanelHeader title="Drawdown Profile" subtitle="Rolling peak-to-trough in R" icon="trendDown" />
            <div className="p-4 sm:p-5">
              <ChartPlaceholder
                title="No drawdown data"
                hint="Requires a sequence of closed trades"
                height={200}
                icon="trendDown"
              />
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Risk Exposure" subtitle="Distribution of risk per trade" icon="shield" />
            <div className="p-4 sm:p-5">
              <ChartPlaceholder
                title="No position sizing data"
                hint="Risk per trade appears once entries are logged"
                height={200}
                icon="shield"
                axes={false}
              />
            </div>
          </Panel>
        </div>
      )}

      {tab === "psychology" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <PsychologyCard findings={psychologyFindings} />
          </div>
          <Panel>
            <PanelHeader
              title="Discipline vs Outcome"
              subtitle="Self-scored discipline against realised R"
              icon="cpu"
            />
            <div className="p-4 sm:p-5">
              {disciplineScatter.length > 0 ? (
                <ScatterChart
                  points={disciplineScatter}
                  xLabel="Discipline score"
                  yLabel="R multiple"
                />
              ) : (
                <ChartPlaceholder
                  title="No discipline scores yet"
                  hint="Score discipline on your journal entries to build this view"
                  height={200}
                  icon="cpu"
                />
              )}
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Emotion → Outcome" subtitle="Average R by emotion at entry" icon="brain" />
            <div className="p-4 sm:p-5">
              {psychologyFindings.length > 0 ? (
                <HBarChart
                  data={psychologyFindings.map((finding) => ({
                    label: finding.emotion,
                    value: finding.avgR,
                    display: formatR(finding.avgR),
                    tone: (finding.avgR >= 0.5
                      ? "pos"
                      : finding.avgR >= 0
                        ? "warn"
                        : "neg") as "pos" | "neg" | "warn",
                    meta: `${finding.trades} trades`,
                  }))}
                />
              ) : (
                <ChartPlaceholder
                  title="No emotion data yet"
                  hint="Log emotion before, during and after each trade"
                  height={200}
                  icon="brain"
                  axes={false}
                />
              )}
            </div>
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
