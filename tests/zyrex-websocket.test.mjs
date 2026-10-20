import { build } from 'esbuild';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { outputFiles } = await build({
  entryPoints: ['src/lib/zyrexApi.ts'], bundle: true, write: false,
  platform: 'node', format: 'esm', define: { 'import.meta.env.VITE_AI_TIMEOUT_MS': '20' },
});
const bundled = outputFiles[0].text;
const api = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString('base64')}`);
class MockSocket {
  static instances = [];
  constructor(url) { this.url = url; MockSocket.instances.push(this); }
  send(data) { this.sent = JSON.parse(data); }
  close() { this.closed = true; }
  chunk(data) { this.onmessage?.({ data }); }
}
globalThis.WebSocket = MockSocket;
const request = { prompt: ' Review risk ', mode: 'analyst', history: [{ role: 'user', text: 'Earlier' }] };

async function waitFor(condition, attempts = 100) {
  for (let i = 0; i < attempts; i += 1) {
    if (condition()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error('waitFor: condition was not met');
}

test('ships only the ZYREX backend endpoints — no legacy HTTP, no direct provider APIs', () => {
  assert.equal(bundled.includes('zyrex-backend-obafemip715.wasmer.app'), false);
  assert.equal(bundled.includes('/api/zyrex-ai'), false);
  assert.equal(bundled.includes('api.Groq.com'), false);
  assert.equal(bundled.includes('api.openai.com'), false);
  assert.match(bundled, /wss:\/\/zyrex-mpya\.onrender\.com/);
  assert.match(bundled, /https:\/\/zyrex-mpya\.onrender\.com\/health/);
  // Failure copy shown to users must never expose transport details.
  assert.equal(bundled.includes('allowed WebSocket origins'), false);
  assert.match(bundled, /Couldn't Generate Response/);
});

test('secure endpoint, JSON payload, whitespace, and DONE completion', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  assert.equal(socket.url, 'wss://zyrex-mpya.onrender.com');
  socket.onopen();
  assert.deepEqual(socket.sent, { ...request, prompt: 'Review risk' });
  socket.chunk('Manage'); socket.chunk(' '); socket.chunk('risk.');
  socket.chunk('[DONE]');
  const answer = await result;
  assert.equal(answer.status, 'ready');
  assert.equal(answer.blocks[0].text, 'Manage risk.');
  assert.equal(socket.closed, true);
  assert.equal(socket.onmessage, null);
});

test('payload is exactly { prompt, mode, history } with clean, capped turns', () => {
  const history = [
    { role: 'user', text: '  first question  ' },
    { role: 'assistant', text: '   ' },
    { role: 'zyrex', text: 'first answer' },
    ...Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: `turn ${i}` })),
  ];
  const payload = api.buildRequestPayload({ prompt: '  What is the current BTC/USDT price? ', mode: 'research', history });
  assert.deepEqual(Object.keys(payload).sort(), ['history', 'mode', 'prompt']);
  assert.equal(payload.prompt, 'What is the current BTC/USDT price?');
  assert.equal(payload.mode, 'research');
  assert.equal(payload.history.length, 8);
  assert.equal(payload.history.every((turn) => turn.text.length > 0), true);
  assert.equal(payload.history.every((turn) => turn.role === 'user' || turn.role === 'assistant'), true);
  assert.equal(payload.history.at(-1).text, 'turn 9');
});

test('sends current mode and appends tokens until DONE', async () => {
  const tokens = [];
  let opened = false;
  const result = api.requestAnalysis(
    { ...request, mode: 'coach' },
    { onOpen: () => { opened = true; }, onToken: (accumulated, chunk) => tokens.push([accumulated, chunk]) },
  );
  const socket = MockSocket.instances.at(-1);
  socket.onopen();
  assert.equal(opened, true);
  assert.equal(socket.sent.mode, 'coach');
  socket.chunk('Keep'); socket.chunk(' '); socket.chunk('calm.');
  socket.chunk('[DONE]');
  const answer = await result;
  assert.deepEqual(tokens, [['Keep', 'Keep'], ['Keep ', ' '], ['Keep calm.', 'calm.']]);
  assert.equal(answer.blocks[0].text, 'Keep calm.');
});

test('JSON chunks and encoded DONE', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  socket.chunk('{"text":"Risk "}'); socket.chunk('"review"'); socket.chunk('"[DONE]"');
  assert.equal((await result).blocks[0].text, 'Risk review');
});

test('DONE appended to the final chunk completes the answer and is stripped', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  socket.chunk('BTC/USDT is ');
  socket.chunk('$67,000.[DONE]');
  const answer = await result;
  assert.equal(answer.status, 'ready');
  assert.equal(answer.blocks[0].text, 'BTC/USDT is $67,000.');
  assert.equal(socket.closed, true);
});

test('error JSON sent before DONE shows only the generic failure notice', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  socket.chunk('{"error":"Tool choice is none, but model called a tool"}');
  socket.chunk('[DONE]');
  const answer = await result;
  assert.equal(answer.status, 'offline');
  assert.equal(answer.reason, "Couldn't Generate Response");
});

test('nested error objects also show only the generic failure notice', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  socket.chunk('{"error":{"message":"internal backend detail"}}');
  const answer = await result;
  assert.equal(answer.status, 'offline');
  assert.equal(answer.reason, "Couldn't Generate Response");
});

test('control and tool-event frames are ignored, never stringified into the reply', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  socket.chunk('{"type":"tool_call","name":"get_ticker_price","message":"Calling CoinAPI"}');
  socket.chunk('BTC/USDT: ');
  socket.chunk('{"status":"streaming"}');
  socket.chunk('67000');
  socket.chunk('[DONE]');
  const answer = await result;
  assert.equal(answer.status, 'ready');
  assert.equal(answer.blocks[0].text, 'BTC/USDT: 67000');
});

test('tool-event frames drive the friendly activity label', async () => {
  const activity = [];
  const result = api.requestAnalysis(request, { onActivity: (label) => activity.push(label) });
  const socket = MockSocket.instances.at(-1);
  socket.chunk('{"type":"tool_call","name":"get_ticker_price"}');
  socket.chunk('{"type":"tool_call","tool":"search_pools"}');
  socket.chunk('{"status":"streaming"}');
  socket.chunk('Done.');
  socket.chunk('[DONE]');
  const answer = await result;
  assert.equal(answer.status, 'ready');
  assert.deepEqual(activity, ['Checking live price…', 'Searching liquidity pools…']);
});

test('cumulative JSON snapshots are applied once, not duplicated per frame', async () => {
  const result = api.requestAnalysis(request);
  const socket = MockSocket.instances.at(-1);
  socket.chunk('{"answer":"Bit"}');
  socket.chunk('{"answer":"Bitcoin"}');
  socket.chunk('{"answer":"Bitcoin"}');
  socket.chunk('[DONE]');
  const answer = await result;
  assert.equal(answer.status, 'ready');
  assert.equal(answer.blocks[0].text, 'Bitcoin');
});

test('premature close does not report a completed answer', async () => {
  const result = api.requestAnalysis(request);
  MockSocket.instances.at(-1).onclose();
  assert.equal((await result).status, 'offline');
});

test('backend errors, empty streams, and timeout report offline', async () => {
  for (const chunk of ['{"error":"Unavailable"}', '[DONE]', null]) {
    const result = api.requestAnalysis(request);
    if (chunk) MockSocket.instances.at(-1).chunk(chunk);
    assert.equal((await result).status, 'offline');
    assert.equal(MockSocket.instances.at(-1).closed, true);
  }
});

test('blank prompt never opens a socket', async () => {
  const count = MockSocket.instances.length;
  assert.equal((await api.requestAnalysis({ ...request, prompt: ' ' })).status, 'offline');
  assert.equal(MockSocket.instances.length, count);
});

test('health uses the /health endpoint when it answers OK', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://zyrex-mpya.onrender.com/health');
    return { ok: true, status: 200 };
  };
  try {
    const count = MockSocket.instances.length;
    const health = await api.checkAiBackendHealth();
    assert.equal(health.state, 'connected');
    assert.equal(health.status, 200);
    assert.equal(MockSocket.instances.length, count);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('health falls back to the WebSocket handshake when /health is unreachable', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('no CORS'); };
  try {
    const count = MockSocket.instances.length;
    const result = api.checkAiBackendHealth();
    await waitFor(() => MockSocket.instances.length > count);
    const socket = MockSocket.instances.at(-1);
    assert.equal(socket.url, 'wss://zyrex-mpya.onrender.com');
    socket.onopen();
    const health = await result;
    assert.equal(health.state, 'connected');
    assert.equal(socket.closed, true);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('health reports offline when both /health and the handshake fail', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  try {
    const count = MockSocket.instances.length;
    const result = api.checkAiBackendHealth();
    await waitFor(() => MockSocket.instances.length > count);
    const socket = MockSocket.instances.at(-1);
    socket.onerror();
    const health = await result;
    assert.equal(health.state, 'disconnected');
    assert.equal(health.status, 503);
    assert.equal(socket.closed, true);
  } finally {
    globalThis.fetch = realFetch;
  }
});
