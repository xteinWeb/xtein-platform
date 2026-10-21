import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Ven210Service } from './ven-210.service';
import { Ven210Catalog, Ven210BusinessAction } from '../constants/ven-210-catalog.constants';
import { Ven210Application } from '../constants/ven-210.constants';
import { Ven210Header, Ven210Lookup } from '../models/ven-210-business.model';
import { Ven210ItemBodega, Ven210RemisionItem } from '../models/ven-210.model';
import { validateAllDistributions, validateItemDistribution } from '../utils/ven-210-distribution';

@Injectable()
export class Ven210BusinessService {
  private readonly api = inject(Ven210Service);
  private readonly session = inject(SessionService);
  get identity() { return { ID_APLICACION: Ven210Application.Id, USUARIO: this.session.current?.userId ?? '' }; }
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
  private static clientsCache: Ven210Lookup[] | null = null;

  clearCache(): void {
    Ven210BusinessService.clientsCache = null;
  }

  async loadClients(forceRefresh = false): Promise<Ven210Lookup[]> {
    if (!forceRefresh && Ven210BusinessService.clientsCache && Ven210BusinessService.clientsCache.length > 0) {
      return Ven210BusinessService.clientsCache;
    }
    const [endpoint, action] = Ven210Catalog.clients;
    const raw = await firstValueFrom(this.api.request(endpoint, action, { ESTADO: 'ACTIVO' }));
    const decoded = this.decode<Ven210Lookup>(raw);
    let clients: Ven210Lookup[] = [];
    const first = decoded[0] as Record<string, unknown> | undefined;
    if (first && typeof first === 'object' && 'CLIENTES' in first && Array.isArray(first['CLIENTES'])) {
      clients = first['CLIENTES'] as Ven210Lookup[];
    } else {
      clients = decoded;
    }
    Ven210BusinessService.clientsCache = clients;
    return clients;
  }
  async catalog(name: keyof typeof Ven210Catalog, data: unknown): Promise<Ven210Lookup[]> {
    const [endpoint, action] = Ven210Catalog[name];
    return this.decode<Ven210Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }
  async action<T>(name: keyof typeof Ven210BusinessAction, data: unknown): Promise<T[]> {
    return this.decode<T>(await firstValueFrom(this.api.query(Ven210BusinessAction[name], data)));
  }
  validate(header: Ven210Header, items: Ven210RemisionItem[]): string {
    const fields: [keyof Ven210Header, string][] = [['DOCUMENTO','Documento'],['FECHA','Fecha'],
      ['ID_CLIENTE','Cliente'],['ID_UN_ITEM','Unidad de negocio'],['ID_MONEDA','Moneda'],
      ['ID_ADC','Vendedor'],['TIPO_VENTA','Tipo de venta'],['ID_CONDICION','Condición'],['FECHA_PRIMER_VENC','Vencimiento']];
    const missing = fields.filter(([key]) => !header[key]).map(([,label])=>label);
    if (missing.length) return 'Faltan datos: ' + missing.join(', ');
    if (!items.length) return 'No se ha asociado ningún producto a la remisión.';
    if (items.some(row => !row.PRODUCTO || !Number.isFinite(Number(row.CANTIDAD)) || Number(row.CANTIDAD) <= 0))
      return 'Complete el producto y una cantidad válida en todos los ítems.';
    if (String(header.FECHA_PRIMER_VENC).slice(0,10) < String(header.FECHA).slice(0,10))
      return 'La fecha de vencimiento no debe ser menor a la fecha de la remisión.';
    return '';
  }
  validateDistribution(item: Ven210RemisionItem, rows: Ven210ItemBodega[]): string {
    return validateItemDistribution(item, rows);
  }
  validateDistributions(items: Ven210RemisionItem[]): string {
    return validateAllDistributions(items);
  }
}
