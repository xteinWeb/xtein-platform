# Regla de Enfoque Inicial en Creación / Edición (Foco Automático)

En **todas las aplicaciones** del ERP XTEIN (migradas actualmente y todas las que se migren de ahora en adelante):

1. **Al accionar "Nuevo" (`ToolbarAction.New` / `newRecord()`)**:
   - La aplicación **DEBE** enviar automáticamente el foco al **primer campo editable disponible** del formulario (`focusFirstControl()`).
   - El control no debe estar deshabilitado (`disabled`), ni ser de sólo lectura (`readOnly` / `dx-state-readonly` / `dx-state-disabled`).
   - Si el primer campo es un input de texto, además de llamar a `.focus()`, se debe ejecutar `.select()` para que el usuario pueda escribir inmediatamente.

2. **Al accionar "Editar" (`ToolbarAction.Edit` / `editRecord()`)**:
   - También se debe invocar `focusFirstControl()`, dirigiendo el foco al primer campo que no sea de solo lectura (por ejemplo, si el código clave principal se bloquea en edición, el foco debe pasar automáticamente al campo siguiente editable, como `DESCRIPCION`).

3. **Patrón estándar de implementación**:
   - Inyectar `ElementRef`.
   - Implementar método privado `focusFirstControl()` con un reintento breve (`setTimeout(..., 100)` y `150ms`) para asegurar que el ciclo de detección de cambios y renderizado de Angular / DevExtreme haya habilitado los inputs.
   - Buscar primero el campo clave inicial no readonly (`input:not([readonly]):not([disabled])`), y como fallback el primer candidato `input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])` que esté visible y editable.

## Regla de Confirmación de Fila con Tecla Enter en Grids Hijas (Detalles / Ítems)

En **todas las grids o tablas de detalle** (ítems de facturas, pedidos, listas asociadas, ubicaciones, contactos, etc.):
- Al estar editando o agregando una fila (`row-editing` / `draft`), presionar la tecla **Enter** (`(keydown.enter)` o evento `(enterKey)`) **DEBE** equivaler a hacer clic en el botón de confirmar la fila (ícono `check` / método `commit()` / `applyDraft()`).
- La fila debe validarse y agregarse/actualizarse en la tabla, cerrando el modo de edición de la fila actual para que el usuario pueda ingresar datos de forma rápida y ágil con el teclado.
