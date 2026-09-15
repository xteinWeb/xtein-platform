import { InjectionToken } from '@angular/core';

export interface SessionPolicy {
  /** Fallback when the login response has no positive TIEMPO_SESION. */
  inactivityTimeoutSeconds: number;
  useBackendTimeout: boolean;
}

export const XTEIN_SESSION_POLICY = new InjectionToken<SessionPolicy>('XTEIN_SESSION_POLICY', {
  providedIn: 'root',
  factory: () => ({ inactivityTimeoutSeconds: 15 * 60, useBackendTimeout: true })
});
