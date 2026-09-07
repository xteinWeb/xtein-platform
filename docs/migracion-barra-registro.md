# Migración de la barra de registro

Comparación realizada contra `C:\DirTrab\Xtein\xtein-dashboard.zip` el 7 de septiembre de 2026. Los cambios de esta entrega están aplicados en `C:\DirTrab\Xtein\xtein-platform`; no es necesario copiar fragmentos del chat.

## Alcance comprobado

Se revisaron `src/app/containers/regbarra`, los componentes Legacy `MAD001`, `MAD002`, `MAD005`, sus servicios, `shared/geninformes` y `shared/visorrep`, y su correspondencia con Shell, SDK, runtime, API client, sesión y formularios migrados.

| Función | MAD-001 y MAD-005 Legacy | Resultado en la plataforma |
| --- | --- | --- |
| Nuevo, modificar, guardar, cancelar, eliminar | Implementadas | Se conserva la implementación migrada |
| Buscar | Filtro por tabla y acción `consulta` | Conectado al filtro compartido ya existente |
| Vista rápida | Lista de resultados, selección y ordenamiento de columnas | Componente compartido con búsqueda, filtro, ordenamiento de columnas y apertura del registro por su clave |
| Primero, anterior, siguiente, último | Implementadas | Se conservan |
| Ir a número de registro | `r_numreg` | Campo numérico conectado a `ToolbarAction.GoTo`, con validación de rango |
| Informes | Lista del servidor, vista previa y PDF | Selector compartido, visor DevExpress y descarga PDF |
| Copiar | El `case r_copiar` está vacío | Continúa deshabilitado |
| Botón ordenar | No hay manejador `r_ordenar` en estos formularios | Continúa deshabilitado; se puede ordenar dentro de la vista rápida |
| Botón descargar | No hay manejador `r_descargar` en estos formularios | Continúa deshabilitado; el PDF se genera desde informes |
| Configurar | La barra Legacy consulta opciones, pero estos formularios no manejan `r_configurar` | Continúa deshabilitado; su integración funcional corresponde a aplicaciones que sí consuman esas opciones |
| Enviar informe por email | La barra lo ofrece, pero `imprimirReporte` de MAD-001/MAD-005 solo maneja vista previa y PDF | No se habilita una operación que estos formularios no implementaban |

MAD-002 solamente maneja refrescar en su barra Legacy. Se conserva ese alcance; el diseñador de dashboards mantiene sus operaciones propias.

## Arquitectura conservada

Shell presenta la barra y publica comandos en `ToolbarRuntimeService`. Cada formulario conserva sus datos, consultas y selección. Los componentes reutilizables viven en `libs/ui` y reciben datos mediante entradas y salidas. El SDK sigue calculando estados y permisos por aplicación.

La búsqueda utiliza los servicios existentes: MAD-001 envía `{ APLICACIONES_ASOCIADAS: ESTRUCTURA }` y MAD-005 `{ CONFIG_ORIGEN_DATO: ESTRUCTURA }`, ambos con acción `consulta`. No se crean endpoints de negocio.

El catálogo utiliza `/listaInformes`, acción `LISTA INFORMES`, mediante `XteinApiClientService`. El servidor de informes conserva su contrato independiente: `DXXRDV` para el visor y `/api/ApiReport/ExportPDF` para PDF. Empresa y usuario se obtienen de `SessionService`. La URL proviene de `environment.reportes`, inyectada por Shell.

Los informes se presentan en un diálogo del formulario dentro del workspace existente. No se introduce un nuevo tipo de pestaña ni un nuevo mecanismo de navegación. El alcance «Todos» utiliza `QFILTRO` devuelto por el servidor; se deshabilita si ese valor no está disponible. «Actual» usa la clave del registro seleccionado.

Durante consultas se deshabilitan las acciones de la barra. Al cambiar de aplicación se cierran sus diálogos. Se ajustó la observación del ancho de la barra para cuando su elemento aparece después de cargar una aplicación.

## Archivos modificados

Todas las rutas son relativas a `C:\DirTrab\Xtein\xtein-platform`.

