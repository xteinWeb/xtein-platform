# Contrato `spNoConformidad` — CAL-001 No Conformidades

Contrato vinculante entre el front (`apps/mfe-cal`, aplicación `CAL-001`), las rutas de apiRest `POST /api/CAL001N/*` y el procedimiento almacenado `dbo.spNoConformidad` (ARTDECON). El SP se implementa en F2 (`sql/sp/41_spNoConformidad.sql`); este documento lo fija antes.

Plan: `xtein-platform/.omc/plans/cal-001-plan.md` §3, §4, §9.2 y §10. Evidencia F0: `xtein-platform/.omc/research/cal-001-p0.md`. **Fase 2** (acción `agregar`, idempotencia, consulta ampliada): `xtein-platform/.omc/plans/cal-001-fase2-plan.md` §3-§5.

Archivos en apiRest:
- BD (F1): `sql/ddl/40_cal001_registros_nc.sql`, `sql/seed/42_cal001_documento.sql`, `sql/rollback/93_rollback_cal001.sql`, `sql/verificacion/92_verificar_cal001.sql`.
- SP y pruebas (F2): `sql/sp/41_spNoConformidad.sql`, `sql/pruebas/41_pruebas_spNoConformidad_{consultas,escritura}.sql`, `sql/pruebas/41_concurrencia_consecutivo.mjs`, `sql/rollback/95c_limpiar_prueba_concurrencia_cal001.sql` (limpieza de la prueba de concurrencia) y `sql/rollback/93b_rollback_spNoConformidad.sql` (rollback solo del SP).
- Rutas (F3): `src/routes/CAL001N.routes.js`, `src/controllers/CAL001N/CAL001N.controller.js`, `src/controllers/CAL001N/fotos.js`, `scripts/limpiar-fotos-cal001.mjs`, `src/tests/CAL001N.test.js` (§6).
- **Fase 2:** `sql/ddl/44_cal001_f2_log_agregar.sql` (CK_LRNC_ACC con `AGREGAR`, `LOG_REGISTROS_NC.ID_OPERACION` + `UQ_LRNC_OPERACION`), `sql/verificacion/92b_verificar_cal001_f2.sql`, `sql/rollback/93c_rollback_spNoConformidad_f2.sql` (SP de fase 1) y `93d_rollback_cal001_f2_ddl.sql` (orden de rollback: 93c → 93d), `sql/pruebas/44_concurrencia_operacion.mjs` + `sql/rollback/95d_limpiar_prueba_concurrencia_cal001_f2.sql`. Orden de despliegue: 44 → SP 41 → 92 y 92b en OK.

**Esquema (F1):** `REGISTROS_NC` (encabezado) → `ITM_REGISTROS_NC_PARTES` → `ITM_REGISTROS_NC_CAUSAS` → `ITM_REGISTROS_NC_OPERARIOS`; `ITM_REGISTROS_NC_FOTOS`; `LOG_REGISTROS_NC`. Lee `USUARIOS_APLICACIONES`, `PRODUCTOS`, `PRODUCTOS_PARTES`, `CAUSAS`, `EMPLEADOS`, `ITM_EMPLEADOS_SECCIONES`, `SECCIONES`, `CLIENTES`, `DOMINIOS`/`ITM_DOMINIOS`, `DOCUMENTOS`. **Nunca escribe `CALIDAD`** ni usa `spDocumentos`.

## 1. Convenciones

- **Firma:** `dbo.spNoConformidad @ACCION NVARCHAR(50), @DATA_JSON NVARCHAR(MAX)`. El controlador lo llama con `sql.NVarChar(50)` y `sql.NVarChar(sql.MAX)` (no `VarChar`, como hace VEN213). `ISJSON(@DATA_JSON) = 1` obligatorio.
- **Salida:** un recordset con una columna `DATOS` (cadena JSON, siempre un **arreglo**). apiRest la devuelve en `data`.
- **Éxito:** cada elemento del arreglo trae `ErrMensaje: ""`. Las listas pueden devolver `[]`.
- **Error de negocio o de permisos:** exactamente `[{"ErrMensaje":"<texto>"}]`, con HTTP 200. El SP **no** hace `THROW` hacia el cliente: atrapa todo en `TRY/CATCH`, hace `ROLLBACK` y devuelve el `ErrMensaje`. El front revisa `data[0]?.ErrMensaje`. (Es la convención de los SP del ERP, como `spDevolucion`; no la de los SP de agentes descrita en `sql/README.md`.)
- **Claves JSON** sensibles a mayúsculas. Fechas `yyyy-MM-dd` (`DATE`); sellos `yyyy-MM-ddTHH:mm:ss` en hora de Colombia, sin zona.
- **Escritura atómica:** una sola transacción por acción de escritura; cualquier rechazo deshace todo. `XACT_ABORT` (§1.4): `ON` desde el inicio cuando el llamador no trae transacción (apiRest); con transacción del llamador, `OFF` hasta la primera escritura y `ON` desde ahí.
- **Sin borrado del encabezado ni anulación.** No existen las acciones `delete` ni `anular`. Las fotos se retiran (lógico).

### 1.1 Identidad, UN y permisos (en el SP, en cada acción)

1. `USUARIO_TOKEN` y `EMPRESA_TOKEN` vienen dentro de `DATA_JSON`, puestos por el controlador desde `req.identidad` (patrón AGT001, `identidadSp`). Si faltan → `ErrMensaje` E01.
2. **Campos prohibidos:** si la raíz de `DATA_JSON` o el objeto `REGISTRO` traen `USUARIO`, `PUEDE_VER`, `PUEDE_CREAR`, `ES_GESTOR`, `ID_UN`, `RUTA` o `MIME` → E02 (ninguna acción los admite; `foto agregar` tampoco recibe `RUTA`/`MIME`).
3. Fila de `USUARIOS_APLICACIONES` con `USUARIO = USUARIO_TOKEN` e `ID_APLICACION = 'CAL-001'`:
   - sin fila → E03 "Sin acceso a CAL-001";
   - más de una fila (varias UN) → E04 (follow-up: elegir la UN).
4. **Regla única de UN:** `@ID_UN` = `ID_UN` de esa fila; **nunca** del JSON. Todas las lecturas y escrituras filtran `ID_UN = @ID_UN`, también las fotos (por la UN del registro dueño). Hoy todos los usuarios de CAL-001 están en `'00'`.
5. Permisos (NULL = 0):
   - `PUEDE_VER = ISNULL(LISTAR,0)=1 OR ISNULL(BUSCAR,0)=1`;
   - `PUEDE_CREAR = ISNULL(CREAR,0)=1`;
   - `ES_GESTOR = ISNULL(CONFIGURAR,0)=1` (DP-3; se asigna en ADM015, columna "OPC"). `MODIFICAR` no se usa.
6. **Sin `ES_GESTOR` todo registro guardado es de solo lectura, también los propios.** Excepciones (fase 2): el **creador** puede **agregar** a su registro (acción `agregar`, §2.3) y subir fotos (§2.4) mientras tenga `CREAR` y esté dentro de la ventana de **7 días** desde `FECHA_CREA` (`@DIAS_AGREGAR_CREADOR`, DP-A). Nunca quita ni baja nada; corregir o quitar sigue siendo del gestor (`update`).
7. **Reloj único:** al inicio del SP, `@AHORA = DATEADD(HOUR, -5, SYSUTCDATETIME())` (Colombia, UTC−5 fijo) y `@HOY = CAST(@AHORA AS DATE)`. Todas las reglas de fecha y todos los sellos (`FECHA_REGISTRO`, `FECHA_CREA`, `FECHA_MODIFICA`, `FECHA_RETIRA`, `LOG.FECHA`, la ventana de 24 h de fotos) usan esas dos variables.

