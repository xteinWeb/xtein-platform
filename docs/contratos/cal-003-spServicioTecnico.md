# Contrato `spServicioTecnico` — CAL-003 Servicios técnicos

Contrato entre el front (`apps/mfe-cal`, aplicación `CAL-003`), las rutas de apiRest `POST /api/CAL003/*` y el procedimiento almacenado `dbo.spServicioTecnico` (ARTDECON). Origen funcional: prototipo «Inventario de servicios técnicos» (Xtein 2.0). Las pestañas Pre-facturas y la factura de Ventas del prototipo son de otros módulos y no están aquí.

Archivos en apiRest:
- BD: `sql/ddl/50_cal003_servicios_tecnicos.sql` (tablas), `sql/seed/52_cal003_documentos.sql` (STS/STT/STD y áreas), `sql/seed/54_cal003_tipos_servicio.sql` (tipos de servicio), `sql/sp/51_spServicioTecnico.sql` (vistas `RS_ST_*` y SP), `sql/seed/53_menu_cal003.sql` (menú y permisos de XTEIN), `sql/seed/55_cal003_filtros.sql` (campos del buscador de la barra), `sql/rollback/91_rollback_cal003.sql`.
- Rutas: `src/routes/CAL003.routes.js`, `src/controllers/CAL003/CAL003.controller.js`, `src/controllers/CAL003/soportes.js`, `src/tests/CAL003.test.js`. Variable `RUTA_ARCHIVOS_CAL003` (`.env.example`).
- Orden de ejecución: **50 → 52 → 54 → 51 → 53 → 55**.

Archivos en el front: `apps/mfe-cal/src/app/applications/cal-003/**` y su entrada en `cal-application.registry.ts`.

## 1. Convenciones

Las mismas de CAL-001 (`cal-001-spNoConformidad.md` §1):

- **Firma:** `dbo.spServicioTecnico @ACCION NVARCHAR(50), @DATA_JSON NVARCHAR(MAX)`; `DATA_JSON` debe ser un objeto JSON.
- **Salida:** un recordset con la columna `DATOS` (cadena JSON, siempre un arreglo). Éxito: `ErrMensaje: ""`. Error de negocio: `[{"ErrMensaje":"<texto>"}]` con HTTP 200; el SP hace `ROLLBACK` y nunca `THROW` al cliente.
- **Una transacción por escritura;** las validaciones van antes de escribir. Concurrencia: `UPDLOCK, HOLDLOCK` sobre las filas que cambian y `sp_getapplock` para los consecutivos.
- **Reloj:** `@AHORA = DATEADD(HOUR, -5, SYSUTCDATETIME())` (Colombia) y `@HOY`.
- **Nada se borra.** Los documentos solo se crean o se anulan: estado + observación + quién y cuándo. Cada cambio de un servicio queda en `LOG_SERVICIOS_TECNICOS` (es el historial de Consultas) y sube su `VERSION`.
- **Inventario propio de Calidad:** no se escribe `KARDEX_PRODUCTOS`.

### 1.1 Identidad, UN y papeles

1. `USUARIO_TOKEN` / `EMPRESA_TOKEN` los pone el controlador desde el token (`identidadSp`). Si faltan → error.
2. Campos prohibidos en la raíz de `DATA_JSON`: `USUARIO`, `ID_UN`, `RUTA`, `MIME`, `PUEDE_*` (el controlador los rechaza a cualquier profundidad con 400).
3. Una fila de `USUARIOS_APLICACIONES` con `ID_APLICACION = 'CAL-003'`; la UN sale de ahí. Sin fila → «Sin acceso a CAL-003»; varias → no soportado.
4. Papeles (se asignan en ADM015):

| Papel del prototipo | Columna | Puede |
|---|---|---|
| Quien gestiona las garantías | `CREAR` | Entrada, anular entrada sin traslados recibidos, enviar traslados desde cualquier bodega, despachar, anular líneas, adjuntar soporte, proponer ajustes |
| Persona de facturación | `ELIMINAR` | Anular un servicio con traslados recibidos (queda `INACTIVO`) y, ya reunidas sus partes, anularlo completo |
| Quien hace las devoluciones | `EXCLUSIVA` | Autorizar o rechazar ajustes |
| Responsable de costos | `MODIFICAR` | Poner el precio de los ESPECIAL |
| Ver | `LISTAR` o `BUSCAR` | Consultas |
| Persona de planta | `BODEGAS_USUARIOS` | Recibir o rechazar traslados hacia sus bodegas; enviar desde ellas; ver solo sus bodegas |

