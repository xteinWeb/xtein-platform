import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, NgZone, computed, effect, inject, untracked } from '@angular/core';
import { SessionService } from './session.service';
import { XTEIN_SESSION_POLICY } from '../models/session-policy.model';
import { sessionTimeoutMilliseconds } from './session-timeout';

/** Started once by the shell; background API/token refreshes are not activity. */
@Injectable({ providedIn: 'root' })
export class SessionActivityService {
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SessionService);
  private readonly zone = inject(NgZone);
  private readonly policy = inject(XTEIN_SESSION_POLICY);
  private readonly destroyRef = inject(DestroyRef);
  private deadline = 0;
  private timeoutMilliseconds = 0;
  private timer?: ReturnType<typeof setInterval>;
  private readonly context = computed(() => {
    const session = this.session.session();
    return session ? JSON.stringify([this.session.sessionId(), session.userId, session.companyId, session.sessionTimeoutSeconds]) : '';
  });

  constructor() {
    effect(() => {
      const context = this.context();
      if (this.timer) clearInterval(this.timer);
      this.timer = undefined;
      this.deadline = 0;
      if (!context) return;
      const current = untracked(() => this.session.current);
      if (!current) return;
      this.timeoutMilliseconds = sessionTimeoutMilliseconds(current, this.policy);
      this.deadline = this.session.lastActivityAt + this.timeoutMilliseconds;
      this.zone.runOutsideAngular(() => {
        this.timer = setInterval(() => this.checkExpiry(), 1000);
      });
    });
    const activity = () => {
      // Check before extending: waking a suspended tab must not revive an expired session.
      if (this.document.visibilityState === 'hidden' || !this.deadline || this.checkExpiry()) return;
      this.session.recordActivity();
    };
    const check = () => this.checkExpiry();
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
    this.zone.runOutsideAngular(() => {
      for (const event of events) this.document.addEventListener(event, activity, { passive: true, capture: true });
      this.document.addEventListener('visibilitychange', check);
      this.document.defaultView?.addEventListener('focus', check);
    });
    this.destroyRef.onDestroy(() => {
      if (this.timer) clearInterval(this.timer);
      for (const event of events) this.document.removeEventListener(event, activity, true);
      this.document.removeEventListener('visibilitychange', check);
      this.document.defaultView?.removeEventListener('focus', check);
    });
  }

  private checkExpiry(): boolean {
    if (this.session.current) this.deadline = this.session.lastActivityAt + this.timeoutMilliseconds;
    if (!this.deadline || !this.session.current || Date.now() < this.deadline) return false;
    this.deadline = 0;
    this.zone.run(() => this.session.clearSession());
    return true;
  }
}
