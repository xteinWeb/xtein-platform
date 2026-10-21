#!/usr/bin/env bash
# Despliegue de xtein-platform en el servidor (lo corre el runner de GitHub Actions; también se puede correr a mano).
#   bash deploy/desplegar-platform.sh <commit>       (sin commit: el último de origin/$RAMA)
#
# Compila en la copia instalada (APP_DIR, por defecto ~/apps/platform) SOLO lo que cambió entre el commit instalado
# y el nuevo, reutiliza el resto de lo ya publicado y, si todo compila, reemplaza lo que sirve nginx (WEB_DIR/browser)
# con un cambio de carpeta casi instantáneo. Estructura publicada: el shell en la raíz y cada microfrontend en
# <WEB_DIR>/browser/<mfe>/. Si la página o algún remoteEntry.json no responde después, deja la versión anterior.
#
# Qué se compila según lo que cambió:
#   libs/, package.json, package-lock.json, angular.json, tsconfig*.json o algún federation.config.js
#                                 → todo (las librerías van dentro de cada app y deben ser la misma versión en todas)
#   apps/shell/...                → solo el shell
#   apps/<mfe>/...                → solo ese microfrontend (si está en MICROFRONTENDS)
#   cualquier otra cosa           → nada (documentación, workflow, este script, nginx...)
# Variables: COMPLETO=true compila y publica todo · SOLO_PLAN=1 muestra qué haría y termina sin tocar nada.
# WEB_DIR debe pertenecer al usuario del runner (sin sudo).
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/platform}"
WEB_DIR="${WEB_DIR:-/var/www/xtein-platform}"
SITE_URL="${SITE_URL:-http://127.0.0.1:7596}"
# Rama del entorno de desarrollo (dev2026); main queda para producción
RAMA="${RAMA:-developer}"
COMPLETO="${COMPLETO:-false}"
SOLO_PLAN="${SOLO_PLAN:-0}"
export NG_CLI_ANALYTICS=false

# Microfrontends que se publican: los que tienen pantallas. Al dar a uno vacío su primera pantalla, se agrega aquí.
MICROFRONTENDS=(mfe-adm mfe-dashboard mfe-mad mfe-mcom)
# Orden de compilación de las librerías (cada una depende de las anteriores)
LIBRERIAS=(sdk logging session api-client runtime dashboard-runtime ui auth)

PUBLICADO="$WEB_DIR/browser"
# Marcas: qué package-lock.json está instalado en node_modules y qué versión de libs/ hay compilada en dist/
MARCA_DEPENDENCIAS="node_modules/.xtein-package-lock"
MARCA_LIBRERIAS="dist/.xtein-libs"

paso() { echo; echo "== $* =="; }
falla() { echo "::error::$*"; exit 1; }

cd "$APP_DIR"
[ -w "$WEB_DIR" ] || falla "No se puede escribir en $WEB_DIR: una vez, en el servidor, sudo chown -R $(whoami):$(whoami) $WEB_DIR"

paso "Estado actual"
[ -z "$(git status --porcelain --untracked-files=no)" ] || {
  git status --short
  falla "Hay archivos modificados a mano en $APP_DIR: revísalos antes de desplegar (git status)."
}
[ "$(git rev-parse --abbrev-ref HEAD)" = "$RAMA" ] || falla "$APP_DIR no está en la rama $RAMA."
ANTERIOR="$(git rev-parse HEAD)"
git fetch --quiet origin "$RAMA"
OBJETIVO="$(git rev-parse "${1:-origin/$RAMA}")"
git merge-base --is-ancestor "$OBJETIVO" "origin/$RAMA" || falla "El commit $OBJETIVO no está en origin/$RAMA."
echo "Instalado: $(git log --oneline -1 "$ANTERIOR")"
echo "A desplegar: $(git log --oneline -1 "$OBJETIVO")"
git merge-base --is-ancestor "$ANTERIOR" "$OBJETIVO" || falla "El commit a desplegar es anterior al instalado (para volver atrás, hazlo a mano)."

paso "Qué compilar"
declare -A COMPILAR=()
declare -A IGNORADOS=()
TODO=""
mapfile -t CAMBIOS < <(git diff --name-only "$ANTERIOR" "$OBJETIVO")
echo "Archivos cambiados: ${#CAMBIOS[@]}"
[ "${#CAMBIOS[@]}" -eq 0 ] || printf '  %s\n' "${CAMBIOS[@]:0:40}"
[ "${#CAMBIOS[@]}" -le 40 ] || echo "  ... y $(( ${#CAMBIOS[@]} - 40 )) más"

if [ "$COMPLETO" = "true" ]; then
  TODO="se pidió compilar todo"
elif [ ! -f "$PUBLICADO/index.html" ]; then
  TODO="todavía no hay nada publicado"
else
  for archivo in "${CAMBIOS[@]}"; do
    case "$archivo" in
      libs/* | package.json | package-lock.json | angular.json | tsconfig*.json | apps/*/federation.config.js)
        TODO="cambió $archivo, que afecta a todas las aplicaciones"
        break
        ;;
      apps/shell/*)
        COMPILAR[shell]=1
        ;;
      apps/mfe-*/*)
        mfe="${archivo#apps/}"
        mfe="${mfe%%/*}"
        if [[ " ${MICROFRONTENDS[*]} " == *" $mfe "* ]]; then
          COMPILAR[$mfe]=1
        elif [ -z "${IGNORADOS[$mfe]:-}" ]; then
          IGNORADOS[$mfe]=1
          echo "  $mfe cambió, pero no se publica (no está en MICROFRONTENDS): se ignora"
        fi
        ;;
    esac
  done
  # Lo que falte en la publicación actual también se compila (p. ej. un microfrontend recién agregado a la lista)
  for mfe in "${MICROFRONTENDS[@]}"; do
    [ -f "$PUBLICADO/$mfe/remoteEntry.json" ] || COMPILAR[$mfe]=1
  done
