/**
 * ZYREX AI — domain types
 *
 * These types are the contract between the UI and a future data/AI layer.
 * Every value the interface renders is typed here so a real backend
 * (trade import, analytics engine, ZYREX AI service) can be attached later
 * without redesigning any component.
 */

export type Theme = "dark" | "light";

export type Direction = "long" | "short";
export type TradeOutcome = "win" | "loss" | "breakeven";
export type TradingSession = "Asia" | "London" | "New York";
export type MarketType = "Spot" | "Futures";
export type ExchangeName = "Binance" | "Bybit" | "OKX" | "Coinbase";

/** AI persona — a frontend presentation mode only (no separate models). */
export type AiModeId = "analyst" | "coach" | "research";

export interface AiMode {
  id: AiModeId;
  name: string;
  tagline: string;
  description: string;
  icon: "chart" | "brain" | "search";
}

/* -------------------------------------------------------------- connection */

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

/**
 * Describes a single integration point that the frontend is waiting on.
 * Rendered as-is — never faked.
 */
export interface IntegrationPoint {
  id: "ai" | "tradeData" | "account" | "notifications";
  label: string;
  state: ConnectionState;
  statusLabel: string;
  detail: string;
  requiredFor: string;
}

/* ------------------------------------------------------------------ journal */

export interface EvidenceShot {
  /** Stage of the trade the screenshot belongs to. */
  label: "Before" | "During" | "After";
  caption: string;
  capturedAt: string;
  present: boolean;
  source?: string | null;
  preview?: number[];
}

/** A single journal entry — mirrors the locked journal field groups. */
export interface Trade {
  // IDENTITY
  id: string;
  account: string;
  exchange: ExchangeName;
  symbol: string;
  market: MarketType;
  direction: Direction;
  tradeType: string;

  // TIMING
  date: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  session: TradingSession;

  // PLAN
  setup: string;
  marketCondition: string;
  entryReason: string;
  plannedEntry: number;
  plannedStop: number;
  plannedTarget: number;
  plannedRisk: number;
  riskReward: number;

  // EXECUTION
  actualEntry: number;
  actualExit: number;
  positionSize: number;
  actualStop: number;
  actualTarget: number;
  fees: number;
  slippage: number;

  // RESULT
  grossPnl: number;
  netPnl: number;
  riskAmount: number;
  rMultiple: number;
  outcome: TradeOutcome;

  // PSYCHOLOGY
  emotionBefore: string;
  emotionDuring: string;
  emotionAfter: string;
  confidence: number | null; // 1–10 — null until calculated from real entries
  discipline: number | null; // 1–10 — null until calculated from real entries

  // MISTAKES
  mistakes: string[];
  ruleFollowed: boolean;
  ruleBroken: string | null;

  // REVIEW
  whatWentWell: string;
  whatWentWrong: string;
  lessonLearned: string;
  improvement: string;

  // EVIDENCE
  evidence: EvidenceShot[];
}

/** Locked journal field groups — schema reference for the UI. */
export interface JournalSchemaGroup {
  key: string;
  title: string;
  icon: "layers" | "clock" | "target" | "zap" | "chart" | "brain" | "alert" | "book" | "panelLeft";
  description: string;
  fields: string[];
}

/* ---------------------------------------------------------------- dashboard */

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  averageR: number;
  maxDrawdown: number;
  averageRiskPct: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  currentStreak: number;
  reviewPeriod: string;
}

export interface EquityPoint {
  index: number;
  label: string;
  equity: number;
}

export interface GroupPerformance {
  label: string;
  trades: number;
  winRate: number;
  netPnl: number;
  avgR: number;
  expectancy: number;
}

export interface RiskMetric {
  label: string;
  value: string;
  detail: string;
  tone: "pos" | "neg" | "warn" | "neutral";
}

export interface PsychologyFinding {
  emotion: string;
  trades: number;
  winRate: number;
  avgR: number;
  discipline: number | null;
  note: string;
}

export interface PatternInsight {
  id: string;
  title: string;
  statement: string;
  confidence: number;
  sampleSize: number;
  evidence: string[];
  state: "confirmed" | "emerging" | "watch";
}

/* ----------------------------------------------------------------- research */

export type ResearchStatus = "Analyzing" | "In Review" | "Complete" | "Paused";

