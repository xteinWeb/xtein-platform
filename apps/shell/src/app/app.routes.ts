import {
  Routes
} from '@angular/router';

import {
  authGuard,
  guestGuard
} from '@xtein/auth';

import {
  LoginComponent
} from './auth/login/login.component';

import {
  ShellLayout
} from './layout/shell-layout/shell-layout.component';

/**
 * Main routes of the XTEIN Shell.
 */
export const routes: Routes = [

  /**
   * Public authentication route.
   *
   * Authenticated users are automatically redirected
   * to the main XTEIN workspace.
   */
  {
    path: '',
    component: LoginComponent,
    canActivate: [
      guestGuard
    ],
    pathMatch: 'full'
  },

  /**
   * Main authenticated XTEIN workspace.
   */
  {
    path: 'home',
    component: ShellLayout,
    canActivate: [
      authGuard
    ]
  },

  /**
   * Unknown routes return to the application entry point.
   */
  {
    path: '**',
    redirectTo: ''
  }

];