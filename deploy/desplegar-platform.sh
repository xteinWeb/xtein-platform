#!/usr/bin/env bash
# Despliegue de xtein-platform en el servidor (lo corre el runner de GitHub Actions; también se puede correr a mano).
#   bash deploy/desplegar-platform.sh <commit>       (sin commit: el último de origin/main)
#
# Compila en la copia instalada (APP_DIR, por defecto ~/apps/platform) las librerías, los microfrontends y el
# shell, y solo si todo compila reemplaza lo que sirve nginx (WEB_DIR/browser) con un cambio de carpeta casi
# instantáneo. Estructura publicada: el shell en la raíz y cada microfrontend en <WEB_DIR>/browser/<mfe>/.
# Si la página o algún remoteEntry.json no responde después, deja de nuevo la versión anterior.
# WEB_DIR debe pertenecer al usuario del runner (sin sudo).
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/platform}"
WEB_DIR="${WEB_DIR:-/var/www/xtein-platform}"
SITE_URL="${SITE_URL:-http://127.0.0.1:7596}"
export NG_CLI_ANALYTICS=false

paso() { echo; echo "== $* =="; }
falla() { echo "::error::$*"; exit 1; }

cd "$APP_DIR"
[ -w "$WEB_DIR" ] || falla "No se puede escribir en $WEB_DIR: una vez, en el servidor, sudo chown -R $(whoami):$(whoami) $WEB_DIR"

paso "Estado actual"
[ -z "$(git status --porcelain --untracked-files=no)" ] || {
  git status --short
  falla "Hay archivos modificados a mano en $APP_DIR: revísalos antes de desplegar (git status)."
}
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || falla "$APP_DIR no está en la rama main."
ANTERIOR="$(git rev-parse HEAD)"
git fetch --quiet origin main
OBJETIVO="$(git rev-parse "${1:-origin/main}")"
git merge-base --is-ancestor "$OBJETIVO" origin/main || falla "El commit $OBJETIVO no está en origin/main."
echo "Instalado: $(git log --oneline -1 "$ANTERIOR")"
echo "A desplegar: $(git log --oneline -1 "$OBJETIVO")"
git merge-base --is-ancestor "$ANTERIOR" "$OBJETIVO" || falla "El commit a desplegar es anterior al instalado (para volver atrás, hazlo a mano)."

paso "Código"
git merge --quiet --ff-only "$OBJETIVO"

paso "Dependencias y compilación (librerías, microfrontends y shell)"
if ! { npm ci --no-audit --no-fund && npm run build:all; }; then
  git reset --quiet --hard "$ANTERIOR"
  falla "No compiló: la página publicada no se tocó y el código volvió a $ANTERIOR."
fi
[ -f dist/shell/browser/index.html ] || falla "La compilación no dejó dist/shell/browser/index.html."

MFES=()
for dir in dist/mfe-*/browser; do
  [ -f "$dir/remoteEntry.json" ] || falla "La compilación no dejó $dir/remoteEntry.json."
  MFES+=("$(basename "$(dirname "$dir")")")
done
[ "${#MFES[@]}" -gt 0 ] || falla "La compilación no dejó ningún microfrontend en dist/mfe-*/browser."
echo "Microfrontends: ${MFES[*]}"

paso "Publicación"
rm -rf "$WEB_DIR/browser.nuevo" "$WEB_DIR/browser.anterior"
cp -r dist/shell/browser "$WEB_DIR/browser.nuevo"
for mfe in "${MFES[@]}"; do
  cp -r "dist/$mfe/browser" "$WEB_DIR/browser.nuevo/$mfe"
done
[ -d "$WEB_DIR/browser" ] && mv "$WEB_DIR/browser" "$WEB_DIR/browser.anterior"
mv "$WEB_DIR/browser.nuevo" "$WEB_DIR/browser"

volver_atras() {
  if [ -d "$WEB_DIR/browser.anterior" ]; then
    rm -rf "$WEB_DIR/browser"
    mv "$WEB_DIR/browser.anterior" "$WEB_DIR/browser"
  fi
  git reset --quiet --hard "$ANTERIOR"
  falla "$1: se dejó publicada la versión anterior."
}

codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE_URL/")"
[ "$codigo" = "200" ] || volver_atras "La página respondió $codigo en $SITE_URL"
for mfe in "${MFES[@]}"; do
  codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE_URL/$mfe/remoteEntry.json")"
  [ "$codigo" = "200" ] || volver_atras "$SITE_URL/$mfe/remoteEntry.json respondió $codigo"
done
rm -rf "$WEB_DIR/browser.anterior"
echo "Publicado: $(git log --oneline -1) · $SITE_URL responde 200 (shell y ${#MFES[@]} microfrontends)"
