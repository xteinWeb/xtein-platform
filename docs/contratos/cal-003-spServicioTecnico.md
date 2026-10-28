# Contrato `spServicioTecnico` — CAL-003 Servicios técnicos

Contrato entre el front (`apps/mfe-cal`, aplicación `CAL-003`), las rutas de apiRest `POST /api/CAL003/*` y el procedimiento almacenado `dbo.spServicioTecnico` (ARTDECON). Origen funcional: prototipo «Inventario de servicios técnicos» (Xtein 2.0). Las pestañas Pre-facturas y la factura de Ventas del prototipo son de otros módulos y no están aquí.

Archivos en apiRest:
- BD: `sql/ddl/50_cal003_servicios_tecnicos.sql` (tablas), `sql/seed/52_cal003_documentos.sql` (STS/STT/STD y áreas), `sql/seed/54_cal003_tipos_servicio.sql` (tipos de servicio), `sql/sp/51_spServicioTecnico.sql` (vistas `RS_ST_*` y SP), `sql/seed/53_menu_cal003.sql` (menú y permisos de XTEIN), `sql/seed/55_cal003_filtros.sql` (campos del buscador de la barra), `sql/rollback/91_rollback_cal003.sql`.
- Rutas: `src/routes/CAL003.routes.js`, `src/controllers/CAL003/CAL003.controller.js`, `src/controllers/CAL003/soportes.js`, `src/tests/CAL003.test.js`. Variable `RUTA_ARCHIVOS_CAL003` (`.env.example`).
- Orden de ejecución: **50 → 60 → 52 → 54 → 51 → 53 → 55 → 56 → 57 → 58 → 59** (60 = columna de la no conformidad y dominio de bodegas; en una BD que ya tiene CAL-003: 60 y luego 51) (57 = `spAutorizaciones`, compartido; 58 = estados de traslados, servicios y ajustes ya creados; 59 = documentos SEN / STR / SSA para lo ya creado).

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
| Quien hace las devoluciones | `EXCLUSIVA` | Recibe el aviso de ajustes por autorizar |
| Quien autoriza ajustes | `USUARIOS_AUTORIZACIONES.APROBAR` en CAL-003 | Autorizar o rechazar ajustes en Autorizaciones (ADM-225), sin importar la bodega |
| Responsable de costos | `MODIFICAR` | Poner el precio de los ESPECIAL |
| Ver | `LISTAR` o `BUSCAR` | Consultas |
| Persona de planta | `BODEGAS_USUARIOS` | Enviar traslados desde sus bodegas; ver solo sus bodegas |
| Quien autoriza traslados | `USUARIOS_AUTORIZACIONES.APROBAR` en CAL-003 **y** la bodega destino en `BODEGAS_USUARIOS` | Autorizar o rechazar en Autorizaciones (ADM-225) los traslados hacia sus bodegas |

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
| `POST /api/CAL003/consulta` | `permisos`, `consecutivo`, `clientes`, `bodegas`, `areas servicio`, `tipos servicio`, `productos`, `producto arbol`, `servicios`, `servicio`, `servicios trasladables`, `traslados`, `servicios entregables`, `entregas`, `entrega`, `servicios ajustables`, `ajustes`, `precios especial`, `inventario bodega`, `servicios cliente`, `historial`, `avisos` |
| `POST /api/CAL003/save` | `entrada nueva`, `entrada anular`, `traslado enviar`, `entrega despachar`, `entrega anular linea`, `ajuste proponer`, `precios guardar` (autorizar o rechazar traslados y ajustes solo en Autorizaciones, §2.6) |
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
| `areas servicio` | — | `[{ID_AREA, DESCRIPCION}]` de `ITM_DOMINIOS` `CALIDAD/AREAS_SERVICIO_TECNICO` (`VALOR1`) |
| `tipos servicio` | — | `[{TIPO_SERVICIO, DESCRIPCION}]` de `ITM_DOMINIOS` `CALIDAD/TIPOS_SERVICIO_TECNICO` (`VALOR1` = código, `VALOR2` = descripción). SG (sin cobro) y SR (genera pre-factura) conservan su significado en el despacho |
| `producto arbol` | `CODIGO` (interno o `CODIGO_ASOCIADO`) | `[{CODIGO_BUSCADO, PRODUCTO_BUSCADO, RAIZ:{NIVEL, PRODUCTO, CODIGO_ASOCIADO, NOMBRE, CANTIDAD, HIJOS:[…]}}]`. Juego (`JU%`) → productos de `PRODUCTOS_KITS` → partes de `PRODUCTOS_PARTES` (cantidad de la parte × la del producto). Si el código es de un producto que pertenece a **un solo** juego, la raíz es ese juego y `PRODUCTO_BUSCADO` indica el producto que llegó |
| `servicios` | `TEXTO?`, `FECHA_DESDE?` (90 días), `FECHA_HASTA?` (hoy), `FILTRO?` (§2.5; con él no hay rango por defecto) | Hasta 200 servicios (`Cal003Servicio`) |
| `servicio` | `ID_SERVICIO` | `[{SERVICIO, UNIDADES:[Cal003Unidad]}]` |
| `servicios trasladables` | — | `[{SERVICIO, UNIDADES}]` en `DEPOSITO` o `INACTIVO`, con unidades en bodegas visibles |
| `traslados` | `FILTRO?` (§2.5) | Hasta 200, primero los `REGISTRADO` |
| `servicios entregables` | `ID_CLIENTE`, `ID_UN_BODEGA` | Servicios del cliente `DEPOSITO` con `OK` (todas sus unidades en esa bodega y sin traslado pendiente) y `MOTIVO` (qué falta reunir) |
| `entregas` | `PENDIENTES?` (1 = solo `DESPACHADO` con líneas activas), `FILTRO?` (§2.5) | Hasta 200 documentos de entrega |
| `entrega` | `ID_ENTREGA` | `[{ENTREGA, LINEAS:[{…, ESTADO ACTIVA/ANULADA, PIEZAS:[{NOMBRE, CANTIDAD}], UNIDADES}]}]`. `PIEZAS` (`dbo.FN_ST_PIEZAS`) es lo que se muestra: el producto registrado si llegó completo; si llegaron solo partes, cada producto completo y las partes sueltas. `servicios entregables` también trae `PIEZAS`. Ambas traen `PRODUCTO`, `ESTADO_SERVICIO` (tipo depósito) y `SALDO` (servicios de ese producto que le quedan al cliente en `DEPOSITO`) |
| `servicios ajustables` | — | `DEPOSITO` sin traslados pendientes |
| `ajustes` | `FILTRO?` (§2.5) | Hasta 200, primero los `PROPUESTO` |
| `precios especial` | — | `[{SIN_PRECIO:[{…, DIAS_HABILES}], CON_PRECIO:[…]}]`. Días hábiles = lunes a viernes, sin festivos |
| `inventario bodega` | `ID_UN_BODEGA` (visible) | Unidades en la bodega con servicio, cliente y días en inventario |
| `servicios cliente` | `ID_CLIENTE` | Servicios con dónde está cada unidad |
| `historial` | `ID_SERVICIO` | `LOG_SERVICIOS_TECNICOS` en orden |
| `avisos` | — | `[{TITULO, DETALLE}]` según el papel: traslados por autorizar en Autorizaciones (sus bodegas); traslados rechazados, soportes pendientes y ajustes rechazados (garantías); ajustes por autorizar en Autorizaciones (devoluciones); ESPECIAL sin precio (costos). Se cierran solos al resolverse |

