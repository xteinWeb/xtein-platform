# Exportar a Excel (`xtein-record-export` + `XteinExcelExportService`)

Exportación estándar a Excel de las aplicaciones de la platform, equivalente a los informes PDF
(`xtein-record-reports`): el botón **Exportar a Excel** de la barra abre una ventana con el mismo estilo
que la de informes para elegir el **registro actual** o **todos los consultados**, y la aplicación
genera el archivo con sus datos.

- **`<xtein-record-export>`**: la ventana. No sabe nada de los datos; emite `exported` con `'actual'` o `'todos'`.
- **`XteinExcelExportService.export(libro)`**: arma el `.xlsx` en el navegador (título, encabezado,
  tabla con estilos, filtros, encabezado fijo, formato numérico) y lo descarga. No depende del servidor de reportes.

Ejemplo completo: Consumos (`apps/mfe-prod/src/app/applications/pro-039`), archivos
`pro-039.component.*` y `constants/pro-039-excel.constants.ts`.

## Activarlo en una aplicación

### 1. Mostrar el botón en la barra

En las capacidades de la barra de la aplicación:

```ts
export const MiAppToolbarCapabilities: RecordToolbarCapabilities = {
  // ...
  download: true,   // botón "Exportar a Excel" (ToolbarAction.Download)
  print: true
};
```

El botón se habilita cuando hay registros consultados y el usuario tiene permiso de informes (el mismo de Imprimir).

### 2. Abrir la ventana

```ts
readonly exportVisible = signal(false);

// en el manejo de comandos de la barra
case ToolbarAction.Download:
  this.exportVisible.set(true);
  break;
```

Si la aplicación cierra sus ventanas al cambiar de pestaña (como hace con `reportsVisible`), agregue
también `this.exportVisible.set(false)`.

### 3. Agregar la ventana a la plantilla

```html
<xtein-record-export
  title="Pedidos"
  [visible]="exportVisible()"
  (visibleChange)="exportVisible.set($event)"
  [current]="currentRecord()?.DOCUMENTO ?? ''"
  [total]="records().length"
  [busy]="busy()"
  (exported)="exportExcel($event)"
/>
```

Importe `XteinRecordExportComponent` en el componente (`imports: [...]`).

### 4. Generar el libro con los datos de la aplicación

```ts
private readonly excel = inject(XteinExcelExportService);

async exportExcel(scope: XteinExportScope): Promise<void> {
  const registros = scope === 'actual' ? [this.currentRecord()!] : this.records();
  this.busy.set(true);
  try {
    await this.excel.export({
      fileName: scope === 'actual' ? `Pedido_${registros[0].DOCUMENTO}` : `Pedidos_${registros.length}`,
      sheets: [{
        name: 'Pedidos',
        title: 'Pedidos',                       // opcional
        fields: [                               // opcional: encabezado (etiqueta: valor)
          { label: 'Cliente', value: '...' }
        ],
        columns: [
          { header: 'Documento', key: 'DOCUMENTO', width: 12 },
          { header: 'Fecha', key: 'FECHA', width: 11 },
          { header: 'Total', key: 'TOTAL', width: 14, numeric: true }
        ],
        rows: registros
      }]
    });
    this.exportVisible.set(false);
  } catch (error) {
    // mostrar el error
  } finally {
    this.busy.set(false);
  }
}
```

- `rows` son objetos; cada columna toma `fila[key]`.
- `numeric: true` alinea a la derecha y aplica `numFmt` (por defecto `#,##0.####`).
- Un libro puede tener varias hojas (`sheets`).
- Si el detalle de cada registro no está cargado (por ejemplo los ítems de cada documento para "todos"),
  consúltelo antes de llamar a `export`, como hace Consumos con `consulta adicionales`.

## Requisitos de la platform (ya configurados)

- `exceljs` está en las dependencias del workspace y como `peerDependency` de `@xtein/ui`.
- Todos los `apps/*/federation.config.js` excluyen `/^exceljs($|\/)/` de Native Federation: el servicio usa
  el build de navegador (`exceljs/dist/exceljs.min.js`), que se empaqueta localmente y se descarga solo al exportar.
  Un microfrontend nuevo debe incluir esa misma regla en `skip`.
- El ícono y el texto del botón (`dx-icon-xlsxfile`, "Exportar a Excel") los define el shell en
  `apps/shell/src/app/toolbar/platform-toolbar/platform-toolbar.constants.ts`.
