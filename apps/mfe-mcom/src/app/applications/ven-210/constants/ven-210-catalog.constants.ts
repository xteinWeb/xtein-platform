/** Routes and actions used by VEN-210 (see docs/contratos/ven-210-spRemision.md). */
export const Ven210Catalog = {
 documents: ['/ADM007/consulta', 'DOCUMENTOS CONSECUTIVO'],
 clients: ['/VEN001/consulta', 'CLIENTES'],
 addresses: ['/VEN001/consulta', 'DIRECCIONES CLIENTE'],
 sellers: ['/VEN006/consulta', 'ADC'],
 saleTypes: ['/ADM012/consulta', 'ITM_DOMINIOS'],
 units: ['/ADM002/consulta', 'UNIDADES NEGOCIOS'],
 currencies: ['/ADM004/consulta', 'MONEDAS'],
 conditions: ['/VEN210/consulta', 'CONDICIONES LISTAS'],
 products: ['/VEN210/consulta', 'PRODUCTOS REMISION'],
 specifications: ['/ADM011/consulta', 'ESPECIFICACIONES'],
 defaultUnit: ['/ADM015/consulta', 'UN DEFECTO']
} as const;
export const Ven210BusinessAction = {
 stock: 'EXISTENCIAS PRODUCTO', warehouseStock: 'EXISTENCIAS BODEGAS',
 pendingOrders: 'PEDIDOS PENDIENTES', loadOrder: 'CARGAR PEDIDO', advances: 'ANTICIPOS CLIENTE'
} as const;
