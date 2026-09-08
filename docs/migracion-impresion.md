# Migración del desplegable de impresión

La barra abre un desplegable con una fila por informe, anclado a Imprimir o a Más opciones cuando la barra no tiene espacio. En móvil se centra y limita su tamaño al viewport. Cada informe permite elegir el registro actual o todos los consultados, previsualizar e imprimir desde el visor, descargar PDF y preparar un correo.

La selección actual/todos se conserva por informe mientras el desplegable está abierto. MAD-001 y MAD-005 construyen el filtro de todos los consultados con las claves de los registros cargados; no dependen de que el backend devuelva QFILTRO ni generan una consulta sin restricciones cuando el resultado está vacío.

## Organización y archivos

- `apps/shell/src/app/toolbar/platform-toolbar/platform-toolbar.component.html`: atributos de anclaje del desplegable. La comunicación de acciones sigue usando ToolbarRuntimeService.
- `apps/mfe-mad/src/app/applications/mad-001/mad-001.component.ts` y `mad-005/mad-005.component.ts`: filtros para los registros consultados.
- `libs/ui/src/lib/forms/xtein-button/xtein-button.component.ts` y `.html`: soporte opcional de icono, texto accesible y estado seleccionado; conserva los valores predeterminados de los botones existentes.
- `libs/ui/src/lib/record-tools/xtein-record-reports/xtein-record-reports.component.ts`, `.html` y `.scss`: desplegable, selección, visor y coordinación de las operaciones.
- `libs/ui/src/lib/record-tools/xtein-record-reports/models/xtein-record-reports.model.ts`: contratos de informes y correo.
- `libs/ui/src/lib/record-tools/xtein-record-reports/constants/xtein-record-reports.constants.ts`: endpoints y selectores de anclaje.
- `libs/ui/src/lib/record-tools/xtein-record-reports/services/xtein-record-reports.service.ts` y `.spec.ts`: transporte, secuencia PDF/correo y filtros de registros.
- `libs/ui/src/lib/record-tools/xtein-record-reports/xtein-report-email/xtein-report-email.component.ts`, `.html`, `.scss` y `.spec.ts`: formulario de correo, validación y confirmación mediante Enviar.

## Contratos conservados

- Catálogo: `/listaInformes`, acción `LISTA INFORMES`.
- Visor: `DXXRDV`, parámetros del generador Legacy.
- PDF: `api/ApiReport/ExportPDF`, contrato JSON del servidor de informes.
- Correo: primero genera el PDF y después llama `/generales/emailer`, acción `send`, con `{ datos: ... }`, conservando el nombre del archivo, `prm_email`, `template` y `replacements`.
- Las futuras aplicaciones pueden proporcionar `emailContext` para precargar destinatarios, asunto y plantillas específicas. No se asignan plantillas de otra aplicación.

La configuración del remitente y el tratamiento de la nota/plantilla pertenecen al servicio Legacy de correo. El endpoint revisado responde antes del resultado de SMTP; la interfaz informa que recibió la solicitud y no afirma que el destinatario ya recibió el mensaje. No se reproduce el registro de auditoría hardcodeado a ADM-401 del generador Legacy en los maestros MAD; ese registro debe asociarse al contexto de cada aplicación cuando se migre.

## Validación manual

1. Recargar la aplicación y abrir MAD-005. Buscar registros y comprobar el contador.
2. Abrir Imprimir y comprobar nombre y cinco controles de cada informe.
3. Seleccionar Actual y previsualizar; comprobar que el documento corresponde al registro seleccionado.
4. Volver, seleccionar Todos y comprobar que el informe incluye solo los registros consultados. Repetir después de una búsqueda con un único resultado.
5. Generar PDF y comprobar la descarga y su contenido.
6. Abrir Correo y comprobar el asunto. Cancelar debe volver al listado sin enviar. Un destinatario inválido debe impedir el envío.
7. Para una prueba real autorizada, indicar destinatarios de prueba y pulsar Enviar. Revisar PDF, respuesta del mailer y recepción. Las pruebas automatizadas usan servicios simulados, sin enviar correos.
8. Repetir en MAD-001 y con ventana estrecha; verificar que el desplegable no sale de la pantalla y que el formulario desplaza los campos manteniendo sus acciones disponibles.

Las pruebas de servicio cubren el contrato del catálogo y PDF, la secuencia de envío con el mismo archivo, el fallo de generación y los filtros por claves. Las pruebas del formulario cubren destinatarios inválidos, varios destinatarios, confirmación explícita y bloqueo durante una solicitud.
