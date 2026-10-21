# Contrato `spRemision` — VEN-210 Remisiones

Contrato vinculante entre el front (`apps/mfe-mcom`, aplicación `VEN-210`) y el procedimiento almacenado `spRemision` (aún por escribir), vía las rutas de apiRest `POST /api/VEN210/{consulta,save,delete}`.

Todo nombre de tabla/columna inferido de PREFACTURA/PEDIDO está marcado **(a confirmar con DDL)**. Si el DDL real difiere, se ajustan los models y `baseQuantity` del front en un solo lugar.

## 1. Convenciones

- **Firma:** `spRemision @ACCION VARCHAR(50), @DATA_JSON VARCHAR(MAX)`. apiRest mapea `prmAccion → @ACCION` y `prmDatos → @DATA_JSON` (cadena JSON).
- **Salida:** un recordset con una columna `DATOS` que contiene una cadena JSON (arreglo). apiRest la devuelve en `data`.
- **Errores de negocio:** `[{"ErrMensaje":"..."}]` con HTTP 200. Rollback completo ante cualquier rechazo.
- **Claves JSON** sensibles a mayúsculas (se leen con `JSON_VALUE`/`OPENJSON`).
- **Escritura:** toda acción de escritura (`save`, `delete`) lleva `ID_APLICACION='VEN-210'` y `USUARIO`. El front **no** envía `ID_UN`/`ID_UN_ITEM` de forma implícita: las claves de documento van explícitas en cada payload.
- **4 claves de documento:** toda consulta/acción por documento usa `ID_DOCUMENTO, PREFIJO, CONSECUTIVO, SUFIJO` (nunca solo 2).
- **Forma de `REMISION`:** en `save` es **arreglo** `[cabecera]` (convención de arreglos planos, igual que `ITM_REMISION`); en `delete` es **objeto** con las 4 claves (es una referencia, no un registro). Es deliberado; no se homogeneiza.
- **Unidades (decisión):** el usuario reparte en la **misma presentación del ítem**.
  - `ITM_REMISION.CANTIDAD` e `ITM_REMISION_BOD.CANTIDAD` van en la presentación de venta del ítem; Σ `ITM_REMISION_BOD.CANTIDAD` por `ITEM` = `ITM_REMISION.CANTIDAD`.
  - **Unidad base:** `CANTIDAD_REAL = CANTIDAD_PRES × CANTIDAD_EQUIV × CANTIDAD` (mismo cálculo que `xtein-ven230-items.component.ts`). Viaja en `ITM_REMISION.CANTIDAD_REAL` e `ITM_REMISION_BOD.CANTIDAD_REAL`.
  - `EXISTENCIA` y `EXISTENCIA_TOTAL` (en `PRODUCTOS REMISION` y `EXISTENCIAS BODEGAS`) están en **unidad base** y se comparan con `CANTIDAD_REAL`.
  - `PRESENTACION` es el **arreglo de opciones** de presentación (no un factor numérico).
  - El SP **recalcula** `CANTIDAD_REAL` con sus propios factores y no confía en el del front.
- **Acciones retiradas respecto a VEN-230:** `acciones settings` y `cargar datos` se **sustituyen por constantes del front** (`Ven210SettingOptions`: `ANTICIPOS` modo `multiple`, `CARGAR_PEDIDO` modo `single`) y por las acciones `PEDIDOS PENDIENTES` / `CARGAR PEDIDO`. `actualizar cantidad` no se usa. No se requieren filas en `settings_aplicacion`.

## 2. Acciones

### 2.1 `POST /api/VEN210/consulta`

