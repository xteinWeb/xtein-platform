import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Ven212Service } from './ven-212.service';
import { Ven212Catalog, Ven212BusinessAction } from '../constants/ven-212-catalog.constants';
import { Ven212Application } from '../constants/ven-212.constants';
import { Ven212Header, Ven212Lookup, Ven212TaxResult } from '../models/ven-212-business.model';
import { Ven212FacturaItem } from '../models/ven-212.model';

@Injectable()
export class Ven212BusinessService {
  private readonly api = inject(Ven212Service);
  private readonly session = inject(SessionService);

  get identity() {
    return {
      ID_APLICACION: Ven212Application.Id,
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
    const error = rows.find(row => row && typeof row === 'object' && 'ErrMensaje' in row && (row as { ErrMensaje: unknown }).ErrMensaje);
    if (error) {
      throw new Error(String((error as { ErrMensaje: unknown }).ErrMensaje));
    }
    return rows as T[];
  }

  async catalog(name: keyof typeof Ven212Catalog, data: unknown = {}): Promise<Ven212Lookup[]> {
    const [endpoint, action] = Ven212Catalog[name];
    return this.decode<Ven212Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }

  async action<T>(name: keyof typeof Ven212BusinessAction, data: unknown): Promise<T[]> {
    return this.decode<T>(await firstValueFrom(this.api.query(Ven212BusinessAction[name], data)));
  }

  taxes(header: Ven212Header, items: Ven212FacturaItem[], option?: string): Promise<Ven212TaxResult[]> {
    return this.action<Ven212TaxResult>('taxes', {
      Factura: header,
      FACTURA: header,
      ITEMS: items,
      ITM_Factura: items,
      ITM_FACTURA: items,
      ...(option === 'original' ? { OPCION_GRAV: option } : { APL_GRAV: option })
    });
  }

  validate(header: Ven212Header, items: Ven212FacturaItem[]): string {
    const fields: [keyof Ven212Header, string][] = [
      ['DOCUMENTO', 'Documento'],
      ['FECHA', 'Fecha'],
      ['ID_CLIENTE', 'Cliente'],
      ['ID_UN_ITEM', 'Unidad de negocio'],
      ['ID_MONEDA', 'Moneda'],
      ['ID_ADC', 'Vendedor'],
      ['TIPO_VENTA', 'Tipo de venta'],
      ['ID_CONDICION', 'Condición / Lista'],
      ['FECHA_PRIMER_VENC', 'Vencimiento']
    ];

    const missing = fields.filter(([key]) => !header[key]).map(([, label]) => label);
    if (missing.length) return 'Faltan datos obligatorios: ' + missing.join(', ');
    if (!items.length) return 'No se ha asociado ningún producto a la factura.';
    if (items.some(row => !row.PRODUCTO || !Number.isFinite(Number(row.CANTIDAD)) || Number(row.CANTIDAD) <= 0)) {
      return 'Complete el producto y una cantidad válida en todos los ítems.';
    }
    return '';
  }
}
