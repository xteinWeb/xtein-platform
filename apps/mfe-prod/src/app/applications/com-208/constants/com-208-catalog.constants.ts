/**
 * [endpoint, acción] de los catálogos y acciones de negocio de COM-208.
 * Las acciones de /COM208/consulta las resuelve spMovimientosConsumos (o las delega a spMovimientosInv).
 */
export const Com208Catalog = {
  documents: ['/COM208/consulta', 'DOCUMENTOS CONSECUTIVO'],
  types: ['/COM208/consulta', 'TIPO MOVIMIENTOS USUARIO'],
  warehouses: ['/COM208/consulta', 'UN MOVIMIENTOS'],
  products: ['/PRO022/consulta', 'PRODUCTOS'],
  sections: ['/COM208/consulta', 'SECCIONES PRODUCTO'],
  itemProducts: ['/PRO022/consulta', 'PRODUCTOS COMPRAS'],
  specifications: ['/ADM011/consulta', 'ESPECIFICACIONES']
} as const;

export const Com208BusinessAction = {
  materials: ['/COM208/consulta', 'MATERIALES PRODUCTO'],
  stock: ['/COM208/consulta', 'EXISTENCIAS PRODUCTO'],
  taxes: ['/COM200/consulta', 'GRAVAMENES'],
  additional: ['/COM208/consulta', 'consulta adicionales']
} as const;