| Ruta | Cambio |
| --- | --- |
| `apps/mfe-mad/src/app/applications/mad-001/mad-001.component.ts` | Búsqueda, selección de vista, informes, GoTo y estado de consulta |
| `apps/mfe-mad/src/app/applications/mad-001/mad-001.component.html` | Integración de los diálogos compartidos |
| `apps/mfe-mad/src/app/applications/mad-001/constants/mad-001-ui.constants.ts` | Habilita búsqueda, vista e informes |
| `apps/mfe-mad/src/app/applications/mad-005/mad-005.component.ts` | Búsqueda, selección de vista, informes, GoTo y estado de consulta |
| `apps/mfe-mad/src/app/applications/mad-005/mad-005.component.html` | Integración de los diálogos compartidos |
| `apps/mfe-mad/src/app/applications/mad-005/constants/mad-005-ui.constants.ts` | Habilita búsqueda, vista e informes |
| `apps/mfe-mad/src/app/applications/mad-005/models/mad-005.model.ts` | Centraliza el modelo de opciones booleanas que antes estaba en constantes |
| `apps/shell/src/app/toolbar/platform-toolbar/platform-toolbar.component.ts` | Salto a registro y ciclo de vida del observador de ancho |
| `apps/shell/src/app/toolbar/platform-toolbar/platform-toolbar.component.html` | Número de registro editable |
| `apps/shell/src/app/toolbar/platform-toolbar/platform-toolbar.component.scss` | Estilo del número de registro, separado de la plantilla |
| `apps/shell/src/app/app.config.ts` | Proporciona la URL de informes existente |
| `libs/sdk/src/lib/contracts/toolbar/record-toolbar-state.ts` | Opción `busy` en el constructor de estado exportado por el SDK |
| `libs/ui/src/public-api.ts` | Exporta los componentes y el servicio de informes |
| `libs/ui/src/lib/record-tools/xtein-record-filter/xtein-record-filter.component.html` | Captura el texto del criterio al escribir |
| `libs/ui/package.json` | Declara la dependencia de pares de Reporting Angular ya instalada |
| `angular.json` | Incluye los estilos del visor de informes en Shell |

## Archivos nuevos

- `libs/ui/src/lib/record-tools/xtein-record-view/xtein-record-view.component.ts`
- `libs/ui/src/lib/record-tools/xtein-record-view/xtein-record-view.component.html`
- `libs/ui/src/lib/record-tools/xtein-record-view/xtein-record-view.component.scss`
- `libs/ui/src/lib/record-tools/xtein-record-view/models/xtein-record-view.model.ts`
- `libs/ui/src/lib/record-tools/xtein-record-reports/xtein-record-reports.component.ts`
- `libs/ui/src/lib/record-tools/xtein-record-reports/xtein-record-reports.component.html`
- `libs/ui/src/lib/record-tools/xtein-record-reports/xtein-record-reports.component.scss`
- `libs/ui/src/lib/record-tools/xtein-record-reports/services/xtein-record-reports.service.ts`
- `libs/ui/src/lib/record-tools/xtein-record-reports/services/xtein-record-reports.service.spec.ts`
- `libs/ui/src/lib/record-tools/xtein-record-reports/models/xtein-record-reports.model.ts`
- `libs/ui/src/lib/record-tools/xtein-record-reports/configuration/xtein-record-reports.config.ts`
- `libs/ui/src/lib/record-tools/xtein-record-reports/constants/xtein-record-reports.constants.ts`
- `libs/sdk/src/lib/toolbar/record-toolbar-state.factory.spec.ts`
- `libs/ui/src/lib/record-tools/xtein-record-filter/xtein-record-filter.component.spec.ts`
- `docs/migracion-barra-registro.md`

## Organización y diseño responsive

Los componentes nuevos `xtein-record-view` y `xtein-record-reports` separan lógica (`.ts`), plantilla (`.html`) y distribución visual (`.scss`). Los servicios y sus pruebas están en `services`, los contratos en `models`, los valores fijos en `constants` y el token de inyección en `configuration`. Las columnas de MAD-001 y MAD-005 se definen en las carpetas `constants` de cada aplicación.

Los botones y el selector reutilizan `xtein-button` y `xtein-select`, con el tema global del proyecto. Los SCSS locales definen distribución y adaptación, sin redefinir los estados visuales de los controles compartidos.

Cuando la barra tiene una sola acción visible, la muestra directamente, independientemente del ancho y de su prioridad responsive. Por ejemplo, MAD-002 muestra Refrescar sin obligar a abrir «Más opciones».

Los diálogos limitan su tamaño al viewport. En móviles los botones se apilan, los nombres largos se ajustan, la lista tiene desplazamiento propio, y la grilla oculta columnas de forma adaptativa. El visor usa su modo móvil hasta 768 px y ocupa la altura disponible, en lugar de una altura fija de 600 px. Verificar las vistas a 360, 768 y 1280 px, además del cambio de orientación.

