/**
 * ============================================================================
 * ZYREX AI — BACKEND TRANSPORT
 * ============================================================================
 *
 * The single place the frontend talks to the ZYREX backend.
 *
 *   POST  {baseUrl}/api/zyrex-ai     →  an AI answer for a prompt
 *   GET   {baseUrl}/api/health        →  reachability / readiness probe
 *
 * AI answer contract:
 *   request   { prompt, mode?, history? }
 *             history entries are { role: "user" | "assistant", text };
 *             the backend reads at most the last 8.
 *   response  200 → { status: "ready", title, blocks: ResponseBlock[] }
 *             the answer is rendered from `blocks` (typically the summary
 *             block's `text`, which may contain Markdown). There is no
 *             top-level `answer` property and the endpoint does not stream.
 *   errors    { status: "offline", reason } — 400 blank/invalid body,
 *             404 unknown route, 500 missing GROQ_API_KEY, 502 provider
 *             failure / rate limit / quota / empty response.
 *
 * Everything is configurable from the environment so the same build can point
 * at a local server, a staging box or production:
 *
 *   VITE_API_BASE_URL      Backend origin (scheme + host, no path).
 *                          Default: the Wasmer deployment.
 *   VITE_API_URL           Alias for the above.
 *   VITE_AI_ENDPOINT       Path for an AI answer.       Default: /api/zyrex-ai
 *   VITE_HEALTH_ENDPOINT   Path for the health probe.   Default: /api/health
 *   VITE_AI_TIMEOUT_MS     Abort timeout in ms.         Default: 30000
 *   VITE_USE_DEV_PROXY     "false" → call the backend URL directly.
 *                          Default: on while running the dev server, because
 *                          the backend only allows a fixed list of browser
 *                          origins and rejects everything else via CORS.
 *
 * The backend is treated as the only source of intelligence: if it cannot be
 * reached, or returns something we cannot read, this module reports `offline`
 * with the real reason. No answer is ever invented locally.
 * ============================================================================
 */

import type {
  AnalysisRequest,
  AnalysisResult,
  ConnectionState,
  ResponseBlock,
} from "../types";

const DEFAULT_BASE_URL = "https://zyrex-backend-obafemip715.wasmer.app";

