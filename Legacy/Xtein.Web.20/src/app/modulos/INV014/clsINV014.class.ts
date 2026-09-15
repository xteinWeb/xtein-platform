export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsEntradas{
  public ID_UN: string;
  public ID_DOCUMENTO: string;
  public NOMBRE_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public ID_SOPORTE: string;
  public NC_SOPORTE: string;
  public FECHA: any;
  public HORA: any;
  public TIPO: string;
  public ID_CAUSA: string;
  public MOVIMIENTO: string;
  public TIPO_INVENTARIO: string;
  public ID_UN_ORIGEN: string;
  public ID_UN_DESTINO: string;
  public DETALLE: string;
  public ID_CONDICION: string;
  public PLAZO: number;
  public USUARIO: string;
  public ESTADO: string;
  public FECHA_REGISTRO: any;
  public FECHA_VENCIMIENTO: any;
  public CONTROL: string;
  public TIPO_COMPRA: string;
}

export class clsEntradasItems{
  public ID_UN: string;
  public ID_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public ITEM: number;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public TIPO_INVENTARIO: string;
  public REFERENCIA: string;
  public PRODUCTO_KIT: string;
  public ID_SOPORTE: string;
  public NC_SOPORTE: string;
  public CANTIDAD: number;
  public CANTIDAD_PENDIENTE: number;
  public UDM: string;
  public VALOR_UNITARIO: number;
  public CANTIDAD_REAL: number;
  public VALOR_DESCUENTO: number;
  public GRAVAMENES: string;
  public TOTAL: number;
  public DETALLE: string;
  public OTROS_GRAVAMENES: number;
  public VALOR_UNITARIO_BASE: number;
  public CANTIDAD_RECIBIDA: number;
  public CANTIDAD_AUTORIZADA: number;
  public ID_PROVEEDOR: string;
}