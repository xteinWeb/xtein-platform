import {
  Injectable
} from '@angular/core';

import {
  Observable,
  map
} from 'rxjs';

import {
  XteinApiAccessMode,
  XteinApiClientService
} from '@xtein/api-client';

import {
  CompanyOption
} from '../contracts/company-option';

import {
  LoginRequest
} from '../contracts/login-request';

import {
  UserValidationResult
} from '../contracts/user-validation-result';



/**
 * Internal authentication result returned by the existing backend.
 *
 * Legacy backend field names remain isolated inside this service.
 */
export interface AuthenticationApiResult {

  /**
   * Indicates whether the credentials were accepted.
   */
  isValid: boolean;

  /**
   * Optional backend error message.
   */
  errorMessage?: string;

  /**
   * Authentication token.
   */
  token?: string;

  /**
   * Authenticated user display name.
   */
  userName?: string;

  /**
   * Authenticated user email.
   */
  email?: string;

  /**
   * Optional profile image.
   */
  profilePhoto?: string;

  /**
   * Session timeout returned by the backend in minutes.
   */
  sessionTimeoutMinutes?: number;
}

/**
 * Provides authentication-specific communication with
 * the existing XTEIN Node.js backend.
 *
 * Endpoint names, action names, and legacy response field names
 * are isolated exclusively inside this service.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  private static readonly validateUserEndpoint =
    '/usuarioValido';

  private static readonly validateUserAction =
    'USUARIO VALIDO';

  private static readonly loginEndpoint =
    '/usuarioLogin';

  private static readonly loginAction =
    'USUARIO CREDENCIALES';

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }

  /**
   * Validates a user and obtains the companies available
   * for authentication.
   *
   * @param userId User identifier.
   * @returns User validation result.
   */
  validateUser(
    userId: string
  ): Observable<UserValidationResult> {

    return this.apiClient
      .execute<unknown>({
        endpoint:
          AuthApiService.validateUserEndpoint,

        action:
          AuthApiService.validateUserAction,

        data: {
          USUARIO:
            userId
        },

        accessMode:
          XteinApiAccessMode.Public
      })
      .pipe(
        map(response =>
          this.mapUserValidationResponse(
            response
          )
        )
      );
  }

  /**
   * Authenticates an XTEIN user.
   *
   * @param request Login information.
   * @returns Backend authentication result.
   */
  login(
    request: LoginRequest
  ): Observable<AuthenticationApiResult> {

    return this.apiClient
      .execute<unknown>({
        endpoint:
          AuthApiService.loginEndpoint,

        action:
          AuthApiService.loginAction,

        data: {
          USUARIO:
            request.userId,

          CONTRASENA:
            request.password,

          EMPRESA:
            request.companyId,

          ID_UN_ASOCIADA:
            request.associatedUnitId
        },

        accessMode:
          XteinApiAccessMode.Public
      })
      .pipe(
        map(response =>
          this.mapAuthenticationResponse(
            response
          )
        )
      );
  }

  /**
   * Maps the legacy user-validation response into
   * the new XTEIN authentication contract.
   *
   * @param response Raw backend response.
   * @returns Normalized validation result.
   */
  private mapUserValidationResponse(
    response: unknown
  ): UserValidationResult {

    const normalizedResponse =
      this.normalizeResponse(
        response
      );

    const records =
      Array.isArray(normalizedResponse)
        ? normalizedResponse
        : [];

    const record =
      this.asOptionalRecord(
        records[0]
      );

    if (!record) {

      return {
        isValid: false,
        errorMessage:
          'The XTEIN backend returned an empty user validation response.',
        companies: []
      };
    }

    const errorMessage =
      this.getOptionalString(
        record,
        'ErrMensaje'
      );

    if (errorMessage) {

      return {
        isValid: false,
        errorMessage,
        companies: []
      };
    }

    const companies =
      this.mapCompanies(
        record['EMPRESAS']
      );

    return {
      isValid: true,

      associatedUnitId:
        this.getOptionalString(
          record,
          'ID_UN_ASOCIADA'
        ),

      companies
    };
  }

  /**
   * Maps the legacy authentication response.
   *
   * @param response Raw backend response.
   * @returns Normalized authentication result.
   */
  private mapAuthenticationResponse(
    response: unknown
  ): AuthenticationApiResult {

    const normalizedResponse =
      this.normalizeResponse(
        response
      );

    const record =
      this.asOptionalRecord(
        Array.isArray(normalizedResponse)
          ? normalizedResponse[0]
          : normalizedResponse
      );

    if (!record) {

      return {
        isValid: false,
        errorMessage:
          'The XTEIN backend returned an empty authentication response.'
      };
    }

    const backendMessage =
      this.getOptionalString(
        record,
        'ErrMensaje'
      );

    if (backendMessage !== 'VALIDO') {

      return {
        isValid: false,

        errorMessage:
          backendMessage ??
          'The XTEIN backend rejected the authentication request.'
      };
    }

    return {
      isValid: true,

      token:
        this.getOptionalString(
          record,
          'token'
        ),

      userName:
        this.getOptionalString(
          record,
          'user_name'
        ),

      email:
        this.getOptionalString(
          record,
          'EMAIL'
        ),

      profilePhoto:
        this.getOptionalString(
          record,
          'foto_perfil_user'
        ),

      sessionTimeoutMinutes:
        this.getOptionalNumber(
          record,
          'TIEMPO_SESION'
        )
    };
  }

  /**
   * Maps the legacy company collection.
   *
   * Legacy fields:
   * ID_UN
   * NOMBRE
   *
   * @param value Raw company value.
   * @returns Normalized company collection.
   */
  private mapCompanies(
    value: unknown
  ): CompanyOption[] {

    const normalizedValue =
      this.normalizeResponse(
        value
      );

    if (!Array.isArray(normalizedValue)) {
      return [];
    }

    return normalizedValue
      .map(item =>
        this.asOptionalRecord(item)
      )
      .filter(
        (
          record
        ): record is Record<string, unknown> =>
          Boolean(record)
      )
      .map(record => ({
        id:
          this.getOptionalString(
            record,
            'ID_UN'
          ) ?? '',

        name:
          this.getOptionalString(
            record,
            'NOMBRE'
          ) ?? ''
      }))
      .filter(company =>
        Boolean(company.id)
      );
  }

  /**
   * Normalizes the different response shapes currently returned
   * by the existing XTEIN backend.
   *
   * Supported formats:
   * - JSON serialized as string;
   * - already parsed JSON;
   * - values wrapped inside a data property.
   *
   * @param response Raw backend response.
   * @returns Normalized response value.
   */
  private normalizeResponse(
    response: unknown
  ): unknown {

    let currentValue =
      response;

    for (
      let index = 0;
      index < 5;
      index += 1
    ) {

      if (
        typeof currentValue ===
        'string'
      ) {

        const normalizedString =
          currentValue.trim();

        if (!normalizedString) {
          return currentValue;
        }

        try {

          currentValue =
            JSON.parse(
              normalizedString
            );

          continue;

        } catch {

          return currentValue;
        }
      }

      const record =
        this.asOptionalRecord(
          currentValue
        );

      if (
        record &&
        Object.prototype.hasOwnProperty.call(
          record,
          'data'
        )
      ) {

        currentValue =
          record['data'];

        continue;
      }

      break;
    }

    return currentValue;
  }

  /**
   * Converts a value into an optional record.
   *
   * @param value Value to convert.
   * @returns Record when valid.
   */
  private asOptionalRecord(
    value: unknown
  ): Record<string, unknown> | undefined {

    if (
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return undefined;
    }

    return value as
      Record<string, unknown>;
  }

  /**
   * Reads an optional normalized string.
   *
   * @param record Source record.
   * @param fieldName Backend field name.
   * @returns Normalized string.
   */
  private getOptionalString(
    record: Record<string, unknown>,
    fieldName: string
  ): string | undefined {

    const value =
      record[fieldName];

    if (
      value === null ||
      value === undefined
    ) {
      return undefined;
    }

    const normalizedValue =
      String(value).trim();

    return normalizedValue ||
      undefined;
  }

  /**
   * Reads an optional numeric value.
   *
   * @param record Source record.
   * @param fieldName Backend field name.
   * @returns Numeric value when valid.
   */
  private getOptionalNumber(
    record: Record<string, unknown>,
    fieldName: string
  ): number | undefined {

    const value =
      record[fieldName];

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return undefined;
    }

    const numericValue =
      Number(value);

    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : undefined;
  }
}