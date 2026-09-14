export class clsAcreedores {
	public ID_PROVEEDOR: any;
	public ESTADO: string;
  	public ID_LEGAL: any;
	public NOMBRE: any;
	public NOMBRE2: any;
	public NOMBRE_COMPLETO: any;
	public APELLIDO: any;
	public APELLIDO2: any;
	public APELLIDO_COMPLETO: any;
	public TIPO: any;
	public TIPO_ID: any;
	public PERSONA: any;
	public PERFIL_TRIBUTARIO: any;
	public PERFIL_TASAS: any;
	public ID_GRUPO: any;
	public CONTACTO: any;
	public NOMBRE_CONTACTO: any;
	public REPRESENTANTE: any;
	public CLASE: string;
	public COMENTARIOS: any;
	public FECHA_REGISTRO: Date;
	public RT: any;

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