`VE_TODAS = 1` si tiene `CREAR`, `ELIMINAR`, `EXCLUSIVA`, `MODIFICAR` o `CONFIGURAR`; si no, traslados y consultas se limitan a sus bodegas. La barra de acciones del front usa estos papeles (no los permisos genéricos de ADM015): Nuevo/Guardar = `PUEDE_CREAR`, Eliminar (anular) = `PUEDE_CREAR` o `PUEDE_ANULAR_RECIBIDO`, Guardar en Precios = `PUEDE_PRECIO`.

### 1.2 Documentos y numeración

`DOCUMENTOS` de la UN raíz, copia de `DE0` (seed 52), con `DOCUMENTOS_UN` y `DOCUMENTOS_APLICACIONES` (`CAL-003`):

| Documento | Tabla | Se muestra |
|---|---|---|
| `STS` Servicio técnico | `SERVICIOS_TECNICOS` | `S-00015` |
| `STT` Traslado servicio técnico | `TRASLADOS_ST` | `TR-00009` |
| `STD` Entrega servicio técnico | `ENTREGAS_ST` | `DE-00021` |

Consecutivo: applock `<TABLA>|<ID_UN>|<DOC>` → mayor entre `MAX(CONSECUTIVO)` y `NC_DOCUMENTO` → `+1` → `UPDATE DOCUMENTOS.NC_DOCUMENTO`. Los dígitos y el separador salen de `DOCUMENTOS`. Documento inactivo o sin numeración → error.

### 1.3 Rutas y lista blanca

Acción fuera de la lista de su ruta → **400 sin llamar al SP**. `DATA_JSON` = solo los campos de la columna «Entrada» + identidad.

| Ruta | Acciones |
|---|---|
| `POST /api/CAL003/consulta` | `permisos`, `clientes`, `bodegas`, `areas`, `tipos servicio`, `productos`, `producto arbol`, `servicios`, `servicio`, `servicios trasladables`, `traslados`, `servicios entregables`, `entregas`, `entrega`, `servicios ajustables`, `ajustes`, `precios especial`, `inventario bodega`, `servicios cliente`, `historial`, `avisos` |
| `POST /api/CAL003/save` | `entrada nueva`, `entrada anular`, `traslado enviar`, `traslado recibir`, `traslado rechazar`, `entrega despachar`, `entrega anular linea`, `ajuste proponer`, `ajuste autorizar`, `ajuste rechazar`, `precios guardar` |
| `POST /api/CAL003/soporte-subir` | `soporte adjuntar` |
| `POST /api/CAL003/soporte` | `soporte ver` |

Ninguna respuesta lleva `RUTA`.

## 2. Acciones

### 2.1 Consultas

