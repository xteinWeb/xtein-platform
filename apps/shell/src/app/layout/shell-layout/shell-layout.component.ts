import {
  ChangeDetectionStrategy,
  Component,
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
   * Indicates whether the main navigation sidebar
   * is collapsed.
   */
  readonly sidebarCollapsed =
    signal(
      false
    );


  constructor(
    private readonly dashboardRuntime:
      XteinDashboardRuntimeService
  ) {

    this.initializeDashboardRuntime();
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