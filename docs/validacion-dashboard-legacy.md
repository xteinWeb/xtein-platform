# Validación previa de dashboards del Legacy

Referencia: `Legacy/xtein-dashboard/src/app/shared/components/`. Esta revisión identifica lo existente y lo pendiente; no modifica la implementación de dashboards.

## Componente que se debe conservar

`libs/ui/src/lib/components/xtein-dashboard/xtein-dashboard.component.ts` define `xtein-dashboard`, exportado por `@xtein/ui` y utilizado en `apps/mfe-mad/src/app/applications/mad-002/mad-002.component.html` con `workingMode="Designer"`.

Tiene carga y descarga por `dashboardId`, modos Designer/Viewer/ViewerOnly, endpoint centralizado mediante `XteinDashboardRuntimeService` y registro de extensiones mediante `XteinDashboardExtensionRegistryService`. Es la base migrada del `dashboard` del Legacy, pero aún no reproduce todas sus personalizaciones.

También existe `libs/dashboard-runtime/src/lib/components/xtein-dashboard-designer/`. Es un wrapper básico que no está exportado por el public-api actual de dashboard-runtime ni tiene consumidores encontrados en apps/libs. No debe confundirse con el componente activo de MAD-002. Se conserva sin eliminarlo ni introducir un tercer diseñador.

## Comparación

| Legacy | Estado actual | Trabajo pendiente |
| --- | --- | --- |
| dashboard | Base migrada como xtein-dashboard, activa en MAD-002 | Ocho extensiones, personalización del toolbox, panel oculto, opciones del diseñador, selección de tarjetas y parámetros, iconos y submenú asociado |
| dashboard-page | No existe xtein-dashboard-page | Consulta DashboardType, construcción del identificador JSON con usuario/tipo/filtro, integración con Refrescar y pantalla completa |
| dashboard-viewer | No existe xtein-dashboard-viewer | ViewerOnly, panel oculto, interacciones KPIPANEL, detalles de tarjetas en popup/grilla y actualización del gráfico y parámetros |

## Extensiones personalizadas pendientes

Todas están en `Legacy/xtein-dashboard/src/app/shared/components/dashboard/extensions/`:

1. `chart-scale-breaks-extension.ts`: cortes de escala.
2. `chart-line-options-extension.ts`: estilo de líneas y tooltips de gráficos.
3. `chart-axis-max-value-extension.ts`: máximo del eje, constante o vinculado a datos.
4. `chart-constant-lines-extension.ts`: líneas constantes y su editor.
5. `item-description-extension.ts`: descripciones por elemento.
6. `dashboard-description-extension.ts`: descripción del dashboard y cambio entre visor y diseñador.
7. `grid-header-filter-extension.ts`: filtros en encabezados de grillas.
8. `card-setkpi-extension.ts`: selección de KPI para tarjetas.

El registro actual de `libs/dashboard-runtime/src/lib/extensions/xtein-dashboard-extension-registry.service.ts` solo incorpora `DashboardPanelExtension`. No se encontraron las ocho clases personalizadas migradas en apps/libs.

## Dependencias y contratos a respetar

- `dashboard-page` consulta `/dashboard-data/consulta` con acción `DashboardType` y `{ ID_APLICACION }`.
- `CardSetKpiExtension` consulta el mismo endpoint con acción `KpiList`.
- La sesión debe obtenerse de `SessionService` y las consultas de `XteinApiClientService`, en lugar del acceso directo a localStorage y HttpClient del Legacy.
- El refresco debe integrarse con `ToolbarRuntimeService` y el estado de la aplicación activa.
- Las propiedades personalizadas persistidas deben conservar sus nombres exactos, incluido `aplicationCode`, para mantener compatibles los dashboards guardados.
- El visor Legacy utiliza miembros privados de DevExpress (`_dataSourceBrowser`, `_value`, `_data.listSource`). Antes de implementarlo deben contrastarse con las API de la versión instalada y aislar los accesos que no tengan equivalente público.
- La extensión de descripción conserva el control en una variable global de módulo. La migración debe mantener el estado por instancia para que dos pestañas no cambien el modo del dashboard equivocado.
- Varias extensiones construyen popups y formularios con `document.createElement` y HTML dentro de TypeScript. Sus editores deben convertirse en componentes Xtein de UI con HTML/SCSS separados. El runtime puede solicitar su apertura mediante contratos o callbacks, sin importar UI y crear una dependencia circular.
- `dashboard/submenu-options` y `dashboard-icons.ts` son dependencias visuales adicionales. Parte del submenú está incompleta en el propio Legacy: `DDashboards` no se carga en DashboardComponent y el manejador de selección no realiza una operación funcional. No se deben inventar altas, cambios o eliminaciones a partir de esos botones.

## Orden previsto para la migración

1. Conservar `xtein-dashboard` y ampliar el registro existente de extensiones en dashboard-runtime.
2. Separar los contratos y consultas de DashboardType/KpiList en models/services del runtime.
3. Migrar las ocho extensiones preservando sus propiedades persistidas y limpiando sus eventos al destruir el control.
4. Crear `xtein-dashboard-viewer` en UI reutilizando la infraestructura actual, con el detalle de tarjetas y comportamiento KPIPANEL.
5. Crear `xtein-dashboard-page` en UI, con refresco y pantalla completa, sin registrar todavía aplicaciones nuevas en los microfrontends vacíos.
6. Validar regresión de MAD-002 y dashboards existentes, y después visor, filtros, detalles, cambios de pestaña y tamaños de pantalla.
