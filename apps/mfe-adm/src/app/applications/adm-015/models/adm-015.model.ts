export interface Adm015UsuarioRecord {
  USUARIO: string;
  NOMBRE: string;
  ID_ROL: string;
  FECHA_CREACION?: string;
  CLAVE_PRIMARIA?: string;
  CLAVE_SECUNDARIA?: string;
  CLAVE_TERCIARIA?: string;
  EXPIRAR: boolean;
  EXPIRARstr?: string;
  TIEMPO_INTERVALO: number;
  INTERVALO: number;
  CAMBIAR_CLAVE: boolean;
  ESTADO: string;
  FECHA_CONFIGURACION?: string;
  IMAGEN?: string;
  EMAIL: string;
  TIEMPO_SESION?: number;
  QFILTRO?: string;
}

export interface Adm015AutorizacionRecord {
  ITEM?: number;
  ID_UN?: string;
  USUARIO?: string;
  ID_APLICACION: string;
  NOMBRE?: string;
  CREAR: boolean;
  MODIFICAR: boolean;
  ELIMINAR: boolean;
  BUSCAR: boolean;
  LISTAR: boolean;
  EXCLUSIVA?: boolean;
  CONFIGURAR?: boolean;
  S_NIVEL?: boolean | number;
  S_CLAVE?: string;
  S_ABRIR?: boolean;
  S_CREAR?: boolean;
  S_MODIFICAR?: boolean;
  S_ELIMINAR?: boolean;
  S_BUSCAR?: boolean;
  S_LISTAR?: boolean;
  S_APROBAR?: boolean;
  A_NIVEL?: boolean | number;
  A_CLAVE?: string;
  A_ABRIR?: boolean;
  A_CREAR?: boolean;
  A_MODIFICAR?: boolean;
  A_ELIMINAR?: boolean;
  A_BUSCAR?: boolean;
  A_LISTAR?: boolean;
  A_APROBAR?: boolean;
  isEdit?: boolean;
}

export interface Adm015PermisoEspecialRecord {
  ITEM?: number;
  ID_UN?: string;
  USUARIO?: string;
  TRANSACCION: string;
  NOMBRE?: string;
  PERMISO: boolean;
  APROBACION: boolean;
  isEdit?: boolean;
}

export interface Adm015UNAsociadaRecord {
  ITEM?: number;
  ID_UN?: string;
  ID_UN_ASOCIADA: string;
  USUARIO?: string;
  NOMBRE?: string;
  VALOR_DEFECTO: boolean;
  isEdit?: boolean;
}

export interface Adm015ConexionRecord {
  ITEM?: number;
  USUARIO?: string;
  ID_CONEXION: string;
  NOMBRE?: string;
  ULTIMA?: boolean;
  ULTIMA_UN?: string;
  isEdit?: boolean;
}

export interface Adm015SettingAplicacionRecord {
  ITEM?: number;
  ID_APLICACION: string;
  NOMBRE_APLICACION?: string;
  DESCRIPCION: string;
  ASIGNAR: boolean;
  isEdit?: boolean;
}

export interface Adm015Lookup {
  code: string;
  description: string;
  [key: string]: unknown;
}
