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
 * MAD-002 owns the application-tree selection.
 *
 * The visual Dashboard implementation belongs to @xtein/ui,
 * while Dashboard infrastructure and configuration belong to
 * @xtein/dashboard-runtime.
 */
@Component({
  selector:
    'mad-002',

  standalone:
    true,

  imports: [
    XteinTreeComponent,
    XteinDashboardComponent,
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
   * Fields included in the local tree search.
   */
  readonly treeSearchFields =
    Mad002TreeSearchFields;


  /**
   * Complete application hierarchy returned by MAD-002.
   */
  readonly applications =
    signal<
      readonly Mad002ApplicationNode[]
    >(
      []
    );


  /**
   * Identifier of the Dashboard or KPI currently loaded
   * inside the designer.
   */
  readonly selectedDashboardId =
    signal(
      ''
    );


  /**
   * Currently selected application metadata.
   */
  readonly selectedApplication =
    signal<
      Mad002ApplicationNode | null
    >(
      null
    );


  /**
   * Indicates whether the application tree is collapsed.
   */
  readonly treePanelCollapsed =
    signal(
      false
    );


  /**
   * Indicates whether MAD-002 is processing an operation.
   */
  readonly loading =
    signal(
      false
    );


  /**
   * Current toolbar permissions.
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
   * Initializes MAD-002.
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
   * Handles selection from the shared XTEIN tree.
   *
   * Module nodes are navigation containers and do not open
   * the Dashboard Designer.
   *
   * Dashboard and KPI nodes load their corresponding
   * Dashboard identifier.
   *
   * @param item Selected application-tree item.
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


    const applicationType =
      this.readString(
        item,
        'TIPO'
      )
        .toUpperCase();


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
      !Mad002DesignableApplicationTypes
        .has(
          applicationType
        )
    ) {

      this.selectedDashboardId.set(
        ''
      );

      return;
    }


    this.selectedDashboardId.set(
      applicationId
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
   * Subscribes the application to commands emitted by the
   * shared XTEIN record toolbar.
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
   * Handles MAD-002 toolbar commands.
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

        this.refresh();

        break;


      default:

        break;
    }
  }


  /**
   * Loads permissions and the initial application hierarchy.
   */
  private loadInitialData():
    void {

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


                this.applications.set(
                  applications
                );


                this.restoreSelection(
                  applications
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
   * Reloads the application hierarchy.
   *
   * The currently opened Dashboard is preserved when it still
   * exists after the refresh.
   */
  private refresh():
    void {

    if (
      this.loading()
    ) {

      return;
    }


    const selectedApplicationId =
      this.selectedApplication()
        ?.ID_APLICACION ??
      '';


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


                this.applications.set(
                  applications
                );


                if (
                  selectedApplicationId
                ) {

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


                  if (
                    !selectedApplication ||
                    !this.isDesignableApplication(
                      selectedApplication
                    )
                  ) {

                    this.selectedDashboardId.set(
                      ''
                    );
                  }

                } else {

                  this.selectedApplication.set(
                    null
                  );


                  this.selectedDashboardId.set(
                    ''
                  );
                }


                this.notification
                  .info(
                    'Información actualizada.'
                  );

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
   * Restores a valid Dashboard selection after loading data.
   *
   * @param applications Loaded applications.
   */
  private restoreSelection(
    applications:
      readonly Mad002ApplicationNode[]
  ): void {

    const dashboardId =
      this.selectedDashboardId();


    if (
      !dashboardId
    ) {

      return;
    }


    const application =
      applications
        .find(
          current =>
            current.ID_APLICACION ===
            dashboardId
        ) ??
      null;


    if (
      !application ||
      !this.isDesignableApplication(
        application
      )
    ) {

      this.selectedApplication.set(
        null
      );


      this.selectedDashboardId.set(
        ''
      );


      return;
    }


    this.selectedApplication.set(
      application
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
   * Determines whether an application can be opened inside
   * the Dashboard Designer.
   *
   * @param application Application record.
   * @returns True for Dashboard and KPI applications.
   */
  private isDesignableApplication(
    application:
      Mad002ApplicationNode
  ): boolean {

    const type =
      application.TIPO
        ?.trim()
        .toUpperCase() ??
      '';


    return Mad002DesignableApplicationTypes
      .has(
        type
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
   * Reads one string property from a generic XTEIN tree item.
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
   * Displays an unexpected application error using the
   * shared XTEIN notification service.
   *
   * @param error Unknown error.
   * @param fallbackMessage Default message.
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