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

export function direccionTipos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(v => (typeof v === 'object' && v !== null && 'TIPO' in v ? (v as { TIPO: unknown }).TIPO : v))
      .map(v => String(v ?? '').trim())
      .filter(Boolean);
  }
  if (!value || typeof value !== 'string') return [];
  // Records may contain the array serialized by the backend.
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map(v => (typeof v === 'object' && v !== null && 'TIPO' in v ? (v as { TIPO: unknown }).TIPO : v))
          .map(v => String(v ?? '').trim())
          .filter(Boolean);
      }
    } catch { /* preserve the stored label */ }
  }
  return value.split(',').map(v => v.trim()).filter(Boolean);
}
