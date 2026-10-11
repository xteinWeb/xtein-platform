export interface XteinTelefono {
  ID_TELEFONO?: number;
  TIPO_TELEFONO?: string | string[];
  TELEFONO?: string;
  EXTENSION?: string;
  isEdit?: boolean;
}

export interface XteinTelefonoTipo {
  TIPO: string;
}

export function telefonoTipos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(v => (typeof v === 'object' && v !== null && 'TIPO' in v ? (v as { TIPO: unknown }).TIPO : v))
      .map(v => String(v ?? '').trim())
      .filter(Boolean);
  }
  if (!value || typeof value !== 'string') return [];
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map(v => (typeof v === 'object' && v !== null && 'TIPO' in v ? (v as { TIPO: unknown }).TIPO : v))
          .map(v => String(v ?? '').trim())
          .filter(Boolean);
      }
    } catch {
      /* preserve the stored label */
    }
  }
  return value.split(',').map(v => v.trim()).filter(Boolean);
}