| Acción | Entrada | Salida |
|---|---|---|
| `permisos` | — | `[{PUEDE_VER, PUEDE_CREAR, PUEDE_ANULAR_RECIBIDO, PUEDE_AUTORIZAR, PUEDE_PRECIO, VE_TODAS, BODEGAS:[ID_UN_BODEGA]}]` |
| `clientes` | `TEXTO?`, `TOP?` (1–5000) | `[{ID_CLIENTE, NOMBRE}]` activos (`CLIENTES` + `R_CLIENTES_ID`) |
| `bodegas` | — | `[{ID_UN_BODEGA, DESCRIPCION, PROPIA}]` activas de `BODEGAS` |
| `areas` | — | `[{ID_AREA, DESCRIPCION}]` de `ITM_DOMINIOS` `CALIDAD/AREAS_SERVICIO_TECNICO` (`VALOR1`) |
| `tipos servicio` | — | `[{TIPO_SERVICIO, DESCRIPCION}]` de `ITM_DOMINIOS` `CALIDAD/TIPOS_SERVICIO_TECNICO` (`VALOR1` = código, `VALOR2` = descripción). SG (sin cobro) y SR (genera pre-factura) conservan su significado en el despacho |
| `producto arbol` | `CODIGO` (interno o `CODIGO_ASOCIADO`) | `[{CODIGO_BUSCADO, PRODUCTO_BUSCADO, RAIZ:{NIVEL, PRODUCTO, CODIGO_ASOCIADO, NOMBRE, CANTIDAD, HIJOS:[…]}}]`. Juego (`JU%`) → productos de `PRODUCTOS_KITS` → partes de `PRODUCTOS_PARTES` (cantidad de la parte × la del producto). Si el código es de un producto que pertenece a **un solo** juego, la raíz es ese juego y `PRODUCTO_BUSCADO` indica el producto que llegó |
| `servicios` | `TEXTO?`, `FECHA_DESDE?` (90 días), `FECHA_HASTA?` (hoy), `FILTRO?` (§2.5; con él no hay rango por defecto) | Hasta 200 servicios (`Cal003Servicio`) |
| `servicio` | `ID_SERVICIO` | `[{SERVICIO, UNIDADES:[Cal003Unidad]}]` |
| `servicios trasladables` | — | `[{SERVICIO, UNIDADES}]` en `EN INVENTARIO` o `INACTIVO`, con unidades en bodegas visibles |
| `traslados` | `FILTRO?` (§2.5) | Hasta 200, primero los `ENVIADO`; `PUEDE_RESPONDER = 1` si el usuario recibe en la bodega destino |
| `servicios entregables` | `ID_CLIENTE`, `ID_UN_BODEGA` | Servicios del cliente `EN INVENTARIO` con `OK` (todas sus unidades en esa bodega y sin traslado pendiente) y `MOTIVO` (qué falta reunir) |
| `entregas` | `PENDIENTES?` (1 = solo `DESPACHADO` con líneas activas), `FILTRO?` (§2.5) | Hasta 200 documentos de entrega |
| `entrega` | `ID_ENTREGA` | `[{ENTREGA, LINEAS:[{…, ESTADO ACTIVA/ANULADA, UNIDADES}]}]` |
| `servicios ajustables` | — | `EN INVENTARIO` sin traslados pendientes |
| `ajustes` | `FILTRO?` (§2.5) | Hasta 200, primero los `PROPUESTO` |
| `precios especial` | — | `[{SIN_PRECIO:[{…, DIAS_HABILES}], CON_PRECIO:[…]}]`. Días hábiles = lunes a viernes, sin festivos |
| `inventario bodega` | `ID_UN_BODEGA` (visible) | Unidades en la bodega con servicio, cliente y días en inventario |
| `servicios cliente` | `ID_CLIENTE` | Servicios con dónde está cada unidad |
| `historial` | `ID_SERVICIO` | `LOG_SERVICIOS_TECNICOS` en orden |
| `avisos` | — | `[{TITULO, DETALLE}]` según el papel: traslados por recibir (sus bodegas); traslados rechazados, soportes pendientes y ajustes rechazados (garantías); ajustes por autorizar (devoluciones); ESPECIAL sin precio (costos). Se cierran solos al resolverse |

### 2.2 Escritura

