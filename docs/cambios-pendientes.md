# Cambios pendientes en las aplicaciones

La pestaña muestra el punto «Cambios sin guardar» cuando `WorkspaceRuntimeService.setDirty(applicationId, true)` registra trabajo pendiente.

Regla común para todas las aplicaciones:

- Abrir, consultar, preparar un registro nuevo o entrar en edición comienza sin cambios pendientes (`false`). La carga de datos y habilitación de controles no son modificaciones del usuario.
- Modificar datos del formulario o de listas secundarias, agregar/eliminar registros de detalle, o iniciar un borrador de detalle activa el indicador (`true`). Las listas deben notificarlo aunque no emitan `form.valueChanges`.
- Guardar correctamente, deshacer la operación completa o cargar otro registro restablece el estado (`false`). Un error de guardado conserva el indicador.
- El indicador es conservador: volver a escribir el valor original o cancelar solo un borrador de detalle no descarta otros cambios pendientes. Se limpia al guardar o deshacer la operación completa.

El Shell aplica `WorkspaceCloseGuard` tanto a la pestaña como al menú de pestañas. Sin cambios cierra directamente. Con cambios pregunta si desea descartarlos y deja el foco en «Seguir editando». Solo «Cerrar sin guardar» autoriza el cierre forzado. Escape conserva la aplicación. No se acumulan confirmaciones por clics repetidos.

El runtime sigue rechazando el cierre normal de una pestaña marcada; la confirmación no sustituye esa protección.
