import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Com208Service } from './com-208.service';
import { Com208BusinessAction, Com208Catalog } from '../constants/com-208-catalog.constants';
import { Com208Application } from '../constants/com-208.constants';
import {
  Com208AdditionalResult,
  Com208Header,
  Com208Lookup,
  Com208Material,
  Com208ProductStock,
  Com208TaxResult
} from '../models/com-208-business.model';
import { Com208MovementGrav, Com208MovementItem, Com208Total } from '../models/com-208.model';

export interface Com208TaxLiquidation {
  items: Com208MovementItem[];
  taxes: Com208MovementGrav[];
  totals: Com208Total[];
}

@Injectable()
export class Com208BusinessService {
  private readonly api = inject(Com208Service);
  private readonly session = inject(SessionService);

  get identity() {
    return {
      ID_APLICACION: Com208Application.Id,
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

  private static readonly catalogCache = new Map<string, Com208Lookup[]>();

  clearCache(): void {
    Com208BusinessService.catalogCache.clear();
  }

  async catalog<T = Com208Lookup>(name: keyof typeof Com208Catalog, data: unknown = {}, forceRefresh = false): Promise<T[]> {
    const cacheKey = `${String(name)}_${JSON.stringify(data ?? {})}`;
    if (!forceRefresh && Com208BusinessService.catalogCache.has(cacheKey)) {
      return Com208BusinessService.catalogCache.get(cacheKey)! as T[];
    }
    const [endpoint, action] = Com208Catalog[name];
    const decoded = this.decode<Com208Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
    Com208BusinessService.catalogCache.set(cacheKey, decoded);
    return decoded as T[];
  }

  async action<T>(name: keyof typeof Com208BusinessAction, data: unknown): Promise<T[]> {
    const [endpoint, action] = Com208BusinessAction[name];
    return this.decode<T>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }

  /** Materiales de la matriz del producto/sección, con el costo de la bodega de origen (o el de la matriz). */
  async materials(product: string, section: string, originWarehouse: string): Promise<Com208MovementItem[]> {
    const rows = await this.action<Com208Material>('materials', {
      PRODUCTO: product,
      SECCION: section || '',
      ID_UN_ORIGEN: originWarehouse || '',
      ...this.identity
    });
    return rows.map((row, index) => this.newItem({
      ITEM: index + 1,
      PRODUCTO: row.PRODUCTO,
      NOMBRE_PRODUCTO: row.NOMBRE ?? '',
      UDM: row.UDM || 'UND',
      UDM_PRES: row.UDM || 'UND',
      UDM_PRESENTACION: row.UDM || 'UND',
      UDM_EQUIV: row.UDM || 'UND',
      CONSUMO_BASE: Number(row.CONSUMO || 0),
      CANTIDAD: Number(row.CONSUMO || 0),
      VALOR_UNITARIO: Number(row.VALOR_UNITARIO || 0),
      ES_MATRIZ: true
    }));
  }

  /**
   * Producto agregado manualmente: igual que COM-203 ('EXISTENCIAS PRODUCTO'), valida que esté asociado
   * a la bodega de origen y trae nombre, costo y presentación.
   */
  async productItem(product: string, header: Com208Header, item: number): Promise<Com208MovementItem> {
    const rows = await this.action<Com208ProductStock>('stock', {
      PRODUCTO: product,
      PRESENTACION: 'SI',
      MOVIMIENTO: header.MOVIMIENTO,
      TIPO: header.TIPO,
      ID_UN_ORIGEN: header.ID_UN_ORIGEN,
      ID_UN_DESTINO: header.ID_UN_DESTINO
    });
    const data = rows[0] ?? {};
    const presentation = data.PRESENTACION?.length === 1 ? data.PRESENTACION[0] : undefined;
    const attribute = data.ATRIBUTOS?.length === 1 ? data.ATRIBUTOS[0].ATRIBUTO : undefined;
    return this.newItem({
      ITEM: item,
      PRODUCTO: product,
      NOMBRE_PRODUCTO: data.NOMBRE ?? '',
      REFERENCIA: data.REFERENCIA ?? '',
      PRODUCTO_KIT: data.PRODUCTO_KIT ?? '',
      UBICACION: data.UBICACION ?? '',
      ATRIBUTO: attribute || 'SIN',
      VALOR_UNITARIO: Number(data.PRECIO || 0),
      UDM_PRES: presentation?.UDM_COMPRA || 'UND',
      UDM_PRESENTACION: presentation?.UDM_COMPRA || 'UND',
      CANTIDAD_PRES: Number(presentation?.CANTIDAD_PRES || 1),
      UDM_EQUIV: presentation?.UDM_EQUIV || 'UND',
      CANTIDAD_EQUIV: Number(presentation?.CANTIDAD_EQUIV || 1),
      CANTIDAD: 0,
      CONSUMO_BASE: 0,
      ES_MATRIZ: false
    });
  }

  /**
   * Liquida gravámenes (GRAVAMENES). El SP exige GRAVAMENES/GRAV_TOTAL en cada ítem y MOVIMIENTOS_GRAV,
   * por eso se aplica siempre que cambian los ítems (como Legacy con APL_GRAV = []).
   */
  async taxes(header: Com208Header, items: Com208MovementItem[]): Promise<Com208TaxLiquidation> {
    const prepared = items.map(row => ({ ...row, APLICACION: 2 }));
    const result = (await this.action<Com208TaxResult>('taxes', {
      ORDEN_COMPRA: header,
      ITEMS: prepared,
      APL_GRAV: []
    }))[0];
    if (!result) throw new Error('El servidor no devolvió la liquidación de gravámenes.');
    return {
      taxes: result.ENCAB ?? [],
      totals: result.TOTALES ?? [],
      items: prepared.map(row => {
        const value = result.ITEMS?.find(i => Number(i.ITEM) === Number(row.ITEM));
        return value ? {
          ...row,
          VALOR_IVA: Number(value.VALOR_IVA ?? row.VALOR_IVA ?? 0),
          SUB_TOTAL: Number(value.SUB_TOTAL ?? row.SUB_TOTAL ?? 0),
          TOTAL: Number(value.TOTAL ?? row.TOTAL ?? 0),
          GRAVAMENES: value.GRAVAMENES ?? row.GRAVAMENES,
          GRAV_TOTAL: value.GRAV_TOTAL ?? row.GRAV_TOTAL
        } : row;
      })
    };
  }

  async additional(idDocument: string, consecutive: number): Promise<Com208AdditionalResult> {
    const rows = await this.action<Com208AdditionalResult>('additional', { ID_DOCUMENTO: idDocument, CONSECUTIVO: consecutive });
    return rows[0] ?? {};
  }

  /** Recalcula los valores de una línea al cambiar la cantidad. */
  withQuantity(row: Com208MovementItem, quantity: number): Com208MovementItem {
    const qty = Math.max(0, Number(quantity) || 0);
    const subtotal = qty * Number(row.VALOR_UNITARIO || 0);
    return {
      ...row,
      CANTIDAD: qty,
      CANTIDAD_REAL: qty * Number(row.CANTIDAD_PRES || 1) * Number(row.CANTIDAD_EQUIV || 1),
      SUB_TOTAL: subtotal,
      TOTAL: subtotal + Number(row.VALOR_IVA || 0)
    };
  }

  validate(header: Com208Header, items: Com208MovementItem[]): string {
    const fields: [keyof Com208Header, string][] = [
      ['DOCUMENTO', 'Documento'],
      ['FECHA', 'Fecha'],
      ['PRODUCTO', 'Producto'],
      ['ID_UN_ORIGEN', 'Bodega origen'],
      ['ID_UN_DESTINO', 'Destino']
    ];
    const missing = fields.filter(([key]) => !header[key]).map(([, label]) => label);
    if (missing.length) return 'Faltan datos obligatorios: ' + missing.join(', ');
    if (!items.some(row => Number(row.CANTIDAD) > 0)) return 'Debe haber al menos un material con cantidad mayor a 0.';
    if (items.some(row => !row.ES_MATRIZ && !(Number(row.CANTIDAD) > 0))) {
      return 'Los materiales adicionales deben tener una cantidad mayor a 0.';
    }
    return '';
  }

  private newItem(values: Partial<Com208MovementItem> & Pick<Com208MovementItem, 'ITEM' | 'PRODUCTO'>): Com208MovementItem {
    const base: Com208MovementItem = {
      ITEM: values.ITEM,
      PRODUCTO: values.PRODUCTO,
      NOMBRE_PRODUCTO: '',
      ATRIBUTO: 'SIN',
      TIPO_INVENTARIO: Com208Application.InventoryType,
      REFERENCIA: '',
      PRODUCTO_KIT: '',
      SOPORTE: '',
      UBICACION: '',
      UDM: 'UND',
      UDM_PRES: 'UND',
      UDM_PRESENTACION: 'UND',
      CANTIDAD_PRES: 1,
      UDM_EQUIV: 'UND',
      CANTIDAD_EQUIV: 1,
      CONSUMO_BASE: 0,
      CANTIDAD: 0,
      CANTIDAD_REAL: 0,
      VALOR_UNITARIO: 0,
      VALOR_DESCUENTO: 0,
      SUB_TOTAL: 0,
      VALOR_IVA: 0,
      TOTAL: 0,
      GRAVAMENES: '',
      GRAV_TOTAL: '',
      DETALLE: '',
      ES_MATRIZ: false
    };
    const row = { ...base, ...values };
    return this.withQuantity(row, row.CANTIDAD);
  }
}
