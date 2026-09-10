# XTEIN Application Generator

Genera la estructura base estandar de una aplicacion XTEIN dentro de un microfrontend existente.

## Ubicacion

El generador debe permanecer en:

```text
tools/application-generator/
```

El desarrollador debe ejecutar el script desde la raiz del proyecto XTEIN Platform:

```powershell
.\tools\application-generator\create-xtein-application.ps1
```

El script solicita:

- Microfrontend destino, por ejemplo `mfe-mad`.
- Application Id, por ejemplo `MAD-006`.
- Tabla base, por ejemplo `EMPLEADOS`.
- Descripcion inicial de la aplicacion.

A partir de `Application Id` deriva automaticamente:

- Backend Id: `MAD006`.
- Prefijo de archivos: `mad-006`.
- Prefijo de clases: `Mad006`.

## Ejecucion con parametros

```powershell
.\tools\application-generator\create-xtein-application.ps1 `
  -Microfrontend mfe-mad `
  -ApplicationId MAD-006 `
  -Table EMPLEADOS `
  -Description "Administracion de empleados"
```

Use `-Force` solamente para omitir la confirmacion interactiva. El parametro no permite sobrescribir una aplicacion existente.

## Registro del microfrontend

El generador NO modifica `*-application.registry.ts`.

Al finalizar muestra:

1. La ruta exacta del registro que debe modificarse.
2. El import que debe agregarse.
3. La entrada que debe incorporarse al arreglo del registro.

Las plantillas utilizadas para construir ese mensaje se encuentran en `templates/registry`.
