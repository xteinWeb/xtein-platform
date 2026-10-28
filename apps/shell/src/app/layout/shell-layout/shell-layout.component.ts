import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  signal
} from '@angular/core';

import {
  XteinDashboardRuntimeService
} from '@xtein/dashboard-runtime';

import {
  environment
} from '../../../environments/environment';

import {
  Header
} from '../header/header.component';

import {
  Sidebar
} from '../../navigation/sidebar/sidebar.component';

import {
  Workspace
} from '../../workspace/workspace/workspace.component';

import {
  SHELL_COMPACT_MEDIA_QUERY,
  isShellCompactViewport
} from './shell-layout.breakpoints';


/**
 * Main authenticated layout of the XTEIN Shell.
 *
 * The Shell owns global layout state because sidebar changes
 * affect the header and workspace dimensions.
 *
 * The Shell is also responsible for initializing global runtime
 * configuration consumed by shared platform libraries.
 */
@Component({
  selector:
    'app-shell-layout',

  standalone:
    true,

  imports: [
    Header,
    Sidebar,
    Workspace
  ],

  templateUrl:
    './shell-layout.component.html',

  styleUrl:
    './shell-layout.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ShellLayout {

  /**
   * Indicates whether the viewport uses the compact layout,
   * where the expanded sidebar floats over the workspace.
   */
  readonly compactLayout =
    signal(
      isShellCompactViewport()
    );


  /**
   * Indicates whether the main navigation sidebar
   * is collapsed.
   *
   * On compact viewports the sidebar starts collapsed so the
   * workspace keeps the available width.
   */
  readonly sidebarCollapsed =
    signal(
      this.compactLayout()
    );


  constructor(
    private readonly dashboardRuntime:
      XteinDashboardRuntimeService,

    destroyRef:
      DestroyRef
  ) {

    this.initializeDashboardRuntime();

    this.watchCompactLayout(
      destroyRef
    );
  }


  /**
   * Updates the sidebar layout state.
   *
   * @param collapsed New collapsed state.
   */
  setSidebarCollapsed(
    collapsed:
      boolean
  ): void {

    this.sidebarCollapsed.set(
      collapsed
    );
  }


  /**
   * Collapses the floating sidebar when the user taps the
   * backdrop on compact viewports.
   */
  closeFloatingSidebar():
    void {

    this.sidebarCollapsed.set(
      true
    );
  }


  /**
   * Keeps the compact layout state in sync with the viewport
   * and collapses the sidebar when entering compact mode.
   */
  private watchCompactLayout(
    destroyRef:
      DestroyRef
  ): void {

    if (
      typeof window === 'undefined'
      || typeof window.matchMedia !== 'function'
    ) {

      return;
    }


    const mediaQuery =
      window.matchMedia(
        SHELL_COMPACT_MEDIA_QUERY
      );


    const onChange =
      (
        event:
          MediaQueryListEvent
      ): void => {

        this.compactLayout.set(
          event.matches
        );

        if (
          event.matches
        ) {

          this.sidebarCollapsed.set(
            true
          );
        }
      };


    mediaQuery.addEventListener(
      'change',
      onChange
    );

    destroyRef.onDestroy(
      () =>
        mediaQuery.removeEventListener(
          'change',
          onChange
        )
    );
  }


  /**
   * Initializes the shared XTEIN Dashboard runtime.
   *
   * The Dashboard Designer endpoint is obtained directly from
   * the Shell environment.
   *
   * A relative endpoint is intentionally used because the
   * existing XTEIN proxy routes Dashboard requests to the
   * Dashboard backend.
   */
  private initializeDashboardRuntime():
    void {

    if (
      this.dashboardRuntime
        .isConfigured()
    ) {

      return;
    }


    this.dashboardRuntime
      .configure({

        designerEndpoint:
          environment.dashboardDesigner
      });
  }
}