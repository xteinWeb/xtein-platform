import { Binary } from "@angular/compiler";

export class IData {
	public storage: any;
}

export class ILista {
	public ID: string;
	public SQL: string;
	public storage: any;

	public constructor() {}
}

export class clsUsuarios{
  public USUARIO: string;
  public NOMBRE: string;
  public ID_ROL: string;
  public FECHA_CREACION: any;
  public CLAVE_PRIMARIA: string;
  public CLAVE_SECUNDARIA: string;
  public CLAVE_TERCIARIA: string;
  public EXPIRAR: boolean;
  public EXPIRARstr: string;
  public TIEMPO_INTERVALO: number;
  public INTERVALO: number;
  public CAMBIAR_CLAVE: boolean;
  public ESTADO: string;
  public FECHA_CONFIGURACION: any;
  public IMAGEN: any;
  public EMAIL: any;
  public TIEMPO_SESION: number;

  public constructor() {}
}

export class clsAutorizaciones{
  public ITEM: number;
  public ID_UN: string;
  public USUARIO: string;
  public ID_APLICACION: string; 
  public CREAR: boolean;
  public MODIFICAR: boolean;
  public ELIMINAR: boolean;
  public BUSCAR: boolean;
  public LISTAR: boolean;
  public EXCLUSIVA: boolean;
  public CONFIGURAR: boolean;
  public NOMBRE: string;
  public S_NIVEL: number;
  public S_CLAVE: string;
  public S_ABRIR: boolean;
  public S_CREAR: boolean;
  public S_MODIFICAR: boolean;
  public S_ELIMINAR: boolean;
  public S_BUSCAR: boolean;
  public S_LISTAR: boolean;
  public S_APROBAR: boolean;
  public A_NIVEL: number;
  public A_CLAVE: string;
  public A_ABRIR: boolean;
  public A_CREAR: boolean;
  public A_MODIFICAR: boolean;
  public A_ELIMINAR: boolean;
  public A_BUSCAR: boolean;
  public A_LISTAR: boolean;
  public A_APROBAR: boolean;

  public constructor(){}
}

export class clsPermisosEspeciales{
  public ITEM: number;
  public ID_UN: string;
  public USUARIO: string;
  public TRANSACCION: string;
  public NOMBRE: string;
  public PERMISO: boolean;
  public APROBACION: boolean;

  public constructor(){}
}

export class clsUN_Asociadas{
  public ITEM: number;
  public ID_UN: string;
  public ID_UN_ASOCIADA: string;
  public USUARIO: string;
  public NOMBRE: string;
  public VALOR_DEFECTO: boolean;

  public constructor(){}
}

export class clsConexiones{
  public ITEM: number;
  public USUARIO: string;
  public ID_CONEXION: string;
  public ULTIMA: boolean;
  public ULTIMA_UN: string;

  public constructor(){}
}
export class clsSAplicaciones{
  public ITEM: number;
  public ID_APLICACION: string;
  public NOMBRE_APLICACION: string;
  public DESCRIPCION: string;
  public ASIGNAR: boolean;

  public constructor(){}
}