## Comprobación paso a paso

1. Detener los servidores de desarrollo que estuvieran abiertos. Compilar `sdk` y `ui`, porque las rutas TypeScript del proyecto consumen `dist`.

   ```powershell
   npx ng build sdk
   npx ng build ui
   ```

2. Reiniciar Shell y MAD con los comandos habituales del proyecto para regenerar los artefactos de Native Federation. Mantener la configuración de puertos y proxy existente.
3. Iniciar sesión con un usuario autorizado para MAD-001 y MAD-005.
4. Abrir MAD-001, pulsar buscar, seleccionar criterios y ejecutar. Comprobar los resultados contra el Legacy con los mismos criterios.
5. Repetir en MAD-005. Comprobar una consulta sin resultados y una consulta con error del servidor. Una respuesta de negocio con `ErrMensaje`, o un resultado vacío, limpia los registros anteriores y vuelve al estado inicial. Los errores de transporte muestran el error sin sustituir los datos de la última consulta exitosa.
6. En una consulta con varios registros, probar primero/anterior/siguiente/último y escribir un número válido en la barra. Probar también cero, decimales y un número mayor al total: no deben navegar.
7. Abrir la vista rápida, ordenar una columna, filtrar y abrir una fila por doble clic o con «Abrir seleccionado». Verificar que se abre la clave elegida, incluso después de ordenar.
8. Abrir informes, seleccionar un informe real y probar «Actual», «Todos», vista previa y PDF. Verificar que los datos pertenecen a la empresa, aplicación y consulta correctas.
9. Repetir sin permisos de buscar o imprimir: las acciones correspondientes no deben estar disponibles.
10. Cambiar entre MAD-001, MAD-005 y MAD-002. Verificar el aislamiento del registro activo y el cierre de los diálogos de la aplicación anterior.
11. Probar crear, editar, guardar y cancelar en un entorno de pruebas, junto con refrescar durante edición. Verificar que no se pierden cambios ni se habilitan acciones mientras hay una petición pendiente.
12. Reducir y ampliar la ventana para comprobar el menú de desbordamiento de la barra.

## Validación técnica y límites

Pasaron la compilación de `sdk` y `ui`, los bundles de desarrollo de Shell y MAD, los builds de desarrollo con Native Federation de ambas aplicaciones y seis pruebas enfocadas: cuatro de estados/permisos/bloqueo de la API pública del SDK y dos del contrato de informes con HTTP simulado.

```powershell
npx ng test sdk --watch=false --include='**/record-toolbar-state.factory.spec.ts'
npx ng test ui --watch=false --include='**/xtein-record-reports.service.spec.ts'
```

Los builds presentan avisos de Sass, imports sin efectos laterales y metadatos de `util`/`stream` en Federation. No se modificaron esas configuraciones.

No se han ejecutado consultas contra el backend real, generado informes reales, probado la interfaz en un navegador autenticado ni validado un despliegue de producción. La prueba exploratoria de formularios en Node encontró una incompatibilidad de resolución ESM de DevExtreme; no se incorporó una prueba que quedara fallando. Las pruebas de búsqueda e interacción descritas arriba siguen siendo necesarias antes de dar por cerrada la validación funcional.

La infraestructura de configuración y el envío de correo para otras aplicaciones deben compararse con sus manejadores Legacy cuando se migren esas aplicaciones. Esta entrega no declara completada la migración de esas otras aplicaciones.

## Corrección de búsqueda por Nombre

Se corrigió la conservación de registros anteriores cuando el servidor devuelve `ErrMensaje` en MAD-001 y MAD-005. Esta respuesta se utiliza también para búsquedas sin coincidencias en el Legacy. El campo de texto del filtro ahora utiliza `valueChangeEvent="input"` para actualizar el criterio al escribir, antes de pulsar Buscar.

Prueba de regresión: `libs/ui/src/lib/record-tools/xtein-record-filter/xtein-record-filter.component.spec.ts`. Sus dos casos comprueban que Nombre = Artdecom produce `{ CAMPO: 'NOMBRE', EXPRESION: 'Artdecom', TABLA: 'CONFIG_ORIGEN_DATO' }`, que se conserva el último texto escrito y que al borrar el valor se elimina el criterio. Los controles visuales están simulados; esta prueba no sustituye la comprobación con el servidor real.