### 1.2 Documento y numeración

- Documento `NCC` (`DOCUMENTOS`, UN `'00'`, `DOCUMENTOS_UN` `00 → 00`, `DOCUMENTOS_APLICACIONES` `CAL-001`), creado por el seed 42. Una sola numeración en la UN raíz (DP-6).
- `PREFIJO = ''` y `SUFIJO = ''` (no `'SIN'`).
- `DOCUMENTO` (texto que se muestra) = `N'NC' + DOCUMENTOS.SEPARADOR + RIGHT(REPLICATE('0', DIGITOS) + CAST(CONSECUTIVO AS NVARCHAR(10)), DIGITOS)` → `NC-0001`. Si el consecutivo tiene más dígitos que `DIGITOS`, se muestra completo.
- **Consecutivo (`new`):** `sp_getapplock @Resource = N'REGISTROS_NC|' + @ID_UN + N'|NCC', @LockMode = 'Exclusive', @LockOwner = 'Transaction'` → base = mayor entre `MAX(CONSECUTIVO)` de `REGISTROS_NC WITH (UPDLOCK, HOLDLOCK)` (misma UN y documento) y `TRY_CAST(DOCUMENTOS.NC_DOCUMENTO AS INT)` → `+1` → `INSERT` → `UPDATE DOCUMENTOS SET NC_DOCUMENTO = <nuevo>`. `UQ_RNC_DOC` es la barrera final. `DOCUMENTOS.INCREMENTO` no se usa. NCC `INACTIVO` (rollback 93 parcial) → E10.

### 1.3 Rutas y lista blanca (apiRest)

Cualquier `prmAccion` fuera de la lista de su ruta → **HTTP 400 sin llamar al SP**.

| Ruta | Acciones permitidas |
|---|---|
| `POST /api/CAL001N/consulta` | `causas`, `productos`, `partes producto`, `operarios`, `clientes`, `listas cliente`, `permisos`, `consulta`, `consulta registro`, `historial` |
| `POST /api/CAL001N/save` | `new`, `update`, `agregar` (fase 2) |
| `POST /api/CAL001N/foto-subir` | `foto agregar` (el `DATA_JSON` lo arma el controlador, §2.4) |
| `POST /api/CAL001N/foto` | `foto ruta` (el controlador lee el archivo y nunca devuelve `RUTA`) |
| `POST /api/CAL001N/foto-retirar` | `foto retirar` |

- `DATA_JSON` = solo los campos permitidos de la acción (columna "Entrada" de §2, copiados por nombre; el resto se descarta) + `identidadSp(req)` al final. **Fase 2:** en `agregar`, las claves de primer nivel `REGISTRO` y `MOTIVO` no se descartan en silencio: → **HTTP 400** `Campo no permitido en la petición: <campo>` sin llamar al SP. Las claves anidadas (`ID_PARTE_NC`, `ID_CAUSA_NC`, `ID_OPERARIO_NC`) llegan al SP, que responde E06. `ID_OPERACION` se copia en `new`, `update`, `agregar` y `foto agregar`; `consulta` admite además `ID_EMPLEADO` y `FECHA_BASE`.
- La conexión es la de `req.identidad.empresa` (como `sp.empresa(...)` en AGT001), nunca `prmConexion.EMPRESA`.
- El controlador **no** calcula permisos.
- Respuesta: `{ data, token: res.locals.newToken }`. En `/foto`: `{ data: { MIME, BASE64 }, token }`.

### 1.4 Precisiones de la implementación (F2)

Complementan las reglas de §2; los textos de error son los de §3.

- **Formato de entrada:** `DATA_JSON` debe ser un objeto (un arreglo u otro valor → E09). Las fechas de entrada (`FECHA_EVENTO`, `FECHA_RECLAMO`, `FECHA_DESDE`, `FECHA_HASTA`) deben venir exactamente como `yyyy-MM-dd`; otro formato → E12 (guardar) o E06 (consulta).
- **Rechazos adicionales con E06** (`Parámetro inválido: <campo>`):
  - `REGISTRO` que no es objeto; `PARTES`, `CAUSAS` u `OPERARIOS` que no son arreglos de objetos;
  - una causa con la clave `OCURRENCIAS`, con cualquier valor (también `null`, objeto o arreglo): las ocurrencias solo van dentro de un operario (ajuste 2);
  - `CANTIDAD_REFERENCIA` no numérica, negativa o que no cabe exacta en `DECIMAL(18,2)` (no se redondea);
  - `OBSERVACION` de más de 1000 caracteres, `MOTIVO` de más de 500 y `NOMBRE_ORIGINAL` de más de 260 (no se truncan);
  - `ID_REGISTRO_NC` o `ID_FOTO_NC` no numéricos.
- **E21:** `N_SERVICIO` que no se conserva igual en `VARCHAR(50)` (un carácter fuera de la página de códigos Latin-1) se rechaza; no se guarda alterado.
- **E22:** `update` sin `VERSION` también devuelve E22. Si el registro nunca se modificó, el mensaje usa `USUARIO_CREA` / `FECHA_CREA`.
- **E23:** en `new`, un `ID_REGISTRO_NC` no nulo en la raíz también es E23.
- **E08:** `foto retirar` de una foto ya retirada (o de otra UN) devuelve E08.
- **E10:** también si `DOCUMENTOS.NC_DOCUMENTO` de NCC no es numérico o está vacío (no se toma como 0).
- **E18 y proceso del operario:** sin `ID_SECCION` se usa la única sección `PRINCIPAL` activa del operario. Si tiene 0 o varias, `ID_SECCION` es obligatorio y, si falta, E18.
- **`ID_AREA_CAUSANTE`** (solo salida) = sección padre de la sección del operario (`SECCIONES.ANTERIOR = PAD.ITEM`). Aparece en cada elemento de `operarios.SECCIONES[]` y en cada operario de `consulta registro` (y del JSON del log).
- **XACT_ABORT y transacciones:** sin transacción del llamador, el SP abre la suya con `XACT_ABORT ON` desde el inicio (una cancelación del cliente no deja una transacción abierta en el pool) y la deshace ante cualquier rechazo. Con transacción del llamador (pruebas SQL con `INSERT … EXEC`), el SP no abre, no confirma y no hace `ROLLBACK` antes de escribir. Todas las validaciones ocurren antes de la primera escritura, y `XACT_ABORT` queda `OFF` hasta ella para que un rechazo no condene esa transacción. Un error de SQL después de escribir deshace toda la transacción.
- **Errores no previstos:** `Error interno (<número>)`. El detalle (número, línea y mensaje) sale como mensaje informativo (`RAISERROR` de severidad 10), para que el controlador lo registre.
- **Valores canónicos:** los códigos (`ID_PARTE`, `ID_CAUSA`, `ID_EMPLEADO`, `ID_SECCION`, `ID_CLIENTE`, `ID_CAUSA_CLIENTE`, área y fuente) se guardan como están en su maestro, aunque lleguen con otras mayúsculas.

