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
