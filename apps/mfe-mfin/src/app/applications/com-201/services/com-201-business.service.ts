import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Com201Service } from './com-201.service';
import { Com201Catalog } from '../constants/com-201-catalog.constants';
import { Com201Action, Com201Application } from '../constants/com-201.constants';
import { Com201ListaPrecios } from '../models/com-201-record.model';
import { Com201Item, Com201ItemsPage } from '../models/com-201-item.model';
import { Com201ItemQuery, Com201Lookup, Com201PriceResult } from '../models/com-201-business.model';

@Injectable()
export class Com201BusinessService {
  private readonly api = inject(Com201Service);
  private readonly session = inject(SessionService);
  get identity() { return { ID_APLICACION: Com201Application.Id, USUARIO: this.session.current?.userId ?? '' }; }

  /**
   * Normalizes the backend envelope and throws on ErrMensaje.
   * A string that is not JSON (non uniform error of consulta/delete) is raised as an Error with its text.
   */
  decode<T>(response: unknown): T[] {
    const rows = this.rows(this.unwrap(response));
    const error = rows.find(row => (row as Com201Lookup | null)?.ErrMensaje);
    if (error) throw new Error(String((error as Com201Lookup).ErrMensaje));
    return rows as T[];
  }

  /**
   * Readable message for any backend failure (HTTP 400 {message}, string bodies, Error).
   */
  errorMessage(error: unknown, fallback = 'No se pudo completar la operación.'): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (body && typeof body === 'object') {
        const value = (body as Record<string, unknown>)['message'] ?? (body as Record<string, unknown>)['ErrMensaje'];
        if (value) return String(value);
      }
      if (typeof body === 'string' && body.trim()) {
        try { return this.decodeErrorText(body); }
        catch { return body.trim(); }
      }
      return error.message || fallback;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
  }

  async catalog(name: keyof typeof Com201Catalog, data: unknown = {}): Promise<Com201Lookup[]> {
    const [endpoint, action] = Com201Catalog[name];
    return this.decode<Com201Lookup>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }

  async action<T>(action: Com201Action, data: unknown): Promise<T[]> {
    return this.decode<T>(await firstValueFrom(this.api.query(action, data)));
  }

  /**
   * Loads one page (or the complete list when PAGINA is absent) of `consulta items lista`.
   * TOTAL_REGISTROS is read from the first row or from a wrapper object.
   */
  async itemsPage(query: Com201ItemQuery): Promise<Com201ItemsPage> {
    const data = this.unwrap(await firstValueFrom(this.api.query(Com201Action.Items, query)));
    let rows = this.rows(data) as Record<string, unknown>[];
    const first = rows[0];
    const wrapper = first && 'TOTAL_REGISTROS' in first ? Object.values(first).find(Array.isArray) : undefined;
    if (wrapper) rows = wrapper as Record<string, unknown>[];
    const error = rows.find(row => row?.['ErrMensaje']);
    if (error) throw new Error(String(error['ErrMensaje']));
    const totalValue = first?.['TOTAL_REGISTROS'];
    const serverPaged = totalValue !== undefined && totalValue !== null && totalValue !== '';
    const items = rows.filter(row => row && (row['ITEM'] || row['PRODUCTO'])) as unknown as Com201Item[];
    return { rows: items, total: serverPaged ? Number(totalValue) : items.length, serverPaged };
  }

  /** Complete item list (no PAGINA), used to materialize and to check concurrency. */
  async allItems(idLista: string): Promise<Com201Item[]> {
    return (await this.itemsPage({ ID_LISTA: idLista })).rows;
  }

  async calculatePrice(header: Com201ListaPrecios, field: 'PRECIO_BASE' | 'PRECIO', value: number, row: Com201Item): Promise<Com201PriceResult> {
    const result = (await this.action<Com201PriceResult>(Com201Action.CalculatePrice,
      { LISTA_PRECIOS: header, [field]: value, ITEM_LISTA: row }))[0];
    if (!result) throw new Error('El servidor no devolvió el cálculo del precio.');
    return result;
  }

  async generateGroup(header: Com201ListaPrecios, idGrupo: string, operacion: string): Promise<Com201Item[]> {
    const rows = await this.action<Com201Item>(Com201Action.GenerateGroup, { DATOS: header, ID_GRUPO: idGrupo, operacion });
    return rows.filter(row => row?.PRODUCTO);
  }

  /** Returns the backend message when ID_LISTA already exists, or '' when it is available. */
  async exists(idLista: string): Promise<string> {
    try {
      await this.action(Com201Action.Exists, { ID_LISTA: idLista });
      return '';
    } catch (error) {
      if (error instanceof HttpErrorResponse) throw error;
      return this.errorMessage(error);
    }
  }

  async baseLists(header: Pick<Com201ListaPrecios, 'TIPO' | 'BASE_PRECIO' | 'ACTUALIZACION' | 'ID_LISTA'>): Promise<Com201Lookup[]> {
    return this.action<Com201Lookup>(Com201Action.BaseLists,
      { TIPO: header.TIPO, BASE_PRECIO: header.BASE_PRECIO, ACTUALIZACION: header.ACTUALIZACION, ID_LISTA: header.ID_LISTA });
  }

  specifications(): Promise<Com201Lookup[]> {
    return this.catalog('specifications', { ...this.identity, ID_APLICACION_BASE: '' });
  }

  private unwrap(response: unknown): unknown {
    let data = response;
    for (let depth = 0; depth < 4; depth++) {
      if (typeof data === 'string') { data = this.parse(data); continue; }
      if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data) { data = (data as { data: unknown }).data; continue; }
      break;
    }
    return data;
  }

  private rows(data: unknown): unknown[] {
    return Array.isArray(data) ? data : data == null ? [] : [data];
  }

  private parse(text: string): unknown {
    const value = text.trim();
    if (!value) return [];
    try { return JSON.parse(value); }
    catch { throw new Error(value); }
  }

  private decodeErrorText(text: string): string {
    const data = this.unwrap(text);
    const row = this.rows(data)[0] as Record<string, unknown> | undefined;
    return String(row?.['message'] ?? row?.['ErrMensaje'] ?? text);
  }
}
