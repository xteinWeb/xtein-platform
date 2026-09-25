import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { SessionContext } from '../contracts/session-context';
import { SESSION_STORAGE_KEYS } from './session-storage-keys';

/**
 * Provides tab-scoped browser storage access for the authenticated XTEIN session.
 *
 * Uses sessionStorage so credentials automatically expire when the tab or
 * browser is closed, while surviving in-tab page reloads (F5 / Enter in URL).
 * Also synchronizes to localStorage while the tab is alive so legacy modules
 * can read existing keys.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  private value: SessionContext | null = null;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document
  ) {
  }

  /**
   * Loads the current session from tab sessionStorage.
   * Survives page reloads (F5 / Enter in address bar).
   */
  load(): SessionContext | null {
    const sessionStore = this.getSessionStorage();
    if (!sessionStore) {
      return this.value ? { ...this.value } : null;
    }

    const userId = sessionStore.getItem(SESSION_STORAGE_KEYS.userId);
    const companyId = sessionStore.getItem(SESSION_STORAGE_KEYS.companyId);
    const token = sessionStore.getItem(SESSION_STORAGE_KEYS.token);

    if (!userId || !companyId || !token) {
      return this.value ? { ...this.value } : null;
    }

    const session: SessionContext = {
      userId,
      userName: sessionStore.getItem(SESSION_STORAGE_KEYS.userName) ?? '',
      email: sessionStore.getItem(SESSION_STORAGE_KEYS.email) ?? '',
      companyId,
      companyName: sessionStore.getItem(SESSION_STORAGE_KEYS.companyName) ?? '',
      associatedUnitId: sessionStore.getItem(SESSION_STORAGE_KEYS.associatedUnitId) ?? '',
      profilePhoto: sessionStore.getItem(SESSION_STORAGE_KEYS.profilePhoto) ?? undefined,
      token,
      sessionTimeoutSeconds: this.parseSessionTimeout(
        sessionStore.getItem(SESSION_STORAGE_KEYS.sessionTimeoutSeconds)
      )
    };

    this.value = session;
    this.syncToLocalStorage(session);
    return session;
  }

  /**
   * Persists the authenticated session to sessionStorage and mirrors to localStorage.
   */
  save(session: SessionContext): void {
    this.value = { ...session };

    const sessionStore = this.getSessionStorage();
    if (sessionStore) {
      this.writeToStorage(sessionStore, session);
    }

    const localStore = this.getLocalStorage();
    if (localStore) {
      this.writeToStorage(localStore, session);
    }
  }

  /**
   * Updates only the authentication token in both storages.
   */
  updateToken(token: string): void {
    if (this.value && token) {
      this.value = { ...this.value, token };
    }
    const sessionStore = this.getSessionStorage();
    if (sessionStore && token) {
      sessionStore.setItem(SESSION_STORAGE_KEYS.token, token);
    }
    const localStore = this.getLocalStorage();
    if (localStore && token) {
      localStore.setItem(SESSION_STORAGE_KEYS.token, token);
    }
  }

  /**
   * Removes credentials from both sessionStorage and localStorage.
   */
  clear(): void {
    this.value = null;
    const sessionStore = this.getSessionStorage();
    if (sessionStore) {
      for (const key of Object.values(SESSION_STORAGE_KEYS)) {
        sessionStore.removeItem(key);
      }
    }
    const localStore = this.getLocalStorage();
    if (localStore) {
      for (const key of Object.values(SESSION_STORAGE_KEYS)) {
        localStore.removeItem(key);
      }
    }
  }

  private writeToStorage(storage: Storage, session: SessionContext): void {
    storage.setItem(SESSION_STORAGE_KEYS.userId, session.userId);
    storage.setItem(SESSION_STORAGE_KEYS.userName, session.userName);
    storage.setItem(SESSION_STORAGE_KEYS.email, session.email);
    storage.setItem(SESSION_STORAGE_KEYS.companyId, session.companyId);
    storage.setItem(SESSION_STORAGE_KEYS.companyName, session.companyName);
    storage.setItem(SESSION_STORAGE_KEYS.associatedUnitId, session.associatedUnitId);

    if (session.profilePhoto) {
      storage.setItem(SESSION_STORAGE_KEYS.profilePhoto, session.profilePhoto);
    } else {
      storage.removeItem(SESSION_STORAGE_KEYS.profilePhoto);
    }

    storage.setItem(SESSION_STORAGE_KEYS.token, session.token);
    storage.setItem(
      SESSION_STORAGE_KEYS.sessionTimeoutSeconds,
      session.sessionTimeoutSeconds.toString()
    );
  }

  private syncToLocalStorage(session: SessionContext): void {
    const localStore = this.getLocalStorage();
    if (localStore) {
      this.writeToStorage(localStore, session);
    }
  }

  private getSessionStorage(): Storage | null {
    try {
      return this.document.defaultView?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private getLocalStorage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private parseSessionTimeout(value: string | null): number {
    if (!value) {
      return 0;
    }
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }
}
