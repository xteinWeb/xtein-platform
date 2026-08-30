import {
  Injectable
} from '@angular/core';

import {
  PasswordPolicyResult
} from '../contracts/password-policy-result';

/**
 * Validates passwords against the XTEIN security policy.
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordPolicyService {

  private static readonly minimumLength =
    8;

  private static readonly maximumLength =
    128;

  private static readonly forbiddenPasswords = [
    'admadm123',
    '123456',
    '12345678',
    'password',
    'admin',
    'qwerty',
    'letmein',
    'welcome',
    '1234',
    '12345',
    '123123',
    'abc123',
    'password123',
    'admin123',
    '1111',
    '0000',
    '9999',
    'test',
    'user',
    'guest',
    'demo',
    '111111',
    '222222',
    '333333'
  ] as const;

  private static readonly sequentialPatterns = [
    '123456',
    '654321',
    'abcdef',
    'fedcba',
    'qwerty',
    'asdfgh',
    '098765',
    '567890',
    'mnbvcx',
    'zxcvbn'
  ] as const;

  /**
   * Validates a password against the complete
   * XTEIN password policy.
   */
  validate(
    password: string,
    userId?: string
  ): PasswordPolicyResult {

    const errors: string[] = [];

    if (
      password.length <
      PasswordPolicyService.minimumLength
    ) {

      errors.push(
        'Mínimo 8 caracteres'
      );
    }

    if (
      password.length >
      PasswordPolicyService.maximumLength
    ) {

      errors.push(
        'Máximo 128 caracteres'
      );
    }

    const normalizedPassword =
      password.toLowerCase();

    const containsForbiddenPassword =
      PasswordPolicyService
        .forbiddenPasswords
        .some(forbiddenPassword =>
          normalizedPassword.includes(
            forbiddenPassword
          )
        );

    if (
      containsForbiddenPassword
    ) {

      errors.push(
        'No usar contraseñas comunes o inseguras'
      );
    }

    const normalizedUserId =
      userId
        ?.trim()
        .toLowerCase();

    if (
      normalizedUserId &&
      normalizedPassword.includes(
        normalizedUserId
      )
    ) {

      errors.push(
        'No debe contener el nombre de usuario'
      );
    }

    const containsSequentialPattern =
      PasswordPolicyService
        .sequentialPatterns
        .some(pattern =>
          normalizedPassword.includes(
            pattern
          )
        );

    if (
      containsSequentialPattern
    ) {

      errors.push(
        'No usar secuencias de caracteres consecutivos'
      );
    }

    if (
      !/[a-z]/.test(
        password
      )
    ) {

      errors.push(
        'Al menos una letra minúscula (a-z)'
      );
    }

    if (
      !/[A-Z]/.test(
        password
      )
    ) {

      errors.push(
        'Al menos una letra mayúscula (A-Z)'
      );
    }

    if (
      !/[0-9]/.test(
        password
      )
    ) {

      errors.push(
        'Al menos un número (0-9)'
      );
    }

    if (
      !/[^a-zA-Z0-9]/.test(
        password
      )
    ) {

      errors.push(
        'Al menos un carácter especial (!@#$%^&*-_=+)'
      );
    }

    if (
      /^(.)\1+$/.test(
        password
      )
    ) {

      errors.push(
        'No puede ser solo repetición del mismo carácter'
      );
    }

    if (
      errors.length > 0
    ) {

      return {
        isValid: false,
        errors,

        message:
          `La contraseña debe cumplir: ${errors.join(', ')}`
      };
    }

    return {
      isValid: true,
      errors: [],
      message:
        'Contraseña válida.'
    };
  }
}