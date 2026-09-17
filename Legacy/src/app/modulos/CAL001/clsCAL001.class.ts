export class MCalidad {
  TIPO_FROM: string;
  ID_GESTOR: string;
  AREA_DETECCION: string;
  FECHA: Date;
  FECHA_REGISTRO: Date;
  ID_CAUSANTE: String;
  NOMBRE_CAUSANTE: String;
  AREA_ASOCIADA: String;
  NOMBRE_AREA_ASOCIADA: String;
  PRODUCTO: String;
  NOMBRE_PRODUCTO: String;
  ID_CAUSA: String;
  NOMBRE_CAUSA: String;
  PIEZA_AFECTADA: String;
  CANT_DETALLES: Number;
  DESCRIPCION: String;
  ITEM: Number;
};

export class MNoConformidad {
  FECHA: Date;
  ID_GESTOR: String;
  ID_CAUSANTE: String;
  NOMBRE_CAUSANTE: String;
  AREA_ASOCIADA: String;
  NOMBRE_AREA_ASOCIADA: String;
  ID_CAUSA: String;
  NOMBRE_CAUSA: String;
  DESCRIPCION: String;
};