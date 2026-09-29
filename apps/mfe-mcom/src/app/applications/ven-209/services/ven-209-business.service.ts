import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Ven209Service } from './ven-209.service';
import { Ven209Catalog } from '../constants/ven-209-catalog.constants';
import { Ven209Application } from '../constants/ven-209.constants';
import {
  Ven209ClienteRecord,
  Ven209ContactoAdicional,
  Ven209Direccion,
  Ven209Email,
  Ven209Lookup,
  Ven209Telefono,
  Ven209Condicion
} from '../models/ven-209.model';
import { Ven209SavePayload } from '../models/ven-209-business.model';

@Injectable()
export class Ven209BusinessService {
  private readonly api = inject(Ven209Service);
  private readonly session = inject(SessionService);

  get identity() {
    return {
      ID_APLICACION: Ven209Application.Id,
      USUARIO: this.session.current?.userId ?? ''
    };
  }

  decode<T>(response: unknown): T[] {
    let data = response;
    for (let depth = 0; depth < 4; depth++) {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          continue;
        } catch {
          break;
        }
      }
      if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
        data = (data as { data: unknown }).data;
        continue;
      }
      break;
    }
    const rows = Array.isArray(data) ? data : data == null ? [] : [data];
    const error = rows.find(row => row && typeof row === 'object' && 'ErrMensaje' in row && row.ErrMensaje);
    if (error) {
      throw new Error(String((error as { ErrMensaje: unknown }).ErrMensaje));
    }
    return rows as T[];
  }

  async catalog(name: keyof typeof Ven209Catalog, data: unknown): Promise<Ven209Lookup[]> {
    const [endpoint, action] = Ven209Catalog[name];
    const decoded = this.decode<unknown>(await firstValueFrom(this.api.request(endpoint, action, data)));
    if (name === 'idLegales' && decoded.length > 0) {
      const first = decoded[0] as Record<string, unknown>;
      if (first && typeof first === 'object' && 'ID_LEGALES' in first && Array.isArray(first['ID_LEGALES'])) {
        return first['ID_LEGALES'] as Ven209Lookup[];
      }
    }
    return decoded as Ven209Lookup[];
  }

  async loadIdLegalesWithTypes(): Promise<{
    idLegales: Ven209Lookup[];
    tiposId: string[];
    personas: string[];
  }> {
    const [endpoint, action] = Ven209Catalog.idLegales;
    const decoded = this.decode<unknown>(await firstValueFrom(this.api.request(endpoint, action, {})));
    const first = decoded[0] as Record<string, unknown> | undefined;
    let idLegales: Ven209Lookup[] = [];
    let tiposId: string[] = ['CEDULA', 'NIT', 'CC', 'CE', 'TI', 'PASAPORTE', 'RUT', 'PEP', 'PPT'];
    let personas: string[] = ['JURIDICA', 'NATURAL'];

    if (first && typeof first === 'object') {
      if ('ID_LEGALES' in first && Array.isArray(first['ID_LEGALES'])) {
        idLegales = first['ID_LEGALES'] as Ven209Lookup[];
      } else if (Array.isArray(decoded)) {
        idLegales = decoded as Ven209Lookup[];
      }
      if ('TIPOS_ID' in first && Array.isArray(first['TIPOS_ID'])) {
        const loadedTipos = (first['TIPOS_ID'] as Array<Record<string, unknown> | string>)
          .map(t => (typeof t === 'string' ? t : (t['TIPO'] ?? t['TIPO_ID'] ?? t['ID_TIPO'] ?? String(t))))
          .map(t => String(t).trim().toUpperCase())
          .filter(Boolean);
        if (loadedTipos.length > 0) {
          tiposId = [...new Set([...tiposId, ...loadedTipos])];
        }
      }
      if ('PERSONA' in first && Array.isArray(first['PERSONA'])) {
        const loadedPersonas = (first['PERSONA'] as Array<Record<string, unknown> | string>)
          .map(p => (typeof p === 'string' ? p : (p['PERSONA'] ?? p['TIPO_PERSONA'] ?? String(p))))
          .map(p => String(p).trim().toUpperCase())
          .filter(Boolean);
        if (loadedPersonas.length > 0) {
          personas = [...new Set([...personas, ...loadedPersonas])];
        }
      }
    } else {
      idLegales = decoded as Ven209Lookup[];
    }
    return { idLegales, tiposId, personas };
  }

  async loadPerfilesTributarios(): Promise<{
    perfilTributario: Record<string, unknown>[];
    listaTasas: Array<{
      ID_TASA: string;
      DESCRIPCION?: string;
      PORCENTAJE?: number;
      VALOR_BASE?: number;
      APLICA_BASE?: boolean;
      CLASE?: string;
    }>;
    columnas: Array<{ dataField: string; caption: string }>;
  }> {
    const [endpoint, action] = Ven209Catalog.perfilesTributarios;
    const decoded = this.decode<Record<string, unknown>>(await firstValueFrom(this.api.request(endpoint, action, {})));
    const first = decoded[0] || {};
    const perfilTributario = (first['PERFIL_TRIBUTARIO'] as Record<string, unknown>[]) || [];
    const rawTasas = (first['LISTA_TASAS'] as Array<Record<string, unknown>>) || [];
    const listaTasas = rawTasas.map(t => ({
      ...t,
      ID_TASA: String(t['ID_TASA'] || ''),
      DESCRIPCION: String(t['DESCRIPCION'] || ''),
      CLASE: String(t['CLASE'] || ''),
      PORCENTAJE: typeof t['PORCENTAJE'] === 'number' ? Number(t['PORCENTAJE']) * 100 : Number(t['PORCENTAJE'] || 0),
      VALOR_BASE: Number(t['VALOR_BASE'] || 0),
      APLICA_BASE: Boolean(t['APLICA_BASE'])
    }));

    let columnas: Array<{ dataField: string; caption: string }> = [];
    const rawCols = perfilTributario.length > 0 ? (perfilTributario[0]['COLUMNAS'] || (perfilTributario[0] as any)['columnas']) : null;
    if (rawCols) {
      try {
        const jsonStr = String(rawCols).replace(/'/g, '"');
        columnas = JSON.parse(jsonStr);
      } catch {
        try {
          columnas = JSON.parse(String(rawCols));
        } catch {
          columnas = [];
        }
      }
    }
    return { perfilTributario, listaTasas, columnas };
  }

  validate(
    record: Partial<Ven209ClienteRecord>,
    emails: Ven209Email[] = [],
    direcciones: Ven209Direccion[] = []
  ): string {
    const missing: string[] = [];

    if (!record.ID_CLIENTE?.trim()) missing.push('Código');
    if (record.ID_LEGAL === null || record.ID_LEGAL === undefined || record.ID_LEGAL === '') missing.push('Id Legal');
    if (!record.NOMBRE?.trim()) missing.push('Primer Nombre');
    if (!record.APELLIDO?.trim()) missing.push('Primer Apellido');
    if (!record.TIPO_ID?.trim()) missing.push('Tipo de Identificación');
    if (!record.PERSONA?.trim()) missing.push('Tipo Persona (Nat/Jur)');
    if (!record.ID_GRUPO?.trim()) missing.push('Grupo');
    if (!record.CLASE?.trim()) missing.push('Clase');
    if (!record.PERFIL_TRIBUTARIO?.trim()) missing.push('Perfil Tributario');
    if (!record.RT || (Array.isArray(record.RT) && record.RT.length === 0)) missing.push('Representación Tributaria');

    if (missing.length > 0) {
      return 'Faltan campos obligatorios: ' + missing.join(', ');
    }

    if (!emails || emails.length === 0) {
      return 'Debe asociar al menos un correo electrónico en Ubicaciones.';
    }

    if (!direcciones || direcciones.length === 0) {
      return 'Debe asociar al menos una dirección en Ubicaciones.';
    }

    return '';
  }

  buildSavePayload(
    record: Ven209ClienteRecord,
    direcciones: Ven209Direccion[] = [],
    telefonos: Ven209Telefono[] = [],
    emails: Ven209Email[] = [],
    condiciones: Ven209Condicion[] = [],
    contactoAdic?: Ven209ContactoAdicional
  ): Ven209SavePayload {
    const rtVal = Array.isArray(record.RT)
      ? record.RT
      : record.RT
        ? [record.RT]
        : [];

    return {
      ACREEDOR: {
        ...record,
        RT: rtVal,
        NOMBRE_COMPLETO: [record.NOMBRE, record.NOMBRE2, record.APELLIDO, record.APELLIDO2]
          .filter(Boolean)
          .join(' ')
      },
      ADIC_ACREEDORES: contactoAdic ?? { URL: '', CIIU: '' },
      EMAIL: emails,
      DIRECCIONES: direcciones,
      TELEFONOS: telefonos,
      CONDICIONES: condiciones,
      CLIENTES_EVAL: record.CLIENTES_PRO ?? [],
      BANCOS: record.BANCOS ?? [],
      USUARIO: this.identity.USUARIO,
      FECHA_REGISTRO: new Date()
    };
  }
}
