import {
  computed,
  Injectable,
  signal
} from '@angular/core';

import { SessionContext } from '../contracts/session-context';
import { SessionStorageService } from '../storage/session-storage.service';
import { Subject } from 'rxjs';
import { SessionUpdate, SharedSession } from '../models/shared-session.model';

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
  private readonly idState = signal('');
  readonly sessionId = this.idState.asReadonly();
  private activityAt = 0;
  private readonly updateSubject = new Subject<SessionUpdate>();
  readonly updates = this.updateSubject.asObservable();

  get lastActivityAt(): number { return this.activityAt; }
  get sharedSnapshot(): SharedSession | null {
    const context = this.current;
    return context && this.idState() ? { id: this.idState(), context: { ...context }, lastActivityAt: this.activityAt } : null;
  }

  adoptSharedSession(snapshot: SharedSession): void {
    this.idState.set(snapshot.id);
    this.activityAt = snapshot.lastActivityAt;
    this.sessionStorage.save(snapshot.context);
    this.sessionState.set({ ...snapshot.context });
  }

  recordActivity(at = Date.now(), broadcast = true): void {
    if (!this.current) return;
    this.activityAt = Math.max(this.activityAt, at);
    if (broadcast) this.updateSubject.next({ type: 'activity', sessionId: this.idState(), lastActivityAt: this.activityAt });
  }

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
    const initial = this.sessionState();
    if (initial) {
      this.idState.set(crypto.randomUUID());
      this.activityAt = Date.now();
    }
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
    this.idState.set(crypto.randomUUID());
    this.activityAt = Date.now();
    this.sessionStorage.save(session);
    this.sessionState.set(session);
    this.updateSubject.next({ type: 'login', snapshot: this.sharedSnapshot! });
  }

  /**
   * Updates the authentication token returned by the backend.
   *
   * @param token Refreshed authentication token.
   */
  updateToken(token: string, broadcast = true): void {

    if (!token) {
      return;
    }

    const currentSession =
      this.sessionState();

    if (!currentSession) {
      return;
    }

    this.sessionStorage.updateToken(token);

    this.sessionState.set({
      ...currentSession,
      token
    });
    if (broadcast) this.updateSubject.next({ type: 'token', sessionId: this.idState(), token });
  }

  /**
   * Clears the current authenticated session.
   */
  clearSession(broadcast = true): void {
    const sessionId = this.idState();
    this.sessionStorage.clear();
    this.sessionState.set(null);
    this.idState.set('');
    this.activityAt = 0;
    if (broadcast && sessionId) this.updateSubject.next({ type: 'logout', sessionId });
  }
}
