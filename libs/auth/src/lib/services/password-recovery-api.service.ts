import {
  Injectable
} from '@angular/core';

import {
  Observable,
  map
} from 'rxjs';

import {
  XteinApiClientService
} from '@xtein/api-client';

import {
  PasswordChangeRequest
} from '../contracts/password-change-request';

import {
  PasswordChangeResult
} from '../contracts/password-change-result';

import {
  PasswordCodeRequest
} from '../contracts/password-code-request';

import {
  PasswordCodeResult
} from '../contracts/password-code-result';

import {
  PasswordCodeValidationRequest
} from '../contracts/password-code-validation-request';

import {
  PasswordCodeValidationResult
} from '../contracts/password-code-validation-result';

/**
 * Provides password recovery communication with
 * the existing XTEIN Node.js backend.
 *
 * Legacy endpoints, actions, payload field names, and response
 * structures are isolated exclusively inside this adapter.
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryApiService {

  private static readonly generateCodeEndpoint =
    '/getCodigoResetPassword';

  private static readonly generateCodeAction =
    'GENERAR CODIGO';

  private static readonly validateCodeEndpoint =
    '/validatePassword';

  private static readonly validateCodeAction =
    'VERIFICAR CODIGO';

  private static readonly updatePasswordEndpoint =
    '/updatePassword';

  private static readonly updatePasswordAction =
    'UPDATE PASSWORD';

  constructor(
    private readonly apiClient:
      XteinApiClientService
  ) {
  }

  /**
   * Requests a password recovery code.
   *
   * @param request Password recovery request.
   * @returns Recovery code request result.
   */
  requestCode(
    request: PasswordCodeRequest
  ): Observable<PasswordCodeResult> {

    return this.apiClient
      .execute<unknown>({

        endpoint:
          PasswordRecoveryApiService
            .generateCodeEndpoint,

        action:
          PasswordRecoveryApiService
            .generateCodeAction,

        data: {
          USUARIO:
            request.userId
        },

        accessMode:
          'public'
      })
      .pipe(
        map(response =>
          this.mapCodeRequestResponse(
            response
          )
        )
      );
  }

  /**
   * Validates a password recovery code.
   *
   * @param request Recovery code validation request.
   * @returns Code validation result.
   */
  validateCode(
    request: PasswordCodeValidationRequest
  ): Observable<PasswordCodeValidationResult> {

    return this.apiClient
      .execute<unknown>({

        endpoint:
          PasswordRecoveryApiService
            .validateCodeEndpoint,

        action:
          PasswordRecoveryApiService
            .validateCodeAction,

        data: {
          USUARIO:
            request.userId,

          CODIGO:
            request.code
        },

        accessMode:
          'public'
      })
      .pipe(
        map(response =>
          this.mapCodeValidationResponse(
            response
          )
        )
      );
  }

  /**
   * Updates the user's password.
   *
   * @param request Password change request.
   * @returns Password change result.
   */
  changePassword(
    request: PasswordChangeRequest
  ): Observable<PasswordChangeResult> {

    return this.apiClient
      .execute<unknown>({

        endpoint:
          PasswordRecoveryApiService
            .updatePasswordEndpoint,

        action:
          PasswordRecoveryApiService
            .updatePasswordAction,

        data: {
          USUARIO:
            request.userId,

          PASSWORD:
            request.newPassword
        },

        accessMode:
          'public'
      })
      .pipe(
        map(response =>
          this.mapPasswordChangeResponse(
            response
          )
        )
      );
  }

  /**
   * Maps the recovery-code generation response.
   */
  private mapCodeRequestResponse(
    response: unknown
  ): PasswordCodeResult {

    const record =
      this.getFirstRecord(
        response
      );

    if (!record) {

      return {
        isSuccessful: false,
        errorMessage:
          'El servidor no devolvió información para la recuperación de contraseña.'
      };
    }

    const errorMessage =
      this.getOptionalString(
        record,
        'ErrMensaje'
      );

    if (errorMessage) {

      return {
        isSuccessful: false,
        errorMessage
      };
    }

    const userData =
      this.asOptionalRecord(
        this.normalizeResponse(
          record['DATA_USER']
        )
      );

    return {
      isSuccessful: true,

      destinationEmail:
        userData
          ? this.getOptionalString(
              userData,
              'EMAIL'
            )
          : undefined
    };
  }

  /**
   * Maps the recovery-code validation response.
   */
  private mapCodeValidationResponse(
    response: unknown
  ): PasswordCodeValidationResult {

    const record =
      this.getRecord(
        response
      );

    if (!record) {

      return {
        isValid: false,
        errorMessage:
          'El servidor no devolvió información al validar el código.'
      };
    }

    const errorMessage =
      this.getOptionalString(
        record,
        'ErrMensaje'
      );

    return {
      isValid:
        !errorMessage,

      errorMessage
    };
  }

  /**
   * Maps the password-update response.
   */
  private mapPasswordChangeResponse(
    response: unknown
  ): PasswordChangeResult {

    const record =
      this.getFirstRecord(
        response
      );

    if (!record) {

      return {
        isSuccessful: false,
        errorMessage:
          'El servidor no devolvió información al actualizar la contraseña.'
      };
    }

    const errorMessage =
      this.getOptionalString(
        record,
        'ErrMensaje'
      );

    return {
      isSuccessful:
        !errorMessage,

      errorMessage
    };
  }

  /**
   * Returns the first record from a backend response.
   */
  private getFirstRecord(
    response: unknown
  ): Record<string, unknown> | undefined {

    const normalizedResponse =
      this.normalizeResponse(
        response
      );

    if (
      !Array.isArray(
        normalizedResponse
      )
    ) {
      return undefined;
    }

    return this.asOptionalRecord(
      normalizedResponse[0]
    );
  }

  /**
   * Returns a record from an array or direct object response.
   */
  private getRecord(
    response: unknown
  ): Record<string, unknown> | undefined {

    const normalizedResponse =
      this.normalizeResponse(
        response
      );

    if (
      Array.isArray(
        normalizedResponse
      )
    ) {

      return this.asOptionalRecord(
        normalizedResponse[0]
      );
    }

    return this.asOptionalRecord(
      normalizedResponse
    );
  }

  /**
   * Normalizes the different response formats returned
   * by the existing Node.js backend.
   *
   * Supported formats:
   * - serialized JSON;
   * - already parsed JSON;
   * - values wrapped inside a data property.
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

        const text =
          currentValue.trim();

        if (!text) {
          return currentValue;
        }

        try {

          currentValue =
            JSON.parse(
              text
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
        Object.prototype
          .hasOwnProperty.call(
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
   * Converts an unknown value into an optional record.
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
}