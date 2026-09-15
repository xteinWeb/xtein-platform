# Reestructuración de Distribución y Estilos VEN-230

Continuación del plan aprobado en la sesión anterior. Los `Ven230DefaultRecord` ya fueron actualizados. Falta aplicar los cambios principales al HTML, SCSS y TypeScript.

---

## Resumen de la nueva distribución

La interfaz se reorganiza en **2 filas de tarjetas**:

```
┌──────────────────────────────────┬──────────────┐
│  TARJETA PRINCIPAL (≈77%)        │  TOTALES     │
│  ┌─────────────┬────────────┐    │  (≈23%)      │
│  │ Prefactura  │ Estado     │    │              │
│  │ Fecha       │ Usuario    │    │  Subtotal    │
│  │ F.Registro  │            │    │  Descuentos  │
│  ├─────────────┴────────────┤    │  Anticipos   │
│  │ SECCIÓN CLIENTE          │    │  ──────────  │
│  │ Doc.Cliente│Nombre       │    │  TOTAL       │
│  │ Dirección  │Orden Compra │    │              │
│  │ F.Orden C. │             │    │              │
│  └──────────────────────────┘    │              │
└──────────────────────────────────┴──────────────┘
┌─────────────────────────────────────────────────┐
│  TARJETA INFERIOR (100%)                        │
│  ┌──────────────────┬───────────────────┐       │
│  │ Datos de Venta   │ Liquidación       │       │
│  │ U.Negocio│Moneda │ Condición│Plazo   │       │
│  │ ADC/Vend│T.Venta │ Vencim. │Cuota I.│       │
│  │ Bodega  │Descrip.│                   │       │
│  ├──────────────────┴───────────────────┤       │
│  │ TABLA DE ITEMS (11 columnas)         │       │
│  │ Producto│Nombre│Cant│UM│VrUnit│Sub│  │       │
│  │ IVA│%│Total│F.Entrega│Estado         │       │
│  └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

---

## Cambios Propuestos

### Componente HTML

#### [MODIFY] [ven-230.component.html](file:///c:/Dev/Personales/Desarrollo/XteinOne/xtein-platform/apps/mfe-mcom/src/app/applications/ven-230/ven-230.component.html)

Reestructurar completamente el markup:

1. **Fila Superior** — contenedor flex con 2 tarjetas:
   - **Tarjeta Principal** (`ven-230__card-main`, flex: `1 1 77%`):
     - **Cabecera Prefactura**: grid de 2 columnas con campos inline (label izquierda, control derecha):
       - Col 1: `Prefactura Número` (readonly), `Fecha` (date), `Fecha de Registro` (readonly sombreado)
       - Col 2: `Estado` (badge verde), `Usuario` (readonly sombreado)
     - **Sección Cliente** con título separador:
       - Col 1: `Documento del Cliente`, `Dirección`, `Fecha Orden Compra`
       - Col 2: `Nombre de Cliente` (readonly), `Orden de Compra`
   - **Tarjeta Totales** (`ven-230__card-totals`, flex: `0 0 23%`):
     - Filas: Subtotal, Descuentos, Anticipos (costos)
     - Fila destacada: TOTAL (grande, negrita, color azul petróleo)

2. **Fila Inferior** — tarjeta full-width:
   - **Grid de parámetros comerciales** (4 columnas):
     - Izquierda "Datos de la venta": U.Negocio, Moneda, ADC/Vendedor, Tipo de Venta, Bodega, Descripción
     - Derecha "Liquidación": Condición/Lista, Plazo, Vencimiento, Cuota Inicial
   - **Tabla de items** con 11 columnas:
     Producto | Nombre | Cantidad | UM | Vr.Unitario | Subtotal | IVA | % | Total | F.Entrega | Estado

3. **Campos inline**: Cada campo usa `ven-230__field-inline` (flex row, label ~40%, control ~60%)

---

### Estilos SCSS

#### [MODIFY] [ven-230.component.scss](file:///c:/Dev/Personales/Desarrollo/XteinOne/xtein-platform/apps/mfe-mcom/src/app/applications/ven-230/ven-230.component.scss)

Reescritura completa de estilos:

- **Página**: Fondo `#f2f5f9`, padding `20px`
- **Fila Superior**: `display: flex`, `gap: 20px`
- **Tarjeta Principal**: `flex: 1 1 0`, borde, border-radius `10px`, padding `20px 24px`
- **Tarjeta Totales**: `flex: 0 0 260px`, fondo blanco, borde, totales alineados a la derecha, total destacado
- **Campos inline** (`.ven-230__field-inline`): `display: flex`, label a la izquierda con ancho fijo `~140px`, control ocupa el resto
- **Badge de estado**: fondo verde pastel (`#e8f5e9`), texto verde oscuro (`#2e7d32`), padding `4px 12px`, border-radius `12px`
- **Sección título**: color `#688fae`, línea inferior sutil
- **Grid parámetros**: `grid-template-columns: repeat(4, 1fr)`
- **Tabla de 11 columnas**: cabecera `#edf2f7`, texto `#244d73`, bordes sutiles, alineación numérica
- **Responsive**: tablets colapsan a 2 columnas, móviles a 1 columna

---

### Componente TypeScript

#### [MODIFY] [ven-230.component.ts](file:///c:/Dev/Personales/Desarrollo/XteinOne/xtein-platform/apps/mfe-mcom/src/app/applications/ven-230/ven-230.component.ts)

Cambios mínimos al TS:

1. **FormGroup**: Agregar controles faltantes para los campos nuevos en la vista:
   - `ORDEN_COMPRA` (FormControl\<string>)
   - `FECHA_OC` (FormControl\<string | null>) — ya existe en el form
   - `ID_UN_BODEGA` (FormControl\<string>) — ya existe en el modelo
   - `FECHA_PRIMER_VENC` (FormControl\<string | null>) — ya existe en el modelo
   - `CUOTA_INICIAL` (FormControl\<number>) — ya existe en el modelo
   - `ANTICIPOS` (FormControl\<number>) — campo calculado de totales

2. **`populateForm()`**: Mapear los campos adicionales
3. **`enableFormControls()`**: Los campos de totales (SUBTOTAL, TOTAL, ANTICIPOS) permanecen disabled
4. **Nuevas señales de catálogo computadas**: usando `dataLists()` para obtener opciones de selects con fallback a arrays vacíos

> [!NOTE]
> Los campos nuevos se basan en propiedades que ya existen en `Ven230PrefacturaRecord`. No se requieren cambios al modelo de datos.

---

## Open Questions

> [!IMPORTANT]
> **Campo ANTICIPOS**: El plan de referencia menciona "Anticipos" en la tarjeta de totales. ¿Este valor se calcula de `VALOR_COSTOS` existente o es un campo distinto que necesita agregarse al modelo `Ven230PrefacturaRecord`? **Asumiré que es `VALOR_COSTOS` renombrado visualmente como "Anticipos"**.

> [!IMPORTANT]
> **Campo ORDEN_COMPRA**: El modelo actual no tiene un campo `ORDEN_COMPRA` explícito. ¿Coincide con algún campo existente como `ID_DOC_SOPORTE` o `NC_DOC_SOPORTE`? **Asumiré que es `ID_DOC_SOPORTE`**.

---

## Plan de Verificación

### Compilación automática
- El servidor `mfe-mcom` ya está corriendo — verificar que no haya errores de compilación en la terminal tras cada cambio.

### Inspección Visual
- Verificar en el navegador que la distribución de tarjetas, campos inline, badge de estado, tarjeta de totales y tabla de 11 columnas coincidan con la imagen de referencia.
