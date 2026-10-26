import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Fin224Service } from './fin-224.service';
import { Fin224Action, Fin224Endpoint } from '../constants/fin-224.constants';
import {
  Fin224CondicionRecord,
  Fin224ItemCondicion,
  Fin224PlanOption,
  Fin224ListaPrecioOption,
  Fin224SavePayload
} from '../models/fin-224.model';

@Injectable()
export class Fin224BusinessService {
  private readonly api = inject(Fin224Service);

  private planesCache: Fin224PlanOption[] | null = null;
  private listasCache: Fin224ListaPrecioOption[] | null = null;

  /**
   * Normalizes the backend response envelope and throws on ErrMensaje.
   */
  decode<T>(response: unknown): T[] {
    const rows = this.rows(this.unwrap(response));
    const error = rows.find(row => (row as Record<string, unknown> | null)?.['ErrMensaje']);
    if (error) {
      const msg = String((error as Record<string, unknown>)['ErrMensaje']).trim();
      if (msg) throw new Error(msg);
    }
    return rows as T[];
  }

  /**
   * Returns human-readable error messages for backend failures.
   */
  errorMessage(error: unknown, fallback = 'No se pudo completar la operación.'): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (body && typeof body === 'object') {
        const value = (body as Record<string, unknown>)['message'] ?? (body as Record<string, unknown>)['ErrMensaje'];
        if (value) return String(value);
      }
      if (typeof body === 'string' && body.trim()) {
        try {
          const decoded = this.decode(body);
          const first = decoded[0] as Record<string, unknown>;
          return String(first?.['ErrMensaje'] ?? body);
        } catch (e: any) {
          return e?.message || body.trim();
        }
      }
      return error.message || fallback;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
  }

  /**
   * Loads financing plans from FIN-221.
   */
  async loadPlanes(forceReload = false): Promise<Fin224PlanOption[]> {
    if (this.planesCache && !forceReload) {
      return this.planesCache;
    }
    const response = await firstValueFrom(
      this.api.request(Fin224Endpoint.PlanesQuery, Fin224Action.Planes, { PLANES: {} })
    );
    const planes = this.decode<Fin224PlanOption>(response);
    this.planesCache = planes;
    return planes;
  }

  /**
   * Loads active price lists from COM-201.
   */
  async loadListasPrecios(forceReload = false): Promise<Fin224ListaPrecioOption[]> {
    if (this.listasCache && !forceReload) {
      return this.listasCache;
    }
    const response = await firstValueFrom(
      this.api.request(Fin224Endpoint.ListasQuery, Fin224Action.ListasPrecios, { ESTADO: 'ACTIVO' })
    );
    const listas = this.decode<Fin224ListaPrecioOption>(response);
    this.listasCache = listas;
    return listas;
  }

  /**
   * Queries negotiation conditions and enriches items with descriptions from the price list catalog.
   */
  async queryRecords(criteria: unknown = []): Promise<Fin224CondicionRecord[]> {
    const payload = { CONDICIONES_NEGOCIACION: Array.isArray(criteria) ? criteria : [] };
    const response = await firstValueFrom(this.api.query(Fin224Action.Query, payload));
    const records = this.decode<Fin224CondicionRecord>(response);

    // Make sure price lists are cached for descriptions
    const listas = await this.loadListasPrecios();

    return records.map(cond => ({
      ...cond,
      ITM_CONDICIONES: (cond.ITM_CONDICIONES || []).map(item => {
        const found = listas.find(l => l.ID_LISTA === item.ID_LISTA);
        return {
          ...item,
          DESCRIPCION: item.DESCRIPCION || found?.DESCRIPCION || ''
        };
      })
    }));
  }

  /**
   * Saves a negotiation condition and its associated price lists.
   */
  async saveCondicion(
    action: 'new' | 'update',
    condicion: Fin224CondicionRecord,
    items: Fin224ItemCondicion[]
  ): Promise<void> {
    const payload: Fin224SavePayload = {
      CONDICIONES: {
        ID_CONDICION: condicion.ID_CONDICION,
        DESCRIPCION: condicion.DESCRIPCION,
        TIPO: condicion.TIPO,
        ID_PLAN: condicion.ID_PLAN,
        ESTADO: condicion.ESTADO
      },
      ITM_CONDICIONES: items.map(i => ({
        ID_CONDICION: condicion.ID_CONDICION,
        ID_LISTA: i.ID_LISTA,
        DESCRIPCION: i.DESCRIPCION
      }))
    };

    const actionKey = action === 'new' ? Fin224Action.New : Fin224Action.Update;
    const response = await firstValueFrom(this.api.save(actionKey, payload));
    this.decode(response);
  }

  /**
   * Deletes a negotiation condition by code.
   */
  async deleteCondicion(idCondicion: string): Promise<void> {
    const response = await firstValueFrom(this.api.delete({ ID_CONDICION: idCondicion }));
    this.decode(response);
  }

  private unwrap(response: unknown): unknown {
    let data = response;
    for (let depth = 0; depth < 4; depth++) {
      if (typeof data === 'string') {
        data = this.parse(data);
        continue;
      }
      if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
        data = (data as { data: unknown }).data;
        continue;
      }
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
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(value);
    }
  }
}
