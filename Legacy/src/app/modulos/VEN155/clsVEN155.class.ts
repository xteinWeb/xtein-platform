export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsPedidos{
  public ID_UN: string;
  public ID_UN_ITEM: string;
  public ID_DOCUMENTO: string;
  public NOMBRE_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public DOCUMENTO: string;
  public FECHA_REGISTRO: any;
  public FECHA: any;
  public FECHA_ENTREGA: any;
  public HORA: any;
  public ID_CLIENTE: string;
  public NOMBRE_CLIENTE: string;
  public ID_ADC: string;
  public ID_CONDICION: string;
  public DESCRIPCION: string;
  public ID_MONEDA: string;
  public TASA_CAMBIO: number;
  public VIGENCIA: any;
  public ID_DOC_SOPORTE: string;
  public NC_DOC_SOPORTE: number;
  public FECHA_AUTORIZACION: any;
  public CUOTA_INICIAL: number;
  public PLAZO: number;
  public CONDICIONES_GENERALES: string;
  public SUB_TOTAL: number;
  public VALOR_DESCUENTO: number;
  public GRAVAMENES: string;
  public VALOR_COSTOS: number;
  public TOTAL: number;
  public TIPO_VENTA: string;
  public VALOR_CUOTA: number;
  public VALOR_PRIMER_CUOTA: number;
  public FECHA_PRIMER_VENC: any;
  public DIAS_CUOTA: number;
  public UM_DIAS_CUOTA: string;
  public USUARIO: string;
  public ESTADO: string;
  public VALOR_FIN_COSTOS: number;
  public FECHA_OC: any;
  public ID_UBICACION: string;
  public ID_DIRECCION: number;
}

export class clsPedidosItems{
  public ID_UN: string;
  public ID_UN_ITEM: string;
  public ID_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public ITEM: number;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public ID_SOPORTE: string;
  public NC_PREFIJO: string;
  public NC_CONSECUTIVO: number;
  public NC_SUFIJO: string;
  public CANTIDAD: number;
  public CANTIDAD_AUTORIZADA: number;
  public CANTIDAD_PENDIENTE: number;
  public VALOR_BASE: number;
  public VALOR_UNITARIO: number;
  public SUB_TOTAL: number;
  public VALOR_DESCUENTO: number;
  public VALOR_COSTOS: number;
  public VALOR_IVA: number;
  public GRAVAMENES: string;
  public TOTAL: number;
}

export class clsPedidosGrav{
  public ID_UN: string;
  public ID_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public ITEM: number;
  public APLICACION: number;
  public ID_TASA: string;
  public POR_TASA: number;
  public VALOR: number;
  public BASE: number;
}