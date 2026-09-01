import {
  Injectable
} from '@angular/core';

import {
  Observable,
  map,
  of,
  tap
} from 'rxjs';

import {
  XteinApiClientService,
  XteinDataApiResponse
} from '@xtein/api-client';

import {
  ConnectionField
} from '../models/connection-field.model';

/**
 * Represents the parameter configuration returned by
 * the data-source-parameters backend service.
 */
interface ConnectionFieldsConfiguration {
  connectionFields?: ConnectionField[];
}

/**
 * Provides the connection field definitions used by
 * XTEIN data-source parameter forms.
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionFieldsService {

  /**
   * Connection fields grouped by source identifier.
   */
  private fieldsMap:
    Record<string, ConnectionField[]> = {};

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }

  /**
   * Loads the connection parameter definitions from the backend.
   *
   * The configuration is cached after the first successful request.
   *
   * @param application Backend application identifier.
   * @returns Connection fields grouped by source.
   */
  getParameter(
    application: string
  ): Observable<
    Record<string, ConnectionField[]>
  > {

    if (
      Object.keys(
        this.fieldsMap
      ).length > 0
    ) {

      return of(
        this.fieldsMap
      );
    }

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          `/${application}/getParameters`,

        action:
          'getParameters',

        data: {},

        accessMode:
          'authenticated'
      })
      .pipe(
        tap(response => {

          const configuration =
            JSON.parse(
              response.data
            ) as ConnectionFieldsConfiguration;

          const fields =
            configuration.connectionFields ?? [];

          this.fieldsMap = {};

          fields.forEach(field => {

            if (
              !this.fieldsMap[
                field.source
              ]
            ) {

              this.fieldsMap[
                field.source
              ] = [];
            }

            this.fieldsMap[
              field.source
            ].push(
              field
            );
          });
        }),

        map(() =>
          this.fieldsMap
        )
      );
  }

  /**
   * Tests a data-source connection using the
   * parameter values entered by the user.
   *
   * @param prmDatos Connection parameters.
   * @param application Backend application identifier.
   * @returns Backend connection test result.
   */
  testConnection(
    prmDatos: any,
    application: string
  ): Observable<
    XteinDataApiResponse<string>
  > {

    return this.apiClient
      .execute<
        XteinDataApiResponse<string>
      >({
        endpoint:
          `/${application}/testConnection`,

        action:
          'testConnection',

        data:
          prmDatos,

        accessMode:
          'authenticated'
      });
  }

  /**
   * Returns the fields configured for a source.
   *
   * @param origin Source identifier.
   * @returns Connection fields.
   */
  getFields(
    origin: string
  ): ConnectionField[] {

    return this.fieldsMap[
      origin
    ] ?? [];
  }

  /**
   * Determines whether a source has configured fields.
   *
   * @param origin Source identifier.
   * @returns True when configured fields exist.
   */
  hasFields(
    origin: string
  ): boolean {

    return Boolean(
      this.fieldsMap[
        origin
      ]
    );
  }

  /**
   * Returns the currently available source identifiers.
   *
   * @returns Source identifiers.
   */
  getAvailableOrigins():
    string[] {

    return Object.keys(
      this.fieldsMap
    );
  }

  /**
   * Clears the cached connection field configuration.
   */
  clear(): void {

    this.fieldsMap = {};
  }
}