import { estados0 } from "src/app/shared/classes/estados";

export class IData {
	public storage: any;
}
export class ILista {
	public ID: string;
	public SQL: string;
	public storage: any;

	public constructor() {}
}

export class clsProductos {
	public PRODUCTO: string;
	public PRO_CONSECUTIVO: number;
	public NOMBRE: string;
	public CLASE: string;
	public ETAPA: string;
	public ID_GRUPO: string;
	public TIPO_MARCA: string;
	public MARCA: string;
	public MODELO: string;
	public NUMERO_PARTE: string;
	public PERFIL_TRIBUTARIO: any;
	public INVENTARIO: boolean;
	public BODEGA: boolean;
	public COMENTARIOS: string;
	public ESTADO: estados0;
	public CONTROL_SERIAL: boolean;
	public CAMBIAR_NOMBRE: boolean;
	public VALOR_NEGATIVO: boolean;
	public MARGEN_RENTABILIDAD: number;
	public DOCUMENTO: string;
	public ID_UDM: string;
	public ID_UDM_PROV: any;
	public CAN_UDM: number;
	public MAXIMO: number;
	public MINIMO: number;
	public ID_PROVEEDOR: string;
	public ID_RUTA: string;
	public NOMBRE_PROVEEDOR: string;
	public PRO_ATRIBUTOS: any;
	public PRO_KITS: any;
	public NUM_PARTES: number;
	public CONTROL_CAMBIOS: any;
	public CODIGO_ASOCIADO: any;
	public COD_ASOCIADO: any;

	public constructor() {}
}

export class clsAtributos {
	public ITEM: number;
	public CODIGO: string;
	public NOMBRE: string;
	public CODIGO_NOMBRE: string;
	public CLASE: string;
	public ESTADO: string;
	public ITM_ATRIBUTOS: any;
	public REFERENCIA: string;
	public NOMBRE_PARTE: string;
	public ORDEN: number;
	public isEdit: boolean;

	public constructor() {}
}

export class clsProAtributos {
	public ITEM: number;
	public ATRIBUTO: string;
	public NOMBRE: string;
	public CODIGO_NOMBRE: string;
	public DETALLE: string;
	public VALOR: string;
	public isEdit: boolean;
	public isSelecc: boolean;
	public ErrMensaje: string;

	public constructor() {}
}

export class clsPartes2 {
	public KEY_PARTE: number;
	public KEY_PARTE_PADRE: number;
	public ID_PARTE: string;
	public ID_PARTE_PADRE: string;
	public NOMBRE: string;
	public CLASE: string;
	public ID_GRUPO: string;
	public TIPO_MARCA: string;
	public MARCA: string;
	public PERFIL_TRIBUTARIO: any;
	public INVENTARIO: boolean;
	public BODEGA: boolean;
	public ESTADO: string;
	public CONTROL_SERIAL: boolean;
	public ID_UDM: string;
	public CANTIDAD: number;
	public ErrMensaje: string;

	public constructor() {}
}

export class clsPartes {
	public ITEM: number;
	public ID_PARTE: string;
	public NOMBRE_PARTE: string;
	public ATRIBUTO: string;
	public ESTADO: string;
	public ID_UDM: string;
	public CANTIDAD: number;
	public esEdit: boolean;
	public ErrMensaje: string;

	public constructor() {}
}

export class clsProductosPartes {
	public KEY_PARTE: number;
	public KEY_PARTE_PADRE: number;
	public ID_PARTE: string;
	public NOMBRE: string;

	public constructor() {}
}

export class clsProProveedores {
	public ITEM: number;
	public ID_PROVEEDOR: string;
	public NOMBRE: string;
	public REFERENCIA: string;
	public PRECIO: number;
	public FECHA_NEGOCIADO: Date;
	public TIEMPO_ENTREGA: number;
	public PERIODO_ENTREGA: string;
	public ID_MONEDA: string;
	public ULTIMA_ENTRADA: Date
	public ErrMensaje: string;

	public constructor() {}
}

export class clsCombos {
	public ITEM: number;
	public PRODUCTO_KIT: string;
	public NOMBRE: string;
	public CANTIDAD: number;
	public OBLIGATORIO: boolean;
	public ATRIBUTO: string;

	public constructor() {}
}

export class clsBodegas {
	public ITEM: number;
	public MAXIMO: number;
	public MINIMO: number;
	public ID_UN_BODEGA: string;
	public DESCRIPCION: string;
	public UBICACION: string;

	public constructor() {}
}

export class clsCubicaje {
	public ITEM: number;
	public CONCEPTO: string;
	public CANTIDAD: number;
	public CATEGORIA: string;
	public DE_ALTO: number;
	public DE_LARGO: number;
	public DE_ANCHO: number;
	public DE_VOLUMEN: number;
	public EM_ALTO: number;
	public EM_LARGO: number;
	public EM_ANCHO: number;
	public EM_VOLUMEN: number;
	public CUBICAJE_NETO: number;
	public PESO: number;
	public PESO_TOTAL: number;
	public REFERENCIA: string;
	public NOMBRE_PARTE: string;
	public isEdit: boolean;

	public constructor() {}
}
export class clsDocumentacion {
	public ITEM: number;
	public DOCUMENTO: string;
	public ARCHIVO: string;
	public FECHA: Date;
	public base64Data: any;

	public constructor() {}
}

export class clsUnidadesMedida {
	public ITEM: number;
	public UDM_COMPRA: string;
	public DESC_COMPRA: string;
	public CAN_PRESENTACION: number;
	public UDM_EQUIV: string;
	public DESC_EQUIV: string;
	public CAN_EQUIV: number;
	public ESTADO: string;
	public DETALLE: string;
	public CODIGO_ASOCIADO: string;
	public CODIGO_BARRAS: string;
	public CONSEC_BARRAS: number;

	public constructor() {}
}

