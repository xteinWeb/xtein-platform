/** Routes and actions verified against the active legacy application for VEN-209. */
export const Ven209Catalog = {
  idLegales: ['/ADM205/consulta', 'ID LEGALES'],
  especificaciones: ['/ADM011/consulta', 'ESPECIFICACIONES'],
  zonas: ['/ADM006/consulta', 'consulta'],
  adc: ['/VEN006/consulta', 'ADC'],
  status: ['/VEN209/consulta', 'STATUS'],
  perfilesTributarios: ['/generales/consulta', 'PIV PERFIL TRIBUTARIO'],
  rt: ['/generales/consulta', 'REPRESENTACION TRIBUTARIA'],
  grupos: ['/ADM203/consulta', 'ARBOL GRUPOS'],
  validarExiste: ['/VEN209/consulta', 'EXISTE CLIENTE'],
  tiposDireccion: ['/ADM006/consulta', 'TIPOS DIRECCION'],
  ciudades: ['/ADM006/consulta', 'CIUDADES'],
  barrios: ['/ADM006/consulta', 'BARRIOS'],
  dependientes: ['/ADM006/consulta', 'DEPENDIENTES'],
  condiciones: ['/VEN003/consulta', 'CONDICIONES']
} as const;

export const Ven209BusinessAction = {
  query: 'consulta',
  save: 'save',
  delete: 'delete'
} as const;
