export interface Modulo {
  ID_APLICACION: string;
  NOMBRE: string;
  ID_APLICACION_PADRE: string | null;
  TIPO: 'modulo';
  items: Aplicacion[];
}

export interface Aplicacion {
  ID_APLICACION: string;
  NOMBRE: string;
  ID_APLICACION_PADRE: string;
  TIPO: 'aplicacion';
  PROGRAMA: string;
}

// Define la estructura de salida para el dx-tree-list
export interface TreeListItem {
  ID_GRUPO: string;
  NOMBRE: string;
  ID_GRUPO_PADRE: string | null;
  TIPO: 'modulo' | 'aplicacion';
}

export interface UnidadesNegocio {
  ID_UN: string;
  ID_UN_ASOCIADA: string;
  ID_DOCUMENTO: string;
  NOMBRE: string;
}