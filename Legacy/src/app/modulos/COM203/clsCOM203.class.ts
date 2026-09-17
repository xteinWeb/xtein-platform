export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsMovimientos{
  public ID_UN: string;
  public MOVIMIENTO: string;
  public TIPO: string;
  public ID_DOCUMENTO: string;
  public NOMBRE_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public DOCUMENTO: string;
  public FECHA: any;
  public FECHA_REGISTRO: any;
  public FECHA_VENCIMIENTO: any;
  public HORA: any;
  public ID_PROVEEDOR: string;
  public PROVEEDOR: string;
  public ID_CLIENTE: string;
  public NOMBRE_CLIENTE: string;
  public ID_UN_ORIGEN: string;
  public ORIGEN: string;
  public ID_UN_DESTINO: string;
  public DESTINO: string;
  public ID_ADC: string;
  public ID_CONDICION: string;
  public DETALLE: string;
  public ID_MONEDA: string;
  public TASA_CAMBIO: number;
  public PLAZO: number;
  public VIGENCIA: any;
  public TIPO_INVENTARIO: string;
  public TIPO_COMPRA: string;
  public ID_SOPORTE: string;
  public NC_SOPORTE: number;
  public NC_DOC_SOPORTE: number;
  public SUB_TOTAL: number;
  public VALOR_DESCUENTO: number;
  public GRAVAMENES: string;
  public TOTAL: number;
  public USUARIO: string;
  public ESTADO: string;
  public FACTURA: string;
  public TOTALES: any;
  public ID_APLICACION: string;
}

export class clsMovimientosItems{
  public ID_UN: string;
  public ID_UN_ITEM: string;
  public ID_DOCUMENTO: string;
  public PREFIJO: string;
  public CONSECUTIVO: number;
  public SUFIJO: string;
  public ITEM: number;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public PRODUCTO_KIT: string;
  public ID_SOPORTE: string;
  public NC_PREFIJO: string;
  public NC_CONSECUTIVO: number;
  public NC_SUFIJO: string;
  public SOPORTE: string;
  public TIPO_INVENTARIO: string;
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
  public UDM_PRES: string;
  public UDM_PRESENTACION: string;
  public CANTIDAD_PRES: string;
  public UDM_EQUIV: string;
  public CANTIDAD_EQUIV: string;
  public CANTIDAD_REAL: number;
} 

export class clsMovimientosGrav{
  public ITEM: number;
  public ID_TASA: string;
  public POR_TASA: number;
  public VALOR: number;
  public BASE: number;
  public DESCRIPCION: string;
}

export class clsMovimientosGravItems {
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

export class clsSerialesMov {
  public ITEM: number;
  public PRODUCTO: string;
  public ATRIBUTO: string;
  public SERIAL: any;
  public LOTE: any;
  public FECHA_VENCIMIENTO: Date;
  public isEdit: boolean;
}


export class RespuestaConfig {
  RECEPCION: any[];
  LISTA_OC: any[];
  ErrMensaje?: string;

  constructor(datos?: any) {
    // Si recibimos datos, los asignamos; si no, inicializamos arrays vacíos
    this.RECEPCION = datos?.RECEPCION || [];
    this.LISTA_OC = datos?.LISTA_OC || [];
    this.ErrMensaje = datos?.ErrMensaje || '';
  }

  // Ejemplo de método útil: Verificar si tiene datos
  hasData(): boolean {
    return this.RECEPCION.length > 0 || this.LISTA_OC.length > 0;
  }

  // Ejemplo: Obtener solo el título de la acción
  getTituloAccion(): string {
    return this.RECEPCION[0]?.titulo || '';
  }

    getTypeAccion(): string {
    return this.RECEPCION[0]?.tipoAccion || '';
  }
}