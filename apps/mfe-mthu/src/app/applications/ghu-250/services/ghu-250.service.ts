import { createGhu250Log } from '../constants/ghu-250-logging.constants';
import {
  Injectable
} from '@angular/core';

import {
  Observable,
  map
} from 'rxjs';

import {
  XteinApiAccessMode,
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';

import {
  SessionService
} from '@xtein/session';

import {
  Ghu250Action,
  Ghu250Application,
  Ghu250Endpoint
} from '../constants/ghu-250.constants';

import {
  Ghu250Adjustment,
  Ghu250BackendMessage,
  Ghu250Cause,
  Ghu250Company,
  Ghu250Employee,
  Ghu250Group,
  Ghu250LiquidationResult,
  Ghu250Parameters,
  Ghu250RequestContext
} from '../models/ghu-250.model';


/**
 * Provides the spLiqPrestaciones actions required by GHU-250.
 *
 * Transport, authentication, company context, token handling,
 * and legacy request-envelope construction are delegated to
 * XteinApiClientService. The backend forwards prmAccion as @ACCION
 * and prmDatos as @DATA_JSON.
 *
 * This service belongs exclusively to GHU-250 and is therefore
 * provided by Ghu250Component instead of the platform root injector.
 */
@Injectable()
export class Ghu250Service {
  private readonly log = createGhu250Log();

  constructor(
    private readonly apiClient:
      XteinApiClientService,

    private readonly session:
      SessionService
  ) {
  }


  getApplicationId():
    string {

    return Ghu250Application.Id;
  }


  getCauses(): Observable<Ghu250Cause[]> {

    return this.queryArray<Ghu250Cause>(Ghu250Action.Causes, {});
  }


  getCompanies(): Observable<Ghu250Company[]> {

    return this.queryArray<Ghu250Company>(Ghu250Action.Companies, {});
  }


  getGroups(): Observable<Ghu250Group[]> {

    return this.queryArray<Ghu250Group>(Ghu250Action.Groups, {});
  }


  /**
   * Active employees (last contract) for the step 1 drop-down box.
   */
  getEmployees(
    filter: Pick<Ghu250Parameters, 'FECHA_RETIRO' | 'ID_EMPRESA' | 'ID_GRUPO'>
  ): Observable<Ghu250Employee[]> {

    return this.queryArray<Ghu250Employee>(Ghu250Action.Employees, filter);
  }


  /**
   * Employees that match every step 1 filter (step 2 grid).
   */
  prepareEmployees(
    parameters: Ghu250Parameters
  ): Observable<Ghu250Employee[]> {

    return this.queryArray<Ghu250Employee>(Ghu250Action.PrepareEmployees, parameters);
  }


  /**
   * Runs PLIQ_NOMINA and liquidates the requested benefits.
   */
  liquidate(
    parameters: Ghu250Parameters
  ): Observable<Ghu250LiquidationResult> {

    return this.execute(Ghu250Endpoint.Save, Ghu250Action.Benefits, parameters)
      .pipe(map(response => this.parseLiquidation(response.data)));
  }


  /**
   * Stores the values edited in the step 3 grid and returns the
   * recalculated liquidation.
   */
  saveAdjustments(
    parameters: Ghu250Parameters,
    consecutive: number,
    adjustments: Ghu250Adjustment[]
  ): Observable<Ghu250LiquidationResult> {

    return this.execute(Ghu250Endpoint.Save, Ghu250Action.Adjustments, {
      ...parameters,
      CONSECUTIVO: consecutive,
      AJUSTES: adjustments
    }).pipe(map(response => this.parseLiquidation(response.data)));
  }


  private queryArray<T>(
    action: Ghu250Action,
    data: object
  ): Observable<T[]> {

    return this.execute(Ghu250Endpoint.Query, action, data)
      .pipe(map(response => {

        const records = this.parseBackendArray<T & Ghu250BackendMessage>(response.data);
        const message = records[0]?.ErrMensaje?.trim();

        if (message) throw new Error(message);

        return records as T[];
      }));
  }


  private execute(
    endpoint: Ghu250Endpoint,
    action: Ghu250Action,
    data: object
  ): Observable<XteinDataApiResponse<string>> {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({

        endpoint,

        action,

        data: {
          ...this.requestContext(),
          ...data
        },

        logContext: endpoint === Ghu250Endpoint.Save ? this.log.Save : this.log.Query,

        accessMode:
          XteinApiAccessMode.Authenticated
      });
  }


  private requestContext(): Ghu250RequestContext {

    const session = this.session.current;

    return {
      ID_UN: session?.associatedUnitId?.trim() || '00',
      USUARIO: session?.userId?.trim() || 'XTEIN'
    };
  }


  private parseLiquidation(
    data: unknown
  ): Ghu250LiquidationResult {

    const records = this.parseBackendArray<Ghu250LiquidationResult & Ghu250BackendMessage>(data);
    const result = records[0];
    const message = result?.ErrMensaje?.trim();

    if (message) throw new Error(message);

    if (!result || !Array.isArray(result.EMPLEADOS)) {
      throw new Error('La liquidación no devolvió información.');
    }

    return {
      ...result,
      CONCEPTOS: Array.isArray(result.CONCEPTOS) ? result.CONCEPTOS : [],
      EMPLEADOS: result.EMPLEADOS.map(employee => ({
        ...employee,
        DETALLE: Array.isArray(employee.DETALLE) ? employee.DETALLE : []
      }))
    };
  }


  /**
   * Accepts the procedure DATA column either as a JSON string or as
   * an already parsed value, and the backend recordset wrapper
   * ([{ DATA: "..." }]) when it is not unwrapped by the API.
   */
  private parseBackendArray<T>(
    data: unknown
  ): T[] {

    let parsed = data;

    if (typeof parsed === 'string') {

      const value = parsed.trim();

      if (!value) return [];

      parsed = JSON.parse(value);
    }

    if (
      Array.isArray(parsed) &&
      parsed.length === 1 &&
      parsed[0] &&
      typeof parsed[0] === 'object' &&
      'DATA' in parsed[0]
    ) {
      return this.parseBackendArray<T>((parsed[0] as { DATA: unknown }).DATA);
    }

    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') return [parsed as T];

    if (!Array.isArray(parsed)) {
      throw new Error('The GHU-250 backend response must contain an array.');
    }

    return parsed as T[];
  }
}
