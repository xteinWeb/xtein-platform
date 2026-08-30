import {
  Injectable
} from '@angular/core';

import {
  Observable,
  of
} from 'rxjs';

import {
  PasswordChangeResult
} from '../contracts/password-change-result';

import {
  PasswordCodeResult
} from '../contracts/password-code-result';

import {
  PasswordCodeValidationResult
} from '../contracts/password-code-validation-result';

import {
  PasswordPolicyResult
} from '../contracts/password-policy-result';

import {
  PasswordPolicyService
} from './password-policy.service';

import {
  PasswordRecoveryApiService
} from './password-recovery-api.service';

/**
 * Coordinates the complete XTEIN password recovery workflow.
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {

  /**
   * Required recovery-code length.
   */
  static readonly recoveryCodeLength =
    6;

  constructor(
    private readonly passwordRecoveryApi:
      PasswordRecoveryApiService,

    private readonly passwordPolicy:
      PasswordPolicyService
  ) {
  }

  /**
   * Requests a recovery code for an XTEIN user.
   */
  requestCode(
    userId: string
  ): Observable<PasswordCodeResult> {

    const normalizedUserId =
      userId.trim();

    if (
      normalizedUserId.length < 5
    ) {

      return of({
        isSuccessful: false,
        errorMessage:
          'El usuario es inválido.'
      });
    }

    return this.passwordRecoveryApi
      .requestCode({
        userId:
          normalizedUserId
      });
  }

  /**
   * Validates a six-digit password recovery code.
   */
  validateCode(
    userId: string,
    code: string
  ): Observable<PasswordCodeValidationResult> {

    const normalizedUserId =
      userId.trim();

    if (
      normalizedUserId.length < 5
    ) {

      return of({
        isValid: false,
        errorMessage:
          'El usuario es inválido.'
      });
    }

    const normalizedCode =
      code.trim();

    if (
      !/^\d{6}$/.test(
        normalizedCode
      )
    ) {

      return of({
        isValid: false,
        errorMessage:
          'Digite todos los números del código (6 dígitos).'
      });
    }

    return this.passwordRecoveryApi
      .validateCode({
        userId:
          normalizedUserId,

        code:
          normalizedCode
      });
  }

  /**
   * Validates a password without modifying it.
   */
  validatePassword(
    userId: string,
    password: string
  ): PasswordPolicyResult {

    return this.passwordPolicy
      .validate(
        password,
        userId
      );
  }

  /**
   * Changes the user's password after validating
   * the complete XTEIN password policy.
   */
  changePassword(
    userId: string,
    newPassword: string,
    confirmationPassword: string
  ): Observable<PasswordChangeResult> {

    const normalizedUserId =
      userId.trim();

    const validation =
      this.passwordPolicy
        .validate(
          newPassword,
          normalizedUserId
        );

    if (
      !validation.isValid
    ) {

      return of({
        isSuccessful: false,
        errorMessage:
          validation.message
      });
    }

    if (
      newPassword !==
      confirmationPassword
    ) {

      return of({
        isSuccessful: false,
        errorMessage:
          'Las contraseñas no coinciden.'
      });
    }

    return this.passwordRecoveryApi
      .changePassword({
        userId:
          normalizedUserId,

        newPassword
      });
  }
}