function readEnv(name: string): string | undefined {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const value = env[name];
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function joinUrl(base: string, path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/+$/, "")}${suffix}`;
}

/**
 * Base URL precedence: VITE_API_BASE_URL (the documented name) →
 * VITE_API_URL (kept as an alias) → the Wasmer deployment.
 */
const baseUrl =
  readEnv("VITE_API_BASE_URL") ?? readEnv("VITE_API_URL") ?? DEFAULT_BASE_URL;

/**
 * Route through the Vite dev server by default while developing.
 *
 * The backend only answers browsers whose Origin is in its CORS_ORIGINS list
 * (currently https://zyrex.vercel.app and https://zyrex.wasmer.app), so a
 * dev or preview origin is normally rejected before any JSON is readable.
 * Proxying keeps the request same-origin and sidesteps CORS entirely.
 * Set VITE_USE_DEV_PROXY=false to call the backend URL directly.
 */
const proxySetting = readEnv("VITE_USE_DEV_PROXY");
const viaProxy = proxySetting === undefined ? import.meta.env.DEV === true : proxySetting === "true";

/** Resolved backend configuration — safe to display in Settings. */
export const aiBackend = {
  baseUrl: baseUrl.replace(/\/+$/, ""),
  endpoint: readEnv("VITE_AI_ENDPOINT") ?? "/api/zyrex-ai",
  healthEndpoint: readEnv("VITE_HEALTH_ENDPOINT") ?? "/api/health",
  timeoutMs: Number(readEnv("VITE_AI_TIMEOUT_MS") ?? 30_000) || 30_000,
  /** When true, requests go to the Vite dev server which proxies to the backend. */
  viaProxy,
} as const;

/** Absolute URL the browser will actually hit for `path`. */
function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return viaProxy ? suffix : joinUrl(aiBackend.baseUrl, suffix);
}

export const aiAnswerUrl = resolveUrl(aiBackend.endpoint);
export const aiHealthUrl = resolveUrl(aiBackend.healthEndpoint);

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

/**
 * Flatten a `blocks` array into readable markdown.
 *
 * The backend's documented contract returns the answer in `blocks`, which may
 * hold plain strings, `{ title, text }` chunks, `{ items: [...] }` lists, or
 * fully structured `ResponseBlock`s.
 */
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
    // Keep list items adjacent so markdown renders one tight list.
    if (listLines.length > 0) chunk.push(listLines.join("\n"));

    // Separate the parts of one chunk with blank lines.
    if (chunk.length > 0) parts.push(chunk.join("\n\n"));
  }

  return parts.join("\n\n").trim();
}

/**
 * Pull the answer text out of whatever shape the backend returns.
 * Covers the documented `blocks` payload, flat fields, nested `data`,
 * OpenAI-style `choices[]` and plain-text bodies.
 * Returns an empty string when nothing readable is present.
 */
export function extractAnswerText(payload: unknown, raw: string): string {
  if (typeof payload === "string") return cleanText(payload);

  if (isRecord(payload)) {
    // Documented contract: the answer lives in `blocks`.
    if (Array.isArray(payload.blocks)) {
      const fromBlocks = stringifyBlocks(payload.blocks);
      if (fromBlocks) return cleanText(fromBlocks);
    }

    // Explicit structured block payload is handled by the caller.
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

  // Non-JSON body (plain text response).
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

/**
 * Turn a plain-text AI answer into the `ResponseBlock[]` the chat surface
 * already renders. Markdown headings become titled sections, bullet/numbered
 * lists under an action-style heading become an ordered action list, and
 * everything else becomes readable markdown paragraphs.
 */
export function answerToBlocks(answer: string): { title: string; blocks: ResponseBlock[] } {
  const text = cleanText(answer);
  if (!text) return { title: "ZYREX Analysis", blocks: [] };

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

    // A section that is only a list reads best as a numbered action list.
    // A list under an action-style heading does too, alongside its text.
    const asActions = items.length > 0 && (paragraph.length === 0 || ACTION_TITLE.test(section.title));

    if (asActions) {
      blocks.push({ type: "actions", title: section.title, items });
      if (paragraph) blocks.push({ type: "observation", title: `${section.title} — detail`, text: paragraph });
      continue;
    }

    const body = pushBody(section);
    if (body) blocks.push({ type: "observation", title: section.title, text: body });
  }

  // No headings anywhere — keep the whole answer as one readable block.
  if (blocks.length === 0) blocks.push({ type: "summary", text });

  const headingTitle = sections.find((section) => section.title)?.title;
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  const title = headingTitle
    ? truncate(headingTitle, 60)
    : truncate(stripInline(firstLine), 60) || "ZYREX Analysis";

  return { title, blocks };
}

/* ------------------------------------------------------------- error reads */

function describeTransportError(error: unknown, url: string): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `The request to ZYREX timed out after ${Math.round(aiBackend.timeoutMs / 1000)}s.`;
  }
  if (viaProxy) {
    return `Couldn't reach the ZYREX backend at ${aiBackend.baseUrl} through the dev proxy (${url}). Check that the backend is deployed and that VITE_API_BASE_URL is correct.`;
  }
  return `Couldn't reach the ZYREX backend at ${aiBackend.baseUrl}. Either it is offline, or this origin is not in the backend's CORS_ORIGINS list (currently https://zyrex.vercel.app and https://zyrex.wasmer.app) — add it and redeploy, or set VITE_USE_DEV_PROXY=true.`;
}

/** Status codes are documented by the backend — report them precisely. */
function describeHttpError(status: number, payload: unknown): string {
  const serverReason = pickString(payload, ["reason", "error", "message", "detail"]);
  const suffix = serverReason ? ` — ${serverReason}` : "";

  switch (status) {
    case 400:
      return `The backend rejected the request (400): the prompt was missing or blank.${suffix}`;
    case 404:
      return `No route at ${aiBackend.endpoint} on ${aiBackend.baseUrl} (404). Check VITE_API_BASE_URL and VITE_AI_ENDPOINT.${suffix}`;
    case 500:
      return `Backend error (500): it is missing its GROQ_API_KEY configuration.${suffix}`;
    case 502:
      return `The AI provider failed (502): unavailable model, rate limit or quota issue, network failure, or an empty response.${suffix}`;
    case 401:
    case 403:
      return `The backend rejected the request (${status}).${suffix}`;
    default:
      if (status >= 500) return `Backend server error (${status}).${suffix}`;
      return `Unexpected response from the backend (${status}).${suffix}`;
  }
}

/* ------------------------------------------------------------- AI request */