## 2. Acciones

`(VER)`, `(CREAR)`, `(GESTOR)` = permiso exigido (§1.1). Sin ese permiso → E05.

### 2.1 Listas de apoyo (`/consulta`)

| prmAccion | Permiso | Entrada | DATOS (cada elemento con `ErrMensaje:""`) |
|---|---|---|---|
| `causas` | VER | `{}` | `[{ID_CAUSA, NOMBRE, DESCRIPCION, TIPO}]` de `CAUSAS` con `ID_UN=@ID_UN`, `ID_APLICACION='CAL-001'`, `ESTADO='ACTIVO'`, `TIPO IN ('PRODUCCION','CLIENTE')`, ordenadas por `TIPO, ID_CAUSA`. `DESCRIPCION` es la real (`CAUSAS.DESCRIPCION`, ajuste 4); si es NULL se devuelve `NOMBRE`. |
| `productos` | VER | `{TEXTO?, TOP?}` | `[{PRODUCTO, NOMBRE, SIN_PARTES}]`: PF activos (`PRODUCTO LIKE 'PF%'`, `ESTADO='ACTIVO'`), `TEXTO` busca en código y nombre (`LIKE '%texto%'`), `TOP` 1–50 (por omisión 50; fuera de rango → E06). `SIN_PARTES` = 1 si no tiene partes activas en `PRODUCTOS_PARTES`. |
| `partes producto` | VER | `{PRODUCTO}` | `[{PRODUCTO, SIN_PARTES, PARTES:[{ID_PARTE, ITEM_PRODUCTO_PARTE, NOMBRE, CANTIDAD}]}]`. PF inexistente o inactivo → E07. `SIN_PARTES=1` ⇒ `PARTES=[]` y el front ofrece "Producto completo" con `PIEZA` (DP-4). |
| `operarios` | VER | `{TEXTO?, TOP?}` | `[{ID_EMPLEADO, NOMBRE, ID_SECCION_SUGERIDA, SECCIONES:[{ID_SECCION, DESCRIPCION, PRINCIPAL}]}]`: empleados activos; secciones activas de `ITM_EMPLEADOS_SECCIONES` que existan activas en `SECCIONES`, la `PRINCIPAL` primero. `ID_SECCION_SUGERIDA` = la principal si hay exactamente una; si no, NULL (el inspector elige). `SECCIONES=[]` ⇒ el operario no se puede usar en Producción. `TOP` como en `productos`. |
| `clientes` | VER | `{TEXTO?, TOP?}` | `[{ID_CLIENTE, NOMBRE}]` activos. |
| `listas cliente` | VER | `{}` | `[{AREAS_DETECCION:[{ITEM, VALOR}], FUENTES:[{ITEM, VALOR}]}]` de `ITM_DOMINIOS` `CALIDAD/AREAS_DETECCION` y `CALIDAD/FUENTES` (`VALOR1`). No se replica la rama `PLATAFORMA` del Legacy. |
| `permisos` | — (exige la fila de §1.1) | `{}` | `[{PUEDE_VER, PUEDE_CREAR, ES_GESTOR}]` (0/1). Solo guía la UI. |

### 2.2 Consulta e historial (`/consulta`)

| prmAccion | Permiso | Entrada | DATOS |
|---|---|---|---|
| `consulta` | VER | `{FECHA_DESDE?, FECHA_HASTA?, FECHA_BASE?, ORIGEN?, PRODUCTO?, USUARIO_CREA?, ID_EMPLEADO?, DOCUMENTO?, PAGINA?, TAMANO?}` | `[{TOTAL, PAGINA, TAMANO, FILAS:[{ID_REGISTRO_NC, DOCUMENTO, ORIGEN, PRODUCTO, NOMBRE_PRODUCTO, FECHA_EVENTO, FECHA_REGISTRO, USUARIO_CREA, NOMBRE_USUARIO_CREA, AREA_USUARIO_CREA, USUARIO_MODIFICA, FECHA_MODIFICA, VERSION, ID_CLIENTE, NOMBRE_CLIENTE, N_PARTES, N_CAUSAS, CAUSAS, N_OPERARIOS, TOTAL_OCURRENCIAS, N_FOTOS}]}]` |
| `consulta registro` | VER | `{ID_REGISTRO_NC}` | ver abajo |
| `historial` | VER | `{ID_REGISTRO_NC}` | `[{VERSION, ACCION, USUARIO, FECHA, MOTIVO, DATOS_ANTES, DATOS_DESPUES}]` ordenado por `ID_LOG`; `DATOS_*` como objetos JSON (no texto). |

Reglas de `consulta`:
- Registros de **todos los usuarios** de `@ID_UN` (historia 9); SQL estático, sin SQL dinámico.
- `FECHA_DESDE` por omisión `DATEADD(DAY,-30,@HOY)`, `FECHA_HASTA` por omisión `@HOY`. `DESDE > HASTA` o rango mayor de 366 días → E06.
- **`FECHA_BASE`** (fase 2) ∈ {`EVENTO` (por omisión), `REGISTRO`}: decide sobre qué fecha se aplican `FECHA_DESDE`/`FECHA_HASTA` y el orden. "Mis reportes" usa `REGISTRO` + `USUARIO_CREA`. El filtro es **semiabierto** en las dos bases: `fecha >= DESDE AND fecha < DATEADD(DAY, 1, HASTA)` (así `FECHA_REGISTRO`, que es `DATETIME2`, incluye todo el día `HASTA`), aplicado igual en `TOTAL` y en `FILAS`. Otro valor → E06.
- `ORIGEN` ∈ {`PRODUCCION`,`CLIENTE`}; `PRODUCTO` y `USUARIO_CREA` exactos; `DOCUMENTO` acepta `NC-0001`, `0001` o `1` (compara `CONSECUTIVO`).
- **`ID_EMPLEADO`** (fase 2, DP-L): cédula exacta (≤ 20) de un operario del registro (`EXISTS` sobre `ITM_REGISTROS_NC_OPERARIOS`, también en `TOTAL`). **Solo el gestor**: sin `ES_GESTOR` → E05 `Sin permiso para filtrar por operario`. El front oculta el campo a los demás.
- `PAGINA` ≥ 1 (por omisión 1), `TAMANO` 1–100 (por omisión 50). Orden `FECHA_EVENTO DESC, ID_REGISTRO_NC DESC` (con `FECHA_BASE = REGISTRO`, primero `FECHA_REGISTRO DESC`), `OFFSET/FETCH`.
- **Columnas nuevas (fase 2):** `CAUSAS` = nombres **distintos** de las causas del registro separados por `, ` (`STRING_AGG` sobre `NVARCHAR(MAX)`, ordenados por nombre), **recortados a 400 caracteres** con `…` para la grilla; el Excel usa las causas completas de `consulta registro`. `NOMBRE_USUARIO_CREA` = `USUARIOS.NOMBRE` → `RS_EMPLEADOS_ID.NOMBRE_COMPLETO` (de `@ID_UN`) → el código. `AREA_USUARIO_CREA` (DP-D) = descripción de la sección **padre** de la sección `PRINCIPAL` activa del empleado en `@ID_UN` (si no hay padre, la sección; sin sección → `null`).

