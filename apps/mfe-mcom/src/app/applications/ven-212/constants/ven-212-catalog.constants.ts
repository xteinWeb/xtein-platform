/**
 * Catalog routes and query actions for VEN-212 (Facturación).
 */
export const Ven212Catalog = {
  documents: ['/ADM007/consulta', 'DOCUMENTOS CONSECUTIVO'],
  clients: ['/VEN001/consulta', 'CLIENTES'],
  addresses: ['/VEN001/consulta', 'DIRECCIONES CLIENTE'],
  sellers: ['/VEN006/consulta', 'ADC'],
  saleTypes: ['/ADM012/consulta', 'ITM_DOMINIOS'],
  bancos: ['/CXP201/consulta', 'BANCOS'],
  units: ['/ADM002/consulta', 'UNIDADES NEGOCIOS'],
  warehouses: ['/INV002/consulta', 'BODEGAS'],
  currencies: ['/ADM004/consulta', 'MONEDAS'],
  conditions: ['/VEN212/consulta', 'CONDICIONES LISTAS'],
  products: ['/PRO022/consulta', 'PRODUCTOS LISTA PRECIOS'],
  defaultUnit: ['/ADM015/consulta', 'UN DEFECTO'],
  specifications: ['/ADM011/consulta', 'ESPECIFICACIONES'],
  settings: ['/generales/consulta', 'settings_aplicacion'],
  additionalData: ['/VEN212/consulta', 'consulta adicionales']
} as const;

export type Ven212CatalogKey = keyof typeof Ven212Catalog;

/**
 * Backend business actions for VEN-212.
 */
export const Ven212BusinessAction = {
  taxes: 'GRAVAMENES',
  quantity: 'actualizar cantidad',
  stock: 'EXISTENCIAS PRODUCTO',
  settings: 'acciones settings',
  load: 'cargar datos'
} as const;
