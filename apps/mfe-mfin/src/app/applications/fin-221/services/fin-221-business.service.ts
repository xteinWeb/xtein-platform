import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Fin221Service } from './fin-221.service';
import { Fin221Action, Fin221Endpoint } from '../constants/fin-221.constants';
import {
  Fin221PlanRecord,
  Fin221ItemPlan,
  Fin221TasaOption,
  Fin221CondicionOption,
  Fin221FactorResult,
  Fin221SavePayload
} from '../models/fin-221.model';

@Injectable()
export class Fin221BusinessService {
  private readonly api = inject(Fin221Service);

  private tasasCache: Fin221TasaOption[] | null = null;
  private condicionesCache: Fin221CondicionOption[] | null = null;

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
   * Loads the financial rates catalog (`lista tasas`).
   */
  async loadTasas(forceReload = false): Promise<Fin221TasaOption[]> {
    if (this.tasasCache && !forceReload) {
      return this.tasasCache;
    }
    const response = await firstValueFrom(this.api.query(Fin221Action.Tasas, {}));
    const tasas = this.decode<Fin221TasaOption>(response);
    this.tasasCache = tasas;
    return tasas;
  }

  /**
   * Loads the negotiation conditions catalog (`condiciones` from FIN230).
   */
  async loadCondiciones(forceReload = false): Promise<Fin221CondicionOption[]> {
    if (this.condicionesCache && !forceReload) {
      return this.condicionesCache;
    }
    const response = await firstValueFrom(this.api.request(Fin221Endpoint.CondicionesQuery, Fin221Action.Condiciones, {}));
    const condiciones = this.decode<Fin221CondicionOption>(response);
    this.condicionesCache = condiciones;
    return condiciones;
  }

  /**
   * Calculates the financing factor for a given rate and installment count.
   */
  async calculateFactor(idTasa: string, pago: number): Promise<number> {
    if (!idTasa || idTasa === 'Manual' || !pago || pago <= 0) {
      return 1;
    }
    try {
      const response = await firstValueFrom(this.api.query(Fin221Action.Factor, { ID_TASA: idTasa, PAGO: pago }));
      const results = this.decode<Fin221FactorResult>(response);
      const factor = results[0]?.FACTOR;
      return typeof factor === 'number' ? factor : Number(factor) || 0;
    } catch (error) {
      console.warn('Error calculating factor:', error);
      return 0;
    }
  }

  /**
   * Queries plans using search criteria (structure from filter or empty).
   */
  async queryRecords(criteria: unknown = []): Promise<Fin221PlanRecord[]> {
    const payload = { PLANES: Array.isArray(criteria) ? criteria : [] };
    const response = await firstValueFrom(this.api.query(Fin221Action.Query, payload));
    const records = this.decode<Fin221PlanRecord>(response);
    
    // Normalize ITM_PLANES booleans for UI editing ('Si' / 'No')
    return records.map(plan => ({
      ...plan,
      ITM_PLANES: (plan.ITM_PLANES || []).map(item => ({
        ...item,
        CUOTA_INICIAL: item.CUOTA_INICIAL === true || item.CUOTA_INICIAL === 'Si' ? 'Si' : 'No',
        DIFERIR_CI: item.DIFERIR_CI === true || item.DIFERIR_CI === 'Si' ? 'Si' : 'No',
        DESCONTAR_CI: item.DESCONTAR_CI === true || item.DESCONTAR_CI === 'Si' ? 'Si' : 'No',
        FINANCIAR_CI: item.FINANCIAR_CI === true || item.FINANCIAR_CI === 'Si' ? 'Si' : 'No',
        PAGO: Number(item.PAGO) || 0,
        FACTOR: Number(item.FACTOR) || 0,
        PORC_TASA: Number(item.PORC_TASA) || 0,
        PORC_GRAV: Number(item.PORC_GRAV) || 0,
        PORC_PAGO: Number(item.PORC_PAGO) || 0,
        DESCUENTO_PPP: Number(item.DESCUENTO_PPP) || 0,
        MINIMO_CI: Number(item.MINIMO_CI) || 0,
        MAXIMO_CI: Number(item.MAXIMO_CI) || 0,
        DIAS_PLAZO_CI: Number(item.DIAS_PLAZO_CI) || 0,
        DIAS: Number(item.DIAS) || 0
      }))
    }));
  }

  /**
   * Saves a plan and its details. Converts 'Si' / 'No' to true / false for DB.
   */
  async savePlan(action: 'new' | 'update', plan: Fin221PlanRecord, items: Fin221ItemPlan[]): Promise<void> {
    const payload: Fin221SavePayload = {
      PLANES: {
        ID_UN: plan.ID_UN,
        ID_PLAN: plan.ID_PLAN,
        DESCRIPCION: plan.DESCRIPCION,
        DIAS_PRIMERA_CUOTA: Number(plan.DIAS_PRIMERA_CUOTA) || 0,
        FINANCIAR_GRAV: plan.FINANCIAR_GRAV,
        TIPO_FRECUENCIA: plan.TIPO_FRECUENCIA,
        FRECUENCIA: Number(plan.FRECUENCIA) || 0,
        NUMERO_PAGOS: Number(plan.NUMERO_PAGOS) || 1,
        ESTADO: plan.ESTADO
      },
      ITM_PLANES: items.map(item => ({
        ...item,
        CUOTA_INICIAL: item.CUOTA_INICIAL === 'Si',
        DIFERIR_CI: item.DIFERIR_CI === 'Si',
        DESCONTAR_CI: item.DESCONTAR_CI === 'Si',
        FINANCIAR_CI: item.FINANCIAR_CI === 'Si'
      }))
    };

    const actionKey = action === 'new' ? Fin221Action.New : Fin221Action.Update;
    const response = await firstValueFrom(this.api.save(actionKey, payload));
    this.decode(response);
  }

  /**
   * Deletes a plan by code.
   */
  async deletePlan(idPlan: string): Promise<void> {
    const response = await firstValueFrom(this.api.delete({ ID_PLAN: idPlan }));
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
