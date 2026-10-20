/**
 * ZYREX backend transport — the ONLY AI transport in this app.
 *
 * Sending a message opens a WebSocket to the ZYREX Python backend
 * (Agno + Groq server-side, with the custom CoinAPI / GeckoTerminal
 * market-data tools and tool_choice="auto"), sends one JSON payload
 * `{ prompt, mode, history }`, then appends streamed text chunks to the
 * assistant message until the backend sends the "[DONE]" marker.
 * Backend errors arrive as a JSON frame before "[DONE]".
 *
 * There are deliberately NO direct model-provider calls here — no Groq
 * SDK, no provider API keys, no built-in browsing/code-execution tools.
 * Model and tool selection happen entirely on the backend.
 *
 * The browser attaches the page's Origin header to the WebSocket
 * handshake automatically; it cannot be set or overridden from
 * JavaScript. The backend must therefore allowlist the deployed
 * frontend origin (e.g. https://zyrex.wasmer.app).
 */
import type {
  AnalysisRequest,
  AnalysisResult,
  ConnectionState,
  ResponseBlock,
  StructuredOption,
} from "../types";

/**
 * ZYREX backend endpoints. Hardcoded (not env-driven) so a stale
 * deployment variable can never silently repoint the chat at a
 * different — e.g. direct-provider — endpoint.
 */
export const ZYREX_WS_URL = "wss://zyrex-mpya.onrender.com";
export const ZYREX_HEALTH_URL = "https://zyrex-mpya.onrender.com/health";

/** Back-compat aliases for existing imports. */
export const aiAnswerUrl = ZYREX_WS_URL;
export const aiHealthUrl = ZYREX_HEALTH_URL;

export const aiBackend = {
  baseUrl: ZYREX_WS_URL,
  wsUrl: ZYREX_WS_URL,
  healthUrl: ZYREX_HEALTH_URL,
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

/**
 * Wire payload for the ZYREX backend — exactly
 * `{ prompt, mode, history: [{ role: "user" | "assistant", text }] }`.
 * No model name, no tools, no tool_choice: the backend owns those and
 * runs with tool_choice="auto" so it can call its market-data tools
 * (CoinAPI, GeckoTerminal, risk checks…) when the question needs them.
 */
export function buildRequestPayload(request: AnalysisRequest): {
  prompt: string;
  mode: AnalysisRequest["mode"];
  history: Array<{ role: "user" | "assistant"; text: string }>;
} {
  return {
    prompt: request.prompt.trim(),
    mode: request.mode,
    history: (request.history ?? [])
      .map((turn) => ({
        role: turn.role === "user" ? ("user" as const) : ("assistant" as const),
        text: (turn.text ?? "").trim(),
      }))
      .filter((turn) => turn.text.length > 0)
      .slice(-8),
  };
}

/* --------------------------------------------------------- stream frames
 * The backend primarily streams raw text chunks and terminates with the
 * "[DONE]" marker — either as its own frame or appended to the final
 * chunk. Errors arrive as a JSON frame before "[DONE]". The helpers
 * below also tolerate JSON-wrapped chunks so a framing change on the
 * backend cannot corrupt the answer: delta fields append, whole-answer
 * fields are treated as cumulative snapshots (never duplicated), and
 * control / tool-event frames carrying no answer text are ignored
 * instead of being stringified into the reply.
 */

const DELTA_KEYS = ["chunk", "token", "delta", "text", "content"] as const;
const SNAPSHOT_KEYS = ["answer", "response", "reply", "output", "result"] as const;

/**
 * Incremental text carried by a JSON frame, if any. Never trimmed —
 * a chunk can be a single meaningful space.
 */
function deltaFromRecord(record: Json): string | undefined {
  for (const key of DELTA_KEYS) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (isRecord(value)) {
      const nested = deltaFromRecord(value);
      if (nested !== undefined) return nested;
    }
  }
  const choices = record.choices;
  if (Array.isArray(choices) && isRecord(choices[0])) {
    const first = choices[0];
    if (isRecord(first.delta)) {
      const nested = deltaFromRecord(first.delta);
      if (nested !== undefined) return nested;
    }
    if (isRecord(first.message)) {
      const nested = deltaFromRecord(first.message);
      if (nested !== undefined) return nested;
    }
    if (typeof first.text === "string") return first.text;
  }
  return undefined;
}

