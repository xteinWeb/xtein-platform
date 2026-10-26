import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Ven213Service } from './ven-213.service';
import { Ven213Catalog, Ven213BusinessAction } from '../constants/ven-213-catalog.constants';
import { Ven213Application } from '../constants/ven-213.constants';
import { Ven213Header, Ven213Lookup } from '../models/ven-213-business.model';
import { Ven213DevolucionItem } from '../models/ven-213.model';
import { validateAllDistributions } from '../utils/ven-213-distribution';
import { validateReturnQuantity } from '../utils/ven-213-source-load';

@Injectable()
export class Ven213BusinessService {
  private readonly api = inject(Ven213Service);
  private readonly session = inject(SessionService);
  get identity() { return { ID_APLICACION: Ven213Application.Id, USUARIO: this.session.current?.userId ?? '' }; }
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
  private static clientsCache: Ven213Lookup[] | null = null;

  async loadClients(): Promise<Ven213Lookup[]> {
    if (Ven213BusinessService.clientsCache && Ven213BusinessService.clientsCache.length > 0) {
      return Ven213BusinessService.clientsCache;
    }
    const [endpoint, action] = Ven213Catalog.clients;
    const raw = await firstValueFrom(this.api.request(endpoint, action, { ESTADO: 'ACTIVO' }));
    const decoded = this.decode<Ven213Lookup>(raw);
    let clients: Ven213Lookup[] = [];
    const first = decoded[0] as Record<string, unknown> | undefined;
    if (first && typeof first === 'object' && 'CLIENTES' in first && Array.isArray(first['CLIENTES'])) {
      clients = first['CLIENTES'] as Ven213Lookup[];
    } else {
      clients = decoded;
    }
    Ven213BusinessService.clientsCache = clients;
    return clients;
  }
  async catalog(name: keyof typeof Ven213Catalog, data: unknown): Promise<Ven213Lookup[]> {
    const [endpoint, action] = Ven213Catalog[name];
    return this.decode<Ven213Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }
  async action<T>(name: keyof typeof Ven213BusinessAction, data: unknown): Promise<T[]> {
    return this.decode<T>(await firstValueFrom(this.api.query(Ven213BusinessAction[name], data)));
  }
  /** Header, source and quantities; the distribution is validated separately. */
  validate(header: Ven213Header, items: Ven213DevolucionItem[], sourceLoaded: boolean): string {
    const fields: [keyof Ven213Header, string][] = [['DOCUMENTO','Documento'],['FECHA','Fecha'],
      ['ID_CLIENTE','Cliente'],['ID_CAUSA','Causa']];
    const missing = fields.filter(([key]) => !header[key]).map(([,label])=>label);
    if (missing.length) return 'Faltan datos: ' + missing.join(', ');
    if (!sourceLoaded) return 'Cargue el documento origen (factura o remisión) de la devolución.';
    if (!items.length) return 'La devolución no tiene productos con cantidad a devolver.';
    return items.map(item => validateReturnQuantity(item)).find(Boolean) ?? '';
  }
  validateDistributions(items: Ven213DevolucionItem[]): string {
    return validateAllDistributions(items);
  }
}