| Acción | Entrada | Reglas |
|---|---|---|
| `entrada nueva` | `ENTRADA:{FECHA, ID_CLIENTE, TIPO_SERVICIO (código del dominio), ID_UN_BODEGA, N_SERVICIO_CLIENTE?, N_ORDEN_DEVOLUCION?, ID_AREA?}`, `PRODUCTOS:[{PRODUCTO, UNIDADES:[{NIVEL PF/PA, PRODUCTO, PARTE, CANTIDAD}]}]` (máx. 20) | `CREAR`. Fecha ≤ hoy. Cada producto = un servicio `STS` `EN INVENTARIO`. Cada unidad debe pertenecer al producto recibido y no pasar la cantidad del catálogo; un producto llega completo (PF) **o** por sus partes (PA). `PARCIAL` y «(llegó una parte)» si es un juego del que no llegó todo. Devuelve `[{ID_SERVICIO, DOCUMENTO, NOMBRE}]` |
| `entrada anular` | `ID_SERVICIO`, `VERSION`, `OBSERVACION` (obligatoria, ≤ 500) | Rechaza si ya tiene despacho o ajuste. Sin traslados recibidos: `CREAR` → `ANULADO` (anula sus traslados `ENVIADO` y saca las unidades). Con traslados recibidos: `ELIMINAR` → `INACTIVO`; un `INACTIVO` con todas sus partes en una bodega y sin traslados pendientes → `ANULADO` (`ELIMINAR`) |
| `traslado enviar` | `ID_SERVICIO`, `ID_UN_BODEGA_DESTINO`, `UNIDADES:[ID_UNIDAD]` | `CREAR`, o persona de planta desde sus bodegas. Unidades del servicio, en inventario, sin traslado pendiente y de **una sola** bodega origen ≠ destino. Crea `STT` `ENVIADO`; las unidades siguen en el origen con `ID_TRASLADO_PENDIENTE` |
| `traslado recibir` / `traslado rechazar` | `ID_TRASLADO` (+ `OBSERVACION` obligatoria al rechazar) | Solo quien está en `BODEGAS_USUARIOS` de la bodega destino. Recibir mueve las unidades al destino; rechazar las deja en el origen |
| `entrega despachar` | `ID_CLIENTE`, `ID_UN_BODEGA`, `SERVICIOS:[ID_SERVICIO]` | `CREAR`. Servicios del cliente `EN INVENTARIO` que salen como llegaron desde esa bodega. Crea `STD` `DESPACHADO`; servicios `DESPACHADO` (siguen en la bodega hasta el soporte) |
| `entrega anular linea` | `ID_ENTREGA`, `ID_SERVICIO`, `OBSERVACION` | `CREAR`. Solo en `DESPACHADO`. La línea queda `ANULADA` y el servicio vuelve a `EN INVENTARIO` (devuelto por el cliente) |
| `ajuste proponer` | `ID_SERVICIO`, `DESTINO` NUEVO/ESPECIAL/BAJA | `CREAR`. `EN INVENTARIO` sin traslados pendientes → `AJUSTE PROPUESTO`. Un solo ajuste propuesto por servicio |
| `ajuste autorizar` | `ID_AJUSTE`, `OBSERVACION?` | `EXCLUSIVA`. Servicio `AJUSTADO`, sale del inventario de Calidad; ESPECIAL crea su fila en `PRECIOS_ESPECIAL_ST` |
| `ajuste rechazar` | `ID_AJUSTE`, `OBSERVACION` | `EXCLUSIVA`. BAJA rechazada → pasa sola a ESPECIAL (como autorizada a ESPECIAL). NUEVO o ESPECIAL rechazado → el servicio vuelve a `EN INVENTARIO` para tipificarlo otra vez |
| `precios guardar` | `PRECIOS:[{ID_SERVICIO, PRECIO > 0}]` | `MODIFICAR`. Solo ESPECIAL sin precio |

Las acciones de escritura devuelven `[{ErrMensaje:"", DOCUMENTO, MENSAJE}]` (el front muestra `MENSAJE`), salvo `entrada nueva` y `entrega despachar`, que devuelven lo creado.

### 2.3 Estados

- Servicio: `EN INVENTARIO` → (`AJUSTE PROPUESTO` → `AJUSTADO` | `EN INVENTARIO`) · (`DESPACHADO` → `ENTREGADO` | `EN INVENTARIO`) · `INACTIVO` → `ANULADO` · `ANULADO`.
- Traslado: `ENVIADO` → `RECIBIDO` | `RECHAZADO` | `ANULADO` (con la entrada).
- Entrega: `DESPACHADO` → `CERRADO` (soporte). Línea: `ACTIVA` | `ANULADA`.
- Ajuste: `PROPUESTO` → `AUTORIZADO` | `RECHAZADO` (`DESTINO_FINAL` = ESPECIAL si era BAJA).

### 2.4 Soporte firmado

`soporte-subir`: `{ID_ENTREGA, NOMBRE_ORIGINAL, BASE64}`. El controlador consulta `permisos` (sin `PUEDE_CREAR` → `ErrMensaje`), decodifica (> 3 MB → 413), detecta el formato por los bytes (PDF, JPG o PNG; si no → 415), escribe `<RAIZ>/_tmp/<uuid>.tmp`, llama a `soporte adjuntar` con `{ID_ENTREGA, NOMBRE_ORIGINAL, EXTENSION}` y mueve el archivo a la `RUTA` que genera el SP (`<ID_UN>/<yyyy>/<ID_ENTREGA>/<guid>.<ext>`). El SP cierra la entrega (`CERRADO`) y saca del inventario los servicios de las líneas activas (`ENTREGADO`). `RAIZ = <RUTA_ARCHIVOS_CAL003>/<EMPRESA del token>`, con las mismas defensas de ruta que las fotos de CAL-001.

