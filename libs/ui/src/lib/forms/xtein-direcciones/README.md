# xtein-direcciones

Componente standalone exportado por `@xtein/ui`. Presenta las ocho columnas de
direcciones del Legacy y obtiene sus catálogos autenticados de `/ADM006/consulta`.

```html
<xtein-direcciones
  [direcciones]="direcciones()"
  [readOnly]="readOnly()"
  (direccionesChange)="direcciones.set($event); markPendingChanges()"
  (pendingChange)="markPendingChanges()"
/>
```

- `direccionesChange` entrega la colección confirmada; no escribe en la base de datos.
- La aplicación incluye esa colección en su operación de guardar.
- Antes de guardar, llamar a `commit()` mediante `ViewChild`: confirma el borrador
  y devuelve `false` cuando faltan tipo, domicilio o ciudad. En ese caso se debe
  detener el guardado de la aplicación.
- Mantener montado el componente al cambiar de pestaña (`hidden`) para conservar
  el borrador. Al cancelar la aplicación, restaurar la colección y el modo de lectura.
- `TIPO_DIRECCION` admite registros antiguos de texto y devuelve un arreglo al
  confirmar una dirección, igual que la selección múltiple del Legacy.
- Ciudad filtra barrios y códigos postales; ciudad y barrio filtran zonas.
  Cambiar un padre limpia los valores dependientes y cancela sus consultas anteriores.
- Se conservan los campos adicionales de cada registro al editarlo.

Controles usados: `xtein-data-grid`, `xtein-lookup` con `selectionMode="multiple"`,
`xtein-select` con búsqueda y plantilla de código/descripción, y `xtein-input`.
