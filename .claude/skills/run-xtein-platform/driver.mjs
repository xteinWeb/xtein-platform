// Drives the running Xtein Shell through headless Edge/Chrome over CDP.
// Node >= 22 (uses the global WebSocket); no npm dependencies.
//
//   node driver.mjs shot  <url> <out.png>
//   node driver.mjs login <url> <user> <out.png> [password]
//   node driver.mjs eval  <url> "<js expression>"
//
// `login` types the user, blurs the field (that triggers the company lookup),
// optionally types the password and presses INICIAR, then prints every /api
// request with its status, console errors and the visible feedback text.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
];
const PORT = Number(process.env.CDP_PORT ?? 9333);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  const exe = process.env.BROWSER ?? BROWSERS.find(existsSync);
  if (!exe) throw new Error('No Edge/Chrome found; set BROWSER=<path>');
  const profile = join(tmpdir(), `xtein-driver-${process.pid}`);
  const proc = spawn(exe, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--window-size=1400,900', 'about:blank'
  ], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = targets.find(t => t.type === 'page');
      if (page) return { proc, wsUrl: page.webSocketDebuggerUrl };
    } catch { /* not up yet */ }
    await sleep(200);
  }
  proc.kill();
  throw new Error(`Browser did not expose CDP on :${PORT}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach(fn => fn(msg));
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  return new Promise(resolve => ws.onopen = () => resolve({ ws, send, on: fn => listeners.push(fn) }));
}

async function evaluate(send, expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed');
  return r.result.value;
}

async function waitFor(send, expression, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await evaluate(send, `!!(${expression})`)) return;
    await sleep(250);
  }
  throw new Error(`Timeout waiting for: ${expression}`);
}

async function screenshot(send, out) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(`screenshot -> ${out}`);
}

// xtein-input/xtein-password swallow `id` as a component @Input, so the host
// only carries `name`; the real <input> is DevExtreme's, nested inside.
const field = name => `document.querySelector('[name=${name}] input')`;

// Focuses the native <input> inside an xtein-* wrapper and types into it.
async function typeInto(send, name, text) {
  await evaluate(send, `${field(name)}.focus()`);
  await send('Input.insertText', { text });
}

// Real mouse click at the element's centre; DevExtreme ignores synthetic el.click() on dropdowns.
async function click(send, selector) {
  const box = await evaluate(send, `(() => { const r = document.querySelector(${JSON.stringify(selector)})
    ?.getBoundingClientRect(); return r && { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) throw new Error(`No element for ${selector}`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
  }
}

async function main() {
  const [cmd, url, ...rest] = process.argv.slice(2);
  if (!cmd || !url) {
    console.error('usage: driver.mjs shot|login|eval <url> ...');
    process.exit(2);
  }
  const { proc, wsUrl } = await launch();
  const { ws, send, on } = await connect(wsUrl);
  const api = new Map();
  const consoleErrors = [];
  on(({ method, params }) => {
    if (method === 'Network.requestWillBeSent' && params.request.url.includes('/api/')) {
      api.set(params.requestId, { url: params.request.url, method: params.request.method, status: 'pending' });
    }
    if (method === 'Network.responseReceived' && api.has(params.requestId)) {
      api.get(params.requestId).status = params.response.status;
    }
    if (method === 'Network.loadingFinished' && api.has(params.requestId)) {
      const entry = api.get(params.requestId);
      entry.body = send('Network.getResponseBody', { requestId: params.requestId })
        .then(r => r.body.slice(0, 400)).catch(() => '');
    }
    if (method === 'Network.loadingFailed' && api.has(params.requestId)) {
      api.get(params.requestId).status = `failed (${params.errorText})`;
    }
    if (method === 'Runtime.exceptionThrown') {
      consoleErrors.push(`EXCEPTION ${params.exceptionDetails.exception?.description ?? params.exceptionDetails.text}`.slice(0, 300));
    }
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      consoleErrors.push(params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300));
    }
  });
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Page.navigate', { url });
    // The Shell boots after initFederation; wait until Angular has rendered something.
    // app-root gets children before the login form exists, so wait for a real control.
    try {
      await waitFor(send, `${field('userName')} || document.querySelector('xtein-workspace, xtein-shell-layout, dx-button')`);
    } catch (error) {
      // A page that never renders is the case worth diagnosing: show why, then fail.
      console.log('page errors:\n  ' + (consoleErrors.join('\n  ') || '(none)'));
      console.log('app-root:', await evaluate(send, `document.querySelector('app-root')?.innerHTML.slice(0, 200) ?? 'missing'`));
      throw error;
    }
    await sleep(1500);

    if (cmd === 'shot') {
      await screenshot(send, rest[0] ?? 'shell.png');
    } else if (cmd === 'eval') {
      console.log(JSON.stringify(await evaluate(send, rest[0]), null, 2));
    } else if (cmd === 'login') {
      const [user, out = 'login.png', password] = rest;
      await waitFor(send, field('userName'));
      await typeInto(send, 'userName', user);
      // Blur triggers validateUser(), which loads the companies for this user.
      await typeInto(send, 'password', '');
      await sleep(3000);
      await click(send, 'xtein-select .dx-dropdowneditor-input-wrapper');
      await sleep(1000);
      const companies = await evaluate(send,
        `[...document.querySelectorAll('.dx-list-item, .dx-empty-message')].map(e => e.textContent.trim())`);
      console.log('companies:', JSON.stringify(companies));
      if (password) {
        // Pick the first company; set COMPANY=<n> to choose another (0-based).
        await click(send, `.dx-list-item:nth-of-type(${Number(process.env.COMPANY ?? 0) + 1})`).catch(() => {});
        await sleep(500);
        await evaluate(send, `${field('password')}.focus()`);
        await send('Input.insertText', { text: password });
        await evaluate(send, `[...document.querySelectorAll('xtein-button [role=button], xtein-button button')]
          .find(b => /iniciar/i.test(b.textContent))?.click()`);
        await sleep(3000);
      }
      const feedback = await evaluate(send,
        `[...document.querySelectorAll('.xtein-login__feedback')].map(e => e.textContent.trim())`);
      console.log('api requests:');
      for (const r of api.values()) {
        console.log(`  ${r.method} ${r.url} -> ${r.status}`);
        const body = await r.body;
        if (body) console.log(`    ${body}`);
      }
      console.log('feedback:', JSON.stringify(feedback));
      if (consoleErrors.length) console.log('console errors:\n  ' + consoleErrors.join('\n  '));
      await screenshot(send, out);
    } else {
      throw new Error(`unknown command ${cmd}`);
    }
  } finally {
    ws.close();
    proc.kill();
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
