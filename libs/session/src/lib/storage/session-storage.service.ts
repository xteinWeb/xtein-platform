import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { SessionContext } from '../contracts/session-context';
import { SESSION_STORAGE_KEYS } from './session-storage-keys';

/** Session credentials live only in the current document, never on disk. */
@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  private value: SessionContext | null = null;
  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.removePersistedCredentials();
  }
  load(): SessionContext | null { return this.value ? { ...this.value } : null; }
  save(session: SessionContext): void { this.value = { ...session }; }
  updateToken(token: string): void {
    if (this.value && token) this.value = { ...this.value, token };
  }
  clear(): void { this.value = null; this.removePersistedCredentials(); }

  private removePersistedCredentials(): void {
    for (const storageName of ['localStorage', 'sessionStorage'] as const) {
      try {
        const storage = this.document.defaultView?.[storageName];
        for (const key of Object.values(SESSION_STORAGE_KEYS)) storage?.removeItem(key);
      } catch { /* Storage may be disabled; the session still stays in memory. */ }
    }
  }
}