| prmAccion | prmDatos (entrada) | DATOS (salida) |
|---|---|---|
| `consulta` | `{REMISION:[{CAMPO,EXPRESION,TABLA}]}` (vacío = todo) | `[Remision]`: cabecera + `NOMBRE_CLIENTE`, `DOCUMENTO`, `ESTADO`, **`ORIGEN_PEDIDO`** (`'S'`/`'N'` explícito, no inferido de nulos), **`PED_ID_DOCUMENTO, PED_PREFIJO, PED_CONSECUTIVO, PED_SUFIJO`** (null si manual) (a confirmar con DDL), `QFILTRO?` |
| `consulta adicionales` | `{ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO}` | `[{ITM_REMISION:[{...,CANTIDAD_PRES,CANTIDAD_EQUIV,UDM_EQUIV,CANTIDAD_REAL,ITEM_PED,CANTIDAD_PENDIENTE,CANTIDAD_MAX}], ITM_REMISION_BOD:[{ITEM,ID_UN_BODEGA,CANTIDAD,CANTIDAD_REAL,DESCRIPCION}], REMISION_PAGOS:[...]}]`. `CANTIDAD_MAX = CANTIDAD_PENDIENTE actual + CANTIDAD ya remitida por esta remisión` en esa línea (presentación) |
| `CONDICIONES LISTAS` | `{ID_ADC,TIPO_VENTA,ESTADO}` | igual a `spPrefactura`: `ID_CONDICION, DESCRIPCION, TIPO, PLAZOS` |
| `PRODUCTOS REMISION` | `{ID_LISTA,TIPO,PLAZO,ID_UN_ITEM}` | productos de la lista de precios con `EXISTENCIA_TOTAL>0` (unidad base) en alguna bodega de la UN: `PRODUCTO,NOMBRE,PRECIO,UDM_VENTA,EXISTENCIA_TOTAL` |
| `EXISTENCIAS PRODUCTO` | `{PRODUCTO,PRESENTACION:'SI',MOVIMIENTO:'Remision',TIPO:'Remision',ID_CONDICION,TIPO_CONDICION,PLAZO,ID_CLIENTE,ID_UN_ITEM}` (sin `ID_UN_BODEGA`) | `[{PRODUCTO,PRECIO,PRESENTACION:[{...,CANTIDAD_PRES,CANTIDAD_EQUIV,UDM_EQUIV}]}]` (arreglo de opciones; sin `IVAS`) |
| `EXISTENCIAS BODEGAS` | `{PRODUCTO,ID_UN_ITEM,ID_DOCUMENTO?,PREFIJO?,CONSECUTIVO?,SUFIJO?}` | `[{ID_UN_BODEGA,DESCRIPCION,EXISTENCIA,UDM}]` (unidad base), solo bodegas habilitadas para el usuario/UN (a confirmar). Con las 4 claves de una remisión ACTIVA en edición: `EXISTENCIA = existencia actual + CANTIDAD_REAL ya descontada por esta remisión en esa bodega` |
| `PEDIDOS PENDIENTES` | `{ID_CLIENTE,ID_UN_ITEM?}` | `[{ITEM,ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,DOCUMENTO,FECHA,TOTAL_PENDIENTE}]`. `ITEM` obligatorio (correlativo de fila; es el `keyExpr` del popup de selección). Solo `ESTADO<>'ANULADO'` y Σ `CANTIDAD_PENDIENTE>0` |
| `CARGAR PEDIDO` | `{ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,ID_CLIENTE}`; rechaza con `ErrMensaje` si el pedido no es del cliente | `[{REMISION:{ID_CLIENTE,ID_UBICACION,DIRECCION,ID_ADC,TIPO_VENTA,ID_CONDICION,PLAZO,ID_MONEDA,TASA_CAMBIO,ID_UN_ITEM,CUOTA_INICIAL,FECHA_PRIMER_VENC}, ITM_REMISION:[{ITEM_PED,PRODUCTO,NOMBRE,UDM_VENTA,CANTIDAD_PRES,CANTIDAD_EQUIV,UDM_EQUIV,PRESENTACION:[...opciones],VALOR_UNITARIO,CANTIDAD_PENDIENTE,FECHA_ENTREGA,ID_SOPORTE,NC_PREFIJO,NC_CONSECUTIVO,NC_SUFIJO}]}]`. `CANTIDAD_PENDIENTE` en la presentación de la línea del pedido |
| `ANTICIPOS CLIENTE` | `{ID_CLIENTE,ID_MONEDA,ID_DOCUMENTO?,PREFIJO?,CONSECUTIVO?,SUFIJO?}` | `[{ITEM,ID_DOCUMENTO,CONSECUTIVO,FECHA,SALDO,VALOR}]` (`ITEM` obligatorio) |

