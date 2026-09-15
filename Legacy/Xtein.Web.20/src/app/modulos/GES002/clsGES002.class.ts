export interface clsOrganigrama {
  ID_ORG: number;
  NOMBRE: string;
  DESCRIPCION: string;
  ESTADO: string;
  DATOS_CARGOS: any;
}

export interface clsRol {
  ITEM: number;
  ITEM_PADRE: number;
  ID_CARGO: string;
  NOMBRE: string;
  DESCRIPCION: string;
  ESTADO: string;
  RESPONSABLE: string;
  FUNCIONES:any;
}