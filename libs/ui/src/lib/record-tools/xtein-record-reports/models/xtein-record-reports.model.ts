export interface XteinReportDefinition {
  ID_REPORTE: string;
  NOMBRE: string;
  ARCHIVO: string;
}

export type XteinReportScope = 'actual' | 'todos';

export type XteinReportPanel = 'list' | 'preview' | 'email';

export interface XteinReportEmail {
  ORIGEN: string;
  ORIGEN_EMAIL: string;
  DESTINO: string;
  DESTINO_EMAIL: string;
  ASUNTO: string;
  NOTA: string;
}

/** Optional application-specific values used by the existing email templates. */
export interface XteinReportEmailContext {
  defaults?: Partial<XteinReportEmail>;
  template?: string;
  replacements?: Record<string, unknown>;
}

export interface XteinReportEmailRequest extends XteinReportParameters {
  archivo: string;
  prm_email: XteinReportEmail;
  template: string;
  replacements: Record<string, unknown>;
}

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
