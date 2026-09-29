import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Ven229Service } from './ven-229.service';
import { Ven229Catalog, Ven229BusinessAction } from '../constants/ven-229-catalog.constants';
import { Ven229Application } from '../constants/ven-229.constants';
import { Ven229Header, Ven229Lookup, Ven229TaxResult } from '../models/ven-229-business.model';
import { Ven229PedidoItem } from '../models/ven-229.model';

@Injectable()
export class Ven229BusinessService {
  private readonly api = inject(Ven229Service);
  private readonly session = inject(SessionService);

  get identity() {
    return {
      ID_APLICACION: Ven229Application.Id,
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

  async catalog(name: keyof typeof Ven229Catalog, data: unknown = {}): Promise<Ven229Lookup[]> {
    const [endpoint, action] = Ven229Catalog[name];
    return this.decode<Ven229Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }

  async action<T>(name: keyof typeof Ven229BusinessAction, data: unknown): Promise<T[]> {
    return this.decode<T>(await firstValueFrom(this.api.query(Ven229BusinessAction[name], data)));
  }

  taxes(header: Ven229Header, items: Ven229PedidoItem[], option?: string): Promise<Ven229TaxResult[]> {
    return this.action<Ven229TaxResult>('taxes', {
      Pedido: header,
      PEDIDO: header,
      ITM_Pedido: items,
      ITM_PEDIDO: items,
      ...(option === 'original' ? { OPCION_GRAV: option } : { APL_GRAV: option })
    });
  }

  validate(header: Ven229Header, items: Ven229PedidoItem[]): string {
    const fields: [keyof Ven229Header, string][] = [
      ['DOCUMENTO', 'Documento'],
      ['FECHA', 'Fecha de entrega'],
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
    if (!items.length) return 'No se ha asociado ningún producto al pedido.';
    if (items.some(row => !row.PRODUCTO || !Number.isFinite(Number(row.CANTIDAD)) || Number(row.CANTIDAD) <= 0)) {
      return 'Complete el producto y una cantidad válida en todos los ítems.';
    }
    return '';
  }
}
