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
  XteinRecordFilterField,
  XteinRecordFilterLookupItem,
  XteinRecordFilterLookupPage
} from '../models/xtein-record-filter.model';


@Injectable({
  providedIn: 'root'
})
export class XteinRecordFilterService {

  private static readonly columnsEndpoint =
    '/generales/columnas';

  private static readonly generalQueryEndpoint =
    '/generales/consulta';


  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }


  getFields(
    tableBase: string
  ): Observable<XteinRecordFilterField[]> {

    const normalizedTableBase =
      tableBase?.trim();

    if (!normalizedTableBase) {

      throw new Error(
        'La tabla base del filtro XTEIN no puede estar vacía.'
      );
    }

    return this.apiClient
      .execute<XteinDataApiResponse<string>>({

        endpoint:
          XteinRecordFilterService.columnsEndpoint,

        action:
          'columnas',

        data: {

          TABLA_BASE:
            normalizedTableBase
        },

        accessMode:
          XteinApiAccessMode.Authenticated
      })
      .pipe(

        map(response =>
          this.parseArray<XteinRecordFilterField>(
            response.data
          )
        )
      );
  }


  getLookupPage(
    field: string,
    data: unknown,
    skip: number,
    take: number,
    search: string
  ): Observable<XteinRecordFilterLookupPage> {

    const safeSkip =
      skip >= 0
        ? skip
        : 0;

    const safeTake =
      take > 0
        ? take
        : 50;

    const page =
      Math.floor(
        safeSkip / safeTake
      ) + 1;

    return this.apiClient
      .execute<XteinDataApiResponse<string>>({

        endpoint:
          XteinRecordFilterService.generalQueryEndpoint,

        action:
          'listaQuery',

        data: {

          ID_APLICACION:
            'generales',

          SKIP:
            safeSkip,

          TAKE:
            safeTake,

          SEARCH:
            search?.trim() ?? '',

          DATA:
            data,

          CAMPO:
            field,

          PAGE:
            page,

          PAGESIZE:
            safeTake
        },

        accessMode:
          XteinApiAccessMode.Authenticated
      })
      .pipe(

        map(response => {

          const items =
            this.parseArray<XteinRecordFilterLookupItem>(
              response.data
            );

          return {

            items,

            totalCount:
              this.getTotalCount(
                items
              )
          };
        })
      );
  }


  autoSearch(
    specification: string,
    search: string
  ): Observable<XteinRecordFilterLookupItem[]> {

    const normalized =
      this.normalizeAutoSearchSpecification(
        specification
      );

    return this.apiClient
      .execute<XteinDataApiResponse<string>>({

        endpoint:
          `/${normalized.application}/consulta`,

        action:
          'autobusqueda',

        data: {

          FILTRO:
            search?.trim() ?? '',

          accion:
            normalized.action
        },

        accessMode:
          XteinApiAccessMode.Authenticated
      })
      .pipe(

        map(response =>
          this.parseArray<XteinRecordFilterLookupItem>(
            response.data
          )
        )
      );
  }


  parseInlineLookup(
    value: unknown
  ): XteinRecordFilterLookupItem[] {

    if (Array.isArray(value)) {

      return value as
        XteinRecordFilterLookupItem[];
    }

    if (
      typeof value !== 'string' ||
      !value.trim()
    ) {

      return [];
    }

    return this.parseArray<XteinRecordFilterLookupItem>(
      value
    );
  }


  private normalizeAutoSearchSpecification(
    specification: string
  ): {
    application: string;
    action: string;
  } {

    const parts =
      String(
        specification ?? ''
      )
        .split('|')
        .map(value =>
          value.trim()
        )
        .filter(Boolean);

    if (parts.length < 2) {

      throw new Error(
        'La configuración de searchbox XTEIN no es válida.'
      );
    }

    const application =
      parts[
        parts.length - 2
      ]
        .replace(
          '-',
          ''
        );

    const action =
      parts[
        parts.length - 1
      ];

    return {

      application,

      action
    };
  }


  private getTotalCount(
    items:
      readonly XteinRecordFilterLookupItem[]
  ): number {

    if (items.length === 0) {

      return 0;
    }

    const rawTotalCount =
      items[0]['TotalCount'] ??
      items[0]['totalCount'];

    if (
      rawTotalCount === undefined ||
      rawTotalCount === null
    ) {

      return items.length;
    }

    const totalCount =
      Number(
        rawTotalCount
      );

    return Number.isFinite(totalCount)
      ? totalCount
      : items.length;
  }


  private parseArray<T>(
    data: unknown
  ): T[] {

    let parsed =
      data;

    if (
      typeof parsed === 'string'
    ) {

      const normalized =
        parsed.trim();

      if (!normalized) {

        return [];
      }

      parsed =
        JSON.parse(
          normalized
        );
    }

    if (!Array.isArray(parsed)) {

      throw new Error(
        'La respuesta del backend del filtro XTEIN debe contener un arreglo.'
      );
    }

    return parsed as T[];
  }
}