export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsOrdenCompra{
  public ID_UN: string;
  public ID_UN_DESTINO: string;
  public ID_DOCUMENTO: string;
  public NOMBRE_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public DOCUMENTO: string;
  public FECHA_REGISTRO: any;
  public FECHA_SOLICITUD: any;
  public HORA: any;
  public ID_PROVEEDOR: string;
  public NOMBRE_PROVEEDOR: string;
  public ID_ADC: string;
  public ID_CONDICION: string;
  public DESCRIPCION: string;
  public ID_MONEDA: string;
  public TASA_CAMBIO: number;
  public VIGENCIA: any;
  public TIPO_INVENTARIO: string;
  public NC_DOC_SOPORTE: number;
  public FECHA_ENTREGA: any;
  public CUOTA_INICIAL: number;
  public PLAZO: number;
  public CONDICIONES_GENERALES: string;
  public SUB_TOTAL: number;
  public VALOR_DESCUENTO: number;
  public GRAVAMENES: string;
  public VALOR_COSTOS: number;
  public TOTAL: number;
  public FECHA_PRIMER_VENC: any;
  public DIAS_CUOTA: number;
  public UM_DIAS_CUOTA: string;
  public USUARIO: string;
  public ESTADO: string;
  public FECHA_OC: any;
  public ID_UBICACION: string;
  public ID_DIRECCION: string;
  public EMAIL: string;
}

export class clsOrdenCompraItems{
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
  public GRAVAMENES: any;
  public GRAV_ORG: any;
  public GRAV_TOTAL: any;
  public TOTAL: number;
  public REFERENCIA: string;
  public DETALLE: string;
  public DOCUMENTO: string;
  public ESTADO: string;
  public COLOR_ESTADO: string;
  public UDM_COMPRA: string;
  public CANTIDAD_PRES: string;
  public UDM_EQUIV: string;
  public CANTIDAD_EQUIV: string;
  public CANTIDAD_REAL: string;
} 

export class clsOrdenCompraGrav{
  public ITEM: number;
  public ID_TASA: string;
  public POR_TASA: number;
  public VALOR: number;
  public BASE: number;
  public DESCRIPCION: string;
}

export class clsOrdenCompraGravItems {
  public ITEM: number;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public GRAV_ORG: any;
  public GRAVAMENES: any;
  public GRAV_TOTAL: any;
  public CANTIDAD: number;
  public VALOR_UNITARIO: number;
  public VALOR_DESCUENTO: number;
  public VALOR_IVA: number;
  public SUB_TOTAL: number;
  public TOTAL: number;
}
