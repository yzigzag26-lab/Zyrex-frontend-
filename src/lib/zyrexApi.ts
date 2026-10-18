/**
 * ZYREX Python backend transport. Submit opens a WebSocket to the Render
 * stream, forwards every token so the chat can append to the last assistant
 * message, and stops when the payload matches "[DONE]".
 */
import type {
  AnalysisRequest,
  AnalysisResult,
  ConnectionState,
  ResponseBlock,
  StructuredOption,
} from "../types";

// Deliberately independent of legacy HTTP environment variables in deployments.
export const aiAnswerUrl = "wss://zyrex-mpya.onrender.com";
export const aiHealthUrl = aiAnswerUrl;
export const aiBackend = {
  baseUrl: aiAnswerUrl,
  healthEndpoint: "",
  timeoutMs: Number(import.meta.env.VITE_AI_TIMEOUT_MS) > 0
    ? Number(import.meta.env.VITE_AI_TIMEOUT_MS)
    : 120_000,
} as const;

/* ------------------------------------------------------------------ helpers */

type Json = Record<string, unknown>;

function parseJson(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(source: unknown, keys: string[]): string | undefined {
  if (!isRecord(source)) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function cleanText(value: string): string {
  let text = value.replace(/\r\n/g, "\n").trim();
  // Some backends double-escape newlines (literal "\n" inside the body).
  if (text.includes("\\n") && !text.includes("\n")) text = text.replace(/\\n/g, "\n");
  return text.replace(/<br\s*\/?>/gi, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* -------------------------------------------------------------- answer text */

const TEXT_KEYS = [
  "answer",
  "response",
  "reply",
  "message",
  "text",
  "output",
  "result",
  "content",
  "completion",
  "generated_text",
  "summary",
  "body",
];

function stringifyBlocks(blocks: unknown[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (typeof block === "string") {
      if (block.trim()) parts.push(block.trim());
      continue;
    }
    if (!isRecord(block)) continue;

    const heading = pickString(block, ["title", "heading", "label", "name"]);
    const body = pickString(block, ["text", "content", "value", "body", "markdown", "answer"]);
    const listSource = block.items ?? block.points ?? block.bullets ?? block.rows;

    const chunk: string[] = [];
    if (heading) chunk.push(`## ${heading}`);
    if (body) chunk.push(body);

    const listLines: string[] = [];
    if (Array.isArray(listSource)) {
      for (const item of listSource) {
        if (typeof item === "string") {
          if (item.trim()) listLines.push(`- ${item.trim()}`);
        } else if (isRecord(item)) {
          const entry =
            pickString(item, ["text", "content", "value"]) ??
            [pickString(item, ["label"]), pickString(item, ["value"])].filter(Boolean).join(" — ");
          if (entry) listLines.push(`- ${entry}`);
        }
      }
    }
    if (listLines.length > 0) chunk.push(listLines.join("\n"));
    if (chunk.length > 0) parts.push(chunk.join("\n\n"));
  }

  return parts.join("\n\n").trim();
}

export function extractAnswerText(payload: unknown, raw: string): string {
  if (typeof payload === "string") return cleanText(payload);

  if (isRecord(payload)) {
    if (Array.isArray(payload.blocks)) {
      const fromBlocks = stringifyBlocks(payload.blocks);
      if (fromBlocks) return cleanText(fromBlocks);
    }

    for (const key of TEXT_KEYS) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) return cleanText(value);
      if (isRecord(value)) {
        const nested = extractAnswerText(value, "");
        if (nested) return nested;
      }
      if (Array.isArray(value)) {
        const joined = value
          .map((item) =>
            typeof item === "string"
              ? item
              : isRecord(item)
                ? pickString(item, ["text", "content", "value"]) ?? ""
                : "",
          )
          .filter((item) => item.trim().length > 0)
          .join("\n");
        if (joined.trim()) return cleanText(joined);
      }
    }

    const choices = payload.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      if (isRecord(first)) {
        if (isRecord(first.message)) {
          const content = pickString(first.message, ["content", "text"]);
          if (content) return cleanText(content);
        }
        const direct = pickString(first, ["text", "content"]);
        if (direct) return cleanText(direct);
      }
    }

    if (isRecord(payload.data)) {
      const nested = extractAnswerText(payload.data, "");
      if (nested) return nested;
    }
  }

  const trimmed = raw.trim();
  if (trimmed && !/^[{[]/.test(trimmed)) return cleanText(trimmed);
  return "";
}

/* ------------------------------------------------------- text → UI blocks */

const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;
const BOLD_HEADING = /^\s*\*\*(.+?)\*\*\s*:?\s*$/;
const BULLET = /^\s*[-*+•]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const ACTION_TITLE = /action|recommend|next step|to-?do|checklist|improve|fix|plan|follow ?up|suggest/i;

interface Section {
  title: string | null;
  lines: string[];
  items: string[];
}

function stripInline(value: string): string {
  return value.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

function truncate(value: string, max: number): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1).trimEnd()}…` : oneLine;
}

export function answerToBlocks(answer: string): { title: string; blocks: ResponseBlock[] } {
  const text = cleanText(answer);
  if (!text) return { title: "HERMES Analysis", blocks: [] };

  const sections: Section[] = [{ title: null, lines: [], items: [] }];

  for (const line of text.split("\n")) {
    const heading = line.match(HEADING) ?? line.match(BOLD_HEADING);
    if (heading) {
      sections.push({ title: stripInline(heading[1]), lines: [], items: [] });
      continue;
    }
    const current = sections[sections.length - 1];
    const bullet = line.match(BULLET);
    if (bullet) {
      current.items.push(bullet[1].trim());
      continue;
    }
    const ordered = line.match(ORDERED);
    if (ordered) {
      current.items.push(ordered[1].trim());
      continue;
    }
    current.lines.push(line);
  }

  const blocks: ResponseBlock[] = [];

  const pushBody = (section: Section) => {
    const paragraph = section.lines.join("\n").trim();
    const list = section.items.filter(Boolean);
    const parts = [paragraph];
    if (list.length > 0) parts.push(list.map((item) => `- ${item}`).join("\n"));
    return parts.filter((part) => part.trim().length > 0).join("\n\n").trim();
  };

  const [intro, ...rest] = sections;

  const introBody = pushBody(intro);
  if (introBody) blocks.push({ type: "summary", text: introBody });

  for (const section of rest) {
    if (!section.title) continue;
    const paragraph = section.lines.join("\n").trim();
    const items = [...new Set(section.items.map((item) => item.trim()).filter(Boolean))];

    const asActions = items.length > 0 && (paragraph.length === 0 || ACTION_TITLE.test(section.title));

    if (asActions) {
      blocks.push({ type: "actions", title: section.title, items });
      if (paragraph) blocks.push({ type: "observation", title: `${section.title} — detail`, text: paragraph });
      continue;
    }

    const body = pushBody(section);
    if (body) blocks.push({ type: "observation", title: section.title, text: body });
  }

  if (blocks.length === 0) blocks.push({ type: "summary", text });

  const headingTitle = sections.find((section) => section.title)?.title;
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  const title = headingTitle
    ? truncate(headingTitle, 60)
    : truncate(stripInline(firstLine), 60) || "HERMES Analysis";

  return { title, blocks };
}

/* ------------------------------------------------------------- AI request */

export const STREAM_DONE = "[DONE]";

export interface AnalysisStreamHandlers {
  onOpen?: () => void;
  onToken?: (accumulated: string, chunk: string) => void;
  onDone?: () => void;
  onOptions?: (options: StructuredOption[]) => void;
  /** Closes the socket without inventing a completed answer. */
  signal?: AbortSignal;
}

export function extractStructuredOptions(payload: unknown): StructuredOption[] | undefined {
  if (!isRecord(payload)) return undefined;
  const raw = payload.options ?? payload.question_options ?? payload.selectable_options;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const options: StructuredOption[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      options.push({ id: item.trim(), label: item.trim() });
      continue;
    }
    if (!isRecord(item)) continue;
    const label = pickString(item, ["label", "text", "value", "name", "title"]);
    if (!label) continue;
    options.push({ id: pickString(item, ["id", "value"]) ?? label, label });
  }
  return options.length > 0 ? options : undefined;
}

export async function requestAnalysis(
  request: AnalysisRequest,
  handlers: AnalysisStreamHandlers = {},
): Promise<AnalysisResult> {
  const prompt = request.prompt.trim();
  if (!prompt) {
    return { status: "offline", reason: "Enter a message before sending." };
  }

  return new Promise((resolve) => {
    let socket: WebSocket | undefined;
    let settled = false;
    let answer = "";
    let options: StructuredOption[] | undefined;
    const timer = setTimeout(() => {
      finish({ status: "offline", reason: "The HERMES response timed out before [DONE]. Please try again." });
    }, aiBackend.timeoutMs);

    if (handlers.signal?.aborted) {
      finish({ status: "offline", reason: "Generation cancelled." });
      return;
    }
    handlers.signal?.addEventListener("abort", () => {
      finish({ status: "offline", reason: "Generation cancelled." });
    });

    function finish(result: AnalysisResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (socket) {
        socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
        socket.close();
      }
      resolve(result);
    }

    function isDoneSentinel(raw: string, payload: unknown): boolean {
      return raw.trim() === STREAM_DONE || payload === STREAM_DONE;
    }

    try {
      socket = new WebSocket(aiAnswerUrl);
      socket.onopen = () => {
        try {
          handlers.onOpen?.();
          socket!.send(JSON.stringify({
            prompt,
            mode: request.mode,
            history: (request.history ?? []).slice(-8).map((turn) => ({
              role: turn.role === "user" ? "user" : "assistant",
              text: turn.text ?? "",
            })),
          }));
        } catch {
          finish({ status: "offline", reason: "Couldn't send the message to HERMES." });
        }
      };
      socket.onmessage = (event: MessageEvent) => {
        if (settled || typeof event.data !== "string") return;
        const raw = event.data;
        const payload = parseJson(raw);
        // Accept both raw text and a JSON-encoded string sentinel.
        if (isDoneSentinel(raw, payload)) {
          handlers.onDone?.();
          finish(answer.trim()
            ? { status: "ready", ...answerToBlocks(answer), options }
            : { status: "offline", reason: "HERMES finished without returning readable content." });
          return;
        }
        if (isRecord(payload) && (payload.error || payload.status === "error" || payload.status === "offline")) {
          finish({ status: "offline", reason: pickString(payload, ["reason", "error", "message", "detail"]) ?? "HERMES could not answer." });
          return;
        }
        if (isRecord(payload)) {
          const nextOptions = extractStructuredOptions(payload);
          if (nextOptions) {
            options = nextOptions;
            handlers.onOptions?.(nextOptions);
          }
        }
        const chunk = typeof payload === "string" ? payload
          : isRecord(payload) ? [payload.chunk, payload.token, payload.text, payload.content]
              .find((value): value is string => typeof value === "string")
              ?? extractAnswerText(payload, "")
          : raw;
        if (chunk.length === 0) return;
        answer += chunk;
        handlers.onToken?.(answer, chunk);
      };
      socket.onerror = () => finish({ status: "offline", reason: `Couldn't connect to ${aiAnswerUrl}. Check backend availability and allowed WebSocket origins.` });
      socket.onclose = () => finish({ status: "offline", reason: "HERMES disconnected before completing the response ([DONE]). Please try again." });
    } catch {
      finish({ status: "offline", reason: `Couldn't open a WebSocket connection to ${aiAnswerUrl}.` });
    }
  });
}

