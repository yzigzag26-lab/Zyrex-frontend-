import type {
  AiMode,
  AppSettings,
  Capability,
  Connector,
  IntegrationPoint,
  JournalSchemaGroup,
  NavItem,
  OnboardingStep,
  StarterCard,
} from "../types";

const hasAiBackend = true;

export const product = {
  name: "HERMES AI",
  shortName: "HERMES",
  tagline: "Private AI Trading",
  version: "v1.0.0",
  offlineTitle: "HERMES AI is ready",
  offlineDetail: "Ask about markets, risk, setups, and trading discipline.",
  disclaimer:
    "HERMES AI provides analysis based on available information. Always verify important decisions against your trading plan and risk rules.",
  privateLabel: "Private access",
};

export const integrations: Record<IntegrationPoint["id"], IntegrationPoint> = {
  ai: {
    id: "ai",
    label: "AI service",
    state: hasAiBackend ? "connecting" : "disconnected",
    statusLabel: hasAiBackend ? "Checking" : "Offline",
    detail: hasAiBackend
      ? "WebSocket endpoint configured. Live status is probed on load."
      : "No analysis endpoint configured.",
    requiredFor: "Conversation, analysis, and streaming replies.",
  },
  tradeData: {
    id: "tradeData",
    label: "Trade data",
    state: "disconnected",
    statusLabel: "No data",
    detail: "No trades have been imported or journalled.",
    requiredFor: "Balances, positions, and performance figures.",
  },
  account: {
    id: "account",
    label: "Connected broker",
    state: "disconnected",
    statusLabel: "Not connected",
    detail: "No exchange or broker account is linked.",
    requiredFor: "Account balances, positions, and order sync.",
  },
  marketData: {
    id: "marketData",
    label: "Market-data service",
    state: "not_configured",
    statusLabel: "Not configured",
    detail: "No market-data provider has been selected.",
    requiredFor: "Live prices and instrument overview.",
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    state: "disconnected",
    statusLabel: "Disabled",
    detail: "No delivery channel configured.",
    requiredFor: "Alerts and weekly reviews.",
  },
};

export const workspace = {
  name: "Admin",
  subtitle: "Private workspace",
  initials: "HA",
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "ai", label: "AI", icon: "spark" },
  { id: "strategies", label: "Strategies", icon: "target" },
  { id: "journal", label: "Journal", icon: "book" },
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
    description: "Open-ended research, hypotheses and evidence review.",
    icon: "search",
  },
];

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

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "connect",
    index: 1,
    title: "Connect a broker",
    detail: "Link an exchange account through Settings → Connectors.",
    icon: "download",
    target: "settings",
  },
  {
    id: "journal",
    index: 2,
    title: "Start a journal",
    detail: "Save analyses and notes. Nothing is invented in empty states.",
    icon: "book",
    target: "journal",
  },
];

export const starterCards: StarterCard[] = [
  {
    id: "performance",
    icon: "📊",
    title: "Analyze performance",
    prompt: "Review my recent trading results.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "risk",
    icon: "💰",
    title: "Analyze risk",
    prompt: "Review my risk management.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "setup",
    icon: "🎯",
    title: "Best setup",
    prompt: "Compare performance by setup.",
    mode: "analyst",
    requires: "tradeData",
  },
  {
    id: "markets",
    icon: "🌐",
    title: "Market structure",
    prompt: "Explain how you would analyze a market before taking a trade.",
    mode: "analyst",
  },
];

export const journalSchema: JournalSchemaGroup[] = [
  {
    key: "identity",
    title: "Identity",
    icon: "layers",
    description: "What and where the trade was placed.",
    fields: ["Trade ID", "Account", "Exchange", "Symbol", "Market", "Direction", "Trade Type"],
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
    fields: ["Actual Entry", "Actual Exit", "Position Size", "Actual SL", "Actual TP", "Fees", "Slippage"],
  },
  {
    key: "result",
    title: "Result",
    icon: "chart",
    description: "Measured outcome of the trade.",
    fields: ["Gross PnL", "Net PnL", "Risk Amount", "R-Multiple", "Win/Loss"],
  },
  {
    key: "psychology",
    title: "Psychology",
    icon: "brain",
    description: "Emotional state across the trade — scored from real entries.",
    fields: ["Emotion Before", "Emotion During", "Emotion After", "Confidence", "Discipline"],
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
    fields: ["What Went Well", "What Went Wrong", "Lesson Learned", "Improvement"],
  },
  {
    key: "evidence",
    title: "Evidence",
    icon: "panelLeft",
    description: "Chart screenshots captured across the trade.",
    fields: ["Before Screenshot", "During Screenshot", "After Screenshot"],
  },
];

export const defaultSettings: AppSettings = {
  appearance: {
    theme: "dark",
    accentGlow: true,
    compactMode: false,
    animations: true,
  },
  interface: {
    showEquityCurve: true,
    defaultLanding: "dashboard",
    sidebarPinned: true,
    monospaceNumbers: true,
  },
  aiPreferences: {
    defaultMode: "analyst",
    responseDetail: "balanced",
    analysisDetail: "standard",
    showConfidence: true,
    autoAnalyzeAfterTrade: false,
  },
  tradingPreferences: {
    baseCurrency: "USD",
    riskUnit: "R",
    defaultSession: "All",
    includeFeesInPnl: true,
  },
  marketPreferences: {
    preferredInstruments: "",
    defaultMarket: "Not set",
    timezone: "UTC",
  },
  notifications: {
    weeklyReview: false,
    drawdownAlerts: false,
    patternDetected: false,
    researchUpdates: false,
  },
  dataDisplay: {
    tradesPerPage: 10,
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    hideSmallPnl: false,
  },
  privacy: {
    allowSharing: false,
  },
  tradingSafety: {
    tradingMode: "not_configured",
    confirmLiveOrders: true,
  },
};

export const defaultProfile = {
  displayName: "Admin",
  imageDataUrl: null,
  imageName: null,
  imageUpdatedAt: null,
};

export const connectors: Connector[] = [
  {
    id: "binance",
    name: "Binance",
    status: "disconnected",
    description: "Spot and futures. Credentials are never collected in this frontend.",
    actionLabel: "Connect",
  },
];

export const emptyCopy = {
  dashboard: {
    title: "Account not connected",
    body: "Balances, positions and allocation charts appear only from a verified data source.",
  },
  metrics: {
    value: "—",
    title: "No data yet",
    hint: "Connect a broker or import trades to populate this panel.",
  },
  chart: {
    title: "Nothing to display",
    hint: "Pie charts render from verified holdings. No values are estimated.",
  },
  journal: {
    title: "No journal entries yet",
    hint: "Save an AI analysis or write a manual note.",
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
    hint: "Sessions you start will appear here.",
  },
  strategies: {
    title: "No strategies yet",
    hint: "Create a draft to store rules and parameters. Drafts are not executable.",
  },
  market: {
    title: "Market data unavailable",
    hint: "A market-data API has not been selected. Live prices are not simulated.",
  },
  activity: {
    title: "No recent activity",
    hint: "Trades, orders, analyses and system events will list here when they exist.",
  },
  notifications: {
    title: "No notifications",
    hint: "Alerts appear once a delivery channel is connected.",
  },
};