### 2.2 Escritura

| Acción | Entrada | Reglas |
|---|---|---|
| `entrada nueva` | `ENTRADA:{FECHA, ID_CLIENTE, TIPO_SERVICIO (código del dominio), ID_UN_BODEGA, N_SERVICIO_CLIENTE?, N_ORDEN_DEVOLUCION?, ID_AREA?}`, `PRODUCTOS:[{PRODUCTO, UNIDADES:[{NIVEL PF/PA, PRODUCTO, PARTE, CANTIDAD}]}]` (**un solo producto**) | `CREAR`. Fecha ≤ hoy. El producto = un servicio `STS` `DEPOSITO`. Cada unidad debe pertenecer al producto recibido y no pasar la cantidad del catálogo; un producto llega completo (PF) **o** por sus partes (PA). `PARCIAL` y «(llegó una parte)» si es un juego del que no llegó todo. Devuelve `[{ID_SERVICIO, DOCUMENTO, NOMBRE}]` |
| `entrada anular` | `ID_SERVICIO`, `VERSION`, `OBSERVACION` (obligatoria, ≤ 500) | Rechaza si ya tiene despacho o ajuste. Sin traslados autorizados: `CREAR` → `ANULADO` (anula sus traslados `REGISTRADO` y sus NAU, como al anular un consumo de PRO-039, y saca las unidades). Con traslados autorizados: `ELIMINAR` → `INACTIVO`; un `INACTIVO` con todas sus partes en una bodega y sin traslados pendientes → `ANULADO` (`ELIMINAR`) |
| `traslado enviar` | `ID_SERVICIO`, `ID_UN_BODEGA_DESTINO`, `UNIDADES:[ID_UNIDAD]` | `CREAR`, o persona de planta desde sus bodegas. Unidades del servicio, en inventario, sin traslado pendiente y de **una sola** bodega origen ≠ destino. Crea `STT` `REGISTRADO`; las unidades siguen en el origen con `ID_TRASLADO_PENDIENTE`. Deja una NAU pendiente en Autorizaciones (§2.6) |
| `traslado autorizar` / `traslado rechazar` | Solo desde Autorizaciones (callback `autorizacion`, §2.6); desde CAL-003 responden "Los traslados se autorizan o rechazan en Autorizaciones" | `APROBAR` en CAL-003 (`USUARIOS_AUTORIZACIONES`) y la bodega destino en `BODEGAS_USUARIOS`. Autorizar mueve las unidades al destino; rechazar las deja en el origen. Observación opcional, como en PRO-039 |
| `entrega despachar` | `ID_CLIENTE`, `ID_UN_BODEGA`, `SERVICIOS:[ID_SERVICIO]` | `CREAR`. Servicios del cliente `DEPOSITO` que salen como llegaron desde esa bodega. Crea `STD` `DESPACHADO`; servicios `DESPACHADO` (siguen en la bodega hasta el soporte) |
| `entrega anular linea` | `ID_ENTREGA`, `ID_SERVICIO`, `OBSERVACION` | `CREAR`. Solo en `DESPACHADO`. La línea queda `ANULADA` y el servicio vuelve a `DEPOSITO` (devuelto por el cliente) |
| `ajuste proponer` | `ID_SERVICIO`, `DESTINO` NUEVO/ESPECIAL/BAJA | `CREAR`. `DEPOSITO` sin traslados pendientes → `AJUSTE PROPUESTO`. Un solo ajuste propuesto por servicio. Deja una NAU pendiente en Autorizaciones con `SOPORTE` `AJ-<ID_AJUSTE>` (5 dígitos) (§2.6) |
| `ajuste autorizar` | Solo desde Autorizaciones (callback `autorizacion`, §2.6) | `APROBAR` en CAL-003. Servicio `AJUSTADO`, sale del inventario de Calidad; ESPECIAL crea su fila en `PRECIOS_ESPECIAL_ST` |
| `ajuste rechazar` | Solo desde Autorizaciones (callback `autorizacion`, §2.6); observación opcional | `APROBAR` en CAL-003. BAJA rechazada → pasa sola a ESPECIAL (como autorizada a ESPECIAL). NUEVO o ESPECIAL rechazado → el servicio vuelve a `DEPOSITO` para tipificarlo otra vez |
| `precios guardar` | `PRECIOS:[{ID_SERVICIO, PRECIO > 0}]` | `MODIFICAR`. Solo ESPECIAL sin precio |

