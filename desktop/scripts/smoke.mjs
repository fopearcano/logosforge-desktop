#!/usr/bin/env node
/**
 * Live API smoke: checks every Whiteboard endpoint against a *running* backend.
 *
 * Start the backend first (../../scripts/run-backend.sh|ps1, or uvicorn), then:
 *   npm run smoke
 *
 * Honors LOGOSFORGE_PORT (default 8777). Exits non-zero on any failure.
 */

const PORT = process.env.LOGOSFORGE_PORT || '8777';
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
function record(label, ok, detail = '') {
  console.log(`  [${ok ? 'ok' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures += 1;
}

async function json(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`LogosForge Whiteboard — API smoke against ${BASE}`);

  try {
    await fetch(BASE + '/health');
  } catch {
    console.error(`\nBackend not reachable at ${BASE}.`);
    console.error('Start it first: scripts/run-backend.sh (or .ps1), or:');
    console.error(`  cd backend && . .venv/bin/activate && uvicorn app.main:app --port ${PORT}`);
    process.exit(1);
  }

  try {
    const health = await json('GET', '/health');
    record('GET  /health', health.status === 'ok' && !!health.api_version && !!health.core_version);
    const ver = await json('GET', '/api/version');
    record('GET  /api/version', !!ver.api_version && !!ver.core_version);
    record('GET  /api/whiteboard', Array.isArray((await json('GET', '/api/whiteboard')).blocks));

    const put = await json('PUT', '/api/whiteboard', {
      blocks: [{ id: 'b0', type: 'heading', text: 'Smoke', level: 1 }],
    });
    record('PUT  /api/whiteboard', put.blocks.length === 1);

    const modes = await json('GET', '/api/writing-modes');
    record('GET  /api/writing-modes', modes.modes.length >= 1, `${modes.modes.length} modes`);

    record('GET  /api/outline', Array.isArray((await json('GET', '/api/outline')).items));

    record('GET  /api/outline/items', Array.isArray((await json('GET', '/api/outline/items')).items));
    const outlinePut = await json('PUT', '/api/outline/items', {
      items: [{ id: 'n0', parentId: null, type: 'act', title: 'Smoke', order: 0 }],
    });
    record('PUT  /api/outline/items', outlinePut.items.length === 1);

    const psyke = await json('GET', '/api/psyke/search?q=test');
    record('GET  /api/psyke/search', Array.isArray(psyke.results));

    const created = await json('POST', '/api/psyke/elements', { type: 'character', name: 'SmokeHero' });
    record('POST /api/psyke/elements', created.ok === true && !!created.element?.id);

    const logos = await json('POST', '/api/logos/inline', { action: 'suggest', selection: 'test' });
    record('POST /api/logos/inline', logos.ok === true && !!logos.output);
  } catch (err) {
    record('request', false, String(err && err.message ? err.message : err));
  }

  console.log(failures === 0 ? '\nSMOKE: PASS' : `\nSMOKE: FAIL (${failures} failed)`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
