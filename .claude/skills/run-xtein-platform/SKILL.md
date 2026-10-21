---
name: run-xtein-platform
description: Build, run, start, serve and drive the Xtein Platform (Angular 21 Shell + Native Federation microfrontends). Use when asked to run or start xtein-platform, serve the shell or an mfe-*, build the @xtein libs, take a screenshot of the login/UI, probe the login against the backend, or run its unit tests.
---

Angular 21 workspace: a `shell` host plus `mfe-*` remotes loaded at runtime through Native
Federation. Agent handle: start the dev servers, then drive the Shell in headless Edge/Chrome
with `.claude/skills/run-xtein-platform/driver.mjs` (CDP over Node's built-in WebSocket, no deps).
Verified on Windows 11 + Git Bash, Node 24.19 / npm 11.17. All paths are relative to the repo root.

## Setup

```bash
npm ci --no-audit --no-fund          # ~2 min, 1371 packages
npm run build:libs                   # REQUIRED first: @xtein/* aliases in tsconfig.json point at dist/
```

Re-run `npm run build:libs` after any change under `libs/` — the apps consume `dist/`, not the source.

### Backend

The Shell proxies `/api` per `apps/shell/proxy.conf.json` (the root `proxy.conf.json` is NOT the one
the Shell uses). It already points at the correct dev backend, `http://192.168.11.151:5779` (confirmed
by the project owner), which accepts `Origin: http://localhost:4210`. Check it answers:

```bash
curl -s -o /dev/null -w "usuarioValido %{http_code}\n" -X POST -H "Content-Type: application/json" -H "Origin: http://localhost:4210" -d '{}' http://192.168.11.151:5779/api/usuarioValido
```

Do NOT use `http://192.168.11.151:5900`: it runs the committed apiRest whose `/api/home` still calls the
old SP `spUsuario` (no `ESTADO`, no `REMOTE_ENTRY_URL`, lowercase `icon`), and the sidebar fails with
`The XTEIN application tree field "ESTADO" is required.` `5779` has no `/api/LOG/save` yet (404, harmless).

Other routes in that file point at production hosts (`api.prod.colchonessunmoon.com`, public IPs) — leave them alone.

## Run (agent path)

1. Start the remotes (background), then the Shell. Check port 4200 first — it is often taken by
   another local Angular project; if so run the Shell on 4210:

```bash
netstat -ano | grep LISTENING | grep -E ":(4200|4201|4301|4305|4311) "
npm run serve:apps > serve.log 2>&1 &        # shell:4200 + mad:4201 + adm:4301 + mcom:4305 + dashboard:4311
npx ng serve shell --port 4210 > shell.log 2>&1 &   # only if 4200 was busy (the SHELL line in serve.log then dies with "Port 4200 is already in use")
```

2. Wait until everything answers (first build ~15 s per project):

```bash
curl -s -o /dev/null -w "shell %{http_code}\n" http://localhost:4210/
for p in 4201 4301 4305 4311; do curl -s -o /dev/null -w "$p remoteEntry %{http_code}\n" http://localhost:$p/remoteEntry.json; done
```

3. Drive it:

```bash
node .claude/skills/run-xtein-platform/driver.mjs shot  http://localhost:4210/ shots/shell.png
node .claude/skills/run-xtein-platform/driver.mjs login http://localhost:4210/ XTEIN shots/login.png
node .claude/skills/run-xtein-platform/driver.mjs eval  http://localhost:4210/ "document.title"
```

| command | what it does |
|---|---|
| `shot <url> <png>` | waits for the login form (or workspace), screenshots 1400x900 |
| `login <url> <user> <png> [password]` | types user, moves focus (fires `usuarioValido`), opens the company dropdown and prints its options, prints every `/api/*` request with status and the first 400 chars of the body, prints `.xtein-login__feedback` text, screenshots. With a password it picks company `COMPANY` (0-based, default 0) and presses INICIAR. |
| `eval <url> "<js>"` | evaluates an expression (promises awaited) after the page boots, prints JSON |

Expected `login ... XTEIN` against the dev backend: `usuarioValido -> 200` and
`companies: ["CAPACITAR","Expericiencia y Tecnologia para la Información de Negocios"]`.
Against no backend: `usuarioValido -> 500`, `companies: ["Sin datos"]`.
There are no demo users in the code; credentials come from the backend environment.

Env: `BROWSER=<path>` overrides the Edge/Chrome lookup, `CDP_PORT` (default 9333).

## Run (human path)

`npm run serve:apps` (or `npm run serve:all` for all 11), open http://localhost:4200. Stop with Ctrl-C.

## Test

```bash
npx ng test sdk --watch=false        # 2 files, 5 tests pass
npx ng test runtime --watch=false    # 2 files, 2 tests pass
```

Vitest via `@angular/build:unit-test`. Only ui, sdk, runtime, api-client, session, auth,
dashboard-runtime and mfe-adm have a test target; shell and the other mfe-* have none.

## Gotchas

- **Stuck on "Cargando plataforma..." when opened by IP over HTTP** (not localhost): insecure context, so the
  browser has no `crypto.randomUUID`. `apps/shell/src/main.ts` now polyfills it. To reproduce any
  secure-context issue locally, open the app by LAN IP (`http://192.168.11.61:<port>/`), not `localhost`; the
  driver prints `page errors:` (including uncaught exceptions) when the page never renders.
- **Deployed copy (dev2026):** `http://192.168.11.80:7596`, deployed by `.github/workflows/desplegar.yml` on
  push to `developer` via `deploy/desplegar-platform.sh` (`npm run build:deploy`, ~15 min). Probe it with
  `node .claude/skills/run-xtein-platform/driver.mjs login http://192.168.11.80:7596/ xtein shots/dev2026.png`.

- **Local apiRest rejects the Shell on :4210 with `Origin not allowed by CORS`** — its allowlist in
  `../apiRest/src/app.js` only had 4200/4795; `http://localhost:4210` was added locally. The dev-server
  proxy forwards the browser's `Origin`, so `changeOrigin` does not help.

- **`ng serve shell --proxy-config <file>` fails with `Unknown argument: proxy-config`** — the Shell's
  serve target is the Native Federation builder, which does not accept that flag. Edit
  `apps/shell/proxy.conf.json` instead (see Backend).
- **`#userName` / `#password` selectors match nothing** — `xtein-input`/`xtein-password` consume `id`
  as a component @Input; only `name` reaches the DOM. Use `[name=userName] input`.
- **`app-root` has children before the login form exists** — wait for `[name=userName] input`, not for app-root.
- **Synthetic `el.blur()` / `el.click()` don't drive DevExtreme** — the company lookup never fires and the
  dropdown doesn't open. Move focus to another field and use CDP `Input.dispatchMouseEvent` (the driver's `click`).
- **`usuarioValido` returns JSON double-encoded as a string** (`"[{\"EMPRESAS\":...}]"`); the app
  decodes it. Don't "fix" the backend contract when reading the driver output.
- **Remotes are not in any manifest** — the Shell gets each remote's `remoteEntryUrl` from the backend
  catalog after login, so without a working login no mfe-* screen can be opened, even if all servers are up.
- npm 11 prints `allow-scripts ... not yet covered` for esbuild, lmdb, etc. Builds and serves work anyway.

## Troubleshooting

- **`An unhandled exception occurred: Port 4200 is already in use`** (SHELL exits code 1 in `serve:apps`): another
  project owns 4200. Leave the other remotes running and start `npx ng serve shell --port 4210`.
- **`http proxy error: /api/LOG/save ... ECONNREFUSED`** in shell.log, "Sin datos" in Empresa: `/api` target is
  down. Apply the Backend patch and restart the Shell (proxy changes need a restart).
- **Killed the background `ng serve` but the port is still LISTENING**: the node child survives on Windows. Find it
  with `netstat -ano | grep ":4210 "`, confirm its command line in PowerShell
  (`(Get-CimInstance Win32_Process -Filter "ProcessId=<pid>").CommandLine`), then `Stop-Process -Id <pid>`.
