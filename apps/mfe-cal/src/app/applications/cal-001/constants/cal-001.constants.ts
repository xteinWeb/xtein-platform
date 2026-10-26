/**
 * Identificadores, rutas y acciones de CAL-001 No Conformidades.
 * Contrato: apiRest/docs/contratos/cal-001-spNoConformidad.md (§1.3 y §2).
 */
export const Cal001Application = {
  Id: 'CAL-001',
  BackendId: 'CAL001N'
} as const;

/** Rutas de apiRest; cada una acepta solo las acciones de su lista blanca (§1.3). */
export const Cal001Endpoint = {
  Query: `/${Cal001Application.BackendId}/consulta`,
  Save: `/${Cal001Application.BackendId}/save`,
  PhotoUpload: `/${Cal001Application.BackendId}/foto-subir`,
  Photo: `/${Cal001Application.BackendId}/foto`,
  PhotoRemove: `/${Cal001Application.BackendId}/foto-retirar`
} as const;

export const Cal001Action = {
  Causes: 'causas',
  Products: 'productos',
  ProductParts: 'partes producto',
  Operators: 'operarios',
  Clients: 'clientes',
  ClientLists: 'listas cliente',
  Permissions: 'permisos',
  Query: 'consulta',
  QueryRecord: 'consulta registro',
  History: 'historial',
  New: 'new',
  Update: 'update',
  PhotoAdd: 'foto agregar',
  PhotoPath: 'foto ruta',
  PhotoRemove: 'foto retirar'
} as const;

export type Cal001QueryAction = typeof Cal001Action[
  'Causes' | 'Products' | 'ProductParts' | 'Operators' | 'Clients' | 'ClientLists' | 'Permissions' | 'Query' | 'QueryRecord' | 'History'
];

/** Orígenes permitidos (historia 5): sin Materiales ni Normas. */
export const Cal001Origen = {
  Produccion: 'PRODUCCION',
  Cliente: 'CLIENTE'
} as const;

export type Cal001Origen = typeof Cal001Origen[keyof typeof Cal001Origen];

/** Límites del contrato (§2.3, validación 10, y §1.4). */
export const Cal001Limits = {
  Parts: 50,
  CausesPerPart: 20,
  OperatorsPerCause: 30,
  MinOccurrences: 1,
  MaxOccurrences: 999,
  Piece: 50,
  Observation: 1000,
  Reason: 500,
  ServiceNumber: 50,
  ClientText: 150,
  PageSize: 50,
  MaxPhotos: 10,
  /** Tamaño máximo que acepta el back por foto (decodificada). */
  PhotoMaxBytes: 3 * 1024 * 1024,
  SearchTop: 50
} as const;

/** Campos que el back rechaza a cualquier profundidad de prmDatos (contrato §1.1 y §6.1). */
export const Cal001ForbiddenFields: readonly string[] = [
  'USUARIO', 'ID_UN', 'ES_GESTOR', 'RUTA', 'MIME', 'USUARIO_TOKEN', 'EMPRESA_TOKEN'
];

/** Además de los anteriores, cualquier clave que empiece así (PUEDE_VER, PUEDE_CREAR…). */
export const Cal001ForbiddenPrefix = 'PUEDE_';
