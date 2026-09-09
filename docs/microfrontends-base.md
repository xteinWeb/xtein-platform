# Bases de microfrontends

Los ocho directorios vacíos se prepararon siguiendo el contrato de `mfe-mad`. No contienen aplicaciones funcionales ni registros de ejemplo. MAD conserva sus aplicaciones existentes.

| Proyecto | Puerto local | Entrada de federación |
| --- | --- | --- |
| mfe-mad (existente) | 4201 | http://localhost:4201/remoteEntry.json |
| mfe-adm | 4202 | http://localhost:4202/remoteEntry.json |
| mfe-inv | 4203 | http://localhost:4203/remoteEntry.json |
| mfe-malm | 4204 | http://localhost:4204/remoteEntry.json |
| mfe-mcom | 4205 | http://localhost:4205/remoteEntry.json |
| mfe-mcpr | 4206 | http://localhost:4206/remoteEntry.json |
| mfe-men | 4207 | http://localhost:4207/remoteEntry.json |
| mfe-mfin | 4208 | http://localhost:4208/remoteEntry.json |
| mfe-mthu | 4209 | http://localhost:4209/remoteEntry.json |

Los puertos son de desarrollo. La asignación de aplicaciones y las direcciones usadas por el Shell siguen viniendo del catálogo del backend. No se han agregado asignaciones, aplicaciones ni permisos al catálogo.

## Archivos de cada proyecto

En `apps/mfe-<modulo>/`:

- `federation.config.js`: expone `./ApplicationHost` y mantiene los paquetes compartidos y exclusiones de MAD.
- `tsconfig.app.json` y `tsconfig.spec.json`: configuración TypeScript.
- `public/favicon.ico`: recurso básico heredado de MAD.
- `src/main.ts` y `src/bootstrap.ts`: inicialización de Native Federation antes de Angular.
- `src/index.html` y `src/styles.scss`: documento y estilos básicos de ejecución independiente.
- `src/app/app.ts`, `app.html`, `app.scss`, `app.config.ts` y `app.routes.ts`: raíz Angular y rutas vacías.
- `src/app/application-host/application-host.component.ts`, `.html` y `.scss`: componente exportado `ApplicationHostComponent`, con entrada `applicationId`, resolución asíncrona y estado de aplicación no disponible.
- `src/app/applications/<modulo>-application.registry.ts`: registro vacío para futuras cargas diferidas.
- `src/app/models/<modulo>-application-registration.model.ts`: contrato de registro.
- `src/app/services/` y `src/app/generated/`: carpetas reservadas, conservadas con `.gitkeep`.

Los nuevos selectores llevan el prefijo `xtein-`. Las plantillas y estilos están separados. El host se adapta al contenedor del Shell y descarta cargas asíncronas obsoletas al cambiar de aplicación o destruirse.

Se añadieron los ocho proyectos en `angular.json`, con los mismos targets `build`, `serve`, `esbuild` y `serve-original` de MAD. El archivo `tsconfig.federation.json` es generado por Native Federation durante la compilación; no se copió la lista generada de dependencias de MAD.

## Ejecutar y agregar aplicaciones posteriormente

1. Desde la raíz, ejecutar `node node_modules/@angular/cli/bin/ng.js serve mfe-adm` (sustituir el proyecto según la tabla).
2. Para compilar, ejecutar `node node_modules/@angular/cli/bin/ng.js build mfe-adm --configuration development`.
3. Los artefactos se generan en `dist/mfe-adm/browser`, incluido `remoteEntry.json` y la exposición `ApplicationHost`.
4. Cuando corresponda migrar una aplicación, crear su carpeta en `src/app/applications/`, manteniendo servicios, modelos, constantes, HTML y SCSS separados.
5. Registrar únicamente esa aplicación implementada en el registro del módulo con una función `load` de importación diferida.
6. Configurar su asociación en el catálogo del backend con el nombre del remoto y `./ApplicationHost`, siguiendo el mismo contrato que MAD. No inferir la asociación por el prefijo del código de aplicación.

Abrir el remoto vacío de forma independiente muestra «Seleccione una aplicación desde el menú». Solicitar un código aún no registrado muestra un estado controlado de aplicación no disponible.

## Validación realizada

Los ocho proyectos compilaron con Native Federation en configuración development. Se verificaron el nombre de cada remoto, `remoteEntry.json`, la exposición `./ApplicationHost`, la exportación `ApplicationHostComponent`, el documento de inicio y los ocho registros vacíos. No se iniciaron servidores permanentes ni se modificó el catálogo del backend.
