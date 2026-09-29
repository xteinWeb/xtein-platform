/** Routes and actions verified against the active legacy VEN-229 application. */
export const Ven229Catalog = {
  documents: ['/ADM007/consulta', 'DOCUMENTOS CONSECUTIVO'],
  clients: ['/VEN001/consulta', 'CLIENTES'],
  addresses: ['/VEN001/consulta', 'DIRECCIONES CLIENTE'],
  sellers: ['/VEN006/consulta', 'ADC'],
  saleTypes: ['/ADM012/consulta', 'ITM_DOMINIOS'],
  units: ['/ADM002/consulta', 'UNIDADES NEGOCIOS'],
  warehouses: ['/INV002/consulta', 'BODEGAS'],
  currencies: ['/ADM004/consulta', 'MONEDAS'],
  conditions: ['/VEN229/consulta', 'CONDICIONES LISTAS'],
  products: ['/PRO022/consulta', 'PRODUCTOS LISTA PRECIOS'],
  specifications: ['/ADM011/consulta', 'ESPECIFICACIONES'],
  defaultUnit: ['/ADM015/consulta', 'UN DEFECTO'],
  settings: ['/generales/consulta', 'settings_aplicacion']
} as const;

export const Ven229BusinessAction = {
  taxes: 'GRAVAMENES',
  quantity: 'actualizar cantidad',
  stock: 'EXISTENCIAS PRODUCTO',
  settings: 'acciones settings',
  load: 'cargar datos'
} as const;
