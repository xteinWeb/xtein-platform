import {
  DOCUMENT
} from '@angular/common';

import {
  Inject,
  Injectable
} from '@angular/core';

import { SessionContext } from '../contracts/session-context';
import { SESSION_STORAGE_KEYS } from './session-storage-keys';

/**
 * Provides browser storage access for the authenticated XTEIN session.
 *
 * This service isolates the legacy localStorage contract from the rest
 * of the new platform.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document
  ) {
  }

  /**
   * Loads the current session from browser storage.
   *
   * @returns Stored session or null when no valid session exists.
   */
  load(): SessionContext | null {

    const storage = this.getStorage();

    if (!storage) {
      return null;
    }

    const userId =
      storage.getItem(SESSION_STORAGE_KEYS.userId);

    const companyId =
      storage.getItem(SESSION_STORAGE_KEYS.companyId);

    const token =
      storage.getItem(SESSION_STORAGE_KEYS.token);

    if (!userId || !companyId || !token) {
      return null;
    }

    return {
      userId,
      userName:
        storage.getItem(SESSION_STORAGE_KEYS.userName) ?? '',
      email:
        storage.getItem(SESSION_STORAGE_KEYS.email) ?? '',
      companyId,
      companyName:
        storage.getItem(SESSION_STORAGE_KEYS.companyName) ?? '',
      associatedUnitId:
        storage.getItem(
          SESSION_STORAGE_KEYS.associatedUnitId
        ) ?? '',
      profilePhoto:
        storage.getItem(
          SESSION_STORAGE_KEYS.profilePhoto
        ) ?? undefined,
      token,
      sessionTimeoutSeconds:
        this.parseSessionTimeout(
          storage.getItem(
            SESSION_STORAGE_KEYS.sessionTimeoutSeconds
          )
        )
    };
  }

  /**
   * Persists the complete authenticated session.
   *
   * Legacy storage keys are preserved intentionally during migration.
   *
   * @param session Session to persist.
   */
  save(session: SessionContext): void {

    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    storage.setItem(
      SESSION_STORAGE_KEYS.userId,
      session.userId
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.userName,
      session.userName
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.email,
      session.email
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.companyId,
      session.companyId
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.companyName,
      session.companyName
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.associatedUnitId,
      session.associatedUnitId
    );

    this.setOptionalValue(
      storage,
      SESSION_STORAGE_KEYS.profilePhoto,
      session.profilePhoto
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.token,
      session.token
    );

    storage.setItem(
      SESSION_STORAGE_KEYS.sessionTimeoutSeconds,
      session.sessionTimeoutSeconds.toString()
    );
  }

  /**
   * Updates only the authentication token.
   *
   * This is used when the backend returns a refreshed token.
   *
   * @param token New authentication token.
   */
  updateToken(token: string): void {

    const storage = this.getStorage();

    if (!storage || !token) {
      return;
    }

    storage.setItem(
      SESSION_STORAGE_KEYS.token,
      token
    );
  }

  /**
   * Removes the authenticated session from browser storage.
   *
   * Only session-related values are removed. Other application settings
   * remain untouched.
   */
  clear(): void {

    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    Object
      .values(SESSION_STORAGE_KEYS)
      .forEach(key => storage.removeItem(key));
  }

  /**
   * Returns browser localStorage when available.
   *
   * @returns Browser storage or null outside a browser environment.
   */
  private getStorage(): Storage | null {

    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Stores or removes an optional value.
   *
   * @param storage Browser storage.
   * @param key Storage key.
   * @param value Optional value.
   */
  private setOptionalValue(
    storage: Storage,
    key: string,
    value?: string
  ): void {

    if (value) {
      storage.setItem(key, value);
      return;
    }

    storage.removeItem(key);
  }

  /**
   * Parses the stored session timeout.
   *
   * @param value Stored timeout value.
   * @returns Session timeout in seconds.
   */
  private parseSessionTimeout(
    value: string | null
  ): number {

    if (!value) {
      return 0;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }
}