`soporte`: `{ID_ENTREGA}` → `{ data: { MIME, NOMBRE, BASE64 }, token }`; falta el archivo → 404.

### 2.5 Buscar de la barra (filtro estándar)

Entrada, Traslado, Entrega y Ajuste usan **Buscar** y **Ver** de la barra con los modales estándar de la plataforma (`xtein-record-filter` y `xtein-record-view`, como PRO-039); en pantalla no hay listas de registros.

- El filtro pide sus campos a `spGenerales 'columnas'` con la tabla base de cada documento. Los campos están en `ITM_DOMINIOS` `COLUMNAS/FILTRO` (seed 55): `VALOR1` = `TABLA.CAMPO`, `VALOR2` = título (`|smalldatetime` para fechas), `VALOR3` = tabla base, `VALOR4` = `''`, `listauni|<SQL>` o `lista|<SQL>`.
- El filtro devuelve `ESTRUCTURA = [{CAMPO, EXPRESION, TABLA}]` y el front la manda como `FILTRO`.
- El SP **no arma SQL con el texto**: llena `@FILTRO` y cada consulta aplica solo los campos que conoce (los demás se ignoran). Texto: contiene. Fecha: `MM/dd/yyyy` o `MM/dd/yyyy..MM/dd/yyyy`. Lista: un valor o arreglo JSON de valores.

| Tabla base | Pantalla | Campos |
|---|---|---|
| `RS_ST_SERVICIOS` | Entrada | `DOCUMENTO`, `FECHA`, `ID_CLIENTE`, `NOMBRE` (producto), `TIPO_SERVICIO`, `N_SERVICIO_CLIENTE`, `ID_UN_BODEGA_ENTRADA`, `ESTADO` |
| `RS_ST_TRASLADOS` | Traslado | `DOCUMENTO`, `SERVICIO` (número S), `FECHA_ENVIA`, `ID_UN_BODEGA_ORIGEN`, `ID_UN_BODEGA_DESTINO`, `ESTADO` |
| `RS_ST_ENTREGAS` | Entrega | `DOCUMENTO`, `FECHA`, `ID_CLIENTE`, `ID_UN_BODEGA`, `ESTADO`, `PENDIENTE_SOPORTE` (`SI`) |
| `AJUSTES_ST` | Ajuste | `SERVICIO` (número S), `PRODUCTO`, `FECHA_PROPONE`, `DESTINO`, `ESTADO` |

Un campo nuevo en el buscador necesita su fila en el seed 55 **y** su condición en el SP.

## 3. Pendiente por definir

- **Entrada a ARTDECON de los ajustes** (NUEVO / ESPECIAL): hoy el ajuste autorizado saca el servicio del inventario de Calidad y registra el resultado, pero no escribe `KARDEX_PRODUCTOS`; falta definir con inventarios el movimiento, la bodega y el costo.
- **No conformidad al guardar la entrada:** el prototipo abre la NC (origen CLIENTE) unida al servicio. Por ahora el front recuerda registrarla en CAL-001 con el Número S; falta enlazarlas (`spNoConformidad` exige partes, causas y operarios).
- **Anulación de un servicio con traslados recibidos:** la bodega donde deben reunirse las partes («bodega por definir») y la corrección de nombre/cantidades sobre el mismo servicio.
- **Recordatorios por días hábiles** (día 1 y aviso al jefe al día 3): los avisos se calculan al consultar; no hay envío programado ni calendario de festivos.
- **Pre-facturas SR y su factura:** otros módulos; el despacho cuenta las líneas SR pero no genera la pre-factura.
- **Supuestos del esquema a confirmar:** juego → productos por `PRODUCTOS_KITS` (`ID_UN` como `PRODUCTOS`); niveles JU/PF/PA por el prefijo del código.
