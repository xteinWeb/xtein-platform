import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  SessionService
} from '@xtein/session';

/**
 * Protects routes that require an authenticated XTEIN session.
 */
export const authGuard: CanActivateFn =
  (_route, state) => {

    const sessionService =
      inject(SessionService);

    const router =
      inject(Router);

    if (
      sessionService.isAuthenticated()
    ) {
      return true;
    }

    return router.createUrlTree(
      ['/'],
      {
        queryParams: {
          returnUrl: state.url
        }
      }
    );
  };