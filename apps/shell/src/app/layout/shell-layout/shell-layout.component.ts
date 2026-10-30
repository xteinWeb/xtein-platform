import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
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
 * The Shell owns the navigation state: the application sidebar
 * floats over the workspace, opens from the header menu button
 * and closes when an application is opened, on a click outside
 * it or with Escape.
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
   * Indicates whether the floating navigation sidebar
   * is open.
   */
  readonly sidebarOpen =
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
   * Opens or closes the floating navigation sidebar.
   */
  toggleSidebar(): void {

    this.sidebarOpen.update(
      open => !open
    );
  }


  /**
   * Closes the floating navigation sidebar.
   */
  closeSidebar(): void {

    this.sidebarOpen.set(
      false
    );
  }


  /**
   * Escape closes the floating navigation sidebar.
   */
  @HostListener(
    'document:keydown.escape'
  )
  onEscape(): void {

    if (this.sidebarOpen()) {

      this.closeSidebar();
    }
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