Las acciones de escritura devuelven `[{ErrMensaje:"", DOCUMENTO, MENSAJE}]` (el front muestra `MENSAJE`), salvo `entrada nueva` y `entrega despachar`, que devuelven lo creado.

### 2.3 Estados

- Servicio: `DEPOSITO` → (`AJUSTE PROPUESTO` → `AJUSTADO` | `DEPOSITO`) · (`DESPACHADO` → `ENTREGADO` | `DEPOSITO`) · `INACTIVO` → `ANULADO` · `ANULADO`.
- Traslado (como los consumos de PRO-039): `REGISTRADO` → `AUTORIZADO` | `RECHAZADO` (solo en Autorizaciones) | `ANULADO` (con la entrada).
- Entrega: `DESPACHADO` → `CERRADO` (soporte). Línea: `ACTIVA` | `ANULADA`.
- Ajuste: `PROPUESTO` → `AUTORIZADO` | `RECHAZADO` (solo en Autorizaciones; `DESTINO_FINAL` = ESPECIAL si era BAJA).

### 2.4 Soporte firmado

`soporte-subir`: `{ID_ENTREGA, NOMBRE_ORIGINAL, BASE64}`. El controlador consulta `permisos` (sin `PUEDE_CREAR` → `ErrMensaje`), decodifica (> 3 MB → 413), detecta el formato por los bytes (PDF, JPG o PNG; si no → 415), escribe `<RAIZ>/_tmp/<uuid>.tmp`, llama a `soporte adjuntar` con `{ID_ENTREGA, NOMBRE_ORIGINAL, EXTENSION}` y mueve el archivo a la `RUTA` que genera el SP (`<ID_UN>/<yyyy>/<ID_ENTREGA>/<guid>.<ext>`). El SP cierra la entrega (`CERRADO`) y saca del inventario los servicios de las líneas activas (`ENTREGADO`). `RAIZ = <RUTA_ARCHIVOS_CAL003>/<EMPRESA del token>`, con las mismas defensas de ruta que las fotos de CAL-001.

