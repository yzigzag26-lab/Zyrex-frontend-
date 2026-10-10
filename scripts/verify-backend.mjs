#!/usr/bin/env node
/**
 * ZYREX backend verifier
 *
 * Node's fetch is not subject to CORS, so it can read Access-Control-* headers
 * that a browser would silently drop. Run this after every backend redeploy:
 *
 *   npm run verify:backend
 *   npm run verify:backend -- --origin https://zyrex.wasmer.app
 *   npm run verify:backend -- --self-test
 *
 * A green GET /api/health in the app does NOT prove the POST preflight will
 * pass. This script checks both.
 */

import http from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_BACKEND = "https://zyrex-backend-obafemip715.wasmer.app";
const DEFAULT_ORIGIN = "https://zyrex.wasmer.app";
const DEFAULT_HEALTH = "/api/health";
const DEFAULT_AI = "/api/zyrex-ai";

const color = {
  enabled: Boolean(process.stdout.isTTY) && process.env.NO_COLOR !== "1",
  wrap(code, text) {
    return this.enabled ? `\x1b[${code}m${text}\x1b[0m` : text;
  },
  green(text) {
    return this.wrap(32, text);
  },
  red(text) {
    return this.wrap(31, text);
  },
  yellow(text) {
    return this.wrap(33, text);
  },
  dim(text) {
    return this.wrap(2, text);
  },
  bold(text) {
    return this.wrap(1, text);
  },
};

function printHelp() {
  process.stdout.write(`Verify that the ZYREX backend is reachable and CORS-ready.

Usage:
  node scripts/verify-backend.mjs [options]

Options:
  --backend <url>   Backend origin (default: ${DEFAULT_BACKEND})
  --origin <url>    Browser Origin to send (default: ${DEFAULT_ORIGIN})
  --health <path>   Health path (default: ${DEFAULT_HEALTH})
  --ai <path>       AI path (default: ${DEFAULT_AI})
  --timeout <ms>    Per-request timeout (default: 15000)
  --self-test       Run against in-process good/broken mocks
  --help            Show this help

Env (overridden by flags):
  VITE_API_BASE_URL / VITE_API_URL / API_BASE_URL
  FRONTEND_ORIGIN
  VITE_HEALTH_ENDPOINT
  VITE_AI_ENDPOINT
`);
}

function parseArgs(argv) {
  const args = {
    backend: process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || process.env.API_BASE_URL || DEFAULT_BACKEND,
    origin: process.env.FRONTEND_ORIGIN || DEFAULT_ORIGIN,
    health: process.env.VITE_HEALTH_ENDPOINT || DEFAULT_HEALTH,
    ai: process.env.VITE_AI_ENDPOINT || DEFAULT_AI,
    timeout: Number(process.env.VERIFY_TIMEOUT_MS || 15_000) || 15_000,
    selfTest: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    switch (token) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--self-test":
        args.selfTest = true;
        break;
      case "--backend":
        args.backend = next ?? args.backend;
        i += 1;
        break;
      case "--origin":
        args.origin = next ?? args.origin;
        i += 1;
        break;
      case "--health":
        args.health = next ?? args.health;
        i += 1;
        break;
      case "--ai":
        args.ai = next ?? args.ai;
        i += 1;
        break;
      case "--timeout":
        args.timeout = Number(next) || args.timeout;
        i += 1;
        break;
      default:
        process.stderr.write(`Unknown argument: ${token}\n`);
        args.help = true;
        args.unknown = true;
    }
  }

  args.backend = stripSlash(args.backend);
  args.origin = stripSlash(args.origin);
  args.health = ensurePath(args.health);
  args.ai = ensurePath(args.ai);
  return args;
}

function stripSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function ensurePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function joinUrl(base, path) {
  return `${stripSlash(base)}${ensurePath(path)}`;
}

