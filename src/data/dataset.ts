import type {
  AiModeId,
  AnalysisResult,
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

/** Aggregate readiness flags derived from the integration registry. */
export const connection = {
  aiConnected: true,
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

export interface AnalysisRequest {
  prompt: string;
  mode: AiModeId;
  history?: Array<{ role: "user" | "zyrex"; text?: string }>;
}

/**
 * The single integration point for the ZYREX AI backend.
 *
 * Currently returns an `offline` result for every request, which the chat
 * surface renders as the connection notice. When a real endpoint exists,
 * replace the body with the request and return `{ status: "ready", ... }`
 * with a `ResponseBlock[]` payload — the renderer already supports it.
 */
export async function requestAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const endpoint = apiUrl ? `${apiUrl}/api/zyrex-ai` : "/api/zyrex-ai";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: request.prompt,
      mode: request.mode,
      history: request.history ?? [],
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return {
      status: "offline",
      reason:
        typeof payload?.reason === "string"
          ? payload.reason
          : "I couldn't connect to ZYREX right now. Please try again.",
    };
  }

  const payload = await response.json();

  if (payload?.status === "offline") {
    return {
      status: "offline",
      reason: payload.reason ?? "I couldn't connect to ZYREX right now. Please try again.",
    };
  }

  return {
    status: "ready",
    title: payload?.title ?? "ZYREX AI",
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [{ type: "summary", text: "ZYREX responded." }],
  };
}

/** Human-readable reason an analysis cannot run, for use in empty states. */
export const analysisUnavailableReason: string = integrations.ai.requiredFor;