`soporte`: `{ID_ENTREGA}` → `{ data: { MIME, NOMBRE, BASE64 }, token }`; falta el archivo → 404.

### 2.5 Buscar de la barra (filtro estándar)

- El select **Operación** de la pantalla solo se habilita con **Nuevo** (cambiarla mientras se registra descarta lo que se llevaba y empieza la nueva). Para ver registros se usa **Buscar**.
- **Buscar** abre un solo modal estándar (`xtein-record-filter`, como PRO-039) con la tabla base `RS_ST_OPERACIONES`. Su campo `OPERACION` (ENTRADA, TRASLADO, ENTREGA, AJUSTE, PRECIOS ESPECIAL, CONSULTAS) escoge el formulario; si no se llena, se busca en el que se ve. PRECIOS ESPECIAL y CONSULTAS solo abren esa vista.
- La pantalla quita `OPERACION` y manda el resto como `FILTRO` a la consulta de esa operación (`servicios`, `traslados`, `entregas`, `ajustes`). **Ver** muestra lo encontrado (`xtein-record-view`) y la barra navega entre los registros. En pantalla no hay listas de registros.
- Campos (`ITM_DOMINIOS` `COLUMNAS/FILTRO`, `VALOR3 = RS_ST_OPERACIONES`, seed 55): `VALOR1` = `TABLA.CAMPO`, `VALOR2` = título (`|smalldatetime` para fechas), `VALOR4` = `''`, `listauni|<SQL>` o `lista|<SQL>`. La lista de Estado sale de la vista `RS_ST_ESTADOS` (51).
- El SP **no arma SQL con el texto**: llena `@FILTRO` y cada consulta aplica los campos que le corresponden e ignora los demás. Texto: contiene. Fecha: `MM/dd/yyyy` o `MM/dd/yyyy..MM/dd/yyyy`. Lista: un valor o arreglo JSON de valores.

| Campo | Entrada (`servicios`) | Traslado (`traslados`) | Entrega (`entregas`) | Ajuste (`ajustes`) |
|---|---|---|---|---|
| `DOCUMENTO` | número S | número TR | número DE | número S |
| `SERVICIO` | número S | número S | algún S del despacho | número S |
| `FECHA` | fecha de entrada | fecha de envío | fecha | fecha de la propuesta |
| `ID_CLIENTE` | cliente | cliente del servicio | cliente | cliente del servicio |
| `PRODUCTO` | producto | producto del servicio | algún producto del despacho | producto del servicio |
| `TIPO_SERVICIO` | tipo | tipo del servicio | algún servicio de ese tipo | tipo del servicio |
| `N_SERVICIO_CLIENTE` | Nº servicio | Nº servicio | algún Nº servicio del despacho | Nº servicio |
| `ID_UN_BODEGA` | bodega de entrada | bodega origen | bodega de salida | — |
| `ID_UN_BODEGA_DESTINO` | — | bodega destino | — | — |
| `DESTINO` | — | — | — | NUEVO / ESPECIAL / BAJA |
| `ESTADO` | estado del servicio | estado del traslado | estado del documento | estado del ajuste |
| `PENDIENTE_SOPORTE` | — | — | `SI` = despachado con líneas activas | — |

Un campo nuevo en el buscador necesita su fila en el seed 55 **y** su condición en el SP.

### 2.6 Traslados en Autorizaciones (ADM-225)

Mismo manejo que los consumos de PRO-039, para traslados y salidas por ajuste: el documento queda pendiente (`REGISTRADO` / `PROPUESTO`) con su NAU y solo Autorizaciones lo cambia; la pantalla de CAL-003 solo muestra el estado (sin botones). Traslado: `SOPORTE` = número TR, autoriza quien tiene `APROBAR` y la bodega destino. Ajuste: `SOPORTE` = `AJ-<ID_AJUSTE>`, autoriza quien tiene `APROBAR`. El callback decide por el prefijo del `SOPORTE`.


