import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { aiModes, defaultSettings } from "../data/appConfig";
import { requestAnalysis, trades as datasetTrades } from "../data/dataset";
import { aiBackend, checkAiBackendHealth, healthLabel } from "../lib/zyrexApi";
import type {
  AiMode,
  AiModeId,
  AppSettings,
  ChatMessage,
  ConnectionState,
  Conversation,
  PageId,
  Theme,
} from "../types";
import { createId } from "../utils/format";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useMediaQuery } from "../hooks/useElementSize";

/** Chat phase for the live request lifecycle. */
export type ChatPhase = "idle" | "connecting" | "thinking";

interface ZyrexContextValue {
  /* navigation */
  page: PageId;
  navigate: (page: PageId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;

  /* theme */
  theme: Theme;
  toggleTheme: () => void;

  /* AI popup */
  aiPopupOpen: boolean;
  toggleAIPopup: () => void;

  /* AI mode */
  mode: AiMode;
  setMode: (id: AiModeId) => void;

  /* data availability (drives every empty state) */
  hasTradeData: boolean;

  /* live backend connection (probed against the real endpoint) */
  aiStatus: ConnectionState;
  aiStatusDetail: string;
  aiStatusLabel: string;
  aiBackendUrl: string;
  recheckAiConnection: () => void;

  /* conversations */
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  selectConversation: (id: string) => void;
  startNewConversation: () => void;
  clearActiveConversation: () => void;
  deleteConversation: (id: string) => void;

  /* chat */
  phase: ChatPhase;
  sendMessage: (text: string) => void;
  regenerate: () => void;
  clearPromptNotice: () => void;
  promptNotice: string | null;

  /* settings */
  settings: AppSettings;
  updateSettings: <K extends keyof AppSettings>(group: K, patch: Partial<AppSettings[K]>) => void;
  resetSettings: () => void;
}

const ZyrexContext = createContext<ZyrexContextValue | null>(null);

function blankConversation(mode: AiModeId): Conversation {
  return {
    id: createId("cnv"),
    title: "New Conversation",
    mode,
    updatedAt: "Just now",
    messages: [],
  };
}

export function ZyrexProvider({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [page, setPage] = useState<PageId>(defaultSettings.interface.defaultLanding);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPopupOpen, setAiPopupOpen] = useState(false);
  const [modeId, setModeId] = useState<AiModeId>(defaultSettings.aiPreferences.defaultMode);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const [promptNotice, setPromptNotice] = useState<string | null>(null);

  /* live AI backend connection ------------------------------------------ */
  const [aiStatus, setAiStatus] = useState<ConnectionState>("connecting");
  const [aiStatusDetail, setAiStatusDetail] = useState<string>(
    `Probing ${aiBackend.baseUrl}${aiBackend.healthEndpoint}…`,
  );

  const [settings, setSettings] = useLocalStorage<AppSettings>("zyrex.settings", defaultSettings);

  /* theme -------------------------------------------------------------- */
  const [theme, setTheme] = useLocalStorage<Theme>("zyrex.theme", defaultSettings.appearance.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }, []);

  const toggleTheme = useCallback(() => {
    // No-op - light mode only
  }, []);

  const toggleAIPopup = useCallback(() => {
    setAiPopupOpen((prev) => !prev);
  }, []);

