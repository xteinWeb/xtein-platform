export interface XteinReportDefinition {
  ID_REPORTE: string;
  NOMBRE: string;
  ARCHIVO: string;
}

export type XteinReportScope = 'actual' | 'todos';

export interface XteinReportScopeOption {
  value: XteinReportScope;
  label: string;
  disabled?: boolean;
}

/** Existing reporting-server contract, independent of the Node API envelope. */
export interface XteinReportParameters {
  clid: string;
  usuario: string;
  idrpt: string;
  id_reporte: string;
  aplicacion: string;
  tabla: string;
  filtro: string;
  parametros: Record<string, unknown>;
}