`consulta registro` devuelve (registro de otra UN o inexistente → E08):

```json
[{
  "ErrMensaje": "",
  "REGISTRO": { "ID_REGISTRO_NC": 1, "DOCUMENTO": "NC-0001", "ORIGEN": "PRODUCCION", "PRODUCTO": "PF...", "NOMBRE_PRODUCTO": "",
                "CANTIDAD_REFERENCIA": null, "FECHA_EVENTO": "2026-10-26", "FECHA_REGISTRO": "2026-10-26T09:15:00",
                "OBSERVACION": "", "ID_CLIENTE": null, "NOMBRE_CLIENTE": null, "N_SERVICIO": null, "ID_AREA_DETECCION": null,
                "FUENTE": null, "FECHA_RECLAMO": null, "ID_CAUSA_CLIENTE": null, "NOMBRE_CAUSA_CLIENTE": null,
                "ESTADO": "REGISTRADO", "USUARIO_CREA": "", "FECHA_CREA": "", "USUARIO_MODIFICA": null, "FECHA_MODIFICA": null,
                "VERSION": 1 },
  "PARTES": [ { "ID_PARTE_NC": 10, "ITEM": 1, "ID_PARTE": "PA...", "ITEM_PRODUCTO_PARTE": 1, "NOMBRE_PARTE": "", "PIEZA": null,
                "CAUSAS": [ { "ID_CAUSA_NC": 20, "ID_CAUSA": "NC-01", "NOMBRE": "", "DESCRIPCION": "",
                              "OPERARIOS": [ { "ID_OPERARIO_NC": 30, "ID_EMPLEADO": "", "NOMBRE": "", "OCURRENCIAS": 2,
                                               "ID_SECCION": "", "DESCRIPCION_SECCION": "" } ] } ] } ],
  "FOTOS": [ { "ID_FOTO_NC": 5, "NOMBRE_ORIGINAL": "", "MIME": "image/jpeg", "USUARIO_CREA": "", "FECHA_CREA": "" } ],
  "HISTORIAL": [ { "VERSION": 1, "ACCION": "CREAR", "USUARIO": "", "FECHA": "" } ],
  "PUEDE_MODIFICAR": 0, "PUEDE_AGREGAR": 1, "AGREGAR_HASTA": "2026-11-02T09:15:00",
  "PUEDE_AGREGAR_FOTOS": 1, "PUEDE_RETIRAR_FOTOS": 0,
  "NOMBRE_USUARIO_CREA": "Edgardo Alcazar", "AREA_USUARIO_CREA": "Producción"
}]
```

- `FOTOS` solo las `ACTIVO`, **sin `RUTA`**.
- `PUEDE_MODIFICAR = ES_GESTOR`; `PUEDE_RETIRAR_FOTOS = ES_GESTOR`.
- **Fase 2:** `PUEDE_AGREGAR` = 1 si `USUARIO_CREA = USUARIO_TOKEN`, `PUEDE_CREAR = 1` y `@AHORA < AGREGAR_HASTA`; `AGREGAR_HASTA = DATEADD(DAY, 7, FECHA_CREA)` (se muestra "puedes agregar hasta …"). `PUEDE_AGREGAR_FOTOS = ES_GESTOR OR PUEDE_AGREGAR` (regla de §2.4). `NOMBRE_USUARIO_CREA` y `AREA_USUARIO_CREA` como en `consulta`.
- El historial resumido no trae antes/después (DP-10); el detalle sale de `historial`.

### 2.3 Guardar (`/save`)

Entrada (claves exactas; en `new` los `ID_*_NC` van `null` o se omiten; `ITEM` de partes lo asigna el SP por el orden del arreglo):

```json
{
  "ID_REGISTRO_NC": 1, "VERSION": 1, "MOTIVO": "",
  "REGISTRO": { "ORIGEN": "PRODUCCION", "PRODUCTO": "PF...", "CANTIDAD_REFERENCIA": null, "FECHA_EVENTO": "2026-10-26",
                "OBSERVACION": "", "ID_CLIENTE": null, "N_SERVICIO": null, "ID_AREA_DETECCION": null, "FUENTE": null,
                "FECHA_RECLAMO": null, "ID_CAUSA_CLIENTE": null },
  "PARTES": [ { "ID_PARTE_NC": null, "ID_PARTE": "PA...", "ITEM_PRODUCTO_PARTE": 1, "PIEZA": null,
                "CAUSAS": [ { "ID_CAUSA_NC": null, "ID_CAUSA": "NC-01",
                              "OPERARIOS": [ { "ID_OPERARIO_NC": null, "ID_EMPLEADO": "", "OCURRENCIAS": 2, "ID_SECCION": "" } ] } ] } ]
}
```

`ID_REGISTRO_NC`, `VERSION` y `MOTIVO` solo en `update` (`ID_REGISTRO_NC` y `VERSION` también en `agregar`). Los textos vacíos se normalizan a NULL (`NULLIF(TRIM(x), '')`). **`ID_OPERACION`** (GUID, §2.5) en las tres acciones; desde el web de fase 2 se envía **siempre**.

| prmAccion | Permiso | DATOS |
|---|---|---|
| `new` | CREAR; además GESTOR si `ORIGEN='CLIENTE'` | `[{ErrMensaje:"", ID_REGISTRO_NC, ID_DOCUMENTO:"NCC", CONSECUTIVO, DOCUMENTO, VERSION:1, FECHA_REGISTRO, REPETIDA:0}]`. Inserta encabezado (`ESTADO='REGISTRADO'`, `USUARIO_CREA=USUARIO_TOKEN`, `FECHA_CREA=FECHA_REGISTRO=@AHORA`) e hijos; log `CREAR` (`DATOS_ANTES` NULL, `DATOS_DESPUES` = registro completo). |
| `update` | GESTOR | `[{ErrMensaje:"", ID_REGISTRO_NC, DOCUMENTO, VERSION, REPETIDA:0}]` con `VERSION+1`, `USUARIO_MODIFICA=USUARIO_TOKEN`, `FECHA_MODIFICA=@AHORA`; log `MODIFICAR` con antes/después completos y `MOTIVO`. `USUARIO_CREA`, `FECHA_CREA`, `FECHA_REGISTRO`, UN y documento no cambian (además lo impide `TR_REGISTROS_NC_INMUTABLE`). |
| `agregar` (fase 2) | **creador** (`USUARIO_CREA = USUARIO_TOKEN`) con CREAR y `@AHORA < FECHA_CREA + 7 días`; si no → E05 `Sin permiso para agregar a este registro` | `[{ErrMensaje:"", ID_REGISTRO_NC, DOCUMENTO, VERSION, REPETIDA:0}]` con `VERSION+1`, `USUARIO_MODIFICA`, `FECHA_MODIFICA`; log `AGREGAR` (antes/después completos, `MOTIVO` NULL, `ID_OPERACION`). Ver "Acción `agregar`" más abajo. |

