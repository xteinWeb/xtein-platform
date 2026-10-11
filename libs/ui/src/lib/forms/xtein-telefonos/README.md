# xtein-telefonos

Componente standalone exportado por `@xtein/ui`. Presenta las columnas de
teléfonos del Legacy (`ID_TELEFONO`, `TIPO_TELEFONO`, `TELEFONO`, `EXTENSION`) y obtiene su catálogo
autenticado de tipos de teléfono desde `/ADM006/consulta` (acción `'tipos direccion'`).

```html
<xtein-telefonos
  [telefonos]="telefonos()"
  [readOnly]="readOnly()"
  (telefonosChange)="telefonos.set($event); markPendingChanges()"
  (pendingChange)="markPendingChanges()"
/>
```

- `telefonosChange` entrega la colección confirmada; no escribe directamente en la base de datos.
- La aplicación incluye esa colección en su operación de guardado.
- Antes de guardar, llamar a `commit()` mediante `ViewChild`: confirma el borrador
  y devuelve `false` si faltan tipo o número telefónico, mostrando las advertencias del Legacy:
  - `"Falta seleccionar el tipo de teléfono."`
  - `"Falta asignar un número de teléfono."`
  En ese caso se debe detener el guardado de la aplicación.
- Mantener montado el componente al cambiar de pestaña o contraer secciones (`hidden`) para conservar
  el borrador en edición.
- `TIPO_TELEFONO` admite registros antiguos (texto o JSON) y devuelve un arreglo al
  confirmar un teléfono, replicando la selección múltiple del Legacy.
- Se conservan los campos adicionales de cada registro al editarlo (e.g. `ID_DIRECCION`).

Controles usados: `xtein-data-grid`, `xtein-lookup` con `selectionMode="multiple"`, y `xtein-input`.
