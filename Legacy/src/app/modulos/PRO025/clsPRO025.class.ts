export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsOrdenProduccion{
  public ID_UN: string;
  public ID_DOCUMENTO: string;
  public CONSECUTIVO: number;
  public DOCUMENTO: string;
  public FECHA: Date;
  public HORA: Date;
  // public FECHA_ENTREGA: Date;
  public PRODUCTO: string;
  // public ID_UN_ITEM: string;
  public PEDIDO: any;
  public DESCRIPCION: string;
  public ESTADO: string;
  public USUARIO: string;
}

export class clsOrdenProduccionItems{
  public ITEM: string;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public ID_PEDIDO: string;
  public NC_PEDIDO: number;
  public PEDIDO: string;
  public FECHA: Date;
  public ID_CLIENTE: string;
  public NOMBRE_PRODUCTO: string;
  public NOMBRE_CLIENTE: string;
  public CANTIDAD: number;
} 