- `traslado enviar` crea en la misma transacción una NAU (`AUTORIZACION_WEB` + `ITM_AUTORIZACION_WEB`, UN raíz, `ID_APLICACION = 'CAL-003'`, `SOPORTE` = número TR, `ESTADO = 'REGISTRADO'`), igual que `spAutorizaciones 'GENERAR AUTORIZACION'` pero escrita en el SP para no anidar `INSERT…EXEC`. `DATOS`: `DOCUMENTO`, `SERVICIO`, `CLIENTE`, `QUE_SE_TRASLADA`, `BODEGA_ORIGEN`, `BODEGA_DESTINO`.
- La ven en Autorizaciones los usuarios con **Aprobar** en CAL-003 (`USUARIOS_AUTORIZACIONES`, se da en ADM-015).
- Al autorizar o rechazar allí, `spAutorizaciones 'UPDATE AUTORIZACION'` ejecuta lo configurado en `ITM_CONFIG_AUTORIZ` (seed 56): `spServicioTecnico 'autorizacion', {ENCABEZADO, ITEMS}`. El SP busca el traslado por el `SOPORTE` de la NAU y hace `traslado autorizar` o `traslado rechazar` con `USUARIO_AUTORIZA` (que tenga `APROBAR` en CAL-003, la bodega destino en `BODEGAS_USUARIOS` y que el traslado siga `REGISTRADO`). Si falla, deshace también la NAU y Autorizaciones muestra el mensaje.
- Anular la entrada deja su NAU pendiente en `ANULADO` (como `spMovimientosConsumos 'delete'`).
- `sql/sp/57_spAutorizaciones_cal003.sql` agrega a `spAutorizaciones 'AUTORIZACIONES PENDIENTES'` una condición solo para CAL-003: salen las NAU `REGISTRADO` sin autorizar ni rechazar (no salen las autorizadas, rechazadas ni anuladas). Las demás aplicaciones siguen igual. Rollback: `sql/rollback/91b_rollback_spAutorizaciones.sql`.
- `autorizacion` no está en las acciones del controlador de CAL-003: solo llega desde `spAutorizaciones`.

### 2.7 Reporte del documento de entrega (`CAL-003-001`)

- Acción `CAL-003-001` de `spServicioTecnico`, para el servidor de reportes DevExpress (como `PRO-039-001`): se llama sin token, con `{"filtro":"{\"FILTRO\":\"(ID_ENTREGA=n)\"}"}` o `{"FILTRO":"ID_ENTREGA IN (n, …)"}`. No arma SQL con el filtro: solo acepta `ID_ENTREGA` con números.
- Devuelve 3 conjuntos: empresa (`NOMBRE`, `NIT`, `DIR_EMP`, `TEL_EMP`); encabezados (`RS_ST_ENTREGAS`); líneas activas con `PRODUCTO`, `CANTIDAD`, `TIPO_DEPOSITO` (estado del servicio), `SOPORTE` (número S), `BODEGA`, `TIPO_ENTRADA` (SG / SR), `SALDO`, más `ITEM`, `N_SERVICIO_CLIENTE` y `CODIGO_ASOCIADO`.
- **Pendiente:** el diseño `.repx` en el servidor de reportes y su fila en `REPORTES` (`ID_APLICACION = 'CAL-003'`, `ID_REPORTE = 'CAL-003-001'`, `ARCHIVO` = nombre del diseño). Mientras tanto la pantalla usa su vista de impresión con las mismas columnas.

### 2.8 Cabecera, documentos por movimiento y validaciones de la entrada

