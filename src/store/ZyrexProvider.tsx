import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { aiModes, defaultProfile, defaultSettings } from "../data/appConfig";
import { requestAnalysis, trades as datasetTrades } from "../data/dataset";
import { GENERATION_FAILED_MESSAGE, checkAiBackendHealth, healthLabel } from "../lib/zyrexApi";
import { persistenceCopy, readCache, writeCache } from "../persistence/localCache";
import type {
  AdminProfile,
  AiMode,
  AiModeId,
  AppSettings,
  ChatAttachmentMeta,
  ChatMessage,
  ConnectionState,
  Conversation,
  GenerationState,
  JournalEntry,
  JournalSource,
  PageId,
  Strategy,
  Theme,
} from "../types";
import { createId } from "../utils/format";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { responseToText } from "../utils/responseText";
import { useMediaQuery } from "../hooks/useElementSize";

export type ChatPhase = "idle" | "connecting" | "thinking";

export interface Feedback {
  tone: "success" | "error" | "info";
  message: string;
}

interface ZyrexContextValue {
  page: PageId;
  navigate: (page: PageId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;

  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;

  aiPopupOpen: boolean;
  toggleAIPopup: () => void;

  mode: AiMode;
  setMode: (id: AiModeId) => void;

  hasTradeData: boolean;

  aiStatus: ConnectionState;
  aiStatusDetail: string;
  aiStatusLabel: string;
  recheckAiConnection: () => void;

  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  selectConversation: (id: string) => void;
  startNewConversation: () => void;
  clearActiveConversation: () => void;
  deleteConversation: (id: string) => void;
  togglePin: (id: string) => void;
  shareConversation: () => Feedback;
  addActiveToJournal: (title?: string) => Feedback;

  phase: ChatPhase;
  isStreaming: boolean;
  generationState: GenerationState;
  /** Friendly activity label while generating ("Thinking…", "Searching market data…"), or null. */
  generationActivity: string | null;
  sendMessage: (text: string, attachments?: ChatAttachmentMeta[]) => void;
  stopGeneration: () => void;
  regenerate: () => void;
  clearPromptNotice: () => void;
  promptNotice: string | null;
  feedback: Feedback | null;
  setFeedback: (feedback: Feedback | null) => void;
  clearFeedback: () => void;

  journal: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => Feedback;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => Feedback;
  deleteJournalEntry: (id: string) => Feedback;

  strategies: Strategy[];
  addStrategy: (draft: Omit<Strategy, "id" | "createdAt" | "updatedAt" | "version" | "status">) => Feedback;
  deleteStrategy: (id: string) => Feedback;

  profile: AdminProfile;
  updateProfile: (patch: Partial<AdminProfile>) => Feedback;

  settings: AppSettings;
  updateSettings: <K extends keyof AppSettings>(group: K, patch: Partial<AppSettings[K]>) => void;
  resetSettings: () => void;
  exportLocalData: () => void;
  deleteLocalData: () => Feedback;
}

const ZyrexContext = createContext<ZyrexContextValue | null>(null);

function blankConversation(mode: AiModeId): Conversation {
  return {
    id: createId("cnv"),
    title: "New Conversation",
    mode,
    updatedAt: "Just now",
    messages: [],
    pinned: false,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export function ZyrexProvider({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [page, setPage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>("hermes.sidebarCollapsed", false);
  const [aiPopupOpen, setAiPopupOpen] = useState(false);
  const [modeId, setModeId] = useState<AiModeId>(defaultSettings.aiPreferences.defaultMode);
  const [conversations, setConversations] = useState<Conversation[]>(
    () => readCache<Conversation[]>("hermes.conversations", []).value,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const [isStreaming, setIsStreaming] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [promptNotice, setPromptNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [generationActivity, setGenerationActivity] = useState<string | null>(null);
  const activityTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearActivityTimers = useCallback(() => {
    activityTimersRef.current.forEach((timer) => clearTimeout(timer));
    activityTimersRef.current = [];
  }, []);

  const scheduleActivity = useCallback(
    (stages: Array<readonly [number, string]>) => {
      clearActivityTimers();
      activityTimersRef.current = stages.map(([delay, label]) =>
        setTimeout(() => setGenerationActivity(label), delay),
      );
    },
    [clearActivityTimers],
  );

  /** ChatGPT-style staged activity while waiting for the first token. */
  const showWaitingActivity = useCallback(() => {
    setGenerationActivity("Thinking…");
    scheduleActivity([
      [4_000, "Searching market data…"],
      [12_000, "Analyzing results…"],
      [30_000, "Still working…"],
    ]);
  }, [scheduleActivity]);

  /** After a token, stay quiet — but if the stream pauses (e.g. tool calls), show activity again. */
  const armStreamSilenceActivity = useCallback(() => {
    setGenerationActivity(null);
    scheduleActivity([
      [3_000, "Thinking…"],
      [9_000, "Searching market data…"],
      [20_000, "Analyzing results…"],
      [40_000, "Still working…"],
    ]);
  }, [scheduleActivity]);

  const endActivity = useCallback(() => {
    clearActivityTimers();
    setGenerationActivity(null);
  }, [clearActivityTimers]);

  const [aiStatus, setAiStatus] = useState<ConnectionState>("connecting");
  const [aiStatusDetail, setAiStatusDetail] = useState<string>("Checking connection…");

  const [settings, setSettings] = useLocalStorage<AppSettings>("hermes.settings", defaultSettings);
  const [theme, setThemeState] = useLocalStorage<Theme>("hermes.theme", defaultSettings.appearance.theme);
  const [journal, setJournal] = useState<JournalEntry[]>(() => readCache<JournalEntry[]>("hermes.journal", []).value);
  const [strategies, setStrategies] = useState<Strategy[]>(() => readCache<Strategy[]>("hermes.strategies", []).value);
  const [profile, setProfile] = useState<AdminProfile>(
    () => readCache<AdminProfile>("hermes.profile", defaultProfile).value,
  );

  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (prefersLight ? "light" : "dark") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    // Persisting serializes every conversation to localStorage, which is
    // synchronous main-thread work. While tokens are streaming in, debounce
    // it so a token burst coalesces into a single write; when streaming
    // ends (or for any non-streaming change) write immediately as before.
    if (!isStreaming) {
      writeCache("hermes.conversations", conversations);
      return;
    }
    const timer = setTimeout(() => writeCache("hermes.conversations", conversations), 500);
    return () => clearTimeout(timer);
  }, [conversations, isStreaming]);

  useEffect(() => {
    writeCache("hermes.journal", journal);
  }, [journal]);

  useEffect(() => {
    writeCache("hermes.strategies", strategies);
  }, [strategies]);

  useEffect(() => {
    writeCache("hermes.profile", profile);
  }, [profile]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      setSettings((prev) => ({ ...prev, appearance: { ...prev.appearance, theme: next } }));
    },
    [setThemeState, setSettings],
  );

  const toggleAIPopup = useCallback(() => {
    setAiPopupOpen((prev) => !prev);
  }, []);

  const mode = useMemo(() => aiModes.find((item) => item.id === modeId) ?? aiModes[0], [modeId]);
  const hasTradeData = datasetTrades.length > 0;

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);

  const navigate = useCallback((next: PageId) => {
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const patchConversation = useCallback((id: string, patch: (conversation: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((conversation) => (conversation.id === id ? patch(conversation) : conversation)));
  }, []);

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
    patchConversation(activeId, (conversation) => ({
      ...conversation,
      title: "New Conversation",
      messages: [],
    }));
  }, [activeId, patchConversation]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const togglePin = useCallback(
    (id: string) => {
      patchConversation(id, (conversation) => ({ ...conversation, pinned: !conversation.pinned }));
    },
    [patchConversation],
  );

  const shareConversation = useCallback((): Feedback => {
    return {
      tone: "info",
      message: "Sharing is unavailable. Private conversations are not published without an explicit sharing service.",
    };
  }, []);

  const addJournalEntry = useCallback(
    (entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">): Feedback => {
      const record: JournalEntry = {
        ...entry,
        id: createId("jnl"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setJournal((prev) => [record, ...prev]);
      return { tone: "success", message: `Saved to Journal on this device. ${persistenceCopy.deviceOnly}` };
    },
    [],
  );

  const updateJournalEntry = useCallback((id: string, patch: Partial<JournalEntry>): Feedback => {
    setJournal((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch, updatedAt: nowIso() } : entry)),
    );
    return { tone: "success", message: "Journal entry updated on this device." };
  }, []);

  const deleteJournalEntry = useCallback((id: string): Feedback => {
    setJournal((prev) => prev.filter((entry) => entry.id !== id));
    return { tone: "success", message: "Journal entry deleted on this device." };
  }, []);

  const addActiveToJournal = useCallback(
    (title?: string): Feedback => {
      if (!activeConversation || activeConversation.messages.length === 0) {
        return { tone: "error", message: "There is no conversation content to save." };
      }
      const content = activeConversation.messages
        .map((message) => {
          const speaker = message.role === "user" ? "Admin" : "HERMES";
          const body =
            message.text ||
            responseToText(message.title ?? "Analysis", message.blocks ?? []) ||
            "";
          return `**${speaker}**\n${body}`;
        })
        .join("\n\n");
      return addJournalEntry({
        title: title?.trim() || activeConversation.title,
        date: new Date().toISOString().slice(0, 10),
        content,
        source: "ai-analysis" satisfies JournalSource,
        tags: ["ai"],
        conversationId: activeConversation.id,
      });
    },
    [activeConversation, addJournalEntry],
  );

  const addStrategy = useCallback(
    (draft: Omit<Strategy, "id" | "createdAt" | "updatedAt" | "version" | "status">): Feedback => {
      const record: Strategy = {
        ...draft,
        id: createId("str"),
        status: "draft",
        version: "0.1",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setStrategies((prev) => [record, ...prev]);
      return {
        tone: "success",
        message: "Draft saved on this device. Backtesting and execution are not connected.",
      };
    },
    [],
  );

  const deleteStrategy = useCallback((id: string): Feedback => {
    setStrategies((prev) => prev.filter((item) => item.id !== id));
    return { tone: "success", message: "Strategy draft removed from this device." };
  }, []);

  const updateProfile = useCallback((patch: Partial<AdminProfile>): Feedback => {
    setProfile((prev) => ({ ...prev, ...patch }));
    return {
      tone: "success",
      message: `Profile updated on this device. ${persistenceCopy.notRemote} Supabase Storage is not connected.`,
    };
  }, []);

  const clearPromptNotice = useCallback(() => setPromptNotice(null), []);
  const clearFeedback = useCallback(() => setFeedback(null), []);

  const recheckAiConnection = useCallback(() => {
    setAiStatus("connecting");
    setAiStatusDetail("Checking connection…");
    void checkAiBackendHealth().then((health) => {
      setAiStatus(health.state);
      setAiStatusDetail(health.detail);
    });
  }, []);

  useEffect(() => {
    recheckAiConnection();
  }, [recheckAiConnection]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    endActivity();
    setIsStreaming(false);
    setPhase("idle");
    setGenerationState("cancelled");
  }, [endActivity]);

  const sendMessage = useCallback(
    (rawText: string, attachments: ChatAttachmentMeta[] = []) => {
      const text = rawText.trim();
      if ((!text && attachments.length === 0) || isStreaming) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setGenerationState("processing");
      showWaitingActivity();

      const attachmentNote =
        attachments.length > 0
          ? `\n\n[Attached: ${attachments.map((file) => file.name).join(", ")}. The current AI endpoint accepts text only — file bytes were not uploaded.]`
          : "";

      const userMessage: ChatMessage = {
        id: createId("msg"),
        role: "user",
        createdAt: nowIso(),
        text: text + attachmentNote,
        attachments,
      };

      const assistantMessage: ChatMessage = {
        id: createId("msg"),
        role: "zyrex",
        createdAt: nowIso(),
        mode: modeId,
        kind: "analysis",
        title: "HERMES Analysis",
        text: "",
        blocks: [],
      };

      // Previous turns only, in the backend's { role, text } shape. Send
      // the assistant's actual streamed words — not a re-serialized
      // header/blocks summary — and skip failed or cancelled turns.
      const history = (activeConversation?.messages ?? [])
        .filter((message) => message.kind !== "offline" && message.kind !== "cancelled")
        .slice(-8)
        .map((message) =>
          message.role === "user"
            ? { role: "user" as const, text: message.text ?? "" }
            : {
                role: "assistant" as const,
                text:
                  message.text?.trim() ||
                  responseToText(message.title ?? "HERMES Analysis", message.blocks ?? []),
              },
        );

      let conversationId = activeId;
      if (!conversationId) {
        const conversation: Conversation = {
          ...blankConversation(modeId),
          title: (text || attachments[0]?.name || "New Conversation").slice(0, 34),
          messages: [userMessage, assistantMessage],
        };
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversation.id);
        conversationId = conversation.id;
      } else {
        patchConversation(conversationId, (conversation) => ({
          ...conversation,
          title:
            conversation.messages.length === 0
              ? (text || attachments[0]?.name || conversation.title).slice(0, 42)
              : conversation.title,
          updatedAt: "Just now",
          messages: [...conversation.messages, userMessage, assistantMessage],
        }));
      }

      setPage("ai");
      setPhase("connecting");

      const targetId = conversationId;
      const assistantId = assistantMessage.id;

      const updateLastAssistant = (patch: (message: ChatMessage) => ChatMessage) => {
        patchConversation(targetId, (conversation) => {
          const next = [...conversation.messages];
          for (let index = next.length - 1; index >= 0; index -= 1) {
            if (next[index].id === assistantId || next[index].role === "zyrex") {
              next[index] = patch(next[index]);
              break;
            }
          }
          return { ...conversation, updatedAt: "Just now", messages: next };
        });
      };

      // Batch streamed tokens into animation-frame state updates instead of
      // re-rendering on every WebSocket frame: tokens can arrive per
      // character, and each one previously triggered a full conversation
      // state write + markdown reparse + scroll. Incoming text is buffered
      // here and flushed at most once per frame (and at most every 50ms),
      // so a burst of frames coalesces into a single render. The final
      // buffered text is flushed synchronously on completion/cancel/error
      // below, so no characters are ever lost or reordered.
      const STREAM_FLUSH_INTERVAL_MS = 50;
      let pendingStreamText: string | null = null;
      let streamFlushFrame: number | null = null;
      let lastStreamFlushAt = 0;
      let lastSilenceArmAt = 0;
      let hasStreamedToken = false;

      const applyStreamText = (accumulated: string) => {
        lastStreamFlushAt = performance.now();
        updateLastAssistant((message) => ({
          ...message,
          kind: "analysis",
          text: accumulated,
          blocks: [{ type: "summary", text: accumulated }],
        }));
      };

      const cancelPendingStreamFlush = () => {
        if (streamFlushFrame !== null) {
          cancelAnimationFrame(streamFlushFrame);
          streamFlushFrame = null;
        }
      };

      const flushPendingStreamText = () => {
        cancelPendingStreamFlush();
        if (pendingStreamText === null) return;
        const accumulated = pendingStreamText;
        pendingStreamText = null;
        applyStreamText(accumulated);
      };

      const scheduleStreamFlush = () => {
        if (streamFlushFrame !== null) return;
        const tick = () => {
          streamFlushFrame = null;
          if (performance.now() - lastStreamFlushAt < STREAM_FLUSH_INTERVAL_MS) {
            streamFlushFrame = requestAnimationFrame(tick);
            return;
          }
          flushPendingStreamText();
        };
        streamFlushFrame = requestAnimationFrame(tick);
      };

      void requestAnalysis(
        {
          prompt: (text || "See attached files.") + attachmentNote,
          mode: modeId,
          history,
        },
        {
          signal: controller.signal,
          onOpen: () => {
            setPhase("thinking");
            setGenerationState("processing");
            showWaitingActivity();
          },
          onActivity: (label) => {
            setGenerationActivity(label);
            scheduleActivity([[10_000, "Still working…"]]);
          },
          onToken: (accumulated) => {
            if (!hasStreamedToken) {
              hasStreamedToken = true;
              setGenerationState("streaming");
            }
            // Re-arming the silence-activity timers is throttled too —
            // previously every token cleared and recreated four timers.
            // 250ms granularity is far finer than the 3s+ activity stages.
            const now = performance.now();
            if (now - lastSilenceArmAt >= 250) {
              lastSilenceArmAt = now;
              armStreamSilenceActivity();
            }
            pendingStreamText = accumulated;
            scheduleStreamFlush();
          },
          onOptions: (options) => {
            updateLastAssistant((message) => ({ ...message, options }));
          },
          onDone: () => {
            flushPendingStreamText();
            endActivity();
            setIsStreaming(false);
          },
        },
      )
        .then((result) => {
          flushPendingStreamText();
          if (
            controller.signal.aborted ||
            (result.status === "offline" && result.reason === "Generation cancelled.")
          ) {
            setGenerationState("cancelled");
            updateLastAssistant((message) => ({
              ...message,
              kind: "cancelled",
              title: "Generation cancelled.",
              text: message.text || "Generation cancelled.",
            }));
            return;
          }
          if (result.status === "ready") {
            setAiStatus("connected");
            setAiStatusDetail("Backend answered the last analysis request.");
            setGenerationState("completed");
            updateLastAssistant((message) => ({
              ...message,
              kind: "analysis",
              title: result.title,
              blocks: result.blocks,
              text: message.text,
              options: result.options ?? message.options,
            }));
            return;
          }
          setAiStatus("error");
          setAiStatusDetail(result.reason);
          setGenerationState("error");
          updateLastAssistant((message) => ({
            ...message,
            kind: "offline",
            title: result.reason,
            // Keep whatever streamed before the failure; the offline
            // bubble renders the reason, and the text stays copyable.
          }));
        })
        .catch(() => {
          flushPendingStreamText();
          setAiStatus("disconnected");
          setAiStatusDetail("Service unavailable right now. Please try again.");
          setGenerationState("error");
          updateLastAssistant((message) => ({
            ...message,
            kind: "offline",
            title: GENERATION_FAILED_MESSAGE,
          }));
        })
        .finally(() => {
          cancelPendingStreamFlush();
          endActivity();
          setIsStreaming(false);
          setPhase("idle");
          if (abortRef.current === controller) abortRef.current = null;
        });
    },
    [
      activeId,
      activeConversation,
      modeId,
      patchConversation,
      isStreaming,
      showWaitingActivity,
      armStreamSilenceActivity,
      scheduleActivity,
      endActivity,
    ],
  );

  const regenerate = useCallback(() => {
    if (!activeConversation) return;
    const lastUserMessage = [...activeConversation.messages].reverse().find((message) => message.role === "user");
    if (!lastUserMessage?.text) return;
    sendMessage(lastUserMessage.text);
  }, [activeConversation, sendMessage]);

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

  const exportLocalData = useCallback(() => {
    const payload = {
      exportedAt: nowIso(),
      notice: "Device-local cache only. Not a verified trading export.",
      profile: { ...profile, imageDataUrl: profile.imageDataUrl ? "[omitted binary]" : null },
      settings,
      journal,
      strategies,
      conversations: conversations.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) => ({
          ...message,
          attachments: message.attachments?.map((file) => ({ ...file })),
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hermes-local-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback({ tone: "success", message: "Exported the device-local cache. This is not cloud-backed." });
  }, [profile, settings, journal, strategies, conversations]);

  const deleteLocalData = useCallback((): Feedback => {
    setConversations([]);
    setJournal([]);
    setStrategies([]);
    setProfile(defaultProfile);
    setActiveId(null);
    return { tone: "success", message: "Device-local journal, chats, strategies and profile cache cleared." };
  }, []);

  const value: ZyrexContextValue = {
    page,
    navigate,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    isMobile,
    theme,
    resolvedTheme,
    setTheme,
    aiPopupOpen,
    toggleAIPopup,
    mode,
    setMode: setModeId,
    hasTradeData,
    aiStatus,
    aiStatusDetail,
    aiStatusLabel: healthLabel(aiStatus),
    recheckAiConnection,
    conversations,
    activeConversationId: activeId,
    activeConversation,
    messages,
    selectConversation,
    startNewConversation,
    clearActiveConversation,
    deleteConversation,
    togglePin,
    shareConversation,
    addActiveToJournal,
    phase,
    isStreaming,
    generationState,
    generationActivity,
    sendMessage,
    stopGeneration,
    regenerate,
    promptNotice,
    clearPromptNotice,
    feedback,
    setFeedback,
    clearFeedback,
    journal,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    strategies,
    addStrategy,
    deleteStrategy,
    profile,
    updateProfile,
    settings,
    updateSettings,
    resetSettings,
    exportLocalData,
    deleteLocalData,
  };

  return <ZyrexContext.Provider value={value}>{children}</ZyrexContext.Provider>;
}

export function useZyrex(): ZyrexContextValue {
  const context = useContext(ZyrexContext);
  if (!context) throw new Error("useZyrex must be used inside a ZyrexProvider");
  return context;
}
