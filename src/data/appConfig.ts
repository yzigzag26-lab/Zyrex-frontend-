import type {
  AiMode,
  AppSettings,
  Capability,
  IntegrationPoint,
  JournalSchemaGroup,
  NavItem,
  OnboardingStep,
  StarterCard,
} from "../types";

/**
 * Static UI configuration for ZYREX AI.
 *
 * This module contains **no trading data, no analytics and no AI responses** —
 * only product chrome: branding, navigation, mode definitions, the locked
 * journal schema, capability declarations and onboarding copy.
 *
 * Anything that represents real trading intelligence lives in `dataset.ts`.
 */

const hasAiBackend = true;

export const product = {
  name: "ZYREX AI",
  tagline: "Trading Intelligence",
  version: "v0.9.4 · Groq-ready",
  offlineTitle: "ZYREX AI is ready",
  offlineDetail: "Ask about trading concepts, setups, risk, and market behavior.",
  disclaimer:
    "ZYREX AI provides analysis based on available trading data. Always verify important decisions against your trading plan and risk rules.",
};

/* ------------------------------------------------------- integration status */

/**
 * Every integration the product waits on. These are the single source of truth
 * for all "not connected" surfaces — nothing is simulated.
 */
export const integrations: Record<IntegrationPoint["id"], IntegrationPoint> = {
  ai: {
    id: "ai",
    label: "ZYREX AI Backend",
    state: hasAiBackend ? "connected" : "disconnected",
    statusLabel: hasAiBackend ? "Connected" : "Offline",
    detail: hasAiBackend ? "Backend configured and ready for analysis requests." : "No analysis endpoint configured.",
    requiredFor: "Trade analysis, psychology analysis, pattern detection and research answers.",
  },
  tradeData: {
    id: "tradeData",
    label: "Trade Data Source",
    state: "disconnected",
    statusLabel: "No data",
    detail: "No trades have been imported or journalled.",
    requiredFor: "Metrics, equity curve, distributions and journal history.",
  },
  account: {
    id: "account",
    label: "Exchange Accounts",
    state: "disconnected",
    statusLabel: "Not linked",
    detail: "No exchange or broker account is linked.",
    requiredFor: "Automatic trade import and position sync.",
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    state: "disconnected",
    statusLabel: "Disabled",
    detail: "No delivery channel configured.",
    requiredFor: "Weekly reviews, drawdown alerts and pattern notifications.",
  },
};

export const workspace = {
  name: "Local Workspace",
  subtitle: "No account connected",
  initials: "ZY",
};

/* --------------------------------------------------------------- navigation */

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "journal", label: "Journal", icon: "book" },
  { id: "recent", label: "Recent", icon: "clock" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export const aiModes: AiMode[] = [
  {
    id: "analyst",
    name: "Analyst",
    tagline: "Trading analysis and performance intelligence",
    description: "Performance, expectancy, risk and trade-level breakdowns.",
    icon: "chart",
  },
  {
    id: "research",
    name: "Research",
    tagline: "Market research and investigation",
    description: "Open-ended research projects, hypotheses and evidence review.",
    icon: "search",
  },
];

/* ------------------------------------------------------------- capabilities */

export const capabilities: Capability[] = [
  {
    id: "trade-analysis",
    label: "Trade Analysis",
    description: "Entry, execution and outcome review per trade.",
    icon: "chart",
    requires: "tradeData",
  },
  {
    id: "psychology",
    label: "Psychology Analysis",
    description: "Emotional state correlated with results.",
    icon: "brain",
    requires: "tradeData",
  },
  {
    id: "pattern-detection",
    label: "Pattern Detection",
    description: "Recurring behaviour and setup patterns.",
    icon: "target",
    requires: "ai",
  },
  {
    id: "performance-review",
    label: "Performance Review",
    description: "Expectancy, drawdown and consistency reporting.",
    icon: "trendUp",
    requires: "tradeData",
  },
  {
    id: "risk-assessment",
    label: "Risk Assessment",
    description: "Exposure, sizing discipline and risk of ruin.",
    icon: "shield",
    requires: "tradeData",
  },
  {
    id: "research-assistant",
    label: "Research Assistant",
    description: "Hypothesis-driven investigation of your data.",
    icon: "flask",
    requires: "ai",
  },
];

/* --------------------------------------------------------- onboarding steps */

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "import",
    index: 1,
    title: "Import trades",
    detail: "Connect an exchange account or upload your trade history.",
    icon: "download",
    target: "journal",
  },
  {
    id: "journal",
    index: 2,
    title: "Create your first journal entry",
    detail: "Log plan, execution, psychology and review for a single trade.",
    icon: "book",
    target: "journal",
  },
];

/* ------------------------------------------------------------ starter cards */

