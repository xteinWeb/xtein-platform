# Producción (prod2026)

Despliegue de **xtein-platform** y **apiRest** en la VM de producción, clonada de dev2026 (VM 109).

| | dev2026 | prod2026 |
|---|---|---|
| Rama | `developer` | `main` |
| Workflow | `.github/workflows/desplegar.yml` | `.github/workflows/desplegar-produccion.yml` |
| Cuándo | al unir un PR a `developer` | al unir un PR a `main`, **después de aprobarlo** en Actions |
| Runner (etiqueta) | `dev2026` | `prod2026` |
| Configuración apiRest | `~/apps/apirest-config` (BD desarrollo) | `~/apps/apirest-config` (BD producción) |

Las credenciales nunca van a GitHub: se escriben una vez en el servidor y el script de despliegue las copia en cada actualización.

## 1. GitHub: Environment "production" (una vez por repositorio)

En **xtein-platform** y en **apiRest**: Settings → Environments → **New environment** → `production` →
**Required reviewers** (quienes aprueban los despliegues) → Save protection rules.
Opcional: *Deployment branches* → solo `main`.

Al unir a `main`, el job queda en espera con **Review deployments** hasta que un aprobador lo autoriza.

## 2. VM: red y nombre (con la tarjeta de red desconectada en Proxmox)

```bash
sudo hostnamectl set-hostname prod2026
sudo nano /etc/netplan/*.yaml     # IP fija nueva
sudo netplan apply
```
Luego, en Proxmox, volver a conectar la tarjeta de red.

## 3. VM: quitar los runners clonados de dev2026

Los runners clonados tienen **la misma identidad** que los de dev2026. **No** use `./config.sh remove` (desregistraría
también los de dev2026): detenga el servicio y borre las carpetas.

```bash
for r in ~/runner-*; do (cd "$r" && sudo ./svc.sh stop; sudo ./svc.sh uninstall); done
rm -rf ~/runner-*
```

## 4. VM: runners nuevos de producción (etiqueta `prod2026`)

Para cada repositorio (xtein-platform y apiRest): Settings → Actions → Runners → **New self-hosted runner** → Linux,
y use el token que muestra GitHub:

```bash
mkdir ~/runner-platform && cd ~/runner-platform
# descargar y descomprimir según la página de GitHub
./config.sh --unattended --url https://github.com/xteinWeb/xtein-platform --token <TOKEN> --name prod2026-platform --labels prod2026
sudo ./svc.sh install developer && sudo ./svc.sh start
```
Repita en `~/runner-apirest` con `--url https://github.com/xteinWeb/apiRest --name prod2026-apirest`.

## 5. VM: código en la rama main

```bash
pm2 stop all
cd ~/apps/apirest && git fetch origin && git checkout main && git reset --hard origin/main
cd ~/apps/platform && git fetch origin && git checkout main && git reset --hard origin/main
```
Si hay procesos de pm2 que no son de producción (por ejemplo `xtein-a1-backend`), elimínelos: `pm2 delete <nombre>` y `pm2 save`.

## 6. VM: configuración de producción del apiRest

`~/apps/apirest-config/.env`:
```
PORT=5900
key=<clave nueva de 64 caracteres: openssl rand -hex 32>
refreshKey=<otra clave nueva>
DB_SERVER=<servidor SQL de producción>
DB_PORT=<puerto>
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
CORS_ORIGINS=http://<IP o dominio de producción>:7596
```
`~/apps/apirest-config/src/databaseSetting.json`: el nombre de la base de cada empresa en producción
(por ejemplo `"00"` → `ARTDECOM`).

Use claves `key`/`refreshKey` distintas a las de dev2026: así una sesión de desarrollo no sirve en producción.

## 7. VM: nginx

`/etc/nginx/sites-available/xtein-platform` ya envía `/api/` a `127.0.0.1:5900` (el apiRest de la misma VM).
Si cambia el puerto o el dominio, ajústelo y recargue: `sudo nginx -t && sudo systemctl reload nginx`.

## 8. Primer despliegue

Unir un PR de `developer` → `main` en cada repositorio, aprobar en Actions (**Review deployments**) y revisar:

```bash
pm2 ls                                   # apirest online
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5900/   # 404 = responde
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:7596/   # 200
```

## 9. Base de datos de producción

Antes de usar Consumos (PRO-039) en producción, ejecutar en la base de producción los scripts de `PRO039_BD`
(tablas, `spMovimientosConsumos`, documentos SC100–SC102, configuración, reporte) y registrar `MFE-PROD` y el menú
`MPRO` en la base XTEIN de producción.
