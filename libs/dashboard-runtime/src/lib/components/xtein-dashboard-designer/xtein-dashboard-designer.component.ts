import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';

import {
  DxDashboardControlModule
} from 'devexpress-dashboard-angular';


/**
 * Supported XTEIN Web Dashboard working modes.
 */
export type XteinDashboardWorkingMode =
  'Designer' |
  'Viewer' |
  'ViewerOnly';


/**
 * Shared XTEIN wrapper around the DevExpress Web Dashboard control.
 *
 * Functional applications must not configure DevExpress Dashboard
 * directly. Dashboard infrastructure remains encapsulated inside
 * @xtein/dashboard-runtime.
 */
@Component({
  selector:
    'xtein-dashboard-designer',

  standalone:
    true,

  imports: [
    DxDashboardControlModule
  ],

  templateUrl:
    './xtein-dashboard-designer.component.html',

  styleUrl:
    './xtein-dashboard-designer.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class XteinDashboardDesignerComponent {

  /**
   * Dashboard backend endpoint.
   */
  @Input({
    required:
      true
  })
  endpoint =
    '';


  /**
   * Dashboard identifier loaded from dashboard storage.
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
      'Designer';
}