/**
 * HERMES AI — domain types
 *
 * Contract between the UI and future data/AI/persistence layers.
 * No fabricated trading values live here.
 */

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export type Direction = "long" | "short";
export type TradeOutcome = "win" | "loss" | "breakeven";
export type TradingSession = "Asia" | "London" | "New York";
export type MarketType = "Spot" | "Futures";
export type ExchangeName = "Binance" | "Bybit" | "OKX" | "Coinbase";

export type AiModeId = "analyst" | "coach" | "research";

export interface AiMode {
  id: AiModeId;
  name: string;
  tagline: string;
  description: string;
  icon: "chart" | "brain" | "search";
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
export type ServiceStatus = ConnectionState | "not_configured";

export interface IntegrationPoint {
  id: "ai" | "tradeData" | "account" | "notifications" | "marketData";
  label: string;
  state: ConnectionState | "not_configured";
  statusLabel: string;
  detail: string;
  requiredFor: string;
}

export interface EvidenceShot {
  label: "Before" | "During" | "After";
  caption: string;
  capturedAt: string;
  present: boolean;
  source?: string | null;
  preview?: number[];
}

export interface Trade {
  id: string;
  account: string;
  exchange: ExchangeName;
  symbol: string;
  market: MarketType;
  direction: Direction;
  tradeType: string;
  date: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  session: TradingSession;
  setup: string;
  marketCondition: string;
  entryReason: string;
  plannedEntry: number;
  plannedStop: number;
  plannedTarget: number;
  plannedRisk: number;
  riskReward: number;
  actualEntry: number;
  actualExit: number;
  positionSize: number;
  actualStop: number;
  actualTarget: number;
  fees: number;
  slippage: number;
  grossPnl: number;
  netPnl: number;
  riskAmount: number;
  rMultiple: number;
  outcome: TradeOutcome;
  emotionBefore: string;
  emotionDuring: string;
  emotionAfter: string;
  confidence: number | null;
  discipline: number | null;
  mistakes: string[];
  ruleFollowed: boolean;
  ruleBroken: string | null;
  whatWentWell: string;
  whatWentWrong: string;
  lessonLearned: string;
  improvement: string;
  evidence: EvidenceShot[];
}

export interface JournalSchemaGroup {
  key: string;
  title: string;
  icon: "layers" | "clock" | "target" | "zap" | "chart" | "brain" | "alert" | "book" | "panelLeft";
  description: string;
  fields: string[];
}

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

export interface Capability {
  id: string;
  label: string;
  description: string;
  icon: "chart" | "brain" | "target" | "trendUp" | "shield" | "flask";
  requires: "ai" | "tradeData";
}

export type AnalysisResult =
  | { status: "offline"; reason: string }
  | { status: "ready"; title: string; blocks: ResponseBlock[]; options?: StructuredOption[] };

export interface AnalysisRequest {
  prompt: string;
  mode: AiModeId;
  history?: Array<{ role: "user" | "assistant"; text?: string }>;
}

export type ChatRole = "user" | "assistant" | "zyrex";

export type GenerationState =
  | "idle"
  | "processing"
  | "streaming"
  | "completed"
  | "cancelled"
  | "error";

export interface StructuredOption {
  id: string;
  label: string;
}

export interface ChatAttachmentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "document";
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  createdAt: string;
  text?: string;
  kind?: "offline" | "analysis" | "cancelled";
  title?: string;
  blocks?: ResponseBlock[];
  mode?: AiModeId;
  simulated?: boolean;
  options?: StructuredOption[];
  attachments?: ChatAttachmentMeta[];
}

export interface Conversation {
  id: string;
  title: string;
  mode: AiModeId;
  updatedAt: string;
  messages: ChatMessage[];
  pinned?: boolean;
}

export type JournalSource = "ai-analysis" | "manual-note" | "imported-trade";

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  content: string;
  market?: string;
  tags: string[];
  source: JournalSource;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type StrategyStatus = "draft" | "active" | "paused" | "archived";

export interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: string;
  market: string;
  timeframe: string;
  riskParameters: string;
  status: StrategyStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile {
  displayName: string;
  imageDataUrl: string | null;
  imageName: string | null;
  imageUpdatedAt: string | null;
}

export type ConnectorStatus = "connected" | "disconnected" | "unavailable" | "error" | "not_configured";

export interface Connector {
  id: string;
  name: string;
  status: ConnectorStatus;
  description: string;
  actionLabel: string;
}

export type TradingMode = "not_configured" | "paper" | "live" | "disabled";

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
    analysisDetail: "overview" | "standard" | "exhaustive";
    showConfidence: boolean;
    autoAnalyzeAfterTrade: boolean;
  };
  tradingPreferences: {
    baseCurrency: string;
    riskUnit: "R" | "USD" | "Percent";
    defaultSession: TradingSession | "All";
    includeFeesInPnl: boolean;
  };
  marketPreferences: {
    preferredInstruments: string;
    defaultMarket: string;
    timezone: string;
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
  privacy: {
    allowSharing: boolean;
  };
  tradingSafety: {
    tradingMode: TradingMode;
    confirmLiveOrders: boolean;
  };
}

export type PageId =
  | "dashboard"
  | "ai"
  | "strategies"
  | "journal"
  | "settings"
  | "analytics"
  | "research"
  | "recent";

export type NavIcon = "grid" | "book" | "chart" | "flask" | "spark" | "settings" | "target" | "clock";

export interface NavItem {
  id: PageId;
  label: string;
  icon: NavIcon;
  badge?: string;
}

export interface OnboardingStep {
  id: string;
  index: number;
  title: string;
  detail: string;
  icon: "download" | "book" | "spark";
  target: PageId;
}

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

export interface AccountOverviewField {
  id: string;
  label: string;
  value: string;
  hint: string;
  connected: boolean;
}