/** Prompt suggestions only — submitting one still requires a live backend. */
export const starterCards: StarterCard[] = [
  {
    id: "performance",
    icon: "📊",
    title: "Analyze My Performance",
    prompt: "Review my recent trading results.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "psychology",
    icon: "🧠",
    title: "Review My Psychology",
    prompt: "Find emotional patterns in my trading.",
    mode: "coach",
    requires: "tradeData",
  },
  {
    id: "mistakes",
    icon: "⚠️",
    title: "Find My Biggest Mistakes",
    prompt: "Identify recurring execution mistakes.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "trades",
    icon: "📈",
    title: "Analyze My Recent Trades",
    prompt: "Review my latest trades.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "setup",
    icon: "🎯",
    title: "Find My Best Setup",
    prompt: "Compare performance by setup.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "risk",
    icon: "💰",
    title: "Analyze My Risk",
    prompt: "Review my risk management.",
    mode: "analyst",
    requires: "tradeData",
  },
];

/* -------------------------------------------------------- locked journ schema */

/** The locked journal schema — presented as a reference, never populated. */
export const journalSchema: JournalSchemaGroup[] = [
  {
    key: "identity",
    title: "Identity",
    icon: "layers",
    description: "What and where the trade was placed.",
    fields: [
      "Trade ID",
      "Account",
      "Exchange",
      "Symbol",
      "Market",
      "Direction",
      "Trade Type",
    ],
  },
  {
    key: "timing",
    title: "Timing",
    icon: "clock",
    description: "When the trade was opened and closed.",
    fields: ["Date", "Entry Time", "Exit Time", "Duration", "Session"],
  },
  {
    key: "plan",
    title: "Plan",
    icon: "target",
    description: "The intended trade before execution.",
    fields: [
      "Setup",
      "Market Condition",
      "Entry Reason",
      "Planned Entry",
      "Planned SL",
      "Planned TP",
      "Planned Risk",
      "Risk/Reward",
    ],
  },
  {
    key: "execution",
    title: "Execution",
    icon: "zap",
    description: "What actually happened in the market.",
    fields: [
      "Actual Entry",
      "Actual Exit",
      "Position Size",
      "Actual SL",
      "Actual TP",
      "Fees",
      "Slippage",
    ],
  },
  {
    key: "result",
    title: "Result",
    icon: "chart",
    description: "Measured outcome of the trade.",
    fields: [
      "Gross PnL",
      "Net PnL",
      "Risk Amount",
      "R-Multiple",
      "Win/Loss",
    ],
  },
  {
    key: "psychology",
    title: "Psychology",
    icon: "brain",
    description: "Emotional state across the trade — scored from real entries.",
    fields: [
      "Emotion Before",
      "Emotion During",
      "Emotion After",
      "Confidence",
      "Discipline",
    ],
  },
  {
    key: "mistakes",
    title: "Mistakes",
    icon: "alert",
    description: "Rule adherence and logged errors.",
    fields: ["Mistakes", "Rule Followed", "Rule Broken"],
  },
  {
    key: "review",
    title: "Review",
    icon: "book",
    description: "Qualitative reflection and next improvement.",
    fields: [
      "What Went Well",
      "What Went Wrong",
      "Lesson Learned",
      "Improvement",
    ],
  },
  {
    key: "evidence",
    title: "Evidence",
    icon: "panelLeft",
    description: "Chart screenshots captured across the trade.",
    fields: ["Before Screenshot", "During Screenshot", "After Screenshot"],
  },
];

/* ----------------------------------------------------------------- settings */

export const defaultSettings: AppSettings = {
  appearance: {
    theme: "light",
    accentGlow: true,
    compactMode: false,
    animations: true,
  },
  interface: {
    showEquityCurve: true,
    defaultLanding: "dashboard" as const,
    sidebarPinned: true,
    monospaceNumbers: true,
  },
  aiPreferences: {
    defaultMode: "analyst",
    responseDetail: "balanced",
    showConfidence: true,
    autoAnalyzeAfterTrade: false,
  },
  tradingPreferences: {
    baseCurrency: "USD",
    riskUnit: "R",
    defaultSession: "All",
    includeFeesInPnl: true,
  },
  notifications: {
    weeklyReview: true,
    drawdownAlerts: true,
    patternDetected: false,
    researchUpdates: false,
  },
  dataDisplay: {
    tradesPerPage: 10,
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    hideSmallPnl: false,
  },
};

/* ------------------------------------------------------------ empty copy */

/** Central copy for unavailable data — used instead of placeholder numbers. */
export const emptyCopy = {
  dashboard: {
    title: "Welcome to ZYREX",
    body: "No trading data found.",
  },
  metrics: {
    value: "—",
    title: "No data available",
    hint: "Import trades to begin analysis",
  },
  chart: {
    title: "Awaiting trade data",
    hint: "Charts populate once trades are imported",
  },
  journal: {
    title: "No trades recorded yet",
    hint: "Import a trade history or create your first journal entry",
  },
  analytics: {
    title: "Analytics unavailable",
    hint: "No trade history available yet",
  },
  research: {
    title: "No research projects yet",
    hint: "Create your first trading research project",
  },
  conversation: {
    title: "No conversations yet",
    hint: "Sessions you start will appear here",
  },
  notifications: {
    title: "No notifications",
    hint: "Alerts appear once a data source and delivery channel are connected",
  },
};
