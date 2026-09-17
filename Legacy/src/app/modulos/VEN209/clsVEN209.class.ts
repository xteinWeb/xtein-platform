export class clsClientes {
	public ID_UN: string;
	public ID_CLIENTE: string;
	public ID_LEGAL: number;
	public ID_CLIENTE_PADRE: string;
	public PERFIL_TRIBUTARIO: string;
	public PERFIL_TASAS: any;
	public CLASE: string;
	public ID_GRUPO: string;
	public COMENTARIOS: string;
	public CONTACTO: string;
	public REPRESENTANTE_LEGAL: string;
	public ZONA: string;
	public ID_ADC: string;
	public STATUS: string;
	public CUPO_CREDITO: number;
	public CUPO_DISPONIBLE: number;
	public FRECUENCIA: number;
	public ESTADO: string;
	public CUPO_CUOTA: number;
	public CUPO_DIS_CUOTA: number;
	public ESTADO_CUPO: string;
	public ESTADO_CUOTA: string;
	public DESCRIPCION_CUPO: string;
	public NOMBRE_COMPLETO: string;
	public APELLIDO_COMPLETO: string;
	public NOMBRE: string;
	public NOMBRE2: string;
	public APELLIDO: string;
	public APELLIDO2: string;
	public TIPO_ID: string;
	public PERSONA: string;
	public NOMBRE_CONTACTO: string;
	public DIRECCIONES: any[];
	public TELEFONOS: any[];
	public ITM_EMAIL: any[];
	public ACTIVIDAD: string;
	public RT: any[];
	public ADIC_CLIENTES: any;
	public CONDICIONES_ADIC: any;
	public CONDICIONES: any[];

	public constructor() {}
}

export class clsUbicaciones {
	public ID_GRUPO: any;
	public NOMBRE: any;
  public ASIGNABLE: any;
	public ID_DIRECCION: any;
	public TIPO_DIRECCION: any;
	public TIPO_NOMENCLATURA: any;
	public NOMENCLATURA: any;
	public NUMERO1: any;
	public NUMERO2: any;
	public DOMICILIO: any;
	public CIUDAD: any;
	public NOM_CUIDAD: any;
	public BARRIO: any;
	public NOM_BARRIO: any;
	public REFERENCIA: any;
	public ID_TELEFONO: any;
	public TIPO_TELEFONO: any;
	public TELEFONO: any;
	public EXTENSION: any;

	public constructor() {}
}

export class clsCondicionesProv {
	public ITEM: number;
	public ID_CONDICION: any;

	public constructor() {}
}

export class clsAdicProveedores {
	public CUPO_CREDITO: number;
	public TIEMPO_ENTREGA: number;

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