export interface ResearchProject {
  id: string;
  title: string;
  question: string;
  status: ResearchStatus;
  progress: number;
  symbols: string[];
  startedAt: string;
  tradesReviewed: number;
  summary: string;
  notes: string[];
  findings: { title: string; detail: string; confidence: number }[];
  conclusions: string[];
  evidence: { label: string; caption: string; source?: string | null; preview?: number[] }[];
}

/* --------------------------------------------------------------- AI / chat */

export type ResponseBlock =
  | { type: "summary"; text: string }
  | { type: "metrics"; title: string; rows: MetricRow[] }
  | { type: "observation"; title: string; text: string }
  | { type: "trades"; title: string; tradeIds: string[] }
  | { type: "risk"; title: string; items: RiskMetric[] }
  | { type: "psychology"; title: string; findings: PsychologyFinding[] }
  | { type: "pattern"; title: string; insight: PatternInsight }
  | { type: "actions"; title: string; items: string[] }
  | { type: "note"; tone: "info" | "warn"; text: string };

export interface MetricRow {
  label: string;
  value: string;
  tone?: "pos" | "neg" | "warn" | "neutral";
  hint?: string;
}

export interface StarterCard {
  id: string;
  icon: string;
  title: string;
  prompt: string;
  mode: AiModeId;
  requires?: IntegrationPoint["id"];
}

export interface MockAiResponse {
  id: string;
  keywords: string[];
  title: string;
  blocks: ResponseBlock[];
}

/** What ZYREX AI can do once the backend is connected. */
export interface Capability {
  id: string;
  label: string;
  description: string;
  icon: "chart" | "brain" | "target" | "trendUp" | "shield" | "flask";
  requires: "ai" | "tradeData";
}

/**
 * Result of an analysis request. While the AI backend is not connected the
 * resolver returns `{ status: "offline" }` and the UI renders the offline
 * notice — never a simulated answer.
 */
export type AnalysisResult =
  | { status: "offline"; reason: string }
  | { status: "ready"; title: string; blocks: ResponseBlock[] };

/** Payload sent to the ZYREX backend when asking for an answer. */
export interface AnalysisRequest {
  prompt: string;
  mode: AiModeId;
  history?: Array<{ role: "user" | "zyrex"; text?: string }>;
}

export type ChatRole = "user" | "assistant" | "zyrex";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  createdAt: string;
  /** Plain user prompt (user messages). */
  text?: string;
  /** Offline notice vs. real structured payload (once connected). */
  kind?: "offline" | "analysis";
  title?: string;
  blocks?: ResponseBlock[];
  mode?: AiModeId;
  simulated?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  mode: AiModeId;
  updatedAt: string;
  messages: ChatMessage[];
}

/* ---------------------------------------------------------------- settings */

export interface AppSettings {
  appearance: {
    theme: Theme;
    accentGlow: boolean;
    compactMode: boolean;
    animations: boolean;
  };
  interface: {
    showEquityCurve: boolean;
    defaultLanding: "dashboard" | "journal" | "ai";
    sidebarPinned: boolean;
    monospaceNumbers: boolean;
  };
  aiPreferences: {
    defaultMode: AiModeId;
    responseDetail: "concise" | "balanced" | "deep";
    showConfidence: boolean;
    autoAnalyzeAfterTrade: boolean;
  };
  tradingPreferences: {
    baseCurrency: string;
    riskUnit: "R" | "USD" | "Percent";
    defaultSession: TradingSession | "All";
    includeFeesInPnl: boolean;
  };
  notifications: {
    weeklyReview: boolean;
    drawdownAlerts: boolean;
    patternDetected: boolean;
    researchUpdates: boolean;
  };
  dataDisplay: {
    tradesPerPage: number;
    timezone: string;
    dateFormat: string;
    hideSmallPnl: boolean;
  };
}

export type PageId = "dashboard" | "journal" | "analytics" | "research" | "ai" | "settings";

export type NavIcon = "grid" | "book" | "chart" | "flask" | "spark" | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  icon: NavIcon;
  badge?: string;
}

/** Step shown in the empty dashboard onboarding list. */
export interface OnboardingStep {
  id: string;
  index: number;
  title: string;
  detail: string;
  icon: "download" | "book" | "spark";
  target: PageId;
}
