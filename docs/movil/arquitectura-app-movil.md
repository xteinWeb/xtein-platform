# Arquitectura de la app móvil de Xtein (Flutter) — propuesta para aprobar

Estado: **propuesta inicial, aprobada e implementada** (2026-10-28). Es el punto de partida de la discusión; las decisiones finales (menú lateral visible desde ya, carga diferida de permisos de CAL-001, foto obligatoria, nombre "Xtein") y la arquitectura vigente están en [`xteinWeb/xtein-movil`](https://github.com/xteinWeb/xtein-movil), `docs/arquitectura.md`.

## 0. Resumen en diez líneas

1. **No se crea un proyecto nuevo: se evoluciona `xtein-movil`** (hoy "Xtein Calidad", CAL-001) para que sea *la* app de Xtein. Su núcleo (`core/`: dio, sobre `prmAccion/prmDatos`, `X-Xtein-Cliente: movil`, token renovado, 401, E90, almacén seguro, inactividad, tema, textos en español) ya hace lo que pide la tarea y está probado (`flutter analyze` sin avisos, 89 pruebas en verde el 2026-10-28). CAL-001 pasa a ser el **primer módulo**.
2. Estructura **feature-first con tres capas por módulo** (`datos/`, `modelo/`, `pantallas/`), sin casos de uso ni mapeadores de más.
3. Estado con **Riverpod 3** (ya en uso), navegación con **go_router** (ya en uso) y **las rutas de cada módulo montadas bajo un `ShellRoute` con menú lateral**.
4. Inyección de dependencias con los **providers de Riverpod** (no se añade `get_it`).
5. **Contrato `ModuloXtein`**: id (= `ID_APLICACION`), título, icono, ruta base, rutas, pantalla raíz, visibilidad por permisos. Un módulo nuevo = una carpeta + **una línea** en `modulos_registrados.dart`.
6. El **menú lateral** se arma con `modulosRegistrados` ∩ aplicaciones del usuario (`/api/home`, acción `USUARIO APLICACIONES`, como el shell web).
7. Sesión, login, perfil y contraseña siguen **las mismas rutas y reglas del shell web** (`@xtein/auth`, `@xtein/session`, `@xtein/api-client`).
8. Pantallas base: login, inicio, menú lateral, ajustes, mi perfil, restablecer contraseña, módulo de ejemplo.
9. GESPRO no se desarrolla ahora; queda como `modulos/gespro/` futuro que implementa el mismo contrato.
10. Pruebas unitarias de lo esencial: registro de módulos y menú por permisos, redirecciones del router, interpretación de respuestas (login, perfil, contraseña), interceptor de sesión.

---

## 1. Punto de partida: lo que ya existe

| Dónde | Qué hay | Estado |
|---|---|---|
| `C:\Users\INETL\Documents\proyectos\xtein-movil` | App Flutter 3.47 / Dart 3.13, Android (minSdk 24), flavors `dev`/`prod`, `--dart-define=API_URL`, `RANGOS_RED_EMPRESA`, `SSID_EMPRESA` | **Sin ningún commit** (rama `main` vacía; todo es working tree del 2026-10-27) |
| `lib/core/api` | `crearDio` con cabecera `X-Xtein-Cliente: movil` en toda petición; `InterceptorSesion` (toma `token` renovado, 401 → cierra sesión); `ClienteApi.llamar` (sobre autenticado, reintentos con el mismo `ID_OPERACION`, `ErrMensaje` → `ErrorNegocio`); `normalizarRespuesta` (misma lógica que `normalizeResponse` del shell); errores sellados `ErrorApi` (`ErrorNegocio`, `ErrorSesionVencida`, `ErrorFueraDeRed`, `ErrorConexion`, `ErrorServidor`, `ErrorConflicto`) | Hecho y con pruebas |
| `lib/core/sesion` | `Sesion` (token, usuario, empresa, nombre, `TIEMPO_SESION`, última actividad), `AlmacenSesion` en `flutter_secure_storage`, `ControladorSesion` (restaurar, inactividad, renovar token, cerrar por manual/inactividad/401), `PreferenciasLocales` (sin secretos) | Hecho y con pruebas |
| `lib/core/red` | Comprobación "dentro de la empresa" (CIDR + SSID) y pantalla bloqueante | Hecho |
| `lib/core/tema`, `lib/core/ui` | Paleta oficial Xtein (Classic Blue), `BarraXtein`, botones, tarjetas, avisos, `EstadoCarga`, `confirmar` | Hecho |
| `lib/features/login` | `usuarioValido` → empresas → `usuarioLogin` (`USUARIO CREDENCIALES`) → `permisos` de CAL-001 | Hecho, pero **acoplado a CAL-001** (la sesión guarda `puedeVer`/`puedeCrear` de CAL-001 y el login llama a `/api/CAL001N/permisos`) |
| `lib/features/cal001` | Flujo completo de No Conformidades (borrador, fotos, agregar, idempotencia) | Hecho |
| `lib/router.dart` | Rutas planas (`/login`, `/inicio`, `/flujo`, `/listo`, `/reporte/:id`) con `redirect` por red + sesión | Hecho, sin menú ni módulos |

Conclusión: buena parte de lo que pide la tarea ya está. Lo que falta es **el shell de la app** (menú, registro de módulos, inicio, ajustes, perfil, contraseña) y **desacoplar el login de CAL-001**.

### Decisión A (la más importante): ¿evolucionar `xtein-movil` o proyecto nuevo?

| | Evolucionar `xtein-movil` (**recomendado**) | Proyecto nuevo `xtein-app` |
|---|---|---|
| Núcleo HTTP / sesión / red / tema | Se reutiliza tal cual (probado contra dev2026) | Se copia → dos copias que divergen |
| CAL-001 | Se mueve a `lib/modulos/cal001/` y se convierte en el primer módulo real | Queda huérfano en otra app, o se migra después (doble trabajo) |
| Riesgo | Hay que **commitear primero el estado actual** (hoy no hay historial) y trabajar en rama | Ninguno sobre lo existente, pero la empresa acaba con dos apps |
| Nombre | Pasa de "Xtein Calidad" a "Xtein" (el paquete `com.xtein.xtein_movil` puede quedarse) | Nombre limpio |

Recomendación: **evolucionar `xtein-movil`**. Antes de tocar nada: commit del estado del 2026-10-27 (lo haría con tu confirmación), y luego rama `feature/arquitectura-modulos`.

---

## 2. Estructura de carpetas

```
xtein-movil/
  lib/
    main.dart                      arranque: config, prefs, almacén, ProviderScope
    app.dart                       MaterialApp.router, tema, locale es-CO, inactividad
    core/                          ← ya existe; no cambia de sitio
      api/        dio, sobre, interceptor, respuestas, errores
      config/     --dart-define (API_URL, rangos de red, flavor)
      red/        dentro/fuera de la empresa
      sesion/     Sesion, almacén seguro, controlador, preferencias
      tema/       paleta y ThemeData Xtein
      ui/         componentes comunes (barra, botones, tarjetas, avisos)
      texto.dart  utilidades de texto/fecha
    shell/                         ← NUEVO: lo que hoy hace apps/shell en la web
      modulos/
        modulo_xtein.dart          contrato ModuloXtein (§5)
        registro_modulos.dart      RegistroModulos: lista, búsqueda por id, filtro por permisos
        modulos_registrados.dart   ÚNICO archivo que se toca para enchufar un módulo
      permisos/
        permisos_usuario.dart      aplicaciones del usuario (/api/home) y operaciones por app
        permisos_api.dart
      navegacion/
        router.dart                GoRouter raíz: redirect (red + sesión) + ShellRoute + rutas de módulos
        layout_shell.dart          Scaffold con AppBar + Drawer + cuerpo
        menu_lateral.dart          Drawer alimentado por RegistroModulos
      pantallas/
        pantalla_inicio.dart       vista principal (saludo + accesos a módulos)
        pantallas_estado.dart      cargando / fuera de la empresa / error de configuración
    cuenta/                        ← NUEVO: todo lo del usuario, independiente de módulos
      login/        pantalla_login.dart, login_api.dart (hoy en features/login; se mueve)
      perfil/       pantalla_perfil.dart, perfil_api.dart   (INFO USUARIO)
      contrasena/   pantalla_restablecer.dart (olvidé mi contraseña, 3 pasos)
                    pantalla_cambiar.dart (desde dentro, con sesión)
                    contrasena_api.dart, politica_contrasena.dart
      ajustes/      pantalla_ajustes.dart, ajustes_controlador.dart
    modulos/                       ← NUEVO: un subdirectorio por módulo de negocio
      cal001/                      (hoy features/cal001; se mueve sin cambiar su interior)
        modulo_cal001.dart         implementa ModuloXtein
        datos/      repositorio, proveedores (API)          ← capa de datos
        modelo/     entidades, payloads, reglas puras        ← capa de dominio
        pantallas/  flujo/, ver/, fotos/, borrador/          ← capa de presentación
      ejemplo/                     módulo vacío de muestra (§8.7)
        modulo_ejemplo.dart
        pantallas/pantalla_ejemplo.dart
      # gespro/                    futuro, mismo contrato
  test/
    unit/   shell (registro, menú, router), cuenta (login, perfil, contraseña), core (ya existen)
    widget/ login, menú lateral, ajustes
  android/, assets/, docs/
```

**Por qué feature-first con tres capas y no "clean architecture" completa:** cada módulo se lee de arriba abajo (`datos → modelo → pantallas`), lo que hace que llevar un microfrontend Angular a la app sea mecánico: el `*.service.ts` que llama al back se vuelve `datos/`, los contratos/modelos se vuelven `modelo/`, y los componentes se vuelven `pantallas/`. No añadimos carpetas `usecases/`, `entities/` + `dtos/` + `mappers/` por módulo porque, con un back que ya devuelve JSON de SP listo para usar, serían archivos que solo reexportan. Si un módulo lo necesita (por ejemplo GESPRO, con reglas de negocio gordas), lo añade dentro de su `modelo/`.

**Un solo paquete Dart por ahora.** Separar cada módulo en un paquete (`packages/modulo_cal001`, melos) da aislamiento real, pero cuesta configuración y hoy hay un módulo. Criterio para dar ese paso: cuando haya tres módulos o cuando dos equipos trabajen módulos distintos a la vez. La estructura propuesta lo permite sin reescribir nada: `lib/modulos/<x>/` se convierte en `packages/<x>/lib/`.

---

## 3. Gestión de estado: Riverpod 3 (se mantiene)

| Criterio | Riverpod 3 | Bloc | Provider / signals |
|---|---|---|---|
| Ya en la app, con pruebas | Sí | No | No |
| Inyección de dependencias incluida | Sí (`Provider`, `overrideWith` en pruebas) | No (necesita `get_it` o `RepositoryProvider`) | Parcial |
| Boilerplate por pantalla | Bajo (`Notifier` + `ref.watch`) | Alto (eventos + estados + bloc) | Bajo |
| Aislar un módulo | Natural: sus providers viven en su carpeta y nadie más los importa | Igual, pero con más archivos | Débil |
| Pruebas sin widgets | `ProviderContainer` con overrides | Sí | Difícil |

Reglas de uso:
- `Notifier`/`AsyncNotifier` para estado con lógica (sesión, borrador, permisos); `Provider` para servicios (dio, repositorios); `FutureProvider` para lecturas simples.
- Un módulo **nunca** importa providers de otro módulo. Solo importa `core/` y `shell/modulos/` (el contrato) y, si necesita sesión o permisos, los providers de `core/sesion` y `shell/permisos`.
- Sin `riverpod_generator` por ahora (evita `build_runner`); se puede adoptar después sin romper nada.

---

## 4. Navegación: go_router con rutas por módulo

```
/cargando, /fuera, /login, /restablecer            rutas libres (sin sesión)
ShellRoute (LayoutShell: AppBar + Drawer)          exige sesión
  /inicio
  /perfil
  /ajustes
  /cambiar-contrasena
  + por cada módulo registrado:  <rutaBase>/...    p. ej. /cal-001, /cal-001/flujo, /cal-001/reporte/:id
```

- El `redirect` actual (red → sesión → ruta libre) se conserva y se amplía: una ruta de un módulo **que el usuario no tiene** redirige a `/inicio` con aviso ("No tienes acceso a …").
- Cada módulo devuelve `List<RouteBase>` ya con su prefijo; el router raíz las concatena. Ningún módulo toca `router.dart`.
- Dentro de un módulo se navega con rutas relativas a su `rutaBase` (`context.go('${modulo.rutaBase}/flujo')`), así el módulo no depende de dónde esté montado.
- `refreshListenable` escucha sesión, red y permisos (cuando llegan las aplicaciones del usuario, el menú y las rutas protegidas se reevalúan).

---

## 5. Contrato de módulo

```dart
/// Lo que implementa cada módulo de negocio para aparecer en la app.
abstract class ModuloXtein {
  const ModuloXtein();

  /// Igual a ID_APLICACION en APLICACIONES (p. ej. 'CAL-001'). Es la llave de permisos.
  String get id;

  /// Texto del menú lateral y de la AppBar.
  String get titulo;

  /// Icono del menú (Material).
  IconData get icono;

  /// Prefijo de todas sus rutas: '/cal-001'.
  String get rutaBase;

  /// Orden en el menú (menor = más arriba). Empates: por título.
  int get orden => 100;

  /// Rutas go_router del módulo, ya con rutaBase. Se montan dentro del ShellRoute.
  List<RouteBase> rutas();

  /// Pantalla raíz (a donde lleva el menú). Normalmente la de rutaBase.
  Widget raiz(BuildContext context);

  /// Si aparece en el menú para este usuario. Por defecto: tiene la aplicación `id`.
  bool visiblePara(PermisosUsuario permisos) => permisos.tieneAplicacion(id);

  /// Ganchos opcionales de ciclo de vida de sesión.
  Future<void> alIniciarSesion(Ref ref) async {}
  Future<void> alCerrarSesion(Ref ref, MotivoCierre motivo) async {}
}
```

Registro:

```dart
// lib/shell/modulos/modulos_registrados.dart — el único archivo que se edita para enchufar uno nuevo
final List<ModuloXtein> modulosRegistrados = [
  const ModuloCal001(),
  const ModuloEjemplo(),
  // const ModuloGespro(),   ← así se añadirá GESPRO
];
```

`RegistroModulos` (provider) expone: `todos`, `porId(id)`, `visibles(permisos)` (ordenados), `rutas()`, y valida al arrancar que no haya ids ni `rutaBase` repetidos (falla en debug con un mensaje claro).

Los ganchos `alIniciarSesion`/`alCerrarSesion` reemplazan a `lib/limpieza_sesion.dart` (hoy conoce al borrador y a las fotos de CAL-001): cada módulo limpia lo suyo.

---

## 6. Sesión, permisos y menú (mismas reglas que el shell web)

### 6.1 Login
Igual que hoy y que `@xtein/auth`:
1. `POST /api/usuarioValido` · `USUARIO VALIDO` · `{USUARIO}` → `[{EMPRESAS:[{ID_UN,NOMBRE}], ID_UN_ASOCIADA, CAMBIAR_CLAVE, TIEMPO_SESION, ErrMensaje}]`.
2. `POST /api/usuarioLogin` · `USUARIO CREDENCIALES` · `{USUARIO, CONTRASENA, EMPRESA, ID_UN_ASOCIADA}` → `{ErrMensaje:'VALIDO', token, user_name, EMAIL, foto_perfil_user, TIEMPO_SESION}`.
3. **Nuevo:** `POST /api/home` · `USUARIO APLICACIONES` · `{USUARIO, EMPRESA, PLATAFORMA:'MFE'}` (sobre autenticado) → arreglo de `{ID_APLICACION, NOMBRE, ID_APLICACION_PADRE, TIPO, ICON, ESTADO, MICROFRONTEND_ID, …}`. Se guarda el **conjunto de `ID_APLICACION`** en `PermisosUsuario`. Esto reemplaza la llamada a `/api/CAL001N/permisos` en el login.
4. Si `CAMBIAR_CLAVE = 1` → después del login se obliga a pasar por "Cambiar contraseña" (hoy la app lo ignora; la web Legacy sí lo hace).

`Sesion` pierde `puedeVer`/`puedeCrear` (eran de CAL-001) y gana `email`, `fotoPerfil`, `idUnAsociada`. Los permisos finos de cada aplicación (`OPERACIONES APLICACIONES USUARIO` en `/api/operacionesAplUsr`, o el `permisos` propio de CAL001N) los pide **cada módulo** cuando los necesita, con caché por sesión en `PermisosUsuario`.

Pregunta abierta a verificar en dev2026 (lo compruebo en la implementación, con usuario de prueba): que `USUARIO APLICACIONES` con `PLATAFORMA:'MFE'` devuelva `CAL-001` para un usuario que la tiene (la nota del 2026-10-26 decía `MICROFRONTEND_ID NULL`; el shell filtra por ese campo pero la app **no filtrará por MFE**, solo por `ID_APLICACION`). Si el SP no la devuelve, se usa `PLATAFORMA:'WEB'` o se pide un valor `MOVIL` en `spUsuarioAplAsociadas` (cambio de SP, fuera de esta tarea).

### 6.2 Token y cierre
Sin cambios: el back renueva solo tokens vencidos y lo manda en `token`; el interceptor lo reemplaza; 401 cierra; inactividad por `TIEMPO_SESION`; almacén seguro (Keystore) para token y datos de sesión; la contraseña nunca se guarda.

### 6.3 Menú lateral
`Drawer` con: cabecera (nombre, empresa, iniciales/foto), **Inicio**, la lista de `registro.visibles(permisos)` (título + icono), separador, **Mi perfil**, **Ajustes**, **Cerrar sesión** (con confirmación; los módulos pueden añadir su aviso por el gancho). Mientras `/api/home` carga, el menú muestra un indicador; si falla, "No se pudieron cargar tus módulos" + reintentar (igual que `ApplicationNavigationService` en la web).

---

## 7. Capa HTTP, errores, almacenamiento, tema y textos

- **HTTP:** `dio` (ya). `X-Xtein-Cliente: movil` en `BaseOptions.headers` **y** reforzado en `onRequest` del interceptor, para las rutas públicas y las autenticadas. Timeouts 20 s. Reintentos solo ante timeout/sin red y solo en llamadas que mandan `ID_OPERACION` o son de lectura (el módulo decide con un parámetro `reintentable`).
- **Sobre:** `armarSobre` / `armarSobrePublico` (ya). Detalle: hoy la app manda `prmConexion: 'XTEIN'` en las rutas públicas y el shell manda `'ConexionBD'`; el back no lo usa en las rutas de `spLogin`, pero se alinea con el shell.
- **Errores:** `ErrorApi` sellado (ya). Regla única: `data[0].ErrMensaje` no vacío con HTTP 200 → `ErrorNegocio`; `{ErrMensaje}` con 4xx → `ErrorServidor` con ese texto; 403 que empieza por `E90` → `ErrorFueraDeRed`; 401 → `ErrorSesionVencida`; 5xx → texto genérico. `mensajeDeError(e)` da el texto en español para la UI; `mostrarError(context, e)` (SnackBar o diálogo según gravedad) vive en `core/ui/errores_ui.dart`.
- **Almacenamiento:** `flutter_secure_storage` para sesión y datos sensibles de módulos (cada módulo con **prefijo de clave** `cal001.` para que "cerrar sesión" pueda borrar por módulo); `shared_preferences` para preferencias sin secretos (usuario recordado, ajustes).
- **Tema:** `crearTemaXtein()` (ya). Se añade `ThemeMode` (claro / oscuro / sistema) controlado desde Ajustes, con una variante oscura derivada de la misma paleta.
- **Textos:** todo en español en el código (como hoy y como la web). Los textos comunes del shell van en `lib/shell/textos_shell.dart` (constantes), los de cada módulo dentro del módulo. No se introduce ARB/l10n: no hay segundo idioma previsto; `flutter_localizations` sigue solo para fechas y widgets de Material en español.

---

## 8. Pantallas base (lo que se construirá tras la aprobación)

| # | Pantalla | Ruta | Back | Notas |
|---|---|---|---|---|
| 1 | **Login** | `/login` | `usuarioValido`, `usuarioLogin`, `home` | La actual, rebautizada "Xtein"; usuario recordado; enlace "¿Olvidaste tu contraseña?"; respeta `CAMBIAR_CLAVE` |
| 2 | **Inicio** (vista principal) | `/inicio` | — | "Hola, {nombre}" + tarjetas de los módulos visibles (icono, título) + aviso si no tiene ninguno |
| 3 | **Menú lateral** | (Drawer del ShellRoute) | `home` | §6.3 |
| 4 | **Ajustes** | `/ajustes` | — | Tema claro/oscuro/sistema; recordar usuario (sí/no); tamaño de texto (normal/grande, pensado para planta); información: versión, API (`API_URL` sin credenciales), flavor; "Borrar datos locales" (preferencias y datos de módulos, no la sesión) |
| 5 | **Mi perfil** | `/perfil` | `/api/infoUsuario` · `INFO USUARIO` · `{USUARIO}` (spUsuario) | NOMBRE_COMPLETO, EMAIL, TELEFONO, AREA, ROL, DIRECCION, empresa activa; botón "Cambiar contraseña". Solo lectura (la edición de datos personales es de ADM, fuera de alcance). Foto: `foto_perfil_user` del login si viene; la descarga vía `bajar_imagen`/spActividades que hace el Legacy queda como follow-up |
| 6 | **Restablecer contraseña** | `/restablecer` (sin sesión) y `/cambiar-contrasena` (con sesión) | `getCodigoResetPassword` · `GENERAR CODIGO`; `validatePassword` · `VERIFICAR CODIGO` · `{USUARIO, CODIGO}`; `updatePassword` · `UPDATE PASSWORD` · `{USUARIO, PASSWORD}` | Tres pasos (usuario → código de 6 dígitos al correo → nueva contraseña) exactamente como el login del shell. Misma `PasswordPolicyService` del shell portada a Dart (mín. 8, mayúscula, minúscula, número, especial, sin secuencias ni comunes, sin el usuario). "Cambiar" desde dentro reutiliza el paso 3 |
| 7 | **Módulo de ejemplo** | `/ejemplo` | — | `ModuloEjemplo` con `id: 'EJEMPLO'`, una pantalla con texto "Así se enchufa un módulo" y un `visiblePara` que lo muestra siempre en `dev` y nunca en `prod`. Sirve de plantilla copiable y de prueba del registro |

Nota de seguridad que se hereda del back (no la resuelve la app): `/api/updatePassword` es público y no pide la contraseña actual ni el código; la verificación del código vive solo en el flujo del cliente. La app seguirá el flujo correcto (código → nueva), pero conviene un follow-up en apiRest para exigir el código validado o el token en `updatePassword`.

---

## 9. Cómo se migra un microfrontend Angular a un módulo (receta)

1. Crear `lib/modulos/<id>/` con `modulo_<id>.dart` que implementa `ModuloXtein` (`id` = `ID_APLICACION` de la web, mismo título e icono).
2. `datos/`: por cada `*.service.ts` del MFE, una clase Dart que usa `ClienteApi.llamar(ruta, accion, datos)`; mismas rutas y acciones del apiRest.
3. `modelo/`: los contratos TS → clases Dart inmutables con `fromJson`; reglas puras (validaciones) como funciones.
4. `pantallas/`: una pantalla por "vista" del MFE; en móvil se simplifica (un paso por pantalla, listas en vez de grids).
5. Añadir `const Modulo<Id>()` a `modulos_registrados.dart`.
6. Pruebas: `test/unit/modulos/<id>/` para `datos/` (respuestas simuladas con `AdaptadorFalso`) y `modelo/`.

Nada más del proyecto se toca. Si el módulo necesita permisos finos, los pide con `PermisosUsuario.operaciones(id)`.

---

## 10. Pruebas (lo esencial, unitarias)

- `shell/modulos`: registro sin duplicados; `visibles(permisos)` filtra y ordena; `rutas()` concatena con prefijo; el módulo de ejemplo no aparece en `prod`.
- `shell/navegacion`: `calcularRedireccion` (ya) + ruta de módulo sin permiso → `/inicio`.
- `shell/permisos`: interpretación de `USUARIO APLICACIONES` (doble codificación, `[{ErrMensaje}]`, lista vacía).
- `cuenta/login`: ya existen (`login_respuestas_test`); se añade `CAMBIAR_CLAVE`.
- `cuenta/perfil`: interpretación de `INFO USUARIO`.
- `cuenta/contrasena`: política portada (casos del `PasswordPolicyService` del shell) y respuestas de los tres pasos.
- `core/api`: ya existen (token renovado, 401, reintento con mismo `ID_OPERACION`, E90).
- Widget: menú lateral muestra solo módulos con permiso; login con "olvidé mi contraseña".

Comandos: `flutter analyze` y `flutter test` (Flutter está en `C:\src\flutter\bin`, no en el PATH).

---

## 11. Plan de trabajo tras la aprobación

| Fase | Qué | Resultado |
|---|---|---|
| F0 | Commit del estado actual de `xtein-movil` (con tu OK) y rama `feature/arquitectura-modulos` | Historial de partida |
| F1 | `shell/` (contrato, registro, permisos, router con ShellRoute, layout + drawer, inicio, estados) | App arranca con menú vacío + módulo de ejemplo |
| F2 | Mover `features/cal001` → `modulos/cal001` como `ModuloCal001`; login deja de llamar a `permisos`; `limpieza_sesion` → ganchos | CAL-001 funciona igual, pero enchufado |
| F3 | `cuenta/`: perfil, ajustes, restablecer/cambiar contraseña; login con `CAMBIAR_CLAVE` y enlace | Las 6 pantallas base |
| F4 | Pruebas, `flutter analyze`, `flutter test`, `flutter build apk --debug`; prueba manual de login en dev2026 (Wi-Fi interna o VPN) | Compila y pasa |
| F5 | README y `docs/arquitectura.md` en `xtein-movil` (este documento, actualizado) | Documentación junto al código |

Commits en español, sin atribución de IA, y te pido confirmación antes de cada commit/push.

---

## 12. Decisiones que necesito de ti

1. **Decisión A:** ¿evolucionar `xtein-movil` (recomendado) o proyecto nuevo?
2. Si es A: ¿hago primero el commit del estado actual de `xtein-movil` tal como está (todo lo del 2026-10-27)?
3. **Nombre de la app:** "Xtein" (recomendado) o mantener "Xtein Calidad" hasta que haya un segundo módulo.
4. **Ajustes:** ¿te vale el contenido propuesto (tema, recordar usuario, tamaño de texto, información, borrar datos locales) o quieres algo más (por ejemplo cambiar de empresa sin cerrar sesión)?
5. **Permisos del menú:** ¿de acuerdo con `USUARIO APLICACIONES` + `PLATAFORMA:'MFE'` y filtrar solo por `ID_APLICACION` (sin exigir MFE)?
