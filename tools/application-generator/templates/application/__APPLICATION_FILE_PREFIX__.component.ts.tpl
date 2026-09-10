import {
  untracked,
  effect,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import {
  FormGroup
} from '@angular/forms';

import {
  Subscription,
  finalize,
  firstValueFrom
} from 'rxjs';

import Swal from 'sweetalert2';

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
  ToolbarRuntimeService,
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  XteinNotificationService
} from '@xtein/ui';

import {
  __APPLICATION_CLASS_PREFIX__Application
} from './constants/__APPLICATION_FILE_PREFIX__.constants';

import {
  __APPLICATION_CLASS_PREFIX__DefaultRecord,
  __APPLICATION_CLASS_PREFIX__ToolbarCapabilities
} from './constants/__APPLICATION_FILE_PREFIX__-ui.constants';

import {
  __APPLICATION_CLASS_PREFIX__Record
} from './models/__APPLICATION_FILE_PREFIX__-record.model';

import {
  __APPLICATION_CLASS_PREFIX__Service
} from './services/__APPLICATION_FILE_PREFIX__.service';


/**
 * __APPLICATION_ID__ application component.
 */
@Component({
  selector:
    '__APPLICATION_FILE_PREFIX__',

  standalone:
    true,

  providers: [
    __APPLICATION_CLASS_PREFIX__Service
  ],

  templateUrl:
    './__APPLICATION_FILE_PREFIX__.component.html',

  styleUrl:
    './__APPLICATION_FILE_PREFIX__.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class __APPLICATION_CLASS_PREFIX__Component
  implements OnInit, OnDestroy {

  /**
   * XTEIN application identifier.
   */
  readonly applicationId =
    __APPLICATION_CLASS_PREFIX__Application.Id;


  /**
   * Base reactive form.
   *
   * Add one FormControl for every editable field of
   * __TABLE_NAME__ when the functional model is implemented.
   */
  readonly form =
    new FormGroup({});


  /**
   * Current record-toolbar mode.
   */
  readonly mode =
    signal<RecordToolbarMode>(
      RecordToolbarMode.Initial
    );


  /**
   * Indicates whether the application is executing backend work.
   */
  readonly loading =
    signal(
      false
    );


  /**
   * Indicates whether the form is currently read-only.
   */
  readonly readOnly =
    signal(
      true
    );


  /**
   * Records loaded by the application.
   */
  readonly records =
    signal<
      readonly __APPLICATION_CLASS_PREFIX__Record[]
    >(
      []
    );


  /**
   * Zero-based index of the currently selected record.
   */
  readonly currentIndex =
    signal(
      0
    );


  /**
   * Indicates that a save attempt requested form validation.
   */
  readonly validationRequested =
    signal(
      false
    );


  /**
   * Keeps the shared toolbar busy state synchronized with the
   * application's loading state.
   */
  private readonly synchronizeBusyToolbar =
    effect(() => {

      this.loading();

      untracked(() =>
        this.publishToolbarState()
      );
    });


  /**
   * Permissions remain denied until the runtime retrieves the
   * permissions assigned to the authenticated user.
   */
  private permissions:
    Readonly<RecordToolbarPermissions> =
      DeniedRecordToolbarPermissions;


  /**
   * Snapshot used to restore the record when an edit/create/copy
   * operation is cancelled.
   */
  private previousRecord:
    __APPLICATION_CLASS_PREFIX__Record | null =
      null;


  /**
   * Prevents programmatic form updates from marking the workspace
   * tab as dirty.
   */
  private synchronizingForm =
    false;


  /**
   * Subscriptions owned by this application instance.
   */
  private readonly subscriptions =
    new Subscription();


  constructor(
    private readonly applicationService:
      __APPLICATION_CLASS_PREFIX__Service,

    private readonly permissionsService:
      RecordToolbarPermissionsService,

    private readonly toolbarRuntime:
      ToolbarRuntimeService,

    private readonly workspaceRuntime:
      WorkspaceRuntimeService,

    private readonly notification:
      XteinNotificationService
  ) {

    this.form.disable({
      emitEvent:
        false
    });
  }


  ngOnInit():
    void {

    this.subscribeToToolbarCommands();

    this.subscribeToFormChanges();

    this.publishToolbarState();

    this.loadInitializationData();
  }


  ngOnDestroy():
    void {

    this.subscriptions
      .unsubscribe();

    this.toolbarRuntime
      .removeApplication(
        this.applicationId
      );
  }


  /**
   * Subscribes to commands addressed to this application.
   */
  private subscribeToToolbarCommands():
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
   * Marks the workspace tab as dirty when the user changes the form
   * while creating, editing or copying a record.
   */
  private subscribeToFormChanges():
    void {

    this.subscriptions.add(
      this.form.valueChanges
        .subscribe(() => {

          if (
            this.synchronizingForm ||
            !this.isChanging()
          ) {

            return;
          }


          this.workspaceRuntime
            .setDirty(
              this.applicationId,
              true
            );
        })
    );
  }


  /**
   * Loads platform-owned initialization information.
   *
   * Application-specific catalogs or reference data must be added
   * here when the functional implementation requires them.
   */
  private loadInitializationData():
    void {

    this.loading.set(
      true
    );


    this.subscriptions.add(
      this.permissionsService
        .getPermissions(
          this.applicationId
        )
        .pipe(
          finalize(() =>
            this.loading.set(
              false
            )
          )
        )
        .subscribe({

          next:
            permissions => {

              this.permissions =
                permissions;

              this.publishToolbarState();
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
   * Routes every standard XTEIN toolbar action to its application
   * handler. Authorization is resolved by the toolbar runtime from
   * the user permissions loaded for this application.
   */
  private handleToolbarCommand(
    command:
      ToolbarCommand
  ): void {

    if (
      this.loading()
    ) {

      return;
    }


    switch (
      command.action
    ) {

      case ToolbarAction.Initialize:

        this.initializeApplication();

        break;


      case ToolbarAction.New:

        this.startCreating();

        break;


      case ToolbarAction.Edit:

        this.startEditing();

        break;


      case ToolbarAction.Copy:

        this.startCopying();

        break;


      case ToolbarAction.Save:

        void this.saveCurrentRecord();

        break;


      case ToolbarAction.Cancel:

        void this.cancelCurrentOperation();

        break;


      case ToolbarAction.Delete:

        void this.deleteCurrentRecord();

        break;


      case ToolbarAction.Search:

        this.searchRecords();

        break;


      case ToolbarAction.View:

        this.viewRecords();

        break;


      case ToolbarAction.Sort:

        this.sortRecords();

        break;


      case ToolbarAction.First:

        this.navigateTo(
          0
        );

        break;


      case ToolbarAction.Previous:

        this.navigateTo(
          this.currentIndex() - 1
        );

        break;


      case ToolbarAction.GoTo:

        if (
          typeof command.payload === 'number' &&
          Number.isInteger(command.payload) &&
          command.payload >= 1 &&
          command.payload <= this.records().length
        ) {

          this.navigateTo(
            command.payload - 1
          );
        }

        break;


      case ToolbarAction.Next:

        this.navigateTo(
          this.currentIndex() + 1
        );

        break;


      case ToolbarAction.Last:

        this.navigateTo(
          this.records().length - 1
        );

        break;


      case ToolbarAction.Print:

        this.printRecords();

        break;


      case ToolbarAction.Download:

        this.downloadRecords();

        break;


      case ToolbarAction.Refresh:

        this.refreshRecords();

        break;


      case ToolbarAction.Configure:

        this.configureApplication();

        break;


      default:

        break;
    }
  }


  /**
   * Handles explicit toolbar initialization.
   */
  private initializeApplication():
    void {

    this.publishToolbarState();
  }


  /**
   * Starts creation of a new record.
   */
  private startCreating():
    void {

    this.previousRecord =
      this.records().length > 0
        ? this.cloneRecord(
            this.getCurrentRecord()
          )
        : null;


    this.mode.set(
      RecordToolbarMode.Creating
    );


    this.readOnly.set(
      false
    );


    this.validationRequested.set(
      false
    );


    this.setFormRecord(
      __APPLICATION_CLASS_PREFIX__DefaultRecord,
      false
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


  /**
   * Starts editing the selected record.
   */
  private startEditing():
    void {

    const currentRecord =
      this.getCurrentRecord();


    if (
      !currentRecord
    ) {

      return;
    }


    this.previousRecord =
      this.cloneRecord(
        currentRecord
      );


    this.mode.set(
      RecordToolbarMode.Editing
    );


    this.readOnly.set(
      false
    );


    this.validationRequested.set(
      false
    );


    this.setFormEditable(
      true
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


  /**
   * Starts creation of a new record from the selected record.
   *
   * Reset identity, sequence or unique-key fields in setFormRecord()
   * when the table contract requires it.
   */
  private startCopying():
    void {

    const currentRecord =
      this.getCurrentRecord();


    if (
      !currentRecord
    ) {

      return;
    }


    this.previousRecord =
      this.cloneRecord(
        currentRecord
      );


    this.mode.set(
      RecordToolbarMode.Copying
    );


    this.readOnly.set(
      false
    );


    this.validationRequested.set(
      false
    );


    this.setFormRecord(
      currentRecord,
      false
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


  /**
   * Saves the current create, edit or copy operation.
   */
  private async saveCurrentRecord():
    Promise<void> {

    if (
      !this.isChanging() ||
      this.loading()
    ) {

      return;
    }


    if (
      !this.validateForm()
    ) {

      return;
    }


    const record =
      this.getFormRecord();


    this.loading.set(
      true
    );


    try {

      const currentMode =
        this.mode();


      const response =
        currentMode === RecordToolbarMode.Editing
          ? await firstValueFrom(
              this.applicationService
                .update({
                  [__APPLICATION_CLASS_PREFIX__Application.Table]:
                    record
                })
            )
          : await firstValueFrom(
              this.applicationService
                .create({
                  [__APPLICATION_CLASS_PREFIX__Application.Table]:
                    record
                })
            );


      this.ensureSuccessfulMutation(
        response.data
      );


      if (
        currentMode === RecordToolbarMode.Editing
      ) {

        const updatedRecords = [
          ...this.records()
        ];


        updatedRecords[
          this.currentIndex()
        ] =
          this.cloneRecord(record) ??
          record;


        this.records.set(
          updatedRecords
        );


        this.mode.set(
          RecordToolbarMode.Browsing
        );

      } else {

        /*
         * The backend may assign identity values while creating or
         * copying. Reload the real record collection when the final
         * query contract is implemented instead of inventing a key.
         */
        this.records.set(
          []
        );


        this.currentIndex.set(
          0
        );


        this.mode.set(
          RecordToolbarMode.Initial
        );
      }


      this.previousRecord =
        this.cloneRecord(
          record
        );


      this.readOnly.set(
        true
      );


      this.validationRequested.set(
        false
      );


      this.setFormEditable(
        false
      );


      this.workspaceRuntime
        .setDirty(
          this.applicationId,
          false
        );


      this.publishToolbarState();


      this.notification
        .success(
          'Registro actualizado.'
        );

    } catch (error) {

      this.showUnknownError(
        error,
        'No fue posible guardar el registro.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


  /**
   * Cancels the current create, edit or copy operation.
   */
  private async cancelCurrentOperation():
    Promise<void> {

    if (
      !this.isChanging()
    ) {

      return;
    }


    const dirty =
      this.workspaceRuntime
        .getTab(
          this.applicationId
        )
        ?.dirty ??
      false;


    const result =
      await Swal.fire({

        title:
          this.workspaceRuntime
            .getApplicationTitle(
              this.applicationId
            ),

        text:
          dirty
            ? '¿Desea cancelar sin guardar cambios?'
            : '¿Desea cancelar la operación?',

        icon:
          'warning',

        showCancelButton:
          true,

        confirmButtonColor:
          '#DF3E3E',

        cancelButtonColor:
          '#438ef1',

        cancelButtonText:
          'No',

        confirmButtonText:
          'Sí, cancelar'
      });


    if (
      !result.isConfirmed
    ) {

      return;
    }


    if (
      this.previousRecord
    ) {

      this.setFormRecord(
        this.previousRecord,
        true
      );

    } else {

      this.setFormRecord(
        __APPLICATION_CLASS_PREFIX__DefaultRecord,
        true
      );
    }


    this.mode.set(
      this.records().length > 0
        ? RecordToolbarMode.Browsing
        : RecordToolbarMode.Initial
    );


    this.readOnly.set(
      true
    );


    this.validationRequested.set(
      false
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


  /**
   * Deletes the selected record.
   *
   * getDeleteRequest() contains the generic payload shape and must be
   * adapted when the backend delete contract expects only key fields.
   */
  private async deleteCurrentRecord():
    Promise<void> {

    const currentRecord =
      this.getCurrentRecord();


    if (
      !currentRecord ||
      this.loading()
    ) {

      return;
    }


    const result =
      await Swal.fire({

        title:
          this.workspaceRuntime
            .getApplicationTitle(
              this.applicationId
            ),

        text:
          '¿Desea eliminar el registro seleccionado?',

        icon:
          'warning',

        showCancelButton:
          true,

        confirmButtonColor:
          '#DF3E3E',

        cancelButtonColor:
          '#438ef1',

        cancelButtonText:
          'No',

        confirmButtonText:
          'Sí, eliminar'
      });


    if (
      !result.isConfirmed
    ) {

      return;
    }


    this.loading.set(
      true
    );


    try {

      const response =
        await firstValueFrom(
          this.applicationService
            .delete(
              this.getDeleteRequest(
                currentRecord
              )
            )
        );


      this.ensureSuccessfulMutation(
        response.data
      );


      const remainingRecords =
        this.records()
          .filter(
            (
              _,
              index
            ) =>
              index !==
              this.currentIndex()
          );


      this.records.set(
        remainingRecords
      );


      if (
        remainingRecords.length > 0
      ) {

        this.navigateTo(
          Math.min(
            this.currentIndex(),
            remainingRecords.length - 1
          )
        );

      } else {

        this.currentIndex.set(
          0
        );


        this.mode.set(
          RecordToolbarMode.Initial
        );


        this.setFormRecord(
          __APPLICATION_CLASS_PREFIX__DefaultRecord,
          true
        );


        this.publishToolbarState();
      }


      this.workspaceRuntime
        .setDirty(
          this.applicationId,
          false
        );


      this.notification
        .success(
          'Registro eliminado.'
        );

    } catch (error) {

      this.showUnknownError(
        error,
        'No fue posible eliminar el registro.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


  /**
   * Opens or executes record search.
   *
   * Add XteinRecordFilterComponent integration when searchable fields
   * are defined for the application.
   */
  private searchRecords():
    void {

    // Implement application search using the shared XTEIN controls.
  }


  /**
   * Opens the quick record view.
   */
  private viewRecords():
    void {

    // Implement XteinRecordViewComponent when view columns are defined.
  }


  /**
   * Applies or opens record sorting.
   */
  private sortRecords():
    void {

    // Implement the application sorting strategy.
  }


  /**
   * Opens the application's reporting options.
   */
  private printRecords():
    void {

    // Implement XteinRecordReportsComponent when reporting is configured.
  }


  /**
   * Downloads application information.
   */
  private downloadRecords():
    void {

    // Implement the application download operation.
  }


  /**
   * Reloads the application record collection using the standard query
   * operation. Adapt the request payload when the backend requires a
   * specific filter contract.
   */
  private refreshRecords():
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
      this.applicationService
        .getRecords()
        .pipe(
          finalize(() =>
            this.loading.set(
              false
            )
          )
        )
        .subscribe({

          next:
            response => {

              try {

                const result =
                  this.parseBackendArray<
                    __APPLICATION_CLASS_PREFIX__Record
                  >(
                    response.data
                  );


                const message =
                  this.getBackendErrorMessage(
                    result[0] as unknown as
                      Record<string, unknown> |
                      undefined
                  );


                const rows =
                  message
                    ? []
                    : result;


                this.records.set(
                  rows
                );


                if (
                  rows.length > 0
                ) {

                  this.navigateTo(
                    0
                  );

                } else {

                  this.currentIndex.set(
                    0
                  );


                  this.mode.set(
                    RecordToolbarMode.Initial
                  );


                  this.setFormRecord(
                    __APPLICATION_CLASS_PREFIX__DefaultRecord,
                    true
                  );


                  this.notification
                    .warning(
                      message ||
                      'No se encontraron datos.'
                    );


                  this.publishToolbarState();
                }

              } catch (error) {

                this.showUnknownError(
                  error,
                  'No fue posible consultar los registros.'
                );
              }
            },


          error:
            error =>
              this.showUnknownError(
                error,
                'No fue posible consultar los registros.'
              )
        })
    );
  }


  /**
   * Opens or executes application configuration.
   */
  private configureApplication():
    void {

    // Implement application configuration when required.
  }


  /**
   * Navigates to one record in the loaded collection.
   */
  private navigateTo(
    requestedIndex:
      number
  ): void {

    const records =
      this.records();


    if (
      records.length === 0
    ) {

      return;
    }


    const index =
      Math.max(
        0,
        Math.min(
          requestedIndex,
          records.length - 1
        )
      );


    this.currentIndex.set(
      index
    );


    this.mode.set(
      RecordToolbarMode.Browsing
    );


    this.readOnly.set(
      true
    );


    this.previousRecord =
      this.cloneRecord(
        records[
          index
        ]
      );


    this.setFormRecord(
      records[
        index
      ],
      true
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


  /**
   * Validates the application form.
   */
  private validateForm():
    boolean {

    this.validationRequested.set(
      true
    );


    this.form
      .markAllAsTouched();

    this.form
      .updateValueAndValidity();


    if (
      this.form.invalid
    ) {

      this.notification
        .warning(
          'Hay datos incompletos. Complete todos los campos obligatorios.'
        );

      return false;
    }


    return true;
  }


  /**
   * Publishes the application's current toolbar state.
   *
   * Capabilities describe the standard functionality implemented by
   * the application template. Actual user authorization is supplied by
   * RecordToolbarPermissionsService.
   */
  private publishToolbarState():
    void {

    this.toolbarRuntime
      .setState(
        createRecordToolbarState({

          busy:
            this.loading(),

          applicationId:
            this.applicationId,

          mode:
            this.mode(),

          permissions:
            this.permissions,

          capabilities:
            __APPLICATION_CLASS_PREFIX__ToolbarCapabilities,

          currentIndex:
            this.currentIndex(),

          totalRecords:
            this.records().length
        })
      );
  }


  /**
   * Synchronizes one record with the reactive form.
   *
   * Replace the empty reset object with the real FormControl mapping
   * after defining the fields of __TABLE_NAME__.
   */
  private setFormRecord(
    record:
      Readonly<__APPLICATION_CLASS_PREFIX__Record>,

    readOnly:
      boolean
  ): void {

    this.synchronizingForm =
      true;


    try {

      /*
       * The base template intentionally has no business fields.
       * Use record to populate every FormControl added to form.
       */
      void record;


      this.form.enable({
        emitEvent:
          false
      });


      this.form.reset(
        {},
        {
          emitEvent:
            false
        }
      );


      this.setFormEditable(
        !readOnly
      );

    } finally {

      this.synchronizingForm =
        false;
    }
  }


  /**
   * Enables or disables the application form.
   *
   * Disable generated identity/read-only controls individually after
   * enabling the form when the table metadata is defined.
   */
  private setFormEditable(
    editable:
      boolean
  ): void {

    if (
      editable
    ) {

      this.form.enable({
        emitEvent:
          false
      });

      return;
    }


    this.form.disable({
      emitEvent:
        false
    });
  }


  /**
   * Builds the record sent to create/update operations.
   *
   * The spread keeps the base template valid while no business fields
   * exist. When controls are added, the returned shape must match
   * __APPLICATION_CLASS_PREFIX__Record.
   */
  private getFormRecord():
    __APPLICATION_CLASS_PREFIX__Record {

    return {
      ...__APPLICATION_CLASS_PREFIX__DefaultRecord,
      ...this.form.getRawValue()
    } as __APPLICATION_CLASS_PREFIX__Record;
  }


  /**
   * Returns the currently selected record.
   */
  private getCurrentRecord():
    __APPLICATION_CLASS_PREFIX__Record | null {

    return (
      this.records()[
        this.currentIndex()
      ] ??
      null
    );
  }


  /**
   * Returns the generic delete payload.
   *
   * Replace this implementation with the key fields required by the
   * application's delete endpoint when its contract is defined.
   */
  private getDeleteRequest(
    record:
      Readonly<__APPLICATION_CLASS_PREFIX__Record>
  ): unknown {

    return {
      [__APPLICATION_CLASS_PREFIX__Application.Table]:
        record
    };
  }


  /**
   * Indicates whether the application is changing a record.
   */
  private isChanging():
    boolean {

    return (
      this.mode() === RecordToolbarMode.Creating ||
      this.mode() === RecordToolbarMode.Editing ||
      this.mode() === RecordToolbarMode.Copying
    );
  }


  /**
   * Validates a mutation response and raises a functional backend error
   * when ErrMensaje is returned.
   */
  private ensureSuccessfulMutation(
    data:
      unknown
  ): void {

    const records =
      this.parseBackendArray<
        Record<string, unknown>
      >(
        data
      );


    const errorMessage =
      this.getBackendErrorMessage(
        records[
          0
        ]
      );


    if (
      errorMessage
    ) {

      throw new Error(
        errorMessage
      );
    }
  }


  /**
   * Normalizes the backend data payload to an array.
   */
  private parseBackendArray<T>(
    data:
      unknown
  ): T[] {

    let parsed =
      data;


    if (
      typeof parsed === 'string'
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
        'La respuesta del backend debe contener un arreglo.'
      );
    }


    return parsed as T[];
  }


  /**
   * Reads the standard functional error field returned by backend
   * operations.
   */
  private getBackendErrorMessage(
    record:
      Record<string, unknown> |
      undefined
  ): string {

    if (
      !record
    ) {

      return '';
    }


    const value =
      record[
        'ErrMensaje'
      ];


    if (
      value === null ||
      value === undefined
    ) {

      return '';
    }


    return String(
      value
    ).trim();
  }


  /**
   * Creates a shallow copy of a record for cancel/restore operations.
   */
  private cloneRecord(
    record:
      Readonly<__APPLICATION_CLASS_PREFIX__Record> |
      null
  ): __APPLICATION_CLASS_PREFIX__Record | null {

    if (
      !record
    ) {

      return null;
    }


    return {
      ...record
    };
  }


  /**
   * Displays an application error using the shared notification service.
   */
  private showUnknownError(
    error:
      unknown,

    fallbackMessage:
      string
  ): void {

    console.error(
      '__APPLICATION_ID__ operation failed.',
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