**Acción `agregar` (fase 2):** entrada `{ID_REGISTRO_NC, VERSION, ID_OPERACION, PARTES:[{ID_PARTE, ITEM_PRODUCTO_PARTE, PIEZA?, CAUSAS:[{ID_CAUSA, OPERARIOS:[{ID_EMPLEADO, OCURRENCIAS, ID_SECCION?}]}]}]}` = **solo lo nuevo (delta)**. Si aparecen `REGISTRO` o `MOTIVO` en la raíz, o `ID_PARTE_NC`/`ID_CAUSA_NC`/`ID_OPERARIO_NC` a cualquier profundidad → E06 `Parámetro inválido: <clave>` (el controlador ya devuelve 400 para `REGISTRO`/`MOTIVO`). El SP carga el árbol actual desde la BD y **fusiona** el delta por claves naturales: parte por `ID_PARTE` + `ITEM_PRODUCTO_PARTE` ("Producto completo" por `PIEZA`); causa por `ID_CAUSA` dentro de su parte; operario por `ID_EMPLEADO` dentro de su causa, **sumando** `OCURRENCIAS` (total ≤ 999 → si no, E18) y conservando el `ID_SECCION` guardado. Las filas nuevas van con `ITEM = MAX + 1`; las existentes conservan `ITEM` e IDs. Las Reglas 4-6 de "maestro activo" se aplican **solo a las filas nuevas** (un operario retirado o una causa inactivada después no bloquean); las estructurales (repetidos, 1-999, E13, límites E24) al árbol resultante. El **encabezado no cambia** (ni pasa por las Reglas 1-3 ni 8: un PF o un cliente inactivados después no bloquean). Delta sin nada nuevo → E13. `VERSION` distinta de la actual → E22. **Por construcción no puede borrar ni bajar nada.**

Validaciones (`new` y `update`; la primera que falla devuelve su `ErrMensaje`):
1. `ORIGEN` ∈ {`PRODUCCION`,`CLIENTE`} (`MATERIALES`/`NORMAS` → E11); `CLIENTE` sin `ES_GESTOR` → E05.
2. `PRODUCTO` es PF (`LIKE 'PF%'`) activo de `@ID_UN` → si no, E07. `CANTIDAD_REFERENCIA` NULL o ≥ 0.
3. `FECHA_EVENTO` **opcional (fase 2)**: en `new`, vacía o ausente → `@HOY` (hoy en Colombia); en `update`, ausente → se conserva la actual. Si viene: formato `yyyy-MM-dd` y `≤ @HOY`, si no → E12 (el texto de E12 no cambia). `FECHA_RECLAMO` `≤ @HOY` → E12.
4. ≥ 1 parte; cada parte con ≥ 1 causa (E13). `ID_PARTE` + `ITEM_PRODUCTO_PARTE` pertenecen a las partes activas del PF; `ID_PARTE` NULL solo si el PF no tiene partes y `PIEZA` viene llena (E14). `PIEZA` ≤ 50 caracteres: si no, E15 (**no se trunca**). Sin partes repetidas (E16).
5. Cada causa existe en `CAUSAS` (`@ID_UN`, `CAL-001`, `TIPO='PRODUCCION'`, `ACTIVO`) y no se repite en su parte (E17).
6. Cada operario existe y está activo en `EMPLEADOS` de `@ID_UN`; `OCURRENCIAS` entero 1–999; no se repite en su causa; `ID_SECCION` es una sección activa suya (E18).
7. **Producción:** cada causa con ≥ 1 operario (E19); datos de cliente vacíos (E20).
8. **Cliente:** operarios opcionales (sin operario no hay ocurrencias: ajuste 2); `ID_CLIENTE` (activo de `@ID_UN`), `N_SERVICIO`, `ID_AREA_DETECCION` (valor de `CALIDAD/AREAS_DETECCION`), `FUENTE` (valor de `CALIDAD/FUENTES`), `FECHA_RECLAMO` y `ID_CAUSA_CLIENTE` (`CAUSAS` `CAL-001` `TIPO='CLIENTE'` activa) obligatorios y válidos (E21). Además `LEN(FUENTE) ≤ 150`, `LEN(ID_AREA_DETECCION) ≤ 150` y `LEN(N_SERVICIO) ≤ 50` antes de insertar → E21 (los dominios admiten 200 caracteres y las columnas 150; no se trunca). Validación a cargo del SP 41 (F2, hallazgo B2).
9. `update`: el registro existe en `@ID_UN` (E08); `VERSION` = la actual, leída con `UPDLOCK` (si no, E22 "Modificado por {USUARIO_MODIFICA} el {FECHA_MODIFICA}; recargue"); todo `ID_PARTE_NC`/`ID_CAUSA_NC`/`ID_OPERARIO_NC` que viene pertenece a este registro y a su padre en el JSON (E23). En `new`, cualquier `ID_*_NC` no nulo → E23.
10. Límites: ≤ 50 partes, ≤ 20 causas por parte, ≤ 30 operarios por causa (E24).

**Merge en `update` (los IDs de las filas que siguen son estables):** actualiza las filas que vienen con ID, inserta las que vienen sin ID y borra las que ya no vienen **en el orden operarios → causas → partes** (las FK no tienen cascada). `ITEM` de partes se renumera por el orden del arreglo. El `ITEM` de la vista `V_CALIDAD_NC` (F5) sale de estos IDs (`10000000 + ID_OPERARIO_NC`, `20000000 + ID_CAUSA_NC`).

**Concurrencia:** `new` con el applock de §1.2; `update` con `UPDLOCK, HOLDLOCK` del encabezado + `VERSION`. Recurso no obtenido en 10 s → E25.

### 2.4 Fotos

| prmAccion | Ruta | Permiso | Entrada | DATOS |
|---|---|---|---|---|
| `foto agregar` | `/foto-subir` | regla de fotos | `{ID_REGISTRO_NC, NOMBRE_ORIGINAL, EXTENSION, ID_OPERACION?}` (los arma el controlador) | `[{ErrMensaje:"", ID_FOTO_NC, RUTA, MIME, REPETIDA:0}]`; repetida: `[{…, ID_FOTO_NC, RUTA, MIME, ESTADO, REPETIDA:1}]` (§2.5) |
| `foto retirar` | `/foto-retirar` | GESTOR | `{ID_FOTO_NC, MOTIVO?}` | `[{ErrMensaje:"", ID_FOTO_NC, ESTADO:"RETIRADO"}]` |
| `foto ruta` | `/foto` | VER | `{ID_FOTO_NC}` | `[{ErrMensaje:"", RUTA, MIME}]` solo si la foto está `ACTIVO` y su registro es de `@ID_UN` (si no, E08) |

