import {
  Injectable,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

import {
  SessionService
} from '@xtein/session';

import {
  XTEIN_THEMES,
  XteinThemeId,
  applyTheme,
  storeTheme,
  themeForUser
} from './xtein-themes';


/**
 * Current XTEIN theme.
 *
 * The theme follows the session: the login page always uses the
 * default theme, signing in applies the user's stored theme, and
 * signing out returns to the default one.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly sessionService =
    inject(
      SessionService
    );

  readonly themes =
    XTEIN_THEMES;

  private readonly currentState =
    signal<XteinThemeId>(
      themeForUser(this.sessionService.session()?.userId)
    );

  readonly current =
    this.currentState.asReadonly();


  constructor() {

    // Reacts to sign-in and sign-out only, not to theme changes. Always
    // applies, because the session may be restored after main.ts already
    // painted the login theme.
    effect(
      () => {
        const theme =
          themeForUser(this.sessionService.session()?.userId);
        untracked(
          () => this.apply(theme)
        );
      }
    );
  }


  /**
   * Applies a theme and stores it for the signed-in user.
   */
  select(
    id: XteinThemeId
  ): void {

    this.apply(id);
    storeTheme(
      id,
      this.sessionService.session()?.userId
    );
  }


  private apply(
    id: XteinThemeId
  ): void {

    applyTheme(id);
    this.currentState.set(id);
  }
}
