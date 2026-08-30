import {
  Injectable
} from '@angular/core';

import {
  Observable,
  map
} from 'rxjs';

import {
  SessionContext,
  SessionService
} from '@xtein/session';

import {
  LoginRequest
} from '../contracts/login-request';

import {
  LoginResult
} from '../contracts/login-result';

import {
  UserValidationResult
} from '../contracts/user-validation-result';

import {
  AuthApiService
} from './auth-api.service';

/**
 * Coordinates XTEIN authentication and authenticated session creation.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private readonly authApi: AuthApiService,
    private readonly sessionService: SessionService
  ) {
  }

  /**
   * Validates a user before authentication.
   *
   * @param userId XTEIN user identifier.
   * @returns User validation information.
   */
  validateUser(
    userId: string
  ): Observable<UserValidationResult> {

    return this.authApi.validateUser(
      userId.trim()
    );
  }

  /**
   * Authenticates a user and starts the XTEIN session.
   *
   * @param request Authentication information.
   * @returns Authentication result.
   */
  login(
    request: LoginRequest
  ): Observable<LoginResult> {

    return this.authApi
      .login(request)
      .pipe(
        map(result => {

          if (!result.isValid) {
            return {
              isAuthenticated: false,
              errorMessage:
                result.errorMessage
            };
          }

          if (!result.token) {
            return {
              isAuthenticated: false,
              errorMessage:
                'The XTEIN backend did not return an authentication token.'
            };
          }

          const session: SessionContext = {
            userId:
              request.userId,

            userName:
              result.userName ?? '',

            email:
              result.email ?? '',

            companyId:
              request.companyId,

            companyName:
              request.companyName,

            associatedUnitId:
              request.associatedUnitId,

            profilePhoto:
              result.profilePhoto,

            token:
              result.token,

            sessionTimeoutSeconds:
              (result.sessionTimeoutMinutes ?? 0) * 60
          };

          this.sessionService.startSession(
            session
          );

          return {
            isAuthenticated: true
          };
        })
      );
  }

  /**
   * Ends the current XTEIN session.
   */
  logout(): void {
    this.sessionService.clearSession();
  }
}