**Regla de fotos:**
- Agregar: el gestor siempre; el **creador** (`USUARIO_CREA = USUARIO_TOKEN`) con `PUEDE_CREAR` y `@AHORA < DATEADD(DAY, 7, FECHA_CREA)` (fase 2, DP-A; antes era `VERSION = 1` y 24 h). Otro caso → E05. Máximo 10 fotos `ACTIVO` por registro: la 11.ª → E26 (se cuenta bajo `UPDLOCK` del encabezado). El SP no conoce el modo de edición del front: que las fotos solo se suban en Nuevo / Modificar / Agregar (C5) lo decide el web.
- Retirar: solo el gestor.
- `EXTENSION` ∈ {`jpg`,`png`,`webp`} (E27); la detecta el controlador por los bytes mágicos. El SP fija `MIME` (`image/jpeg`, `image/png`, `image/webp`) y genera `RUTA = <ID_UN>/<yyyy de @AHORA>/<ID_REGISTRO_NC>/<NEWID() en minúsculas>.<ext>`. `NOMBRE_ORIGINAL` se guarda solo como texto (≤ 260; vacío → `foto.<ext>`); nunca entra en la ruta.
- BD: `CK_RNCF_RUTA` rechaza `..`, `:`, `\` y `/` inicial; `UQ_RNCF_RUTA` impide duplicados.
- Log: `FOTO_AGREGAR` / `FOTO_RETIRAR` con la `VERSION` vigente del encabezado (las fotos **no** suben la versión). El JSON del log lleva `ID_FOTO_NC, NOMBRE_ORIGINAL, MIME, ESTADO` y **nunca `RUTA`**. `foto retirar` llena `USUARIO_RETIRA`/`FECHA_RETIRA`.

**Flujo del controlador (F3):** decodifica el base64 (> 3 MB → 413), valida bytes mágicos (si no → 415), escribe `<RAIZ>/_tmp/<uuid>.tmp`, llama `foto agregar`; si hay `ErrMensaje` borra el `.tmp`; si no, exige que `path.resolve(RAIZ, RUTA)` quede dentro de `RAIZ` (si no → 500 por fallo de integridad y borra el `.tmp`) y hace `rename`. `RAIZ` = `<RUTA_ARCHIVOS_CAL001>/<EMPRESA del token>` (§6.2), fuera de `/img`. `foto` aplica la misma comprobación de prefijo antes de leer. Detalle vigente en §6.

### 2.5 Idempotencia por `ID_OPERACION` (fase 2)

La red móvil y el navegador reintentan; cada escritura debe poder repetirse sin duplicar.

- `ID_OPERACION` es un **GUID** (36 caracteres) que genera el cliente **una sola vez por operación** y reutiliza en todos los reintentos de esa misma operación (`crypto.randomUUID()` en el web). Lo admiten `new`, `update`, `agregar` y `foto agregar`. **Desde el web de fase 2 es obligatorio** (el front no envía ninguna de esas acciones sin él); el SP tolera su ausencia solo para clientes anteriores al cambio, sin idempotencia (follow-up: retirar la tolerancia al desplegar F3 en producción). Si viene y no es un GUID → E06 `Parámetro inválido: ID_OPERACION`.
- Cada escritura deja exactamente una fila en `LOG_REGISTROS_NC` con su `ID_OPERACION` (`UQ_LRNC_OPERACION`, único filtrado). El log es el registro de operaciones.
- **Coincidencia:** si el `ID_OPERACION` ya está en el log con el mismo `USUARIO`, la misma `ACCION` del log (`CREAR` ↔ `new`, `MODIFICAR` ↔ `update`, `AGREGAR` ↔ `agregar`, `FOTO_AGREGAR` ↔ `foto agregar`) y, salvo en `new`, el mismo `ID_REGISTRO_NC`, el SP **no escribe** y devuelve el resultado original con **`REPETIDA: 1`**: `new` → `ID_REGISTRO_NC`, `ID_DOCUMENTO`, `CONSECUTIVO`, `DOCUMENTO`, `VERSION`, `FECHA_REGISTRO`; `update`/`agregar` → `ID_REGISTRO_NC`, `DOCUMENTO`, `VERSION` (la de esa fila del log); `foto agregar` → `ID_FOTO_NC`, `RUTA`, `MIME`, `ESTADO` (`RUTA` y `ESTADO` son solo para el controlador, §6.2). Si el ID existe con **otro usuario, otra acción u otro registro** → E06 `Parámetro inválido: ID_OPERACION`.
- **El mismo ID con otro payload** (misma acción y registro) devuelve el resultado original y **no aplica el payload nuevo**: el ID identifica la operación, no su contenido. El cliente debe generar un ID nuevo por cada operación distinta.
- **Orden:** la búsqueda va inmediatamente después de E00, E09/E02 y E01/E03/E04, y **antes de** permisos (E05, incluida la ventana de 7 días), E22 (`VERSION`), E13, E24, E26 y la validación de datos. Así un reintento de una operación ya aplicada nunca recibe un rechazo causado por su propio efecto. En `update`, `agregar` y `foto agregar` la búsqueda **se repite bajo el `UPDLOCK, HOLDLOCK` del encabezado**, antes de E22/E05/E26: si el primer intento confirmó mientras el reintento esperaba el bloqueo, el reintento recibe `REPETIDA`, no E22. **Un E22 es siempre un conflicto real** (otro usuario modificó el registro).
- **Carrera** (dos llamadas simultáneas con el mismo ID): la segunda choca con `UQ_LRNC_OPERACION`. Sin transacción del llamador (apiRest) el SP deshace la suya, relee el log y responde el resultado de la primera con `REPETIDA: 1`; con transacción del llamador (pruebas) responde E25.
- Las respuestas normales llevan `REPETIDA: 0`.

## 3. Catálogo de errores (`ErrMensaje`)

Los textos son estables: las pruebas de F2 y F3 los comparan por prefijo.

| Código | Texto |
|---|---|
| E00 | `Acción no válida: <accion>` |
| E01 | `Falta la identidad del token (USUARIO_TOKEN / EMPRESA_TOKEN)` |
| E02 | `Campo no permitido en la petición: <campo>` |
| E03 | `Sin acceso a CAL-001` |
| E04 | `Usuario con varias UN en CAL-001; no soportado` |
| E05 | `Sin permiso para <operación>` (fase 2: `… agregar a este registro`, `… filtrar por operario`) |
| E06 | `Parámetro inválido: <campo>` (fase 2: también `ID_OPERACION`, `FECHA_BASE`, `ID_EMPLEADO`, y en `agregar` `REGISTRO`, `MOTIVO`, `ID_PARTE_NC`, `ID_CAUSA_NC`, `ID_OPERARIO_NC`) |
| E07 | `El producto <PRODUCTO> no es un PF activo` |
| E08 | `El registro no existe` (también para otra UN; no se revela que exista) |
| E09 | `JSON inválido` |
| E10 | `El documento NCC no está activo` |
| E11 | `Origen no válido: <ORIGEN>` |
| E12 | `La fecha <campo> es obligatoria y no puede ser posterior a hoy` |
| E13 | `Cada registro necesita al menos una parte y cada parte al menos una causa` |
| E14 | `La parte <ID_PARTE> no pertenece al producto <PRODUCTO>` / `Producto completo requiere Pieza` |
| E15 | `La pieza supera 50 caracteres` |
| E16 | `Parte repetida: <ID_PARTE>` |
| E17 | `Causa no válida o repetida: <ID_CAUSA>` |
| E18 | `Operario no válido, repetido o con sección ajena: <ID_EMPLEADO>` / `Ocurrencias deben ser de 1 a 999` |
| E19 | `En Producción cada causa necesita al menos un operario` |
| E20 | `Un registro de Producción no lleva datos de cliente` |
| E21 | `Falta o no es válido el dato de cliente: <campo>` |
| E22 | `Modificado por <USUARIO_MODIFICA> el <FECHA_MODIFICA>; recargue` |
| E23 | `Identificador de detalle no válido: <campo> <valor>` |
| E24 | `Se superó el límite de <partes/causas/operarios>` |
| E25 | `Recurso ocupado; intente de nuevo` |
| E26 | `Máximo 10 fotos activas por registro` |
| E27 | `Extensión de foto no permitida: <EXTENSION>` |
| E99 | `Error interno (<número>)` para errores no previstos de SQL; el detalle va al log del servidor, no al cliente |
| E90 | `E90 Fuera de la red de la empresa` (HTTP 403, lo emite el middleware `soloRedInterna`, §6.6; solo para `X-Xtein-Cliente: movil`) |

## 4. Efecto sobre el Legacy: primeras FK hacia maestros

`FK_RNC_PRODUCTO`, `FK_RNC_CLIENTE` y `FK_RNCO_EMPLEADO` son las **primeras FK de ARTDECON hacia `PRODUCTOS`, `CLIENTES` y `EMPLEADOS`** (verificado en F1: no había ninguna). Desde que exista un registro NC, el Legacy y cualquier proceso **no podrán borrar físicamente** un PF, un cliente o un empleado que aparezca en una NC (error 547). Inactivar (`ESTADO`) sigue funcionando. Si una pantalla del Legacy borra maestros, mostrará ese error; la salida es inactivar, no quitar la FK.

## 5. Fuera de este contrato

- La vista de compatibilidad `V_CALIDAD_NC` y el cambio de `spPlanAccion 'HISTORIAL'` (F5).
- El alta de menú y microfrontend (`MICROFRONTENDS` `MFE-CAL`, `APLICACIONES.MICROFRONTEND_ID`, `APLICACIONES_ASOCIADAS`, `USUARIOS_APL_ASO`): seed 43 (F4).
- DP-1 está cerrada (plan §10.1): la bonificación se calcula a mano desde el Excel; no cambia este contrato.
- **Follow-up (F4, exportación):** hoy la exportación de Consulta pide `consulta` página a página y luego `consulta registro` por cada registro (4 en paralelo; si uno falla se corta). Conviene una acción de solo lectura en el SP, p. ej. `exportar`, que devuelva en una sola llamada las filas por operario y causa del mismo filtro de `consulta` (documento, fecha del evento, producto, parte, causa, operario, proceso, ocurrencias), con su lista blanca en `/consulta`.

## 6. CAL-001 F3 — rutas apiRest (implementación)

Archivos: `src/routes/CAL001N.routes.js` (Swagger en `/api-docs`, etiqueta "CAL001N - No Conformidades"), `src/controllers/CAL001N/CAL001N.controller.js`, `src/controllers/CAL001N/fotos.js`, registro en `src/app.js` (`app.use(CAL001N)`; rollback: quitar esa línea), `scripts/limpiar-fotos-cal001.mjs` y `src/tests/CAL001N.test.js`.

### 6.1 Comportamiento del controlador

- Middleware: `authMiddleware` de `src/middleware/session.js` (`req.identidad = {usuario, empresa}`; token vencido renovable → `res.locals.newToken`). Todas las respuestas, también los rechazos, llevan `token` cuando hubo renovación.
- Lista blanca de §1.3 en `ACCIONES_POR_RUTA` (comparación exacta de `prmAccion`). Otra acción → 400 `Acción no válida: <accion>` sin llamar al SP.
- Campos prohibidos: `USUARIO`, `ID_UN`, `ES_GESTOR`, `PUEDE_*` (cualquier clave que empiece así), `RUTA`, `MIME`, `USUARIO_TOKEN`, `EMPRESA_TOKEN`, **a cualquier profundidad** de `prmDatos` y sin distinguir mayúsculas → 400 `Campo no permitido en la petición: <campo>` sin llamar al SP. El SP repite la validación en la raíz y en `REGISTRO` (E02).
- `DATA_JSON` = campos de la acción (copiados por nombre; `REGISTRO` y `PARTES` se pasan tal cual para que el SP aplique sus validaciones de forma, §1.4) + `USUARIO_TOKEN`/`EMPRESA_TOKEN` al final. En `new` también se copia `ID_REGISTRO_NC`, para que el SP lo rechace con E23 si no es nulo. La BD es la de `req.identidad.empresa` (`getConnectionEmpresaEstricta`); `prmConexion` y `prmTokenDatos.USUARIO/EMPRESA` del body se ignoran.
- SP: `@ACCION NVARCHAR(50)`, `@DATA_JSON NVARCHAR(MAX)`. Los mensajes informativos del SP (detalle de E99) se escriben en el log del servidor (`[CAL001N] <accion>: ...`).
- Respuesta: `{ data: "<DATOS>", token }`. Errores de negocio del SP → HTTP 200 con `[{ErrMensaje}]`. BD no disponible o SP inexistente en esa BD (error 2812) → 503; excepción no prevista → 500 `Error interno del servidor`. Rechazos del controlador: `{ data: "[{ErrMensaje}]", error, token }`.
- `prmAccion` debe ser un texto idéntico al de la lista (sin espacios, sin cambiar mayúsculas); un arreglo, objeto o `null` → 400. Las listas blancas están congeladas en profundidad (`Object.freeze`).
- Errores de body-parser en `/api/CAL001N/*` (manejador `erroresCal001n`, registrado al final de `src/app.js`): cuerpo > 5 MB → 413 `La foto supera el tamaño máximo de 3 MB`; JSON malformado → 400 `Petición inválida`; ambos en JSON, sin stack, con `token` si existiera. Para cualquier otra ruta el manejador hace `next(err)` y el comportamiento no cambia.
- Ninguna respuesta lleva `RUTA`: se quita de lo que devuelva el SP a cualquier profundidad.

### 6.2 Fotos

- `RUTA_ARCHIVOS_CAL001` (`.env`, documentada en `.env.example`): carpeta base, fuera de `/img`. Si falta → 500 `El almacenamiento de fotos no está configurado`, sin llamar al SP.
- **Raíz efectiva por empresa:** `RAIZ = <RUTA_ARCHIVOS_CAL001>/<EMPRESA>`, con `EMPRESA` = `req.identidad.empresa` validada contra `^[A-Za-z0-9_-]+$` (si no cumple → 500 genérico, sin llamar al SP). Estructura en disco: `<RUTA_ARCHIVOS_CAL001>/<EMPRESA>/<ID_UN>/<yyyy>/<ID_REGISTRO_NC>/<guid>.<ext>`. La `RUTA` de la BD **sigue siendo relativa a la raíz de la empresa** (`<ID_UN>/<yyyy>/<ID_REGISTRO_NC>/<guid>.<ext>`). Ojo: `00` y `PROD` apuntan a la misma BD (ARTDECON) pero a carpetas distintas; una foto subida con un token de `PROD` no se encuentra con uno de `00` (404).
- **Cupo:** máximo 4 subidas simultáneas por proceso (`MAX_SUBIDAS_SIMULTANEAS`); la quinta → 429 con `ErrMensaje` y `token`.
- **Filtro previo de permisos:** antes de decodificar y de escribir, `/foto-subir` llama al SP `permisos`. Con `ErrMensaje` lo devuelve; sin `PUEDE_CREAR` ni `ES_GESTOR` → `[{ErrMensaje:"Sin permiso para agregar fotos"}]` (HTTP 200). La regla completa (creador, 24 h, 10 fotos) la vuelve a aplicar el SP en `foto agregar`.
- **Enlaces:** antes de escribir (carpeta `_tmp` y carpeta de destino) y antes de leer (el archivo), se repite la comprobación de prefijo con `fs.realpath` contra el `realpath` de la raíz; un enlace simbólico o junction hacia fuera → 500.
- `/foto-subir`, `prmDatos = {ID_REGISTRO_NC, NOMBRE_ORIGINAL, BASE64}` (BASE64 con o sin prefijo `data:...;base64,`): BASE64 ausente o mal formado → 400; > 3 MB decodificados → 413 (se calcula antes de decodificar); bytes mágicos distintos de JPEG/PNG/WEBP → 415 (el tipo declarado se ignora). Luego `<RAIZ>/_tmp/<uuid>.tmp` → SP `foto agregar` con `{ID_REGISTRO_NC, NOMBRE_ORIGINAL, EXTENSION}` → `ErrMensaje` ⇒ se borra el `.tmp` y se devuelve el error (200) → `RUTA` fuera de la raíz (`path.resolve(RAIZ, RUTA)` no empieza por `RAIZ + path.sep`) ⇒ 500 por fallo de integridad (se registra) y se borra el `.tmp` → `mkdir` + `realpath` + `rename`. Respuesta `[{ErrMensaje:"", ID_FOTO_NC, MIME}]`.
- **Si el `rename` falla** (o la `RUTA` sale de la raíz) la fila ya quedó `ACTIVO` en la BD sin archivo: el controlador borra el `.tmp` y responde 500. Esa fila cuenta para el límite de 10 fotos hasta que el gestor la retire; el script de limpieza la reporta como `[REVISAR]`. No se borra la fila desde el controlador (no hay acción para eso y el SP ya hizo `COMMIT`).
- `/foto`: SP `foto ruta` → misma comprobación de prefijo, también con `realpath` (fuera → 500 sin leer) → archivo inexistente → 404 → `{ data: { MIME, BASE64 }, token }`. Un error de negocio del SP se devuelve como `data: "[{ErrMensaje}]"` (cadena, HTTP 200).
- `/foto-retirar`: retiro lógico en el SP; el archivo se conserva.

### 6.3 Limpieza de huérfanos

`node scripts/limpiar-fotos-cal001.mjs [--empresa 00] [--confirmar]` desde la raíz de apiRest (lee su `.env`). Trabaja sobre `<RUTA_ARCHIVOS_CAL001>/<EMPRESA>` (misma validación de `EMPRESA`). Solo hace `SELECT` (`ITM_REGISTROS_NC_FOTOS` y las `ID_UN` de `USUARIOS_APLICACIONES` de `CAL-001`).
- **Orden:** primero lista los archivos y después lee las filas. El controlador inserta la fila antes de mover el archivo, así que un archivo listado ya tiene su fila en el `SELECT` posterior.
- `[BORRABLE]`: `.tmp` de más de 24 h, y archivos sin ninguna fila que tengan más de 24 h y cuya primera carpeta sea una `ID_UN` conocida (de las filas o de `USUARIOS_APLICACIONES`).
- `[INFO]`: archivos sin fila de menos de 24 h y archivos de fotos `RETIRADO` (se conservan).
- `[REVISAR]`: archivos sin fila fuera de una carpeta de `ID_UN` conocida, filas `ACTIVO` sin archivo y filas con `RUTA` fuera de la raíz. No se tocan.
- Si la tabla no devuelve filas pero hay archivos → `[ABORTADO]`, sin borrar nada (código de salida 1).
- Con `--confirmar` borra solo los `[BORRABLE]` y solo si la ruta resuelta queda dentro de la raíz. Ejecución programada sugerida (DP-8): diaria, primero en seco.

### 6.4 Pruebas

- Unitarias sin BD: `node --test src/tests/CAL001N.test.js` (o `npm test`). Simulan `spNc.ejecutar` y usan una raíz temporal.
- Manual en dev (con un token real del login, `<jwt>`):

```bash
API=https://<servidor-dev>/api   # o http://localhost:5900/api
curl -s -X POST "$API/CAL001N/consulta" -H 'Content-Type: application/json' \
  -d '{"prmAccion":"permisos","prmDatos":"{}","prmTokenDatos":{"TOKEN":"<jwt>"}}'
curl -s -X POST "$API/CAL001N/consulta" -H 'Content-Type: application/json' \
  -d '{"prmAccion":"update","prmDatos":"{}","prmTokenDatos":{"TOKEN":"<jwt>"}}'          # → 400
B64=$(base64 -w0 foto.jpg)
curl -s -X POST "$API/CAL001N/foto-subir" -H 'Content-Type: application/json' \
  -d "{\"prmAccion\":\"foto agregar\",\"prmDatos\":{\"ID_REGISTRO_NC\":1,\"NOMBRE_ORIGINAL\":\"foto.jpg\",\"BASE64\":\"$B64\"},\"prmTokenDatos\":{\"TOKEN\":\"<jwt>\"}}"
curl -s -X POST "$API/CAL001N/foto" -H 'Content-Type: application/json' \
  -d '{"prmAccion":"foto ruta","prmDatos":"{\"ID_FOTO_NC\":1}","prmTokenDatos":{"TOKEN":"<jwt>"}}'
```

En Postman: `POST`, cuerpo raw JSON con `prmAccion`, `prmDatos` (texto JSON u objeto) y `prmTokenDatos.TOKEN`.

### 6.6 Red interna para la app móvil (fase 2, plan §4.0 y §6.8b)

`src/middleware/soloRedInterna.js`, aplicado a `/api/CAL001N/*` y a `/api/usuarioLogin`:
- Si la petición trae la cabecera **`X-Xtein-Cliente: movil`** (la envía la app en todas sus llamadas) y `req.ip` no cae en ningún rango de **`RED_INTERNA_CIDR`** (`.env`, lista CIDR separada por comas, IPv4 o IPv6; una IPv4 mapeada en IPv6 se compara como IPv4) → **403** `{ ErrMensaje: "E90 Fuera de la red de la empresa" }` sin llamar al SP ni escribir nada.
- Sin la cabecera (web) o con otro valor, nada cambia.
- `RED_INTERNA_CIDR` vacío → el middleware deja pasar y registra un aviso al arrancar (`[soloRedInterna] RED_INTERNA_CIDR vacío…`).
- `req.ip` solo confía en el proxy interno indicado en **`TRUST_PROXY`** (`app.set('trust proxy', …)`); sin la variable no se confía en `X-Forwarded-For`.
- Los rangos los entrega TI (DP-P). Pruebas en `src/tests/CAL001N.test.js` (IP dentro pasa, fuera 403, sin cabecera pasa, vacío pasa, parseo de CIDR).

### 6.5 Follow-ups (no se hacen en F3)

- **B4, archivos políglotas:** la validación es solo por bytes mágicos, así que un archivo que empieza como JPEG/PNG/WEBP puede llevar otro contenido detrás. Hoy se mitiga porque la foto nunca se sirve como archivo estático ni con `<img src>` directo, sino como base64 dentro del JSON. Pendiente: re-codificar la imagen en el servidor o validarla con un decodificador.
- **B8, `npm audit`:** revisar las vulnerabilidades de las dependencias del repo en un cambio aparte (no es propio de CAL-001).