function header(headers, name) {
  if (!headers) return "";
  const direct = headers.get(name);
  if (direct) return direct;
  // Some stacks emit mixed-case names; Headers.get is case-insensitive, but
  // be defensive if a mock returns a plain object.
  if (typeof headers.get !== "function") {
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? String(headers[key]) : "";
  }
  return "";
}

function acaoMatches(value, origin) {
  if (!value) return false;
  const tokens = value.split(",").map((part) => part.trim());
  return tokens.includes("*") || tokens.includes(origin);
}

function allowsMethod(value, method) {
  if (!value) return false;
  const tokens = value.split(",").map((part) => part.trim().toUpperCase());
  return tokens.includes("*") || tokens.includes(method.toUpperCase());
}

function allowsHeader(value, name) {
  if (!value) return false;
  const tokens = value.split(",").map((part) => part.trim().toLowerCase());
  return tokens.includes("*") || tokens.includes(name.toLowerCase());
}

function healthyStatus(payload) {
  if (!payload || typeof payload !== "object") return false;
  const state = String(payload.status ?? payload.state ?? "").trim();
  if (!state) return true; // 200 with no status field is still a live health route
  return /^(ok|up|healthy|ready|connected|alive|passing)$/i.test(state);
}

async function request(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: "manual" });
    const raw = await response.text().catch(() => "");
    let payload = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }
    return {
      ok: true,
      status: response.status,
      headers: response.headers,
      raw,
      payload,
      ms: Date.now() - started,
    };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? error.name : "";
    const message =
      name === "AbortError"
        ? `timed out after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : String(error);
    return { ok: false, error: message, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

function failDetailForAcao(got, origin) {
  if (!got) {
    return `got no Access-Control-Allow-Origin header. Add ${origin} to the backend's CORS_ORIGINS (exact scheme+host, no trailing slash) and redeploy.`;
  }
  return `got Access-Control-Allow-Origin: ${got} (wanted ${origin} or *). Add ${origin} to CORS_ORIGINS (exact scheme+host, no trailing slash) and redeploy.`;
}

