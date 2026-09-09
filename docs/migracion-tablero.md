# Tablero (ADM-300)

La aplicación de `Legacy/xtein-dashboard/src/app/containers/tablero` se migra a `apps/mfe-adm/src/app/applications/adm-300`. El registro de `mfe-adm` carga `Adm300Component` mediante la entrada existente `./ApplicationHost`. Se conserva el código `ADM-300`, confirmado en `Legacy/xtein-dashboard/src/app/shared/classes/tabs.class.ts`.

## Contenido

La presentación solicitada muestra ocho tarjetas en tres columnas, con Top Compras ocupando dos columnas. Las tres filas se reparten la altura disponible del workspace, con un mínimo de 220 px por fila; en pantallas pequeñas el tablero permite desplazamiento y pasa a dos o una columna. Gráficos, agenda y notas se ajustan a la altura de su tarjeta; listas y tablas permiten desplazamiento sin recortar contenido. Más usadas, Favoritas, la novena tarjeta de resúmenes y los textos auxiliares permanecen ocultos. Las notas muestran su barra de formato abajo. Se conservan los datos de ejemplo aunque sus etiquetas no se muestran en las tarjetas.

Se conservan las nueve tarjetas del Legacy: Notas rápidas, Ventas (donut), Ingresos, Entregas, Mis notificaciones, Agenda, Top Compras (tabla), Ventas (línea) y Top Compras (resúmenes). Las cifras, textos y citas de ejemplo se mantienen e identifican como «Ejemplo». La agenda conserva su fecha inicial de mayo de 2021; no representa la agenda real del usuario.

Los datos de demostración están en `constants/tablero-demo.constants.ts`. El editor admite formato, enlaces, imágenes y tablas. Las notas, cambios en la agenda y orden de las tarjetas permanecen en la instancia de la pestaña; cerrar y volver a abrir reinicia ese estado. Arrastrar la cabecera de una tarjeta sobre otra intercambia su posición sin reemplazar el DOM de sus controles.

El código Legacy también cargaba favoritas y aplicaciones frecuentes, aunque no aparecían en su plantilla principal. Ahora tienen accesos visibles y un selector de favoritas. La selección se aplica localmente, como hacía `clickAplFav` en el Legacy, y Actualizar vuelve a consultar el backend.

## Integración

`TableroDataService` usa `XteinApiClientService` y `SessionService`, sin leer tokens de `localStorage` ni definir URLs de entorno. Las consultas conservan el contrato de `generales/consulta`:

| Contenido | Acción | Datos |
| --- | --- | --- |
| Más usadas | `apl mas usadas` | `{ usuario: userId }` |
| Favoritas | `apl favoritas` | `{ usuario: userId }` |
| Opciones de favoritas | `consulta aplicacion` | `{ USUARIO: userId, opcion: 'usuario' }` |

Los accesos se resuelven contra el catálogo de la sesión y se abren mediante `WorkspaceRuntimeService`, conservando títulos, destinos y reactivación de pestañas. No se recrea el registro estático de componentes del Legacy. La barra compartida habilita Actualizar según los permisos de `ADM-300`.

La consulta de compras estaba comentada: su tabla se mantiene vacía con un mensaje y no se habilita una consulta nueva. El Legacy consultaba además `VEN220/informes` para 2021, pero ninguna tarjeta utilizaba esos resultados: no se reproduce esa petición sin consumidor. Tampoco se reproduce la llamada incidental de registro de uso al abrir aplicaciones; la navegación se delega al workspace. Los enlaces de ejemplo sin destino se muestran como texto para evitar recargar la página.

La plantilla usa los controles DevExtreme instalados y el tema que entrega el shell. Se evitan las copias de Bootstrap, las fuentes y estilos globales del Legacy y su script de arrastre que intercambiaba HTML.

## Ejecución

El catálogo debe asociar `ADM-300` con el microfrontend `MFE-ADM`, remoto `mfe-adm`, exposición `./ApplicationHost`. La URL local prevista por Angular es `http://localhost:4202/remoteEntry.json`. No se modificó la base de datos. Si esa asociación ya existe, no hace falta cambiarla.

```powershell
node node_modules/@angular/cli/bin/ng.js build mfe-adm --configuration development
node node_modules/@angular/cli/bin/ng.js test mfe-adm --watch=false
node node_modules/@angular/cli/bin/ng.js serve mfe-adm --port 4202
```

Reiniciar `mfe-adm` si ya estaba ejecutándose y recargar el navegador. Si se cambia el catálogo, volver a iniciar sesión para cargarlo.

Validación del 2026-09-09: compilación federada de `mfe-adm` en `development` correcta, con artefactos en `dist/mfe-adm`; ocho pruebas aprobadas. Las pruebas cubren el contrato de API, respuestas vacías y errores, ausencia de sesión, resolución de aplicaciones, orden de respuestas de favoritas, conservación de notas ante errores y reordenación de tarjetas. Se requiere comprobar visualmente desde el shell con la sesión real: abrir Tablero, escribir una nota, cambiar de pestaña y volver, mover una tarjeta, recorrer la agenda de ejemplo y abrir una aplicación desde los accesos.
