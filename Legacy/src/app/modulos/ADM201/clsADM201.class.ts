export interface Aplicaciones {
  ID_APLICACION: string;
  ID_APLICACION_PADRE: any;
  NOMBRE: string;
  TIPO: any;
  NOMBRE_PROGRAMA: any;
  TABLA_APLICACION: any;
  DIRECTORIO: any;
  PARAMETROS: any;
  TIPO_SISTEMA: any;
  FECHA_VIGENCIA: Date;
  GENERA_CONTABILIDAD: boolean;
  URL_IMAGEN?: string;
  IMAGEN?: File;
  IMAGEN_APLICACION?: File;
  IMAGEN_TAMANO?: File;
  ESTADO: string;
  COMENTARIOS: string;
}
