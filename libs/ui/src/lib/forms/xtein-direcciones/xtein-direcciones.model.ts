export interface XteinDireccion {
  ID_DIRECCION?: number;
  TIPO_DIRECCION?: string | string[];
  TIPO_NOMENCLATURA?: string;
  NOMENCLATURA?: string;
  NUMERO1?: string;
  NUMERO2?: string;
  DOMICILIO?: string;
  BARRIO?: string;
  DEPENDIENTE?: string;
  REFERENCIA?: string;
  ID_UBICACION?: string;
  CODIGO_POSTAL?: string;
  NOMBRE_UBICACION?: string;
  NOMBRE_BARRIO?: string;
  isEdit?: boolean;
}

export interface XteinDireccionTipo { TIPO: string; }
export interface XteinDireccionUbicacion { ID_UBICACION: string; NOMBRE: string; }
export interface XteinDireccionPostal { CODIGO_POSTAL: string; DETALLE: string; }

export function direccionTipos(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return [...value];
  if (!value) return [];
  // Records may contain the array serialized by the backend.
  if (value.startsWith('[')) {
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string'); } catch { /* preserve the stored label */ }
  }
  return value.split(',').map(v => v.trim()).filter(Boolean);
}