### 2.2 `POST /api/VEN210/save`

Payload plano (claves exactas):

```json
{
  "REMISION": [ { "ID_DOCUMENTO": "", "PREFIJO": "", "CONSECUTIVO": null, "SUFIJO": "", "ID_CLIENTE": "", "ID_UN_ITEM": "", "FECHA": "", "DESCRIPCION": "", "ESTADO": "ACTIVA",
                  "PED_ID_DOCUMENTO": null, "PED_PREFIJO": null, "PED_CONSECUTIVO": null, "PED_SUFIJO": null } ],
  "ITM_REMISION": [ { "ITEM": 1, "PRODUCTO": "", "NOMBRE": "", "CANTIDAD": 2, "CANTIDAD_PRES": 12, "CANTIDAD_EQUIV": 1, "CANTIDAD_REAL": 24,
                      "VALOR_UNITARIO": 0, "SUB_TOTAL": 0, "TOTAL": 0, "FECHA_ENTREGA": "", "ITEM_PED": null } ],
  "ITM_REMISION_BOD": [ { "ITEM": 1, "ID_UN_BODEGA": "", "CANTIDAD": 2, "CANTIDAD_REAL": 24 } ],
  "REMISION_PAGOS": [ ],
  "PEDIDO": { "ID_DOCUMENTO": "", "PREFIJO": "", "CONSECUTIVO": 0, "SUFIJO": "" },
  "ID_APLICACION": "VEN-210",
  "USUARIO": ""
}
```

- `PEDIDO` es `null` en remisión manual. `ITM_REMISION` no incluye `BODEGAS`, `EXISTENCIA`, `SIN_REPARTO` ni `CANTIDAD_MAX`.
- Totales sin impuestos: `TOTAL = SUB_TOTAL = CANTIDAD × VALOR_UNITARIO`. No hay gravámenes, electrónico ni QR.
- Columnas `PED_*`, `ITEM_PED`, `NC_*`, `REMISION_PAGOS` (a confirmar con DDL).

| prmAccion | Comportamiento | DATOS |
|---|---|---|
| `new` | Asigna consecutivo con bloqueo. **Descuenta** existencias por bodega y el pendiente del pedido vinculado | `[{ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,DOCUMENTO,ESTADO:'ACTIVA'}]` |
| `update` | Solo si `ESTADO='ACTIVA'`; **no** reasigna consecutivo. Aplica la **diferencia** de existencias por (`PRODUCTO`,`ID_UN_BODEGA`) y de pendiente por línea (descuenta lo nuevo, repone lo quitado). Si la remisión guardada tiene vínculo de pedido, rechaza cambios de `PED_*` o de campos de cabecera heredados del pedido (todos salvo `FECHA` y `DESCRIPCION`) | igual a `new` |

### 2.3 `POST /api/VEN210/delete` (anular)

| prmAccion | prmDatos | DATOS |
|---|---|---|
| `delete` | `{REMISION:{ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO}, ID_APLICACION, USUARIO}` (`REMISION` es **objeto**) | `[{ID_DOCUMENTO,PREFIJO,CONSECUTIVO,SUFIJO,ESTADO:'ANULADA'}]` |

`delete` **no borra**: pasa a `ESTADO='ANULADA'`, **repone** todas las existencias por bodega descontadas y el pendiente del pedido. La remisión ANULADA sigue visible pero no editable.

## 3. Invariantes obligatorias del SP

