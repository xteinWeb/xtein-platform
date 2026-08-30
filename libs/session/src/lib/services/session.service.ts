import {
  computed,
  Injectable,
  signal
} from '@angular/core';

import { SessionContext } from '../contracts/session-context';
import { SessionStorageService } from '../storage/session-storage.service';

/**
 * Maintains the authenticated XTEIN session.
 *
 * The service is the single runtime source of session information for
 * the Shell, shared libraries, API client, guards, and microfrontends.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {

  /**
   * Internal session state initialized from browser storage.
   */
  private readonly sessionState =
    signal<SessionContext | null>(
      this.sessionStorage.load()
    );

  /**
   * Read-only authenticated session.
   */
  readonly session =
    this.sessionState.asReadonly();

  /**
   * Indicates whether an authenticated session currently exists.
   */
  readonly isAuthenticated =
    computed(
      () => Boolean(this.sessionState()?.token)
    );

  constructor(
    private readonly sessionStorage: SessionStorageService
  ) {
  }

  /**
   * Returns the current session synchronously.
   */
  get current(): SessionContext | null {
    return this.sessionState();
  }

  /**
   * Starts or replaces the authenticated session.
   *
   * @param session Authenticated session information.
   */
  startSession(
    session: SessionContext
  ): void {

    this.sessionStorage.save(session);
    this.sessionState.set(session);
  }

  /**
   * Updates the authentication token returned by the backend.
   *
   * @param token Refreshed authentication token.
   */
  updateToken(token: string): void {

    if (!token) {
      return;
    }

    const currentSession =
      this.sessionState();

    this.sessionStorage.updateToken(token);

    if (!currentSession) {
      return;
    }

    this.sessionState.set({
      ...currentSession,
      token
    });
  }

  /**
   * Clears the current authenticated session.
   */
  clearSession(): void {

    this.sessionStorage.clear();
    this.sessionState.set(null);
  }
}