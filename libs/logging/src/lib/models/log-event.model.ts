export interface LogContext {
  ID_APLICACION?: string;
  MICROFRONTEND_ID?: string;
  LIBRERIA?: string;
  COMPONENTE?: string;
  METODO?: string;
  TIPO_ORIGEN?: string;
  ID_CORRELACION?: string;
}
export interface LogEvent extends LogContext {
  ID_EVENTO: string;
  ENCOLADO_EN: number;
  ORIGEN: 'FRONTEND';
  MENSAJE: string;
  EMPRESA?: string;
  USUARIO?: string;
  [key: string]: unknown;
}
