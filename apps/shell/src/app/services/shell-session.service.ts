import { Injectable, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { SessionActivityService, SessionService } from '@xtein/session';
import { WorkspaceRuntimeService } from '@xtein/runtime';
import { ApplicationNavigationService } from '../navigation/services/application-navigation.service';

@Injectable({ providedIn: 'root' })
export class ShellSessionService {
  private readonly activity = inject(SessionActivityService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly workspace = inject(WorkspaceRuntimeService);
  private readonly navigation = inject(ApplicationNavigationService);
  private previousSessionId = '';

  constructor() {
    effect(() => {
      const sessionId = this.session.sessionId();
      const previous = this.previousSessionId;
      untracked(() => {
        if (previous && previous !== sessionId) {
          this.workspace.clear();
          this.navigation.clear();
        }
        if (previous && !sessionId) {
          void this.router.navigateByUrl('/', { replaceUrl: true });
        } else if (sessionId && previous !== sessionId) {
          if (previous) this.navigation.load();
          if (this.router.url === '/' || this.router.url.startsWith('/?')) void this.router.navigateByUrl('/home', { replaceUrl: true });
        }
      });
      this.previousSessionId = sessionId;
    });
  }
}