- **Cabecera de la pantalla:** Movimiento (ENTRADA, TRASLADO, SALIDA = entrega) · Estado · Documento · Usuario · Fecha de registro. El Movimiento solo se habilita con Nuevo; Ajuste, Precios ESPECIAL y Consultas se abren desde Buscar → Operación.
- **Documentos:** uno por movimiento, sin ceros a la izquierda: `SEN-1` (entrada), `STR-1` (traslado), `SSA-1` (salida). Reemplazan a STS / STT / STD (seed 52; lo ya creado lo pasa el 59 y deja los viejos INACTIVO). Las ajustes siguen como `AJ-00001` en Autorizaciones.
- **`consecutivo`** (consulta): `MOVIMIENTO` (ENTRADA / TRASLADO / SALIDA), `ID_APLICACION?` (`CAL-003`); el usuario sale del token. Devuelve `[{MOVIMIENTO, ID_DOCUMENTO, CONSECUTIVO, DOCUMENTO, USUARIO}]`, con la misma regla que al guardar (mayor entre `NC_DOCUMENTO` y el último usado, más uno). Es una vista previa: el número se asigna al guardar.
- **Estado del documento** (`ESTADO_DOCUMENTO` en las vistas y consultas), solo REGISTRADO / ANULADO / AUTORIZADO:
  - Entrada: REGISTRADO o ANULADO.
  - Traslado: REGISTRADO, AUTORIZADO o ANULADO (rechazado o anulado).
  - Salida: REGISTRADO al despachar, AUTORIZADO con el soporte firmado, ANULADO sin líneas activas.
  El estado del servicio en inventario (DEPOSITO, DESPACHADO, AJUSTADO…) sigue aparte.
- **`areas servicio`** (antes `areas`): lista del campo "Área que solicita".
- **`entrada nueva`:** el Nº de servicio del cliente es solo numérico y no se repite para el mismo cliente (las entradas anuladas no cuentan; se valida con el bloqueo de la numeración). Las partes llegan en cantidad 0 por defecto; las que siguen en 0 no se guardan y si todas están en 0 se rechaza.

### 2.9 Bodegas de servicio técnico y no conformidad obligatoria

- **Bodegas:** CAL-003 solo trabaja con las del dominio `CALIDAD / BODEGAS_SERVICIO_TECNICO` (`VALOR1` = `ID_UN_BODEGA`; script 60 con PP 500 / 501 / 502 y PT 700 / 701 / 702). Se aplica a `bodegas`, a las bodegas del usuario (`permisos`, filtros de lo que ve) y a la bodega de `entrada nueva`, el destino de `traslado enviar` y la bodega de `entrega despachar`. Dominio vacío = sin restricción.
- **No conformidad (CAL-001, origen CLIENTE) obligatoria por entrada:** el Nº de servicio del cliente pasa a ser obligatorio (lo pide la NC). Al guardar la entrada, la pantalla abre el formulario de la NC (producto PF, fechas del evento y del reclamo, área de detección, fuente, causa del cliente, partes afectadas con su causa o la pieza si el PF no tiene partes) y la crea con `POST /api/CAL001N/save` `new`; luego la liga con **`servicio nc`** (`ID_SERVICIO`, `ID_REGISTRO_NC`): la NC debe ser de origen CLIENTE, del mismo cliente y Nº de servicio, y no estar ligada a otra entrada. Queda en `SERVICIOS_TECNICOS.ID_REGISTRO_NC` (FK, índice único) y se ve como `NC_DOCUMENTO` en `servicios` / `servicio`. Mientras falte, `avisos` muestra "Entrada sin no conformidad" y la entrada abierta trae el botón para registrarla. Registrar la NC pide en CAL-001 los permisos Crear y OPC (gestor).
- **Salida:** `servicios entregables`, `entrega` y el reporte `CAL-003-001` traen también `N_ORDEN_DEVOLUCION`; la vista de impresión muestra Nº servicio y Nº orden devolución.

## 3. Pendiente por definir

- **Entrada a ARTDECON de los ajustes** (NUEVO / ESPECIAL): hoy el ajuste autorizado saca el servicio del inventario de Calidad y registra el resultado, pero no escribe `KARDEX_PRODUCTOS`; falta definir con inventarios el movimiento, la bodega y el costo.
- **No conformidad al guardar la entrada:** el prototipo abre la NC (origen CLIENTE) unida al servicio. Por ahora el front recuerda registrarla en CAL-001 con el Número S; falta enlazarlas (`spNoConformidad` exige partes, causas y operarios).
- **Anulación de un servicio con traslados recibidos:** la bodega donde deben reunirse las partes («bodega por definir») y la corrección de nombre/cantidades sobre el mismo servicio.
- **Recordatorios por días hábiles** (día 1 y aviso al jefe al día 3): los avisos se calculan al consultar; no hay envío programado ni calendario de festivos.
- **Pre-facturas SR y su factura:** otros módulos; el despacho cuenta las líneas SR pero no genera la pre-factura.
- **Supuestos del esquema a confirmar:** juego → productos por `PRODUCTOS_KITS` (`ID_UN` como `PRODUCTOS`); niveles JU/PF/PA por el prefijo del código.