fi

if [ -n "$TODO" ]; then
  echo "Se compila todo: $TODO."
  COMPILAR=([shell]=1)
  for mfe in "${MICROFRONTENDS[@]}"; do COMPILAR[$mfe]=1; done
fi

APPS=()
for mfe in "${MICROFRONTENDS[@]}"; do [ -n "${COMPILAR[$mfe]:-}" ] && APPS+=("$mfe"); done
[ -n "${COMPILAR[shell]:-}" ] && APPS+=(shell)

LOCK_OBJETIVO="$(git rev-parse "$OBJETIVO:package-lock.json")"
LIBS_OBJETIVO="$(git rev-parse "$OBJETIVO:libs")"
INSTALAR="no"
if [ "${#APPS[@]}" -gt 0 ] && [ "$(cat "$MARCA_DEPENDENCIAS" 2>/dev/null)" != "$LOCK_OBJETIVO" ]; then INSTALAR="sí"; fi
COMPILAR_LIBS="no"
if [ "${#APPS[@]}" -gt 0 ] && { [ -n "$TODO" ] || [ "$(cat "$MARCA_LIBRERIAS" 2>/dev/null)" != "$LIBS_OBJETIVO" ]; }; then COMPILAR_LIBS="sí"; fi

if [ "${#APPS[@]}" -eq 0 ]; then
  echo "Nada que compilar: lo publicado sigue sirviendo para este commit."
else
  echo "Aplicaciones a compilar: ${APPS[*]}"
  echo "Instalar dependencias (npm ci): $INSTALAR · Compilar librerías: $COMPILAR_LIBS"
fi
[ "$SOLO_PLAN" = "1" ] && { echo "(SOLO_PLAN=1: no se tocó nada)"; exit 0; }

paso "Código"
git merge --quiet --ff-only "$OBJETIVO"

if [ "${#APPS[@]}" -eq 0 ]; then
  echo "Publicado sin cambios: $(git log --oneline -1) · tardó ${SECONDS}s"
  exit 0
fi

paso "Dependencias y compilación"
compilar() {
  if [ "$INSTALAR" = "sí" ]; then
    npm ci --no-audit --no-fund || return 1
    echo "$LOCK_OBJETIVO" > "$MARCA_DEPENDENCIAS"
  fi
  if [ "$COMPILAR_LIBS" = "sí" ]; then
    # Al compilar todo se parte de cero: no quedan restos de compilaciones anteriores en dist/
    [ -n "$TODO" ] && rm -rf dist
    rm -f "$MARCA_LIBRERIAS"
    for lib in "${LIBRERIAS[@]}"; do npx ng build "$lib" || return 1; done
    echo "$LIBS_OBJETIVO" > "$MARCA_LIBRERIAS"
  fi
  for app in "${APPS[@]}"; do npx ng build "$app" || return 1; done
}
if ! compilar; then
  git reset --quiet --hard "$ANTERIOR"
  falla "No compiló: la página publicada no se tocó y el código volvió a $ANTERIOR."
fi
for app in "${APPS[@]}"; do
  [ -f "dist/$app/browser/index.html" ] || falla "La compilación no dejó dist/$app/browser/index.html."
  [ "$app" = "shell" ] || [ -f "dist/$app/browser/remoteEntry.json" ] || falla "La compilación no dejó dist/$app/browser/remoteEntry.json."
done

paso "Publicación"
NUEVO="$WEB_DIR/browser.nuevo"
rm -rf "$NUEVO" "$WEB_DIR/browser.anterior"
mkdir -p "$NUEVO"
if [ -n "${COMPILAR[shell]:-}" ]; then
  cp -r dist/shell/browser/. "$NUEVO/"
  echo "shell: nuevo"
else
  find "$PUBLICADO" -mindepth 1 -maxdepth 1 ! -name 'mfe-*' -exec cp -r {} "$NUEVO/" \;
  echo "shell: se mantiene el publicado"
fi
for mfe in "${MICROFRONTENDS[@]}"; do
  if [ -n "${COMPILAR[$mfe]:-}" ]; then
    cp -r "dist/$mfe/browser" "$NUEVO/$mfe"
    echo "$mfe: nuevo"
  else
    cp -r "$PUBLICADO/$mfe" "$NUEVO/$mfe"
    echo "$mfe: se mantiene el publicado"
  fi
done
[ -d "$PUBLICADO" ] && mv "$PUBLICADO" "$WEB_DIR/browser.anterior"
mv "$NUEVO" "$PUBLICADO"

volver_atras() {
  if [ -d "$WEB_DIR/browser.anterior" ]; then
    rm -rf "$PUBLICADO"
    mv "$WEB_DIR/browser.anterior" "$PUBLICADO"
  fi
  git reset --quiet --hard "$ANTERIOR"
  falla "$1: se dejó publicada la versión anterior."
}

# "|| true": si nginx no responde, curl falla (código 000) y set -e cortaría el script antes de volver atrás
codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE_URL/" || true)"
[ "$codigo" = "200" ] || volver_atras "La página respondió $codigo en $SITE_URL"
for mfe in "${MICROFRONTENDS[@]}"; do
  codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE_URL/$mfe/remoteEntry.json" || true)"
  [ "$codigo" = "200" ] || volver_atras "$SITE_URL/$mfe/remoteEntry.json respondió $codigo"
done
rm -rf "$WEB_DIR/browser.anterior"
echo "Publicado: $(git log --oneline -1) · compilado: ${APPS[*]} · $SITE_URL responde 200 · tardó ${SECONDS}s"