  /* derived ------------------------------------------------------------- */
  const mode = useMemo(() => aiModes.find((m) => m.id === modeId) ?? aiModes[0], [modeId]);
  const hasTradeData = datasetTrades.length > 0;

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  /* navigation ---------------------------------------------------------- */
  const navigate = useCallback((next: PageId) => {
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  /* conversations ------------------------------------------------------- */
  const patchConversation = useCallback(
    (id: string, patch: (conversation: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? patch(c) : c)));
    },
    [setConversations],
  );

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setPage("ai");
    setSidebarOpen(false);
  }, []);

  const startNewConversation = useCallback(() => {
    const conversation = blankConversation(modeId);
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    setPage("ai");
    setSidebarOpen(false);
  }, [modeId]);

  const clearActiveConversation = useCallback(() => {
    if (!activeId) return;
    patchConversation(activeId, (c) => ({ ...c, title: "New Conversation", messages: [] }));
  }, [activeId, patchConversation]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveId((current) => (current === id ? null : current));
    },
    [setConversations],
  );

  const clearPromptNotice = useCallback(() => setPromptNotice(null), []);

  /* ---------------------------------------------------- backend connection */
  /**
   * Probes the real backend endpoint. Every "connected / offline" surface
   * reads this result, so it only reports success when the backend answered.
   */
  const recheckAiConnection = useCallback(() => {
    setAiStatus("connecting");
    setAiStatusDetail(`Probing ${aiBackend.baseUrl}${aiBackend.healthEndpoint}…`);
    void checkAiBackendHealth().then((health) => {
      setAiStatus(health.state);
      setAiStatusDetail(health.detail);
    });
  }, []);

  useEffect(() => {
    recheckAiConnection();
  }, [recheckAiConnection]);

  /* chat ---------------------------------------------------------------- */
  /**
   * Sends a prompt to the ZYREX AI backend through `requestAnalysis`.
   * While the backend is not connected the resolver returns `offline` and the
   * chat surface renders the connection notice. No response is ever fabricated.
   */
  const sendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text || phase === "connecting" || phase === "thinking") return;

      const userMessage: ChatMessage = {
        id: createId("msg"),
        role: "user",
        createdAt: new Date().toISOString(),
        text,
      };

      let conversationId = activeId;
      if (!conversationId) {
        const conversation: Conversation = {
          ...blankConversation(modeId),
          title: text.length > 34 ? `${text.slice(0, 34)}…` : text,
          messages: [userMessage],
        };
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversation.id);
        conversationId = conversation.id;
      } else {
        patchConversation(conversationId, (c) => ({
          ...c,
          title:
            c.messages.length === 0 ? (text.length > 34 ? `${text.slice(0, 34)}…` : text) : c.title,
          updatedAt: "Just now",
          messages: [...c.messages, userMessage],
        }));
      }

      setPage("ai");
      setPhase("connecting");

      const history = activeConversation?.messages.slice(-6) ?? [];

      window.setTimeout(() => {
        setPhase("thinking");
        void requestAnalysis({
          prompt: text,
          mode: modeId,
          history: history.map((message) => ({
            role: message.role === "user" ? "user" : "zyrex",
            text: message.text ?? message.title ?? "",
          })),
        })
          .then((result) => {
            if (result.status === "ready") {
              setAiStatus("connected");
              setAiStatusDetail("Backend answered the last analysis request.");
            } else {
              setAiStatus("error");
              setAiStatusDetail(result.reason);
            }

            const message: ChatMessage =
              result.status === "ready"
                ? {
                    id: createId("msg"),
                    role: "zyrex",
                    createdAt: new Date().toISOString(),
                    mode: modeId,
                    kind: "analysis",
                    title: result.title,
                    blocks: result.blocks,
                  }
                : {
                    id: createId("msg"),
                    role: "zyrex",
                    createdAt: new Date().toISOString(),
                    mode: modeId,
                    kind: "offline",
                    title: result.reason,
                  };

            patchConversation(conversationId as string, (c) => ({
              ...c,
              updatedAt: "Just now",
              messages: [...c.messages, message],
            }));
          })
          .catch(() => {
            setAiStatus("disconnected");
            setAiStatusDetail(
              `Couldn't reach ${aiBackend.baseUrl}. It may be offline or blocking cross-origin requests.`,
            );
            patchConversation(conversationId as string, (c) => ({
              ...c,
              updatedAt: "Just now",
              messages: [
                ...c.messages,
                {
                  id: createId("msg"),
                  role: "zyrex",
                  createdAt: new Date().toISOString(),
                  mode: modeId,
                  kind: "offline",
                  title: "I couldn't connect to ZYREX right now. Please try again.",
                },
              ],
            }));
          })
          .finally(() => {
            setPhase("idle");
          });
      }, 650);
    },
    [activeId, activeConversation, modeId, patchConversation, phase],
  );

  const regenerate = useCallback(() => {
    if (!activeConversation) return;
    const lastUserMessage = [...activeConversation.messages]
      .reverse()
      .find((message) => message.role === "user");
    if (!lastUserMessage?.text) return;
    sendMessage(lastUserMessage.text);
  }, [activeConversation, sendMessage]);

  /* settings ------------------------------------------------------------ */
  const updateSettings = useCallback(
    <K extends keyof AppSettings>(group: K, patch: Partial<AppSettings[K]>) => {
      setSettings((prev) => ({ ...prev, [group]: { ...prev[group], ...patch } }));
    },
    [setSettings],
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setTheme(defaultSettings.appearance.theme);
    setModeId(defaultSettings.aiPreferences.defaultMode);
  }, [setSettings, setTheme]);

  const value: ZyrexContextValue = {
    page,
    navigate,
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    theme,
    toggleTheme,
    aiPopupOpen,
    toggleAIPopup,
    mode,
    setMode: setModeId,
    hasTradeData,
    aiStatus,
    aiStatusDetail,
    aiStatusLabel: healthLabel(aiStatus),
    aiBackendUrl: aiBackend.baseUrl,
    recheckAiConnection,
    conversations,
    activeConversationId: activeId,
    activeConversation,
    selectConversation,
    startNewConversation,
    clearActiveConversation,
    deleteConversation,
    phase,
    sendMessage,
    regenerate,
    promptNotice,
    clearPromptNotice,
    settings,
    updateSettings,
    resetSettings,
  };

  return <ZyrexContext.Provider value={value}>{children}</ZyrexContext.Provider>;
}

export function useZyrex(): ZyrexContextValue {
  const context = useContext(ZyrexContext);
  if (!context) throw new Error("useZyrex must be used inside a ZyrexProvider");
  return context;
}
