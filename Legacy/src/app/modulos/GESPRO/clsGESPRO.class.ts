export interface MActividad {
  ID_ACTIVIDAD: number;
  readOnlyResponsables?: boolean;
  readOnlyColaboradores?: boolean;
  ID_ACTIVIDAD_PADRE: string;
  NOMBRE: string;
  DESCRIPCION: string;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  PRIORIDAD: string;
  ETIQUETAS: string;
  MEDICION: string;
  ESTADO: string;
  USUARIO: string;
  CLASE: string;
  TIPO: string;
  REPETIR: boolean;
  TODO_DIA: boolean;
  INTERVALO_FRECUENCIA: string;
  PERIODO_FRECUENCIA_DIA: any;
  PERIODO_FRECUENCIA_MES: number;
  FRECUENCIA: string;
  ANULADO: boolean;
  ELIMINADO: boolean;
  ORDEN: string;
  DESCRIPCION_ESTILO: string;
  DATA_PROGRAMACION: {};
  RECORDATORIO: boolean;
  DATA_RECORDATORIO: {};
  colaboradore: [];
  ITEM: any;
}

export class Resource {
  text: string;
  id: string;
  color: string;
}
export class MColaboradores {
  NOMBRE: string;
  ID_RESPONSABLE: string;
}