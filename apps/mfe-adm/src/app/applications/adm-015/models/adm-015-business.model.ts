import {
  Adm015UsuarioRecord,
  Adm015AutorizacionRecord,
  Adm015PermisoEspecialRecord,
  Adm015UNAsociadaRecord,
  Adm015ConexionRecord,
  Adm015SettingAplicacionRecord
} from './adm-015.model';

export interface Adm015SavePayload {
  USUARIOS: Adm015UsuarioRecord;
  AUTORIZACIONES: Adm015AutorizacionRecord[];
  PERMISOS_ESPECIALES: Adm015PermisoEspecialRecord[];
  UN_ASOCIADAS: Adm015UNAsociadaRecord[];
  CONEXIONES: Adm015ConexionRecord[];
  SETTINGS: Adm015SettingAplicacionRecord[];
}

export interface Adm015ChangePasswordPayload {
  USUARIO: string;
  PASSWORD: string;
  TIPO: 'USUARIO' | 'ADMINISTRADOR';
}
