/** Routes and actions used by VEN-213 (see docs/contratos/ven-213-spDevolucion.md). */
export const Ven213Catalog = {
 documents: ['/ADM007/consulta', 'DOCUMENTOS CONSECUTIVO'],
 clients: ['/VEN001/consulta', 'CLIENTES'],
 addresses: ['/VEN001/consulta', 'DIRECCIONES CLIENTE'],
 causes: ['/VEN213/consulta', 'CAUSAS'],
 specifications: ['/ADM011/consulta', 'ESPECIFICACIONES']
} as const;
export const Ven213BusinessAction = {
 sources: 'DOCUMENTOS ORIGEN', loadSource: 'CARGAR ORIGEN', warehouses: 'BODEGAS DEVOLUCION'
} as const;
