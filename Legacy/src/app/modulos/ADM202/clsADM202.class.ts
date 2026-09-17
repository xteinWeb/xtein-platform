export interface MUDnegocios {
  ID_UN: string;
  NOMBRE: string;
  ID_UN_SUPERIOR: any;
  NOMBRE_SUPERIOR: any;
  ID_LEGAL: any;
  // UBICACION: string;
  RESPONSABLE: string;
  ID_GRUPO: string;
  ID_UBICACION: string;
  TIPO: string;
  UN_OPERATIVA: boolean;
  MANEJO_PRESUPUESTO: boolean;
  DESCRIPCION: string;
  ESTADO: string;
  CONTACTOS: any[];
  DIRECCIONES: any[];
  TELEFONOS: any[];
}

export interface CIDLegales {
  ID_LEGAL: string;
  NOMBRE_COMPLETO: string;
}
export interface CUbicaciones {
  ID_UBICACION: string;
  NOMBRE: string;
}

export interface CListaResponsabels {
  RESPONSABLE: string;
  NOMBRE_COMPLETO: string;
}
export interface CListaIdetificacion {
  TIPO_ACTIVIDAD: string;
  ID_ACTIVIDAD: string;
  COSTEO_INVENTARIO: string;
  INVENTARIO: string;
}

export interface CListaImagenes {
  LOGO16: string;
  LOGO32: string;
  LOGOSIMBOLO: string;
}
export interface CListaContabilidad {
  PERFIL_TASAS?: any;
  ID_TRIBUTARIA: any;
  FECHA_CREACION: string;
  FECHA_INIC_CONTABLE: string;
  PERIODO: number;
  BASE_ACUMULADA: string;
}