function isResponseBlock(value: unknown): value is ResponseBlock {
  return isRecord(value) && typeof value.type === "string";
}

/**
 * Ask the backend for an AI answer.
 *
 * Resolves to `{ status: "ready" }` with rendered blocks when the backend
 * answered, or `{ status: "offline" }` carrying the real reason when it did
 * not. Never throws for transport/HTTP failures.
 */
export async function requestAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const url = aiAnswerUrl;
  const prompt = request.prompt.trim();

  // The backend answers 400 for a blank prompt — catch it before the network.
  if (!prompt) {
    return {
      status: "offline",
      reason: "Enter a message before sending — the backend rejects a blank prompt.",
    };
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiBackend.timeoutMs);
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({
          prompt,
          mode: request.mode || "analyst",
          // The backend only reads the last 8 turns, and its roles are
          // "user" | "assistant" — normalize whatever the UI produced.
          history: (request.history ?? []).slice(-8).map((turn) => ({
            role: turn.role === "user" ? "user" : "assistant",
            text: turn.text ?? "",
          })),
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    return { status: "offline", reason: describeTransportError(error, url) };
  }

  const raw = await response.text().catch(() => "");
  const payload = parseJson(raw);

  if (!response.ok) {
    return { status: "offline", reason: describeHttpError(response.status, payload) };
  }

  // Backend explicitly reports it cannot answer.
  const status = pickString(payload, ["status"]);
  if (status === "offline" || status === "error") {
    return {
      status: "offline",
      reason:
        pickString(payload, ["reason", "error", "message", "detail"]) ??
        "ZYREX is not ready to answer right now. Please try again.",
    };
  }

  // Structured contract: { title, blocks: ResponseBlock[] }
  if (isRecord(payload) && Array.isArray(payload.blocks)) {
    const blocks = payload.blocks.filter(isResponseBlock);
    if (blocks.length > 0) {
      return {
        status: "ready",
        title: pickString(payload, ["title"]) ?? "ZYREX Analysis",
        blocks,
      };
    }
  }

  // Plain-text (or loosely shaped) contract: normalize into blocks.
  const answer = extractAnswerText(payload, raw);
  if (!answer) {
    return {
      status: "offline",
      reason: `ZYREX answered, but the response had no readable content. Expected \`blocks\` (or a text field such as answer/response/text) at ${aiBackend.endpoint}.`,
    };
  }

  const { title, blocks } = answerToBlocks(answer);
  return { status: "ready", title, blocks };
}

/* ------------------------------------------------------------ health probe */

export interface BackendHealth {
  state: ConnectionState;
  label: string;
  detail: string;
  /** Round-trip time in ms, when the probe succeeded. */
  latencyMs: number | null;
  /** HTTP status of the probe, when one was received. */
  status: number | null;
}

/**
 * Probe the backend. This drives every "connected / offline" surface, so it
 * must never report success unless the backend actually answered.
 */
export async function checkAiBackendHealth(): Promise<BackendHealth> {
  const url = aiHealthUrl;
  const startedAt = Date.now();

  let response: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json, text/plain, */*" },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    return {
      state: "disconnected",
      label: "Offline",
      detail: describeTransportError(error, url),
      latencyMs: null,
      status: null,
    };
  }

  const latencyMs = Date.now() - startedAt;
  const raw = await response.text().catch(() => "");
  const payload = parseJson(raw);

  if (!response.ok) {
    return {
      state: "error",
      label: response.status === 404 ? "No route" : "Error",
      detail: describeHttpError(response.status, payload),
      latencyMs,
      status: response.status,
    };
  }

  const state = pickString(payload, ["status", "state"]);
  if (state && !/^(ok|up|healthy|ready|connected|alive|passing)$/i.test(state)) {
    return {
      state: "error",
      label: "Not ready",
      detail:
        pickString(payload, ["detail", "message", "reason", "error"]) ??
        `Backend reports status "${state}".`,
      latencyMs,
      status: response.status,
    };
  }

  const service = pickString(payload, ["service"]);
  const version = pickString(payload, ["version"]);
  const identity = service ? ` (${service}${version ? ` ${version}` : ""})` : "";

  return {
    state: "connected",
    label: "Connected",
    detail: `Backend answered in ${latencyMs}ms${identity}. Reachability only — it does not prove the AI provider key or quota is working.`,
    latencyMs,
    status: response.status,
  };
}

/** Convenience for the mode chip in the chat header. */
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