1. **Consecutivo con bloqueo** en `new` (p. ej. `UPDATE ... WITH (UPDLOCK, HOLDLOCK)` sobre la tabla de consecutivos de ADM007, o `sp_getapplock`) dentro de la transacción. Prohibido `MAX+1` libre; prohibido reasignar en `update`.
2. **Reparto:** por cada `ITEM`, Σ `ITM_REMISION_BOD.CANTIDAD` = `ITM_REMISION.CANTIDAD` (ambas en la presentación del ítem). El SP recalcula `CANTIDAD_REAL = CANTIDAD_PRES × CANTIDAD_EQUIV × CANTIDAD` por fila. Por cada (`PRODUCTO`,`ID_UN_BODEGA`), Σ `CANTIDAD_REAL` de todas las filas de la remisión ≤ existencia de esa bodega en unidad base (en `update`: existencia + lo que esta misma remisión ya había descontado). Revalidar siempre en servidor.
3. **Pedido:** cada ítem con `ITEM_PED` cumple `CANTIDAD ≤ CANTIDAD_PENDIENTE actual` en `new`, y `CANTIDAD ≤ CANTIDAD_PENDIENTE actual + cantidad previa de esta remisión en esa línea` en `update`. `new` descuenta; `update` aplica la diferencia; `delete` repone; todo en una transacción. Si `PEDIDO` no es `null`, debe pertenecer al `ID_CLIENTE` de la cabecera (rechazo con `ErrMensaje`; también en `save`, no solo en `CARGAR PEDIDO`).
4. **Concurrencia:** antes de validar 2 y 3, tomar `UPDLOCK, HOLDLOCK` (o `sp_getapplock` por pedido y por producto+bodega) sobre las líneas de `ITM_PEDIDO` y las filas de existencias por bodega afectadas, además del bloqueo del consecutivo. Dos usuarios sobre el mismo pedido/bodega se serializan; el segundo ve el pendiente/existencia ya descontado.
5. **Estados:** ACTIVA → ANULADA (`delete`) | FACTURADA (VEN-212, futuro). `update` y `delete` rechazan si el estado no es ACTIVA.
6. **Anticipos:** Σ `REMISION_PAGOS.VALOR` ≤ `TOTAL` (tabla a confirmar con DDL).
7. `actualizar cantidad`, `acciones settings`, `cargar datos`: no se usan en VEN-210.
8. **Inventario:** una remisión ACTIVA **descuenta existencias por bodega** en unidad base (`CANTIDAD_REAL`). `new`: descuenta Σ por (`PRODUCTO`,`ID_UN_BODEGA`). `update`: diferencia nueva − anterior por (`PRODUCTO`,`ID_UN_BODEGA`); descuenta los positivos y repone los negativos. `delete`: repone todo lo descontado. Nunca deja existencia negativa (rechazo con `ErrMensaje` y rollback). Todo en la misma transacción que el consecutivo y el pendiente, con `UPDLOCK, HOLDLOCK` (invariante 4). Resultado: para toda bodega, existencia actual = existencia sin remisiones − Σ `CANTIDAD_REAL` de remisiones ACTIVAS (y FACTURADAS, cuyo tratamiento define VEN-212; VEN-212 no debe descontar de nuevo al facturar una remisión). El movimiento/kárdex concreto (tabla de movimientos, tipo de documento) se define con el DDL.
9. **Vínculo inmutable:** si la remisión guardada tiene `ORIGEN_PEDIDO='S'`, `update` rechaza cambios de `PED_*` y de la cabecera heredada del pedido (todo salvo `FECHA` y `DESCRIPCION`). El front ya lo impide; el SP lo garantiza. **Excepción en `new`:** en pedidos a crédito, `FECHA_PRIMER_VENC` puede diferir de la del pedido, porque el front la recalcula como `FECHA + DIAS_VENC` de la condición cuando la del pedido viene vacía o es anterior a la `FECHA` de la remisión; el SP no debe exigir que coincida con la del pedido (sí que sea ≥ `FECHA`).

## 4. Guía de configuración

- **MAD-001:** registrar `VEN-210` → `MFE-MCOM`, tabla `REMISION`.
- **ADM-015:** permisos por usuario para `VEN-210`.
- **ADM007:** crear el documento REMISIÓN con `ID_APLICACION='VEN-210'` (si hay un solo documento, el front lo autoselecciona).
- **ADM011:** especificaciones `ASUNTO EMAIL`, `EMAIL USUARIO`, `TEMPLATE`, `ESTILOS ESTADO`.
- No requiere filas en `settings_aplicacion`.
