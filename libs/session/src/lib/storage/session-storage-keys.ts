/**
 * Legacy browser storage keys currently used by XTEIN.
 *
 * These keys are intentionally preserved during the migration so that
 * legacy modules and the new platform can coexist while applications
 * are migrated progressively.
 */
export const SESSION_STORAGE_KEYS = {
  email: 'email',
  userId: 'usuario',
  userName: 'user_name',
  companyId: 'empresa',
  companyName: 'nombre empresa',
  associatedUnitId: 'ID_UN_ASOCIADA',
  profilePhoto: 'foto_perfil_user',
  token: 'token',
  sessionTimeoutSeconds: 'TIEMPO_SESION'
} as const;