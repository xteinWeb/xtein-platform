import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { SessionService } from './session.service';
import { XTEIN_SESSION_POLICY } from '../models/session-policy.model';
import { SessionTabMessage, SharedSession } from '../models/shared-session.model';
import { SESSION_CHANNEL_NAME, SESSION_DISCOVERY_TIMEOUT_MS } from '../constants/session-tabs.constants';
import { sessionTimeoutMilliseconds } from './session-timeout';

/** Synchronizes live session state across tabs using BroadcastChannel. */
@Injectable({ providedIn: 'root' })
export class SessionTabsService {
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SessionService);
  private readonly zone = inject(NgZone);
  private readonly policy = inject(XTEIN_SESSION_POLICY);
  private readonly destroyRef = inject(DestroyRef);
  private channel?: BroadcastChannel;
  private ready?: Promise<void>;
  private requestId = '';
  private finishDiscovery?: () => void;
  private readonly revoked = new Set<string>();

  constructor() {
    const updates = this.session.updates.subscribe(message => {
      if (message.type === 'logout') this.revoked.add(message.sessionId);
      this.post(message);
    });
    const leave = () => this.detach();
    const resume = (event: PageTransitionEvent) => { if (event.persisted) void this.initialize(); };
    this.document.defaultView?.addEventListener('pagehide', leave);
    this.document.defaultView?.addEventListener('pageshow', resume);
    this.destroyRef.onDestroy(() => {
      updates.unsubscribe();
      this.document.defaultView?.removeEventListener('pagehide', leave);
      this.document.defaultView?.removeEventListener('pageshow', resume);
      this.detach();
    });
  }

  /** The shell waits for discovery before running its initial route guards. */
  initialize(): Promise<void> {
    if (this.ready) return this.ready;
    const Channel = this.document.defaultView?.BroadcastChannel;
    if (!Channel) return Promise.resolve();
    try {
      this.zone.runOutsideAngular(() => {
        this.channel = new Channel(SESSION_CHANNEL_NAME);
        this.channel.onmessage = event => this.receive(event.data);
      });
    } catch { return Promise.resolve(); }

    if (this.session.current) {
      return Promise.resolve();
    }

    this.requestId = crypto.randomUUID();
    this.ready = new Promise<void>(resolve => {
      const timer = setTimeout(() => this.finishDiscovery?.(), SESSION_DISCOVERY_TIMEOUT_MS);
      this.finishDiscovery = () => {
        clearTimeout(timer);
        this.requestId = '';
        this.finishDiscovery = undefined;
        if (!this.session.current) {
          this.session.clearSession(false);
        }
        resolve();
      };
      this.post({ type: 'request', requestId: this.requestId });
    });
    return this.ready;
  }

  private post(message: SessionTabMessage): void {
    this.channel?.postMessage(message);
  }

  private detach(): void {
    this.channel?.close();
    this.channel = undefined;
    this.finishDiscovery?.();
    this.ready = undefined;
  }

  private receive(raw: unknown): void {
    if (!raw || typeof raw !== 'object') return;
    const message = raw as Record<string, unknown>;
    switch (message['type']) {
      case 'request': {
        if (typeof message['requestId'] !== 'string') return;
        const snapshot = this.session.sharedSnapshot;
        if (!snapshot) return;
        if (!this.isLive(snapshot)) {
          this.zone.run(() => this.session.clearSession());
          return;
        }
        this.post({ type: 'reply', requestId: message['requestId'], snapshot });
        break;
      }
      case 'reply':
        if (!this.requestId || message['requestId'] !== this.requestId || this.session.current) return;
        this.adopt(message['snapshot']);
        break;
      case 'login':
        this.adopt(message['snapshot']);
        break;
      case 'logout': {
        const id = message['sessionId'];
        if (typeof id !== 'string') return;
        this.revoked.add(id);
        if (id === this.session.sessionId()) this.zone.run(() => this.session.clearSession(false));
        break;
      }
      case 'activity':
        if (message['sessionId'] === this.session.sessionId() && typeof message['lastActivityAt'] === 'number'
          && Number.isFinite(message['lastActivityAt']) && message['lastActivityAt'] <= Date.now()) {
          this.session.recordActivity(message['lastActivityAt'], false);
        }
        break;
      case 'token':
        if (message['sessionId'] === this.session.sessionId() && typeof message['token'] === 'string') {
          this.zone.run(() => this.session.updateToken(message['token'] as string, false));
        }
        break;
    }
  }

  private adopt(value: unknown): void {
    if (!isSharedSession(value) || this.revoked.has(value.id) || !this.isLive(value)) return;
    this.zone.run(() => this.session.adoptSharedSession(value));
    this.finishDiscovery?.();
  }

  private isLive(snapshot: SharedSession): boolean {
    return snapshot.lastActivityAt + sessionTimeoutMilliseconds(snapshot.context, this.policy) > Date.now();
  }
}

function isSharedSession(value: unknown): value is SharedSession {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<SharedSession>;
  const context = snapshot.context;
  return typeof snapshot.id === 'string' && !!snapshot.id && typeof snapshot.lastActivityAt === 'number'
    && Number.isFinite(snapshot.lastActivityAt) && snapshot.lastActivityAt <= Date.now()
    && !!context && typeof context === 'object'
    && ['userId', 'companyId', 'token'].every(key => typeof context[key as keyof typeof context] === 'string' && !!context[key as keyof typeof context])
    && ['userName', 'email', 'companyName', 'associatedUnitId'].every(key => typeof context[key as keyof typeof context] === 'string')
    && typeof context.sessionTimeoutSeconds === 'number';
}
