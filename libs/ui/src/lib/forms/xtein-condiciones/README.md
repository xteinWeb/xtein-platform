# xtein-condiciones

Componente standalone exportado por `@xtein/ui`. Presenta la grid de condiciones comerciales
con selección por catálogo `/VEN003/consulta` (acción `'CONDICIONES'`), coincidiendo con el Legacy
`VEN20901` y `CXP20001`.

```html
<xtein-condiciones
  [condiciones]="condiciones()"
  [availableCondiciones]="availableCondiciones()"
  [readOnly]="readOnly()"
  (condicionesChange)="condiciones.set($event); markPendingChanges()"
  (pendingChange)="markPendingChanges()"
/>
```

- `condicionesChange` entrega la colección confirmada; no escribe directamente en la base de datos.
- La aplicación incluye esa colección en su operación de guardado.
- Antes de guardar, llamar a `commit()` mediante `ViewChild`: confirma el borrador
  y devuelve `false` si falta seleccionar la condición (`"Falta seleccionar la condición."`) o si es duplicada.
- Mantener montado el componente al cambiar de pestaña o contraer secciones (`hidden`) para conservar
  el borrador en edición.
- Permite pasar pre-cargado el catálogo con `availableCondiciones`, o si no se suministra, consulta
  automáticamente `/VEN003/consulta`.

Controles usados: `xtein-data-grid`, `xtein-lookup` con búsqueda, y `xtein-input`.
