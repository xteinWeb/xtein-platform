import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  computed
} from '@angular/core';

import {
  DxDashboardControlComponent,
  DxDashboardControlModule
} from 'devexpress-dashboard-angular';

import {
  DashboardControlArgs
} from 'devexpress-dashboard';

import {
  XteinDashboardExtensionRegistryService,
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
 * Responsibilities:
 *
 * - Obtain the Dashboard endpoint from the shared runtime.
 * - Initialize the DevExpress Dashboard control.
 * - Register platform Dashboard extensions before rendering.
 * - Explicitly load a Dashboard when dashboardId changes.
 *
 * Functional applications do not interact directly with
 * DevExpress Dashboard.
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
export class XteinDashboardComponent
  implements OnChanges, AfterViewInit {

  /**
   * DevExpress Angular Dashboard component.
   */
  @ViewChild(
    DxDashboardControlComponent
  )
  private dashboardComponent?:
    DxDashboardControlComponent;


  /**
   * Dashboard identifier stored by the Dashboard backend.
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
   * Dashboard endpoint supplied by the shared XTEIN runtime.
   *
   * The endpoint is configured by the Shell using
   * environment.dashboardDesigner.
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


  /**
   * Indicates whether Angular already initialized the
   * underlying DevExpress component.
   */
  private viewInitialized =
    false;


  constructor(
    private readonly dashboardRuntime:
      XteinDashboardRuntimeService,

    private readonly extensionRegistry:
      XteinDashboardExtensionRegistryService
  ) {
  }


  /**
   * Reacts to input changes.
   *
   * When dashboardId changes after the DevExpress control has
   * already been initialized, the selected Dashboard is explicitly
   * loaded again.
   *
   * This reproduces the behavior of the legacy Dashboard wrapper.
   *
   * @param changes Angular input changes.
   */
  ngOnChanges(
    changes:
      SimpleChanges
  ): void {

    if (
      !changes[
        'dashboardId'
      ]
    ) {

      return;
    }


    if (
      !this.viewInitialized
    ) {

      return;
    }


    this.synchronizeDashboard();
  }


  /**
   * Synchronizes the initial Dashboard after Angular creates
   * the DevExpress component.
   */
  ngAfterViewInit():
    void {

    this.viewInitialized =
      true;


    this.synchronizeDashboard();
  }


  /**
   * Handles the DevExpress Dashboard BeforeRender event.
   *
   * The Angular wrapper exposes the template event as Object,
   * therefore it is validated and converted internally before
   * accessing the DashboardControl instance.
   *
   * All XTEIN Dashboard extensions are registered here before
   * the Dashboard completes its rendering process.
   *
   * @param event DevExpress BeforeRender event.
   */
  handleBeforeRender(
    event:
      unknown
  ): void {

    if (
      !event ||
      typeof event !==
        'object'
    ) {

      return;
    }


    const dashboardArgs =
      event as
        DashboardControlArgs;


    if (
      !dashboardArgs.component
    ) {

      return;
    }


    this.extensionRegistry
      .registerExtensions(
        dashboardArgs.component
      );
  }


  /**
   * Synchronizes dashboardId with the underlying
   * DevExpress DashboardControl.
   *
   * Angular input binding alone is intentionally not used
   * to perform Dashboard navigation because the legacy wrapper
   * explicitly called DashboardControl.loadDashboard().
   */
  private synchronizeDashboard():
    void {

    const dashboardControl =
      this.dashboardComponent
        ?.instance;


    if (
      !dashboardControl
    ) {

      return;
    }


    const dashboardId =
      this.dashboardId
        ?.trim();


    if (
      !dashboardId
    ) {

      dashboardControl
        .unloadDashboard();

      return;
    }


    dashboardControl
      .loadDashboard(
        dashboardId
      );
  }
}