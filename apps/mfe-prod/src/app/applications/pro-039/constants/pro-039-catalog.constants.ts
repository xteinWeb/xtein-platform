/**
 * [endpoint, acción] de los catálogos y acciones de negocio de PRO-039.
 * Las acciones de /PRO039/consulta las resuelve spMovimientosConsumos (o las delega a spMovimientosInv).
 */
export const Pro039Catalog = {
  documents: ['/PRO039/consulta', 'DOCUMENTOS CONSECUTIVO'],
  types: ['/PRO039/consulta', 'TIPO MOVIMIENTOS USUARIO'],
  warehouses: ['/PRO039/consulta', 'UN MOVIMIENTOS'],
  products: ['/PRO039/consulta', 'PRODUCTOS CONSUMO'],
  components: ['/PRO039/consulta', 'COMPONENTES PRODUCTO'],
  sections: ['/PRO039/consulta', 'SECCIONES PRODUCTO'],
  itemProducts: ['/PRO022/consulta', 'PRODUCTOS COMPRAS'],
  specifications: ['/ADM011/consulta', 'ESPECIFICACIONES']
} as const;

export const Pro039BusinessAction = {
  materials: ['/PRO039/consulta', 'MATERIALES PRODUCTO'],
  stock: ['/PRO039/consulta', 'EXISTENCIAS PRODUCTO'],
  taxes: ['/COM200/consulta', 'GRAVAMENES'],
  additional: ['/PRO039/consulta', 'consulta adicionales']
} as const;
