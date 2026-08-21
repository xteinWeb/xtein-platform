export interface Aplicaciones {
  ID_APLICACION: string;
  ID_APLICACION_PADRE: string | null;
  NOMBRE: string;
  TIPO: string | null;
  COMENTARIOS: string | null;
  ESTADO: string | null;
  ACCION: string | null;
  META_INFERIOR: number | null;
  META_SUPERIOR: number | null;
  UDM: string | null;
  NIVEL: string | null;
}