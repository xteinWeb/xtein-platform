import { Adm015AutorizacionRecord } from './adm-015.model';

export interface Adm015AvailableApplication {
  ID_APLICACION: string;
  NOMBRE: string;
  TIPO_SISTEMA?: string;
}

export interface Adm015AuthorizationDraft extends Adm015AutorizacionRecord {
  originalApplicationId?: string;
}

export type Adm015PermissionField = 'CREAR' | 'MODIFICAR' | 'ELIMINAR' | 'BUSCAR' | 'LISTAR' |
  'CONFIGURAR' | 'S_ABRIR' | 'S_CREAR' | 'S_MODIFICAR' | 'S_ELIMINAR' | 'S_BUSCAR' |
  'S_LISTAR' | 'A_ABRIR' | 'A_CREAR' | 'A_MODIFICAR' | 'A_ELIMINAR' | 'A_BUSCAR' | 'A_LISTAR' | 'A_APROBAR';

export interface Adm015PermissionColumn {
  field: Adm015PermissionField;
  caption: string;
  title: string;
}

export type Adm015ApplicationChoice = Adm015AvailableApplication &
  Pick<Adm015AutorizacionRecord, 'CREAR' | 'MODIFICAR' | 'ELIMINAR' | 'BUSCAR'>;
