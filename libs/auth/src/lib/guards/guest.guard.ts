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
 * Prevents authenticated users from accessing guest-only routes.
 *
 * Authenticated users are redirected to the main XTEIN workspace.
 */
export const guestGuard: CanActivateFn =
  () => {

    const sessionService =
      inject(SessionService);

    const router =
      inject(Router);

    if (
      !sessionService.isAuthenticated()
    ) {
      return true;
    }

    return router.createUrlTree(
      ['/home']
    );
  };