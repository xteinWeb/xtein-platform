import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import {
  Subscription,
  finalize,
  forkJoin
} from 'rxjs';

import {
  DeniedRecordToolbarPermissions,
  RecordToolbarMode,
  RecordToolbarPermissions,
  ToolbarAction,
  ToolbarCommand,
  createRecordToolbarState
} from '@xtein/sdk';

import {
  RecordToolbarPermissionsService,
  ToolbarRuntimeService
} from '@xtein/runtime';

import {
  XteinDashboardComponent,
  XteinDashboardFrameComponent,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinTreeComponent,
  XteinTreeDataItem
} from '@xtein/ui';

import {
  Mad002Application,
  Mad002DesignableApplicationTypes
} from './constants/mad-002.constants';

import {
  Mad002ToolbarCapabilities,
  Mad002TreeSearchFields
} from './constants/mad-002-ui.constants';

import {
  Mad002ApplicationNode
} from './models/mad-002.model';

import {
  Mad002Service
} from './services/mad-002.service';


/**
 * MAD-002 - Dashboard and KPI Designer.
 *
 * Responsibilities:
 *
 * - Load the application hierarchy.
 * - Reload the hierarchy from the global record toolbar.
 * - Select Dashboard and KPI applications.
 * - Send the selected Dashboard identifier to the shared
 *   XTEIN Dashboard control.
 *
 * DevExpress Dashboard implementation details remain
 * encapsulated inside the shared platform libraries.
 */
