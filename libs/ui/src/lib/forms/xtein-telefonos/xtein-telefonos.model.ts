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

export function telefonoTipos(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return [...value];
  if (!value) return [];
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string');
    } catch {
      /* preserve the stored label */
    }
  }
  return value.split(',').map(v => v.trim()).filter(Boolean);
}
