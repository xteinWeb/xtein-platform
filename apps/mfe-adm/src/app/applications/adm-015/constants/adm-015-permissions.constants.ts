import { Adm015PermissionColumn, Adm015PermissionField } from '../models/adm-015-application-permissions.model';

export const Adm015PermissionGroups: { caption: string; columns: Adm015PermissionColumn[] }[] = [
  { caption: 'Operaciones', columns: [
    { field: 'CREAR', caption: 'C', title: 'Crear' },
    { field: 'MODIFICAR', caption: 'M', title: 'Modificar' },
    { field: 'ELIMINAR', caption: 'E', title: 'Eliminar' },
    { field: 'BUSCAR', caption: 'B', title: 'Buscar' },
    { field: 'LISTAR', caption: 'L', title: 'Listar' },
    { field: 'CONFIGURAR', caption: 'OPC', title: 'Opciones Avanzadas' }
  ] },
  ...(['S', 'A'] as const).map(prefix => ({
    caption: prefix === 'S' ? 'Permisos' : 'Aprobación de Permisos',
    columns: (['ABRIR', 'CREAR', 'MODIFICAR', 'ELIMINAR', 'BUSCAR', 'LISTAR'] as const).map(action => ({
      field: `${prefix}_${action}` as Adm015PermissionField,
      caption: action[0], title: `${prefix === 'S' ? 'Permiso' : 'Aprobación'}: ${action.toLowerCase()}`
    }))
  })),
  { caption: 'Autorizar', columns: [{ field: 'A_APROBAR', caption: 'Autorizar', title: 'Autorizar' }] }
];

export const Adm015ListOperations = Adm015PermissionGroups[0].columns.slice(0, 4);
export const Adm015PermissionLegend = 'A: Abrir    B: Buscar    C: Crear    E: Eliminar    L: Listar    M: Modificar    OPC: Opciones Avanzadas';

export function oppositePermission(field: Adm015PermissionField): Adm015PermissionField | undefined {
  if (field === 'A_APROBAR') return undefined;
  if (field.startsWith('S_')) return `A_${field.slice(2)}` as Adm015PermissionField;
  if (field.startsWith('A_')) return `S_${field.slice(2)}` as Adm015PermissionField;
  return undefined;
}