/** Whole-answer-so-far text carried by a JSON frame, if any. */
function snapshotFromRecord(record: Json): string | undefined {
  for (const key of SNAPSHOT_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

/** Backend error message carried by a JSON frame, if it is one. */
function errorFromRecord(record: Json): string | undefined {
  const flagged =
    (record.error !== undefined && record.error !== null && record.error !== false) ||
    record.status === "error" ||
    record.status === "offline" ||
    record.type === "error" ||
    record.ok === false;
  if (!flagged) return undefined;
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  if (isRecord(record.error)) {
    const nested = pickString(record.error, ["message", "detail", "reason", "error"]);
    if (nested) return nested;
  }
  return pickString(record, ["reason", "message", "detail"]) ?? "HERMES could not answer.";
}

function isDoneRecord(record: Json): boolean {
  return (
    record.done === true ||
    record.type === "done" ||
    record.event === "done" ||
    record.status === "done"
  );
}

export async function requestAnalysis(
  request: AnalysisRequest,
  handlers: AnalysisStreamHandlers = {},
): Promise<AnalysisResult> {
  const payload = buildRequestPayload(request);
  if (!payload.prompt) {
    return { status: "offline", reason: "Enter a message before sending." };
  }

  return new Promise((resolve) => {
    let socket: WebSocket | undefined;
    let settled = false;
    let answer = "";
    let options: StructuredOption[] | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    function finish(result: AnalysisResult) {
      if (settled) return;
      settled = true;
      if (idleTimer !== undefined) clearTimeout(idleTimer);
      handlers.signal?.removeEventListener("abort", onAbort);
      if (socket) {
        socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
        socket.close();
      }
      resolve(result);
    }

    function onAbort() {
      finish({ status: "offline", reason: "Generation cancelled." });
    }

    // Bounds silence, not total answer length: a Render cold start and
    // server-side tool calls can precede the first token, and a healthy
    // stream must not be cut off merely for being long. Re-armed on open
    // and on every received frame.
    function armIdleTimer() {
      if (idleTimer !== undefined) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        finish({
          status: "offline",
          reason: "The HERMES response timed out before [DONE]. Please try again.",
        });
      }, aiBackend.timeoutMs);
    }

    function appendText(chunk: string) {
      if (chunk.length === 0) return;
      answer += chunk;
      handlers.onToken?.(answer, chunk);
    }

    function appendSnapshot(fullText: string) {
      if (fullText === answer) return;
      if (fullText.startsWith(answer)) {
        const chunk = fullText.slice(answer.length);
        answer = fullText;
        if (chunk.length > 0) handlers.onToken?.(answer, chunk);
        return;
      }
      appendText(fullText);
    }

    function complete() {
      handlers.onDone?.();
      finish(
        answer.trim()
          ? { status: "ready", ...answerToBlocks(answer), options }
          : { status: "offline", reason: "HERMES finished without returning readable content." },
      );
    }

    /**
     * Append text, treating "[DONE]" anywhere in it as the terminator:
     * the marker may be its own frame or appended to the final chunk.
     */
    function handleText(text: string) {
      const doneAt = text.indexOf(STREAM_DONE);
      if (doneAt >= 0) {
        appendText(text.slice(0, doneAt));
        complete();
        return;
      }
      appendText(text);
    }

    function handleFrame(raw: string) {
      if (settled) return;
      armIdleTimer();
      const payload = parseJson(raw);

      // JSON-encoded string chunk (including an encoded "[DONE]").
      if (typeof payload === "string") {
        handleText(payload);
        return;
      }

      if (isRecord(payload)) {
        const error = errorFromRecord(payload);
        if (error) {
          finish({ status: "offline", reason: error });
          return;
        }
        const nextOptions = extractStructuredOptions(payload);
        if (nextOptions) {
          options = nextOptions;
          handlers.onOptions?.(nextOptions);
        }
        const delta = deltaFromRecord(payload);
        if (delta !== undefined) {
          const doneAt = delta.indexOf(STREAM_DONE);
          if (doneAt >= 0) {
            appendText(delta.slice(0, doneAt));
            complete();
            return;
          }
          appendText(delta);
        } else {
          const snapshot = snapshotFromRecord(payload);
          if (snapshot !== undefined) appendSnapshot(snapshot);
          // Frames with no answer text (status / tool-call events) count
          // as liveness only — never stringified into the reply.
        }
        if (isDoneRecord(payload)) complete();
        return;
      }

      // Plain text chunk — the backend's primary framing.
      handleText(raw);
    }

    if (handlers.signal?.aborted) {
      finish({ status: "offline", reason: "Generation cancelled." });
      return;
    }
    handlers.signal?.addEventListener("abort", onAbort);
    armIdleTimer();

    try {
      socket = new WebSocket(ZYREX_WS_URL);
      const activeSocket = socket;
      activeSocket.onopen = () => {
        armIdleTimer();
        try {
          handlers.onOpen?.();
          activeSocket.send(JSON.stringify(payload));
        } catch {
          finish({ status: "offline", reason: "Couldn't send the message to HERMES." });
        }
      };
      activeSocket.onmessage = (event: MessageEvent) => {
        if (settled) return;
        const data: unknown = event.data;
        if (typeof data === "string") {
          handleFrame(data);
        } else if (typeof Blob !== "undefined" && data instanceof Blob) {
          void data
            .text()
            .then((text) => handleFrame(text))
            .catch(() => undefined);
        } else if (data instanceof ArrayBuffer) {
          handleFrame(new TextDecoder().decode(data));
        }
      };
      activeSocket.onerror = () =>
        finish({
          status: "offline",
          reason: `Couldn't connect to ${ZYREX_WS_URL}. Check backend availability and allowed WebSocket origins.`,
        });
      activeSocket.onclose = () =>
        finish({
          status: "offline",
          reason: "HERMES disconnected before completing the response ([DONE]). Please try again.",
        });
    } catch {
      finish({ status: "offline", reason: `Couldn't open a WebSocket connection to ${ZYREX_WS_URL}.` });
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

async function probeHealthEndpoint(
  timeoutMs: number,
): Promise<{ ok: boolean; status: number | null }> {
  if (typeof fetch !== "function") return { ok: false, status: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(ZYREX_HEALTH_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timer);
  }
}

function probeWebSocketHandshake(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let socket: WebSocket | undefined;
    let settled = false;
    const timer = setTimeout(() => finish(false), timeoutMs);
    function finish(connected: boolean) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (socket) {
        socket.onopen = socket.onerror = socket.onclose = null;
        socket.close();
      }
      resolve(connected);
    }
    try {
      socket = new WebSocket(ZYREX_WS_URL);
      socket.onopen = () => finish(true);
      socket.onerror = socket.onclose = () => finish(false);
    } catch {
      finish(false);
    }
  });
}

export async function checkAiBackendHealth(): Promise<BackendHealth> {
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;

  const http = await probeHealthEndpoint(aiBackend.timeoutMs);
  if (http.ok) {
    return {
      state: "connected",
      label: "Connected",
      detail: `Health check passed at ${ZYREX_HEALTH_URL} in ${elapsed()}ms.`,
      latencyMs: elapsed(),
      status: http.status,
    };
  }

  // /health can be unreachable from a browser (e.g. no CORS headers on the
  // HTTP route) while the WebSocket itself is fine — WebSockets are not
  // subject to CORS, only to the backend's Origin allowlist.
  const wsOk = await probeWebSocketHandshake(aiBackend.timeoutMs);
  if (wsOk) {
    return {
      state: "connected",
      label: "Connected",
      detail: `WebSocket handshake succeeded in ${elapsed()}ms. Reachability only — AI availability is checked when sending a message.`,
      latencyMs: elapsed(),
      status: http.status,
    };
  }

  return {
    state: "disconnected",
    label: "Offline",
    detail: `Couldn't reach the ZYREX backend at ${ZYREX_WS_URL}. It may still be starting up — try again in a moment.`,
    latencyMs: null,
    status: http.status,
  };
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
