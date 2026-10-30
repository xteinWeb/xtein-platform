import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '@xtein/auth';

import {
  SessionService
} from '@xtein/session';

import {
  PlatformToolbar
} from '../../toolbar/platform-toolbar/platform-toolbar.component';

import {
  ThemeService
} from '../../theme/theme.service';

import {
  XteinThemeId
} from '../../theme/xtein-themes';


@Component({
  selector:
    'app-header',

  standalone:
    true,

  imports: [
    PlatformToolbar
  ],

  templateUrl:
    './header.component.html',

  styleUrl:
    './header.component.scss'
})
export class Header {

  /**
   * Whether the floating applications menu is open.
   */
  @Input()
  menuOpen =
    false;


  /**
   * Asks the Shell layout to open or close the
   * applications menu.
   */
  @Output()
  readonly menuToggle =
    new EventEmitter<void>();


  private readonly authService =
    inject(
      AuthService
    );


  private readonly sessionService =
    inject(
      SessionService
    );


  private readonly router =
    inject(
      Router
    );

  private readonly themeService =
    inject(
      ThemeService
    );


  /**
   * Themes offered in the user menu.
   */
  readonly themes =
    this.themeService
      .themes;


  readonly currentTheme =
    this.themeService
      .current;


  /**
   * Applies and stores the chosen theme; the menu stays open
   * so the user can compare.
   */
  selectTheme(
    id: XteinThemeId
  ): void {

    this.themeService.select(
      id
    );
  }


  /**
   * Current authenticated XTEIN session.
   */
  readonly session =
    this.sessionService
      .session;


  /**
   * User initials displayed when no profile photo is available.
   */
  readonly userInitials =
    computed(
      () => {

        const currentSession =
          this.session();


        const displayName =
          currentSession
            ?.userName
            ?.trim() ||
          currentSession
            ?.userId
            ?.trim() ||
          'XT';


        const parts =
          displayName
            .split(
              /\s+/
            )
            .filter(
              Boolean
            )
            .slice(
              0,
              2
            );


        return parts
          .map(
            part =>
              part
                .charAt(
                  0
                )
                .toUpperCase()
          )
          .join(
            ''
          );
      }
    );


  /**
   * Indicates whether the user menu is visible.
   */
  userMenuOpen =
    false;


  /**
   * Opens or closes the user menu.
   */
  toggleUserMenu():
    void {

    this.userMenuOpen =
      !this.userMenuOpen;
  }


  /**
   * Closes the user menu when the user clicks outside it.
   */
  @HostListener(
    'document:click',
    [
      '$event'
    ]
  )
  onDocumentClick(
    event:
      MouseEvent
  ): void {

    const target =
      event.target as
        HTMLElement | null;


    if (
      target?.closest(
        '.xt-header__user'
      )
    ) {

      return;
    }


    this.userMenuOpen =
      false;
  }


  /**
   * Ends the authenticated XTEIN session
   * and returns to the login page.
   */
  async logout():
    Promise<void> {

    this.userMenuOpen =
      false;


    this.authService
      .logout();


    await this.router
      .navigateByUrl(
        '/'
      );
  }
}