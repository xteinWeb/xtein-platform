import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Pro039Service } from './pro-039.service';
import { Pro039BusinessAction, Pro039Catalog } from '../constants/pro-039-catalog.constants';
import { Pro039Application } from '../constants/pro-039.constants';
import {
  Pro039AdditionalResult,
  Pro039Header,
  Pro039Lookup,
  Pro039Material,
  Pro039ProductStock,
  Pro039TaxResult
} from '../models/pro-039-business.model';
import { Pro039MovementGrav, Pro039MovementItem, Pro039Total } from '../models/pro-039.model';

export interface Pro039TaxLiquidation {
  items: Pro039MovementItem[];
  taxes: Pro039MovementGrav[];
  totals: Pro039Total[];
}

@Injectable()
export class Pro039BusinessService {
  private readonly api = inject(Pro039Service);
  private readonly session = inject(SessionService);

  get identity() {
    return {
      ID_APLICACION: Pro039Application.Id,
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

  private static readonly catalogCache = new Map<string, Pro039Lookup[]>();

  clearCache(): void {
    Pro039BusinessService.catalogCache.clear();
  }

  async catalog<T = Pro039Lookup>(name: keyof typeof Pro039Catalog, data: unknown = {}, forceRefresh = false): Promise<T[]> {
    const cacheKey = `${String(name)}_${JSON.stringify(data ?? {})}`;
    if (!forceRefresh && Pro039BusinessService.catalogCache.has(cacheKey)) {
      return Pro039BusinessService.catalogCache.get(cacheKey)! as T[];
    }
    const [endpoint, action] = Pro039Catalog[name];
    const decoded = this.decode<Pro039Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
    Pro039BusinessService.catalogCache.set(cacheKey, decoded);
    return decoded as T[];
  }

  async action<T>(name: keyof typeof Pro039BusinessAction, data: unknown): Promise<T[]> {
    const [endpoint, action] = Pro039BusinessAction[name];
    return this.decode<T>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }

  /** Materiales de la matriz del producto/sección, con el costo de la bodega de origen (o el de la matriz). */
  /** CONSUMO_BASE queda unitario (matriz); CANTIDAD = unitario x lote. */
  async materials(product: string, section: string, originWarehouse: string, component = '', lot = 1): Promise<Pro039MovementItem[]> {
    const rows = await this.action<Pro039Material>('materials', {
      PRODUCTO: product,
      SECCION: section || '',
      ID_UN_ORIGEN: originWarehouse || '',
      COMPONENTE: component || '',
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
      CANTIDAD: Number(row.CONSUMO || 0) * lot,
      VALOR_UNITARIO: Number(row.VALOR_UNITARIO || 0),
      ES_MATRIZ: true
    }));
  }

  /**
   * Producto agregado manualmente: igual que COM-203 ('EXISTENCIAS PRODUCTO'), valida que esté asociado
   * a la bodega de origen y trae nombre, costo y presentación.
   */
  async productItem(product: string, header: Pro039Header, item: number): Promise<Pro039MovementItem> {
    const rows = await this.action<Pro039ProductStock>('stock', {
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
  async taxes(header: Pro039Header, items: Pro039MovementItem[]): Promise<Pro039TaxLiquidation> {
    const prepared = items.map(row => ({ ...row, APLICACION: 2 }));
    const result = (await this.action<Pro039TaxResult>('taxes', {
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

  async additional(idDocument: string, consecutive: number): Promise<Pro039AdditionalResult> {
    const rows = await this.action<Pro039AdditionalResult>('additional', { ID_DOCUMENTO: idDocument, CONSECUTIVO: consecutive });
    return rows[0] ?? {};
  }

  /** Recalcula los valores de una línea al cambiar la cantidad. */
  withQuantity(row: Pro039MovementItem, quantity: number): Pro039MovementItem {
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

  validate(header: Pro039Header, items: Pro039MovementItem[]): string {
    const fields: [keyof Pro039Header, string][] = [
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

  private newItem(values: Partial<Pro039MovementItem> & Pick<Pro039MovementItem, 'ITEM' | 'PRODUCTO'>): Pro039MovementItem {
    const base: Pro039MovementItem = {
      ITEM: values.ITEM,
      PRODUCTO: values.PRODUCTO,
      NOMBRE_PRODUCTO: '',
      ATRIBUTO: 'SIN',
      TIPO_INVENTARIO: Pro039Application.InventoryType,
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
