export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsPrefacturas{
  public ID_UN: string;
  public ID_UN_ITEM: string;
  public ID_DOCUMENTO: string;
  public NOMBRE_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public DOCUMENTO: string;
  public DOCUMENTO_FAC: string;
  public FECHA_REGISTRO: any;
  public FECHA: any;
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
  public DIRECCION: string;
  public ID_UN_BODEGA: string;
  public CUFE: string;
  public VALOR_BASE: number;
}

export class clsPrefacturasPagos{
  public ITEM: number;
  public ID_RECAUDO: string;
  public NC_RECAUDO: string;
  public FECHA: Date;
  public ID_Prefactura: string;
  public NC_Prefactura: string;
  public SALDO: number;
  public VALOR: number;
}

export class clsPrefacturasItems{
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
  public SOPORTE: string;
  public CANTIDAD: number;
  public CANTIDAD_AUTORIZADA: number;
  public CANTIDAD_PENDIENTE: number;
  public VALOR_BASE: number;
  public VALOR_UNITARIO: number;
  public SUB_TOTAL: number;
  public VALOR_DESCUENTO: number;
  public VALOR_COSTOS: number;
  public VALOR_IVA: number;
  public POR_IVA: number;
  public GRAVAMENES: string;
  public GRAV_TOTAL: number;
  public GRAV_ORG: any;
  public TOTAL: number;
  public UDM_VENTA: string;
  public FECHA: any;
  public ESTADO: string;
}

export class clsPrefacturasGrav{
  public ID_UN: string;
  public ID_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public ITEM: number;
  public APLICACION: number;
  public ID_TASA: string;
  public CLASE: string;
  public POR_TASA: number;
  public VALOR: number;
  public BASE: number;
}
export class clsPrefacturaGravAux {
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
