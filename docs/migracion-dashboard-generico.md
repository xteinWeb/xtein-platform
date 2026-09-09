# Aplicación genérica de dashboards

La implementación reside en `apps/mfe-dashboard/src/app/applications/dashboard`, dentro del microfrontend independiente `mfe-dashboard`. Cada código del catálogo utiliza su propio `applicationId`, permisos, dashboard y pestaña. No se asigna un código funcional nuevo al visor.

## Configuración del catálogo

Crear un registro independiente en la tabla de microfrontends:

| Columna | Valor de desarrollo |
| --- | --- |
| `MICROFRONTEND_ID` | `MFE-DASHBOARD` |
| `NAME` | `Dashboard Microfrontend` |
| `REMOTE_NAME` | `mfe-dashboard` |
| `EXPOSED_MODULE` | `./ApplicationHost` |
| `REMOTE_ENTRY_URL` | `http://localhost:4311/remoteEntry.json` |
| `VERSION` | `0.0.1` |
| `STATUS` | `ACTIVE` |
| `EFFECTIVE_DATE` | Fecha de activación del entorno |
| `COMMENTS` | `Visor genérico de dashboards` |

Asociar únicamente las aplicaciones visor a `MFE-DASHBOARD`, conservando su código funcional. No modificar el registro `MFE-MAD` ni las asociaciones de MAD001, MAD002 y MAD005.

Iniciar el nuevo microfrontend desde la raíz del proyecto:

```powershell
node node_modules/@angular/cli/bin/ng.js serve mfe-dashboard --port 4311
```

Después de actualizar las asociaciones, volver a iniciar sesión para recargar el catálogo. La URL del microfrontend sirve los artefactos; las aplicaciones se abren desde el shell, que aporta sesión, permisos y configuración del backend. El puerto 4311 evita los puertos mostrados en la configuración existente.

El registro devuelto por el backend para cada aplicación que deba usar el visor debe resolver:

| Campo del catálogo | Valor |
| --- | --- |
| `REMOTE_NAME` | `mfe-dashboard` |
| `EXPOSED_MODULE` | `./ApplicationHost` |
| `REMOTE_ENTRY_URL` | `http://localhost:4311/remoteEntry.json` en desarrollo |

Se conservan los identificadores, nombres, permisos y estados existentes. La configuración pertenece al microfrontend: las aplicaciones visor se asocian a `MFE-DASHBOARD` y las aplicaciones MAD conservan su asociación a `MFE-MAD`. No se modificó la base de datos ni se creó un listado de códigos en TypeScript.

Abrir otra vez un código activa su pestaña; abrir otro código crea otra instancia aunque ambos compartan la entrada técnica.

## Organización de archivos

- `apps/mfe-dashboard/src/app/applications/dashboard/dashboard-application.component.{ts,html,scss}`: entrada del visor y conexión con la barra por código original.
- `apps/mfe-dashboard/src/app/applications/dashboard/constants/dashboard-toolbar.constants.ts`: capacidades de la barra (refrescar).
- `apps/mfe-dashboard/federation.config.js`: exposición `./ApplicationHost` del nuevo microfrontend.
- `apps/mfe-dashboard/src/app/application-host/application-host.component.{ts,html,scss}`: entrega del código original a la aplicación genérica.
- `angular.json`: proyecto `mfe-dashboard` y puerto de desarrollo 4311.
- `apps/mfe-mad/federation.config.js`: retirada de la exposición adicional del visor; conserva su entrada habitual.
- `libs/ui/src/lib/components/xtein-dashboard/`: componente existente, conservado para MAD002 e integrado con las extensiones y editores.
- `libs/ui/src/lib/components/xtein-dashboard-page/`: carga de configuración, estados de carga/error y pantalla completa.
- `libs/ui/src/lib/components/xtein-dashboard-frame/`: contenedor compartido de pantalla completa para visor y MAD002. Botón circular azul a la izquierda, icono `fullscreen` para expandir y `chevrondown` para restaurar, como en el Legacy. El cambio de tamaño conserva la instancia del dashboard.
- `libs/ui/src/lib/components/xtein-dashboard-viewer/`: modo `ViewerOnly`, comportamiento KPI y ventana de detalles.
- `libs/ui/src/lib/components/xtein-dashboard-editor/`: ventanas de líneas constantes y asociación KPI, con contenido desplazable y acciones visibles.
- `libs/dashboard-runtime/src/lib/services/xtein-dashboard-data.service.ts`: consultas `DashboardType` y `KpiList`, mediante API y sesión centralizadas.
- `libs/dashboard-runtime/src/lib/services/xtein-dashboard-extension-registry.service.ts`: registro compartido; trasladado desde `extensions` para mantener los servicios en `services`. Su exportación pública se conserva.
- `libs/dashboard-runtime/src/lib/models/xtein-dashboard-definition.model.ts`: contrato de configuración.
- `libs/dashboard-runtime/src/lib/models/xtein-dashboard-editor.model.ts`: contratos de los editores, líneas y opciones KPI.
- `libs/dashboard-runtime/src/lib/constants/xtein-dashboard-icons.constants.ts`: siete SVG originales del Legacy (`iconInfo`, `iconRoles`, `iconSettings`, `iconKpiSettings`, `dashboard-designer`, `administracion`, `iconDescription`).
- `libs/dashboard-runtime/src/lib/services/xtein-dashboard-icons.service.ts`: registro de SVG antes de las extensiones, usando `DashboardControl.registerIcon`, que delega en el `ResourceManager` del control. Evita registros repetidos sobre una misma instancia.
- `libs/dashboard-runtime/src/lib/extensions/`: ocho extensiones del Legacy y adaptaciones de interacción KPI y opciones del diseñador.
- `libs/ui/src/public-api.ts` y `libs/dashboard-runtime/src/public-api.ts`: exportaciones públicas.

