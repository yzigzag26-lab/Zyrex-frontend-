import type {
  Conversation,
  EquityPoint,
  GroupPerformance,
  IntegrationPoint,
  PatternInsight,
  PerformanceMetrics,
  PsychologyFinding,
  ResearchProject,
  RiskMetric,
  Trade,
} from "../types";
import { integrations } from "./appConfig";
import { aiBackend } from "../lib/zyrexApi";

/**
 * ============================================================================
 * ZYREX AI — DATA SOURCE
 * ============================================================================
 *
 * This is the ONLY module the UI reads trading intelligence from. Every export
 * is empty or `null` because no backend is connected yet.
 *
 * When the real layer is available, replace the bodies below with live reads
 * (e.g. `await listTrades()`, `await getMetrics()`, `await requestAnalysis()`)
 * and keep the signatures identical. No component needs to change.
 *
 * There is intentionally NO mock, sample or simulated data in this file.
 * ============================================================================
 */

/* --------------------------------------------------------------- connection */

/**
 * Aggregate readiness flags derived from the integration registry.
 * `aiConnected` reflects configuration only — the live, measured state is
 * `useZyrex().aiStatus` (a real probe, never an assumption).
 */
export const connection = {
  aiConnected: Boolean(aiBackend.baseUrl),
  tradeDataConnected: integrations.tradeData.state === "connected",
  accountConnected: integrations.account.state === "connected",
  notificationsConnected: integrations.notifications.state === "connected",
} as const;

export function getIntegration(id: IntegrationPoint["id"]): IntegrationPoint {
  return integrations[id];
}

/* -------------------------------------------------------------------- trades */

/** Journal entries. Empty until trades are imported or journalled. */
export const trades: Trade[] = [];

export function getTradeById(id: string): Trade | undefined {
  return trades.find((trade) => trade.id === id);
}

/* ------------------------------------------------------------------- metrics */

/** Aggregate performance. `null` until at least one trade exists. */
export const metrics: PerformanceMetrics | null = null;

export const equityCurve: EquityPoint[] = [];

export const sessionPerformance: GroupPerformance[] = [];
export const setupPerformance: GroupPerformance[] = [];
export const directionPerformance: GroupPerformance[] = [];
export const symbolPerformance: GroupPerformance[] = [];

export const rDistribution: { label: string; count: number; tone: "pos" | "neg" | "neutral" }[] = [];

export const winLossSplit: { wins: number; losses: number; breakeven: number } | null = null;

/* ------------------------------------------------------- risk / psychology */

/** Risk findings — computed from real trades only. */
export const riskMetrics: RiskMetric[] = [];

/** Psychology findings — requires self-scored entries to exist. */
export const psychologyFindings: PsychologyFinding[] = [];

/** Patterns — produced by the ZYREX AI engine, never invented locally. */
export const patternInsights: PatternInsight[] = [];

/**
 * Discipline-vs-outcome scatter points.
 * Derived from journal entries that have both a discipline score and an
 * R-multiple — empty until those entries exist.
 */
export const disciplineScatter: {
  x: number;
  y: number;
  tone: "pos" | "neg" | "neutral";
}[] = [];

/* ----------------------------------------------------------------- research */

export const researchProjects: ResearchProject[] = [];

/* ------------------------------------------------------------- conversations */

/** Conversation history. Empty until the user starts a session. */
export const conversations: Conversation[] = [];

export const notifications: {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: "pos" | "neg" | "warn" | "neutral";
}[] = [];

/* ------------------------------------------------------------ AI request API */

/**
 * The single integration point for the ZYREX AI backend.
 *
 * Implemented in `src/lib/zyrexApi.ts` — it streams the prompt response over WebSocket,
 * normalizes the answer into `ResponseBlock[]`, and reports `offline` with the
 * real reason when the backend cannot be reached. No answer is ever invented.
 */
export { requestAnalysis } from "../lib/zyrexApi";
export type { AnalysisRequest } from "../types";

/** Human-readable reason an analysis cannot run, for use in empty states. */
export const analysisUnavailableReason: string = integrations.ai.requiredFor;
