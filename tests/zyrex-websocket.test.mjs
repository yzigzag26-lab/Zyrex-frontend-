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

test('does not ship the legacy HTTP POST endpoint', () => {
  assert.equal(bundled.includes('zyrex-backend-obafemip715.wasmer.app'), false);
  assert.equal(bundled.includes('/api/zyrex-ai'), false);
  assert.match(bundled, /wss:\/\/zyrex-mpya\.onrender\.com/);
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

test('health checks the handshake and cleans up', async () => {
  const result = api.checkAiBackendHealth();
  const socket = MockSocket.instances.at(-1);
  socket.onopen();
  assert.equal((await result).state, 'connected');
  assert.equal(socket.closed, true);
});