/* ------------------------------------------------------------ health probe */

export interface BackendHealth {
  state: ConnectionState;
  label: string;
  detail: string;
  latencyMs: number | null;
  status: number | null;
}

export async function checkAiBackendHealth(): Promise<BackendHealth> {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    let socket: WebSocket | undefined;
    let settled = false;
    const timer = setTimeout(() => finish(false), aiBackend.timeoutMs);
    function finish(connected: boolean) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (socket) {
        socket.onopen = socket.onerror = socket.onclose = null;
        socket.close();
      }
      resolve({
        state: connected ? "connected" : "disconnected",
        label: connected ? "Connected" : "Offline",
        detail: connected
          ? `WebSocket handshake succeeded in ${Date.now() - startedAt}ms. Reachability only — AI availability is checked when sending a message.`
          : `Couldn't open a WebSocket connection to ${aiAnswerUrl}.`,
        latencyMs: connected ? Date.now() - startedAt : null,
        status: null,
      });
    }
    try {
      socket = new WebSocket(aiAnswerUrl);
      socket.onopen = () => finish(true);
      socket.onerror = socket.onclose = () => finish(false);
    } catch {
      finish(false);
    }
  });
}

export function healthLabel(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Checking…";
    case "error":
      return "Error";
    default:
      return "Offline";
  }
}
