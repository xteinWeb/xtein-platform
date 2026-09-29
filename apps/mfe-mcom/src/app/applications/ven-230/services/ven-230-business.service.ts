import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Ven230Service } from './ven-230.service';
import { Ven230Catalog, Ven230BusinessAction } from '../constants/ven-230-catalog.constants';
import { Ven230Application } from '../constants/ven-230.constants';
import { Ven230Header, Ven230Lookup, Ven230TaxResult } from '../models/ven-230-business.model';
import { Ven230PrefacturaItem } from '../models/ven-230.model';

@Injectable()
export class Ven230BusinessService {
  private readonly api = inject(Ven230Service);
  private readonly session = inject(SessionService);
  get identity() { return { ID_APLICACION: Ven230Application.Id, USUARIO: this.session.current?.userId ?? '' }; }
  decode<T>(response: unknown): T[] {
    let data = response;
    for (let depth=0;depth<4;depth++) {
      if (typeof data==='string') { data=JSON.parse(data); continue; }
      if (data && typeof data==='object' && !Array.isArray(data) && 'data' in data) { data=data.data; continue; }
      break;
    }
    const rows = Array.isArray(data) ? data : data == null ? [] : [data];
    const error = rows.find(row => row?.ErrMensaje);
    if (error) throw new Error(String(error.ErrMensaje));
    return rows as T[];
  }
  async catalog(name: keyof typeof Ven230Catalog, data: unknown): Promise<Ven230Lookup[]> {
    const [endpoint, action] = Ven230Catalog[name];
    return this.decode<Ven230Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }
  async action<T>(name: keyof typeof Ven230BusinessAction, data: unknown): Promise<T[]> {
    return this.decode<T>(await firstValueFrom(this.api.query(Ven230BusinessAction[name], data)));
  }
  taxes(header: Ven230Header, items: Ven230PrefacturaItem[], option?: string) {
    return this.action<Ven230TaxResult>('taxes', { PREFACTURA: header, ITEMS: items,
      ...(option === 'original' ? { OPCION_GRAV: option } : { APL_GRAV: option }) });
  }
  validate(header: Ven230Header, items: Ven230PrefacturaItem[]): string {
    const fields: [keyof Ven230Header, string][] = [['DOCUMENTO','Documento'],['FECHA','Fecha'],
      ['ID_CLIENTE','Cliente'],['ID_UN_ITEM','Unidad de negocio'],['ID_MONEDA','Moneda'],
      ['ID_ADC','Vendedor'],['TIPO_VENTA','Tipo de venta'],['ID_CONDICION','Condición'],['FECHA_PRIMER_VENC','Vencimiento']];
    const missing = fields.filter(([key]) => !header[key]).map(([,label])=>label);
    if (missing.length) return 'Faltan datos: ' + missing.join(', ');
    if (!items.length) return 'No se ha asociado ningún producto a la prefactura.';
    if (items.some(row => !row.PRODUCTO || !Number.isFinite(Number(row.CANTIDAD)) || Number(row.CANTIDAD) <= 0))
      return 'Complete el producto y una cantidad válida en todos los ítems.';
    if (String(header.FECHA_PRIMER_VENC).slice(0,10) < String(header.FECHA).slice(0,10))
      return 'La fecha de vencimiento no debe ser menor a la fecha de la prefactura.';
    return '';
  }
}