@Component({
  selector:
    'mad-002',

  standalone:
    true,

  imports: [
    XteinTreeComponent,
    XteinDashboardComponent,
    XteinDashboardFrameComponent,
    XteinLoadingComponent
  ],

  providers: [
    Mad002Service
  ],

  templateUrl:
    './mad-002.component.html',

  styleUrl:
    './mad-002.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Mad002Component
  implements OnInit, OnDestroy {

  /**
   * Current XTEIN application identifier.
   */
  readonly applicationId =
    Mad002Application.Id;


  /**
   * Fields included in the application-tree search.
   */
  readonly treeSearchFields =
    Mad002TreeSearchFields;


  /**
   * Complete application hierarchy.
   */
  readonly applications =
    signal<
      readonly Mad002ApplicationNode[]
    >(
      []
    );


  /**
   * Application currently selected in the tree.
   */
  readonly selectedApplication =
    signal<
      Mad002ApplicationNode | null
    >(
      null
    );


  /**
   * Dashboard identifier currently loaded in the
   * shared Dashboard control.
   */
  readonly selectedDashboardId =
    signal(
      ''
    );


  /**
   * Indicates whether the tree panel is collapsed.
   */
  readonly treePanelCollapsed =
    signal(
      false
    );


  /**
   * Indicates whether MAD-002 is executing an operation.
   */
  readonly loading =
    signal(
      false
    );


  /**
   * Current record-toolbar permissions.
   */
  private permissions:
    Readonly<RecordToolbarPermissions> =
      DeniedRecordToolbarPermissions;


  /**
   * Application-owned subscriptions.
   */
  private readonly subscriptions =
    new Subscription();


  constructor(
    private readonly mad002Service:
      Mad002Service,

    private readonly permissionsService:
      RecordToolbarPermissionsService,

    private readonly toolbarRuntime:
      ToolbarRuntimeService,

    private readonly notification:
      XteinNotificationService
  ) {
  }


  /**
   * Initializes the application.
   */
  ngOnInit():
    void {

    this.subscribeToToolbar();

    this.publishToolbarState();

    this.loadInitialData();
  }


  /**
   * Releases application subscriptions.
   */
  ngOnDestroy():
    void {

    this.subscriptions
      .unsubscribe();
  }


  /**
   * Handles an item selected from the XTEIN tree.
   *
   * Dashboard and KPI records load the Dashboard whose
   * identifier corresponds to ID_APLICACION.
   *
   * Container/module records only update tree selection.
   *
   * @param item Selected tree item.
   */
  selectTreeItem(
    item:
      XteinTreeDataItem
  ): void {

    const applicationId =
      this.readString(
        item,
        'ID_APLICACION'
      );


    if (
      !applicationId
    ) {

      return;
    }


    const application =
      this.applications()
        .find(
          current =>
            current.ID_APLICACION ===
            applicationId
        ) ??
      null;


    if (
      !application
    ) {

      return;
    }


    this.selectedApplication.set(
      application
    );


    if (
      !this.isDesignableApplication(
        application
      )
    ) {

      return;
    }


    /*
     * Do not rely only on Angular input binding.
     *
     * XteinDashboardComponent explicitly calls
     * DashboardControl.loadDashboard when this value changes,
     * reproducing the behavior of the legacy Dashboard wrapper.
     */
    this.selectedDashboardId.set(
      application.ID_APLICACION
    );
  }


  /**
   * Collapses or expands the application tree.
   */
  toggleTreePanel():
    void {

    this.treePanelCollapsed
      .update(
        collapsed =>
          !collapsed
      );
  }


  /**
   * Subscribes MAD-002 to commands emitted by
   * the global XTEIN record toolbar.
   */
  private subscribeToToolbar():
    void {

    this.subscriptions.add(

      this.toolbarRuntime
        .commandsForApplication(
          this.applicationId
        )
        .subscribe(
          command =>
            this.handleToolbarCommand(
              command
            )
        )

    );
  }


  /**
   * Handles commands from the global XTEIN record toolbar.
   *
   * Refresh reproduces the legacy r_refrescar operation:
   * the complete application tree is requested again.
   *
   * @param command Toolbar command.
   */
  private handleToolbarCommand(
    command:
      ToolbarCommand
  ): void {

    switch (
      command.action
    ) {

      case ToolbarAction.Refresh:

        this.reloadApplicationTree(
          true
        );

        break;


      default:

        break;
    }
  }


  /**
   * Loads permissions and the application tree.
   */
  private loadInitialData():
    void {

    if (
      this.loading()
    ) {

      return;
    }


    this.loading.set(
      true
    );


    this.subscriptions.add(

      forkJoin({

        permissions:
          this.permissionsService
            .getPermissions(
              this.applicationId
            ),

        tree:
          this.mad002Service
            .getApplicationTree()

      })
        .pipe(
          finalize(
            () =>
              this.loading.set(
                false
              )
          )
        )
        .subscribe({

          next:
            result => {

              try {

                this.permissions =
                  result.permissions;


                const applications =
                  this.parseApplicationTree(
                    result.tree.data
                  );


                this.applyApplicationTree(
                  applications,
                  ''
                );


                this.publishToolbarState();

              } catch (error) {

                this.permissions =
                  DeniedRecordToolbarPermissions;


                this.publishToolbarState();


                this.showUnknownError(
                  error,
                  'No fue posible cargar el árbol de aplicaciones.'
                );
              }
            },


          error:
            error => {

              this.permissions =
                DeniedRecordToolbarPermissions;


              this.publishToolbarState();


              this.showUnknownError(
                error,
                'No fue posible inicializar la aplicación.'
              );
            }
        })

    );
  }


  /**
   * Reloads the complete application hierarchy.
   *
   * This method intentionally executes ARBOL_APLICACIONES again.
   * It does not only repaint the existing tree.
   *
   * The currently loaded Dashboard remains selected when the
   * corresponding application still exists.
   *
   * @param notifyUser Indicates whether a successful refresh
   * should display a notification.
   */
  private reloadApplicationTree(
    notifyUser:
      boolean
  ): void {

    if (
      this.loading()
    ) {

      return;
    }


    const selectedApplicationId =
      this.selectedApplication()
        ?.ID_APLICACION ??
      '';


    const selectedDashboardId =
      this.selectedDashboardId();


    this.loading.set(
      true
    );


    this.subscriptions.add(

      this.mad002Service
        .getApplicationTree()
        .pipe(
          finalize(
            () =>
              this.loading.set(
                false
              )
          )
        )
        .subscribe({

          next:
            response => {

              try {

                const applications =
                  this.parseApplicationTree(
                    response.data
                  );


                this.applyApplicationTree(
                  applications,
                  selectedApplicationId
                );


                /*
                 * Preserve the currently displayed Dashboard only when
                 * the corresponding application continues to exist.
                 */
                if (
                  selectedDashboardId
                ) {

                  const dashboardApplication =
                    applications
                      .find(
                        application =>
                          application.ID_APLICACION ===
                          selectedDashboardId
                      ) ??
                    null;


                  if (
                    !dashboardApplication ||
                    !this.isDesignableApplication(
                      dashboardApplication
                    )
                  ) {

                    this.selectedDashboardId.set(
                      ''
                    );
                  }
                }


                if (
                  notifyUser
                ) {

                  this.notification
                    .success(
                      'Árbol de aplicaciones actualizado.'
                    );
                }

              } catch (error) {

                this.showUnknownError(
                  error,
                  'No fue posible refrescar el árbol de aplicaciones.'
                );
              }
            },


          error:
            error =>
              this.showUnknownError(
                error,
                'No fue posible refrescar el árbol de aplicaciones.'
              )
        })

    );
  }


  /**
   * Applies a newly retrieved application hierarchy.
   *
   * A new array reference is always assigned so the shared
   * tree rebuilds its internal hierarchy.
   *
   * @param applications New application hierarchy.
   * @param selectedApplicationId Previous selection.
   */
  private applyApplicationTree(
    applications:
      readonly Mad002ApplicationNode[],

    selectedApplicationId:
      string
  ): void {

    this.applications.set(
      [
        ...applications
      ]
    );


    if (
      !selectedApplicationId
    ) {

      this.selectedApplication.set(
        null
      );

      return;
    }


    const selectedApplication =
      applications
        .find(
          application =>
            application.ID_APLICACION ===
            selectedApplicationId
        ) ??
      null;


    this.selectedApplication.set(
      selectedApplication
    );
  }


  /**
   * Publishes MAD-002 state to the global record toolbar.
   */
  private publishToolbarState():
    void {

    this.toolbarRuntime
      .setState(
        createRecordToolbarState({

          applicationId:
            this.applicationId,

          mode:
            RecordToolbarMode.Initial,

          permissions:
            this.permissions,

          capabilities:
            Mad002ToolbarCapabilities,

          currentIndex:
            0,

          totalRecords:
            0
        })
      );
  }


  /**
   * Determines whether an application represents a Dashboard
   * that can be loaded by the Dashboard Designer.
   *
   * @param application Application record.
   * @returns True when the application is designable.
   */
  private isDesignableApplication(
    application:
      Mad002ApplicationNode
  ): boolean {

    const applicationType =
      application.TIPO
        ?.trim()
        .toUpperCase() ??
      '';


    return Mad002DesignableApplicationTypes
      .has(
        applicationType
      );
  }


  /**
   * Parses the existing MAD-002 application-tree response.
   *
   * @param data Backend response data.
   * @returns Application hierarchy.
   */
  private parseApplicationTree(
    data:
      unknown
  ): Mad002ApplicationNode[] {

    let parsed =
      data;


    if (
      typeof parsed ===
        'string'
    ) {

      const value =
        parsed.trim();


      if (
        !value
      ) {

        return [];
      }


      parsed =
        JSON.parse(
          value
        );
    }


    if (
      !Array.isArray(
        parsed
      )
    ) {

      throw new Error(
        'The MAD-002 application-tree response must contain an array.'
      );
    }


    const applications =
      parsed as
        Mad002ApplicationNode[];


    const errorMessage =
      applications[
        0
      ]
        ?.ErrMensaje
        ?.trim();


    if (
      errorMessage
    ) {

      throw new Error(
        errorMessage
      );
    }


    return applications;
  }


  /**
   * Reads one string property from a generic tree item.
   *
   * @param item Tree item.
   * @param propertyName Property name.
   * @returns Normalized string value.
   */
  private readString(
    item:
      XteinTreeDataItem,

    propertyName:
      string
  ): string {

    return String(
      item[
        propertyName
      ] ??
      ''
    ).trim();
  }


  /**
   * Displays an unexpected application error.
   *
   * @param error Unknown error.
   * @param fallbackMessage Default user-facing message.
   */
  private showUnknownError(
    error:
      unknown,

    fallbackMessage:
      string
  ): void {

    console.error(
      'MAD-002 operation failed.',
      error
    );


    const message =
      error instanceof Error &&
      error.message.trim()

        ? error.message.trim()

        : fallbackMessage;


    this.notification
      .error(
        message
      );
  }
}