export async function runChecks(options) {
  const { backend, origin, health, ai, timeout } = options;
  const healthUrl = joinUrl(backend, health);
  const aiUrl = joinUrl(backend, ai);
  const results = [];

  const record = (name, pass, detail) => {
    results.push({ name, pass, detail });
  };

  const originHeaders = { Origin: origin };

  const healthGet = await request(
    healthUrl,
    { method: "GET", headers: { ...originHeaders, Accept: "application/json, text/plain, */*" } },
    timeout,
  );

  if (!healthGet.ok) {
    record("GET /api/health returns HTTP 200", false, healthGet.error);
    record("GET /api/health body looks healthy", false, "skipped — no response");
    record("GET /api/health returns ACAO for this origin", false, "skipped — no response");
  } else {
    record(
      "GET /api/health returns HTTP 200",
      healthGet.status === 200,
      healthGet.status === 200
        ? `HTTP 200 in ${healthGet.ms}ms`
        : `got HTTP ${healthGet.status}. A 500 here usually means a committed fix has not been redeployed yet.`,
    );
    const looksHealthy = healthGet.status === 200 && healthyStatus(healthGet.payload);
    const identity =
      healthGet.payload && typeof healthGet.payload === "object"
        ? [healthGet.payload.service, healthGet.payload.version].filter(Boolean).join(" ")
        : "";
    record(
      "GET /api/health body looks healthy",
      looksHealthy,
      looksHealthy
        ? identity
          ? `status ok${identity ? ` (${identity})` : ""}`
          : "HTTP 200 with a healthy (or empty) status"
        : `body did not look healthy: ${healthGet.raw.slice(0, 180) || "(empty)"}`,
    );
    const acao = header(healthGet.headers, "access-control-allow-origin");
    record(
      "GET /api/health returns ACAO for this origin",
      acaoMatches(acao, origin),
      acaoMatches(acao, origin)
        ? `Access-Control-Allow-Origin: ${acao}`
        : failDetailForAcao(acao, origin),
    );
  }

  const preflight = await request(
    aiUrl,
    {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    },
    timeout,
  );

  if (!preflight.ok) {
    record("preflight (OPTIONS /api/zyrex-ai) succeeds", false, preflight.error);
    record("preflight returns ACAO for this origin", false, "skipped — no response");
    record("preflight allows POST", false, "skipped — no response");
    record("preflight allows Content-Type", false, "skipped — no response");
  } else {
    const preflightOk = preflight.status >= 200 && preflight.status < 400;
    record(
      "preflight (OPTIONS /api/zyrex-ai) succeeds",
      preflightOk,
      preflightOk
        ? `HTTP ${preflight.status} in ${preflight.ms}ms`
        : `got HTTP ${preflight.status} (a 500 with no CORS headers is the current live failure mode — redeploy the CORS fix).`,
    );
    const acao = header(preflight.headers, "access-control-allow-origin");
    record(
      "preflight returns ACAO for this origin",
      acaoMatches(acao, origin),
      acaoMatches(acao, origin)
        ? `Access-Control-Allow-Origin: ${acao}`
        : failDetailForAcao(acao, origin),
    );
    const methods = header(preflight.headers, "access-control-allow-methods");
    // Some stacks omit Allow-Methods and still succeed in browsers if ACAO is
    // present; treat that as a pass with a note, but require POST when set.
    const methodOk =
      allowsMethod(methods, "POST") || (preflightOk && acaoMatches(acao, origin) && !methods);
    record(
      "preflight allows POST",
      methodOk,
      methods
        ? `Access-Control-Allow-Methods: ${methods}`
        : methodOk
          ? "no Allow-Methods header; ACAO present so browsers may still proceed"
          : "got no Access-Control-Allow-Methods header (need POST)",
    );
    const allowedHeaders = header(preflight.headers, "access-control-allow-headers");
    const headerOk =
      allowsHeader(allowedHeaders, "content-type") ||
      (preflightOk && acaoMatches(acao, origin) && !allowedHeaders);
    record(
      "preflight allows Content-Type",
      headerOk,
      allowedHeaders
        ? `Access-Control-Allow-Headers: ${allowedHeaders}`
        : headerOk
          ? "no Allow-Headers header; ACAO present so browsers may still proceed"
          : "got no Access-Control-Allow-Headers header (need content-type)",
    );
  }

  const post = await request(
    aiUrl,
    {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify({ prompt: "ping", mode: "analyst" }),
    },
    timeout,
  );

  if (!post.ok) {
    record("POST /api/zyrex-ai returns HTTP 2xx", false, post.error);
  } else {
    const postOk = post.status >= 200 && post.status < 300;
    let detail;
    if (postOk) {
      detail = `HTTP ${post.status} in ${post.ms}ms`;
    } else if (post.status === 500) {
      detail =
        "got HTTP 500 — for this endpoint that is usually a missing GROQ_API_KEY. CORS is checked separately above.";
    } else if (post.status === 404) {
      detail = `got HTTP 404. Check VITE_API_BASE_URL and VITE_AI_ENDPOINT (${ai}).`;
    } else {
      detail = `got HTTP ${post.status}${post.raw ? `: ${post.raw.slice(0, 160)}` : ""}`;
    }
    record("POST /api/zyrex-ai returns HTTP 2xx", postOk, detail);
  }

  return results;
}

