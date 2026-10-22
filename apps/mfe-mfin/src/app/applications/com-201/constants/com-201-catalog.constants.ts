/** Routes and actions verified against the legacy COM-201 application. */
export const Com201Catalog = {
  providers: ['/PRO022/consulta', 'PROVEEDORES'],
  groups: ['/PRO022/consulta', 'GRUPOS'],
  products: ['/PRO022/consulta', 'PRODUCTOS'],
  attributes: ['/PRO022/consulta', 'atributos simples'],
  units: ['/PRO022/consulta', 'UDM PRES'],
  specifications: ['/ADM011/consulta', 'ESPECIFICACIONES']
} as const;