Las ocho extensiones migradas son escala automática, estilos de línea, máximo de eje, líneas constantes, descripción de elementos, descripción del dashboard, filtros de cabecera y asociación KPI. Se preservan los nombres de propiedades almacenados, incluido `aplicationCode`. No se habilitan menús ni acciones que estaban comentados en el Legacy. El visor genérico no ofrece edición del dashboard.

Archivos dentro de `libs/dashboard-runtime/src/lib/extensions/`:

- `chart-scale-breaks-extension.ts`
- `chart-line-options-extension.ts`
- `chart-axis-max-value-extension.ts`
- `chart-constant-lines-extension.ts`
- `item-description-extension.ts`
- `dashboard-description-extension.ts`
- `grid-header-filter-extension.ts`
- `card-setkpi-extension.ts`
- `xtein-dashboard-card-interaction.extension.ts`
- `xtein-dashboard-designer-policy.extension.ts`

Pruebas añadidas:

- `libs/dashboard-runtime/src/lib/services/xtein-dashboard-data.service.spec.ts`: contrato de consulta, errores y lista KPI.
- `libs/dashboard-runtime/src/lib/extensions/xtein-dashboard-card-interaction.extension.spec.ts`: preservación de parámetros, aislamiento y limpieza de eventos.
- `libs/runtime/src/lib/workspace/workspace-runtime.service.spec.ts`: dos códigos en la misma entrada y reactivación del tab existente.

Las líneas se aplican al modelo mediante Guardar en su ventana; la persistencia del dashboard sigue el flujo del diseñador. La asociación KPI utiliza la extensión pública `saveDashboard`, informa errores y restaura el valor anterior si falla el guardado. Los tooltips de gráficos presentan texto formateado sin insertar HTML dinámico.

## Backend

`DashboardType` envía `{ ID_APLICACION: applicationId }` a `dashboard-data/consulta`. El identificador del visor conserva el formato Legacy: `{ dashboardId, user, type: 'view', filter: [{ Field: '', Value: '' }] }`. El usuario se obtiene de `SessionService`. Los tokens y la conexión se gestionan exclusivamente en `XteinApiClientService`.

El endpoint del control de dashboards lo configura el shell mediante `XteinDashboardRuntimeService`. No hay URLs de backend en la aplicación genérica.

Los recursos gráficos provienen de `Legacy/xtein-dashboard/src/app/shared/components/dashboard/dashboard-icons.ts`, de los SVG de `dashboard.component.html` y de `extensions/item-description-extension.ts`. Las acciones Ver detalles, Configurar KPI y Diseño / visor utilizan los mismos identificadores de icono del Legacy; sus textos se conservan como ayuda al pasar el cursor.

El botón Actualizar de la barra vuelve a consultar `DashboardType` para el código de la pestaña y recrea el visor. Esto recarga la definición y vuelve a dibujar el dashboard, reiniciando su selección KPI y filtros temporales. Durante la consulta se muestra el estado de carga; si falla, se permite volver a intentar con Actualizar.

## Verificación funcional en el entorno

Validación de la migración de iconos (2026-09-09): compilaron `dashboard-runtime` y `ui` en configuración `development`, y pasaron las seis pruebas existentes de `dashboard-runtime` (`ng test dashboard-runtime --watch=false`). Se comprobó que los siete SVG son XML válido, tienen identificadores únicos y conservan el contenido del Legacy, salvo comentarios y finales de línea. El registro compartido se ejecuta antes de las extensiones y del evento `controlReady`, tanto para el visor como para el diseñador. Queda por comprobar su presentación visual con dashboards reales en el entorno.

Las pruebas de contrato, interacción KPI y pestañas cubren siete casos. La prueba de pestañas se ejecutó nuevamente usando `mfe-dashboard` y `./ApplicationHost`, y pasó. Las librerías y el shell conservan la compilación validada de la migración; la separación del visor requiere artefactos independientes de `mfe-dashboard` y `mfe-mad`.

La separación quedó compilada correctamente en modo `development` para ambos microfrontends. Se verificó que cada `remoteEntry.json` contiene únicamente su entrada `./ApplicationHost`, con nombres remotos diferentes. Los proyectos Angular existentes conservaron su configuración.

1. Publicar los artefactos compatibles del shell, `mfe-mad` y `mfe-dashboard`, con sus librerías actualizadas.
2. Asociar los códigos reales del visor a `MFE-DASHBOARD`, cuyo registro resuelve a `mfe-dashboard` y `./ApplicationHost`.
3. Abrir dos códigos distintos y confirmar sus dashboards y títulos; volver a abrir el primero y comprobar que solo se activa su pestaña.
4. Refrescar cada pestaña y verificar que conserva su código; probar pantalla completa y una pantalla estrecha.
5. En un `KPIPANEL`, seleccionar una tarjeta y abrir Ver detalles. Confirmar el filtro esperado y que otra pestaña no cambia.
6. En MAD002, abrir un dashboard existente y revisar propiedades personalizadas, líneas constantes y asociación KPI; guardar y volver a abrir para comprobar persistencia.

La compilación y las pruebas automatizadas no sustituyen esta validación con dashboards y permisos reales. No se realizaron escrituras de prueba al backend.
