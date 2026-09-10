# XTEIN application template

This directory contains the source templates consumed by the application generator.

Replacement tokens:

- `__APPLICATION_ID__`: functional application id, for example `MAD-006`.
- `__BACKEND_ID__`: backend id derived from the application id, for example `MAD006`.
- `__APPLICATION_FILE_PREFIX__`: file/folder prefix, for example `mad-006`.
- `__APPLICATION_CLASS_PREFIX__`: TypeScript class prefix, for example `Mad006`.
- `__TABLE_NAME__`: base table name, for example `EMPLEADOS`.
- `__APPLICATION_DESCRIPTION__`: text rendered by the initial HTML.

The generator copies only the `application` directory into the selected microfrontend. Files under `registry` are used only to print the manual registration instructions; the generator must not modify the microfrontend registry automatically.
