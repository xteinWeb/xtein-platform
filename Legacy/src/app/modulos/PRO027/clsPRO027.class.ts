export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsTransaccProduccion{
  public ID_UN: string;
  public ID_DOCUMENTO: string;
  public CONSECUTIVO: number;
  public DOCUMENTO: string;
  public FECHA: Date;
  public HORA: Date;
  public TIPO: string;
  public ID_UN_ITEM: string;
  public ID_SECCION_ORIGEN: string;
  public ID_SECCION_DESTINO: string;
  public DESCRIPCION: string;
  public ESTADO_PRODUCCION: string;
  public ESTADO: string;
  public USUARIO: string;
  public BODEGAS: any;
}

export class clsTransaccProduccionOP {
  public ITEM: string;
  public ORDEN_PRO: string;
  public ID_ORDEN_PRO: string;
  public NC_ORDEN_PRO: number;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public ID_PEDIDO: string;
  public NC_PEDIDO: number;
  public PEDIDO: string;
  public FECHA: Date;
  public ID_SECCION_ORIGEN: string;
  public ID_SECCION_DESTINO: string;
  public ESTADO: string;
  public ID_CLIENTE: string;
  public NOMBRE_PRODUCTO: string;
  public NOMBRE_CLIENTE: string;
  public CANTIDAD: number;
  public FECHA_AGENDA: Date;
  public ITEM_PRO: string;
} 

export class clsTransaccProduccionItems {
  public ITEM: string;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public UDM: string;
  public ID_SECCION: string;
  public ID_SOPORTE: string;
  public NC_SOPORTE: string;
  public SOPORTE: string;
  public CANTIDAD: number;
  public CANTIDAD_PRODUCCION: number;
  public CANTIDAD_EXIS: number;
  public CANTIDAD_PENDIENTE: number;
  public VALOR_UNITARIO: number;
} 

