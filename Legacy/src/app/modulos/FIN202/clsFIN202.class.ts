export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsRecaudos{
  public ID_UN: string;
  public ID_UN_RECAUDO: string;
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
  public TIPO_PAGO: string;
  public DESCRIPCION: string;
  public ID_DOC_SOPORTE: string;
  public NC_DOC_SOPORTE: number;
  public FECHA_AUTORIZACION: any;
  public TOTAL: number;
  public SALDO: number;
  public USUARIO: string;
  public ESTADO: string;
  public FECHA_OC: any;
  public ID_UBICACION: string;
  public DIRECCION: string;
}

export class clsRecaudosPagos{
  public ITEM: number;
  public TIPO_PAGO: string;
  public TIPO_PAGO_ORDEN?: number;
  public ID_BANCO: string;
  public BANCO: string;
  public CUENTA_BANCARIA: string;
  public FECHA_EMISION: Date;
  public FECHA_VENCIMIENTO: Date;
  public SALDO: number;
  public VALOR_PAGO: number;
  public VALOR_TOTAL: number;
}

export class clsRecaudosGrav{
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
export class clsRecaudoGravAux {
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
  public CAPITAL: number;
  public INTERESES: number;

}

export class clsAbonos {
  public ITEM: number;
  public FACTURA: string;
  public ID_FACTURA: string;
  public NC_FACTURA: number;
  public CUOTA: string;
  public FECHA: Date;
  public FECHA_VENCIMIENTO: Date;
  public SALDO: number;
  public VALOR_INTERESES: number;
  public VALOR_DESCUENTO: number;
  public VALOR_TOTAL: number;
  public VALOR_PAGADO: number;
  public CAPITAL: number;
  public INTERESES: number;
}
