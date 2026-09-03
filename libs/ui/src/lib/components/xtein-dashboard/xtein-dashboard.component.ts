import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed
} from '@angular/core';

import {
  DxDashboardControlModule
} from 'devexpress-dashboard-angular';

import {
  XteinDashboardRuntimeService
} from '@xtein/dashboard-runtime';


/**
 * Supported XTEIN Dashboard working modes.
 */
export type XteinDashboardWorkingMode =
  'Designer' |
  'Viewer' |
  'ViewerOnly';


/**
 * Shared visual Dashboard control used by XTEIN applications.
 *
 * Functional applications do not configure DevExpress directly.
 * Endpoint configuration is provided centrally by the Shell
 * through @xtein/dashboard-runtime.
 */
@Component({
  selector:
    'xtein-dashboard',

  standalone:
    true,

  imports: [
    DxDashboardControlModule
  ],

  templateUrl:
    './xtein-dashboard.component.html',

  styleUrl:
    './xtein-dashboard.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class XteinDashboardComponent {

  /**
   * Dashboard identifier stored in the Dashboard backend.
   */
  @Input()
  dashboardId =
    '';


  /**
   * Dashboard working mode.
   */
  @Input()
  workingMode:
    XteinDashboardWorkingMode =
      'Viewer';


  /**
   * Absolute Dashboard endpoint supplied by the shared runtime.
   */
  readonly endpoint =
    computed(
      () => {

        if (
          !this.dashboardRuntime
            .isConfigured()
        ) {

          return '';
        }


        return this.dashboardRuntime
          .getDesignerEndpoint();
      }
    );


  constructor(
    private readonly dashboardRuntime:
      XteinDashboardRuntimeService
  ) {
  }
}