function printReport(options, results, title) {
  const passed = results.filter((item) => item.pass).length;
  const total = results.length;
  const allPass = passed === total;

  if (title) process.stdout.write(`\n${color.bold(title)}\n`);
  process.stdout.write(`  origin:  ${options.backend}\n`);
  process.stdout.write(`  browser: ${options.origin}\n\n`);

  for (const item of results) {
    const mark = item.pass ? color.green("PASS") : color.red("FAIL");
    process.stdout.write(`  ${mark}  ${item.name}\n`);
    if (item.detail) process.stdout.write(color.dim(`        ${item.detail}\n`));
  }

  process.stdout.write(
    `\n${allPass ? color.green(`${passed}/${total} checks passed`) : color.red(`${passed}/${total} checks passed`)}\n`,
  );

  if (!allPass) {
    process.stdout.write(`
Next steps:
  1. Redeploy the backend so the CORS fix is live:
       wasmer deploy --owner obafemip715 --publish-package
  2. Re-run: npm run verify:backend
  3. To go live before CORS is fixed, deploy this frontend on Vercel with
     VITE_USE_PROXY=true (vercel.json rewrites /api/* to the backend).
`);
  }

  return allPass;
}

/* ------------------------------------------------------------------ mocks */

function send(response, status, headers, body) {
  response.writeHead(status, headers);
  response.end(body ?? "");
}

function startMock({ cors, fail }) {
  return new Promise((resolve) => {
    const server = http.createServer((req, response) => {
      const origin = req.headers.origin || DEFAULT_ORIGIN;
      const corsHeaders = cors
        ? {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
            Vary: "Origin",
          }
        : {};

      if (fail) {
        send(response, 500, { "Content-Type": "application/json" }, JSON.stringify({ error: "internal" }));
        return;
      }

      if (req.method === "OPTIONS") {
        send(response, 204, corsHeaders);
        return;
      }

      if (req.url === "/api/health" && req.method === "GET") {
        send(
          response,
          200,
          { "Content-Type": "application/json", ...corsHeaders },
          JSON.stringify({ status: "ok", service: "zyrex-ai", version: "1.0" }),
        );
        return;
      }

      if (req.url === "/api/zyrex-ai" && req.method === "POST") {
        send(
          response,
          200,
          { "Content-Type": "application/json", ...corsHeaders },
          JSON.stringify({ status: "ready", title: "ok", blocks: [{ type: "summary", text: "ok" }] }),
        );
        return;
      }

      send(response, 404, { "Content-Type": "application/json", ...corsHeaders }, JSON.stringify({ error: "not found" }));
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}

async function selfTest() {
  process.stdout.write(`${color.bold("Self-test against in-process mocks")}\n`);

  const good = await startMock({ cors: true, fail: false });
  const broken = await startMock({ cors: false, fail: true });

  try {
    const goodOpts = {
      backend: good.url,
      origin: DEFAULT_ORIGIN,
      health: DEFAULT_HEALTH,
      ai: DEFAULT_AI,
      timeout: 3000,
    };
    const goodResults = await runChecks(goodOpts);
    const goodPass = printReport(goodOpts, goodResults, "Correct backend");
    const goodCount = goodResults.filter((item) => item.pass).length;

    const brokenOpts = {
      backend: broken.url,
      origin: DEFAULT_ORIGIN,
      health: DEFAULT_HEALTH,
      ai: DEFAULT_AI,
      timeout: 3000,
    };
    const brokenResults = await runChecks(brokenOpts);
    const brokenAllFailed = brokenResults.every((item) => !item.pass);
    printReport(brokenOpts, brokenResults, "Broken backend (500, no CORS headers)");

    const ok = goodPass && goodCount === 8 && brokenAllFailed;
    if (!ok) {
      process.stderr.write("\nSelf-test failed: expected 8/8 on the correct mock and 0/8 on the broken mock.\n");
      return 1;
    }
    process.stdout.write(`\n${color.green("Self-test passed.")}\n`);
    return 0;
  } finally {
    await good.close();
    await broken.close();
  }
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return args.unknown ? 2 : 0;
  }
  if (args.selfTest) return selfTest();

  process.stdout.write(`${color.bold("ZYREX backend verifier")}\n`);
  const results = await runChecks(args);
  const ok = printReport(args, results);
  return ok ? 0 : 1;
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirect) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
      process.exitCode = 1;
    });
}
