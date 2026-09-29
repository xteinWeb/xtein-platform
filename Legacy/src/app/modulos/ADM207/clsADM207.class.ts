export interface MDocumentos {
  ID_UN: string;
  ID_DOCUMENTO: string;
  NC_DOCUMENTO: string;
  DESCRIPCION: string;
  INCREMENTO: number;
  DIGITOS: number;
  EXPRESION_CONSECUTIVO: string;
  FORMATO: number;
  DIAS_ATRASO: number;
  ESTADO: string;
  EXPR_CONSEC_SUFIJO: string;
  SEPARADOR: string;
  DATO_PREFIJO: string;
  DATO_SUFIJO: string;
  ID_APLICACION: any[];
  ID_DOC_ELECTRONICO: string;
  ID_UN_ASOCIADA: string;
  LISTA_APL: any[];
}

// export interface UnidadesNegocio {
//   ID_UN: string;
//   ID_UN_ASOCIADA: string;
//   ID_DOCUMENTO: string;
//   NOMBRE: string;
// }


// export interface AutoriacionesNegocio {
//   ID_UN: string;
//   ID_DOCUMENTO: string;
//   RESOLUCION: string;
//   FECHA_EXPEDICION: string;
//   FECHA_VENCIMIENTO : string;
//   RANGO_INICIO: string;
//   RANGO_FINAL: String;
// }

// export interface DocumentoRangos {
//   ID_UN: string;
//   ID_DOCUMENTO: string;
//   INICIAL: string;
//   FINAL: String;
//   FECHA: string;
//   ESTADO: string;
//   CONSECUTIVO: string;
// }

// export interface DocumentosUsuarios {
//   ID_UN: string;
//   ID_DOCUMENTO: string;
//   USUARIO: string;
//   ID_APLICACION: String;
// }

// export interface DocumentosAplicaciones {
//   ID_UN: string;
//   ID_DOCUMENTO: string;
//   ID_APLICACION: String;
// }

// export interface DocumentosElecGen {
//   ID_UN: string;
//   ID_DOCUMENTO: string;
//   CONSECUTIVO: string;
//   ID_SOPORTE: string;
//   NC_CONSECUTIVO: string;
//   ID_APLICACION: String;
//   CODIGO_ELECTRONICO: string;
// }
