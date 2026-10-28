import type { RecordToolbarCapabilities, RecordToolbarPermissions } from '@xtein/sdk';
import type { Cal001Permisos } from '../models/cal-001.model';

/**
 * Barra de registro de CAL-001: Nuevo, Guardar, Modificar, Cancelar, Buscar (pestaña Consulta), Refrescar y navegación.
 * Sin eliminar ni anular (historia 3), sin imprimir y sin r_configurar: CONFIGURAR se usa como "gestor de calidad"
 * (DP-3) y el botón no tendría función (plan F4, D5).
 */
export const Cal001ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
  create: true,
  edit: true,
  delete: false,
  search: true,
  refresh: true,
  copy: false,
  view: false,
  sort: false,
  navigation: true,
  download: false,
  print: false,
  configure: false
};

/** Permisos de la barra a partir de la acción `permisos` del SP (no de los permisos genéricos de la plataforma). */
export function permisosBarra(permisos: Cal001Permisos | null): RecordToolbarPermissions {
  return {
    create: Number(permisos?.PUEDE_CREAR) === 1,
    edit: Number(permisos?.ES_GESTOR) === 1,
    delete: false,
    search: Number(permisos?.PUEDE_VER) === 1,
    print: false,
    configure: false
  };
}
