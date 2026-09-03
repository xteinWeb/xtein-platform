import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Subscription,
  finalize,
  firstValueFrom,
  forkJoin
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
  DataSourceConnectionTestResult,
  XteinDataSourceParametersComponent,
  XteinInputComponent,
  XteinLoadingComponent,
  XteinSelectComponent,
  XteinTextareaComponent
} from '@xtein/ui';

import {
  Mad005Application
} from './constants/mad-005.constants';

import {
  Mad005DefaultOptions,
  Mad005DefaultRecord,
  Mad005StatusOptions,
  Mad005ToolbarCapabilities
} from './constants/mad-005-ui.constants';

import {
  Mad005DataLists,
  Mad005DataSourceConfiguration,
  Mad005DataSourceConfigurationRecord,
  Mad005DataSourceType
} from './models/mad-005.model';

import {
  Mad005Service
} from './services/mad-005.service';


/**
 * MAD-005 - Data Sources.
 *
 * The application owns its record state and publishes its toolbar state
 * through the shared XTEIN runtime. The Shell remains responsible only
 * for rendering the platform toolbar and dispatching commands.
 */
@Component({
  selector:
    'mad-005',

  standalone:
    true,

  imports: [
    ReactiveFormsModule,
    XteinInputComponent,
    XteinSelectComponent,
    XteinTextareaComponent,
    XteinDataSourceParametersComponent,
    XteinLoadingComponent
  ],

  /**
   * Application-specific services remain scoped to MAD-005.
   *
   * Platform services such as ToolbarRuntimeService,
   * WorkspaceRuntimeService and XteinApiClientService continue
   * to come from the shared platform injector.
   */
  providers: [
    Mad005Service
  ],

  templateUrl:
    './mad-005.component.html',

  styleUrl:
    './mad-005.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Mad005Component
  implements OnInit, OnDestroy {

  /**
   * Dynamic connection-parameter editor.
   */
  @ViewChild(
    XteinDataSourceParametersComponent
  )
  private dataSourceParameters?:
    XteinDataSourceParametersComponent;


  /**
   * XTEIN application identifier.
   */
  readonly applicationId =
    Mad005Application.Id;


  /**
   * Available active-state options.
   */
  readonly statusOptions = [
    ...Mad005StatusOptions
  ];


  /**
   * Available default-connection options.
   */
  readonly defaultOptions = [
    ...Mad005DefaultOptions
  ];


  /**
   * MAD-005 reactive record form.
   */
  readonly form =
    new FormGroup({

      ID_ORIGEN_DATO:
        new FormControl<number>(
          Mad005DefaultRecord.ID_ORIGEN_DATO,
          {
            nonNullable:
              true
          }
        ),

      NOMBRE:
        new FormControl<string>(
          Mad005DefaultRecord.NOMBRE,
          {
            nonNullable:
              true,

            validators: [
              Validators.required,
              Validators.maxLength(30)
            ]
          }
        ),

      ORIGEN_DATO:
        new FormControl<string>(
          Mad005DefaultRecord.ORIGEN_DATO,
          {
            nonNullable:
              true,

            validators: [
              Validators.required
            ]
          }
        ),

      PARAMETROS:
        new FormControl<string>(
          Mad005DefaultRecord.PARAMETROS,
          {
            nonNullable:
              true
          }
        ),

      DEFECTO:
        new FormControl<boolean>(
          Mad005DefaultRecord.DEFECTO,
          {
            nonNullable:
              true
          }
        ),

      ACTIVO:
        new FormControl<boolean>(
          Mad005DefaultRecord.ACTIVO,
          {
            nonNullable:
              true
          }
        ),

      COMENTARIOS:
        new FormControl<string | null>(
          Mad005DefaultRecord.COMENTARIOS ??
          null
        )
    });


  /**
   * Current application operation mode.
   */
  readonly mode =
    signal<RecordToolbarMode>(
      RecordToolbarMode.Initial
    );


  /**
   * Indicates whether MAD-005 is processing a backend operation.
   */
  readonly loading =
    signal(
      false
    );


  /**
   * Indicates whether the form is currently editable.
   */
  readonly readOnly =
    signal(
      true
    );


  /**
   * Available data source types returned by the existing backend.
   */
  readonly dataSourceTypes =
    signal<
      Mad005DataSourceType[]
    >(
      []
    );


  /**
   * Loaded data source records.
   */
  readonly records =
    signal<
      readonly Mad005DataSourceConfigurationRecord[]
    >(
      []
    );


  /**
   * Zero-based index of the current loaded record.
   */
  readonly currentIndex =
    signal(
      0
    );


  /**
   * Indicates whether validation feedback should be displayed.
   */
  readonly validationRequested =
    signal(
      false
    );


  /**
   * User permissions loaded through the shared runtime.
   */
  private permissions:
    Readonly<RecordToolbarPermissions> =
      DeniedRecordToolbarPermissions;


  /**
   * Record snapshot restored when edition is cancelled.
   */
  private previousRecord:
    Mad005DataSourceConfiguration | null =
      null;


  /**
   * Prevents programmatic synchronization from setting dirty state.
   */
  private synchronizingForm =
    false;


  /**
   * Component-owned subscriptions.
   */
  private readonly subscriptions =
    new Subscription();


  constructor(
    private readonly mad005Service:
      Mad005Service,

    private readonly permissionsService:
      RecordToolbarPermissionsService,

    private readonly toolbarRuntime:
      ToolbarRuntimeService,

    private readonly workspaceRuntime:
      WorkspaceRuntimeService
  ) {

    this.form.disable({
      emitEvent:
        false
    });
  }


  /**
   * Initializes MAD-005.
   */
  ngOnInit():
    void {

    this.subscribeToToolbarCommands();

    this.subscribeToFormChanges();

    this.subscribeToBusinessRules();

    this.publishToolbarState();

    this.loadInitializationData();
  }


  /**
   * Releases application subscriptions.
   */
  ngOnDestroy():
    void {

    this.subscriptions.unsubscribe();
  }


  /**
   * Updates serialized connection parameters.
   *
   * @param value Serialized connection parameters.
   */
  updateConnectionParameters(
    value:
      string
  ): void {

    this.form.controls.PARAMETROS
      .setValue(
        value
      );
  }


  /**
   * Displays the result of a connection test.
   *
   * @param result Connection-test result.
   */
  handleConnectionTest(
    result:
      DataSourceConnectionTestResult
  ): void {

    void this.showMessage(
      result.message,

      result.success
        ? 'Conexión exitosa'
        : 'Validación de conexión',

      result.success
        ? 'success'
        : 'warning'
    );
  }


  /**
   * Validates the data source name when focus leaves the field.
   */
  validateNameOnBlur():
    void {

    if (
      this.readOnly() ||
      !this.form.controls.NOMBRE.value.trim()
    ) {

      return;
    }

    void this.validateNameAvailability();
  }


  /**
   * Returns whether the name field is invalid.
   */
  isNameInvalid():
    boolean {

    const control =
      this.form.controls.NOMBRE;

    return (
      control.invalid &&
      (
        control.touched ||
        this.validationRequested()
      )
    );
  }


  /**
   * Returns whether the origin field is invalid.
   */
  isOriginInvalid():
    boolean {

    const control =
      this.form.controls.ORIGEN_DATO;

    return (
      control.invalid &&
      (
        control.touched ||
        this.validationRequested()
      )
    );
  }


  /**
   * Subscribes MAD-005 to its own toolbar command stream.
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
   * Tracks form changes and updates workspace dirty state.
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
   * Applies MAD-005 business rules.
   */
  private subscribeToBusinessRules():
    void {

    this.subscriptions.add(
      this.form.controls.ACTIVO
        .valueChanges
        .subscribe(
          active => {

            if (
              this.synchronizingForm ||
              active ||
              !this.form.controls.DEFECTO.value
            ) {

              return;
            }

            this.form.controls.ACTIVO
              .setValue(
                true,
                {
                  emitEvent:
                    false
                }
              );

            void this.showMessage(
              'No se puede desactivar la conexión por defecto.',
              'Validación',
              'warning'
            );
          }
        )
    );


    this.subscriptions.add(
      this.form.controls.DEFECTO
        .valueChanges
        .subscribe(
          isDefault => {

            if (
              this.synchronizingForm ||
              !isDefault ||
              !this.isChanging()
            ) {

              return;
            }

            void this.validateDefaultSelection();
          }
        )
    );
  }


  /**
   * Loads user permissions and MAD-005 lists.
   */
  private loadInitializationData():
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

        dataLists:
          this.mad005Service
            .getDataLists()
      })
        .pipe(
          finalize(() =>
            this.loading.set(
              false
            )
          )
        )
        .subscribe({

          next:
            result => {

              this.permissions =
                result.permissions;

              try {

                const dataLists =
                  this.parseDataLists(
                    result.dataLists.data
                  );

                this.dataSourceTypes.set(
                  [
                    ...dataLists.origenDatos
                  ]
                );

              } catch (error) {

                void this.showUnknownError(
                  error,
                  'No fue posible cargar los tipos de origen de datos.'
                );
              }

              this.publishToolbarState();
            },

          error:
            error => {

              this.permissions =
                DeniedRecordToolbarPermissions;

              this.publishToolbarState();

              void this.showUnknownError(
                error,
                'No fue posible inicializar Orígenes de Datos.'
              );
            }
        })
    );
  }


  /**
   * Routes platform toolbar commands to MAD-005.
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

      case ToolbarAction.New:

        this.startCreating();

        break;


      case ToolbarAction.Edit:

        this.startEditing();

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


      case ToolbarAction.Refresh:

        this.refreshDataLists();

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


      default:

        break;
    }
  }


  /**
   * Starts creation mode.
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
      Mad005DefaultRecord,
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
   * Starts edition mode.
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
   * Saves the current record.
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

    if (
      !await this.validateNameAvailability()
    ) {

      return;
    }

    const record =
      this.getFormRecord();

    if (
      record.DEFECTO &&
      !await this.validateDefaultAvailability()
    ) {

      return;
    }

    this.loading.set(
      true
    );

    try {

      const response =
        this.mode() ===
          RecordToolbarMode.Creating

          ? await firstValueFrom(
              this.mad005Service
                .create({
                  CONFIG_ORIGEN_DATO:
                    record
                })
            )

          : await firstValueFrom(
              this.mad005Service
                .update({
                  CONFIG_ORIGEN_DATO:
                    record
                })
            );


      this.ensureSuccessfulMutation(
        response.data
      );


      if (
        this.mode() ===
          RecordToolbarMode.Editing
      ) {

        const updatedRecords =
          [
            ...this.records()
          ];

        updatedRecords[
          this.currentIndex()
        ] = {
          ...record
        };

        this.records.set(
          updatedRecords
        );

        this.mode.set(
          RecordToolbarMode.Browsing
        );

      } else {

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


      await this.showMessage(
        'Registro actualizado.',
        'Orígenes de Datos',
        'success'
      );

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible guardar el origen de datos.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


  /**
   * Cancels the current operation.
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
          '',

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
        Mad005DefaultRecord,
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
   * Deletes the current record.
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
          '',

        html:
          `¿Desea eliminar el origen de datos <i>${this.escapeHtml(
            currentRecord.NOMBRE
          )}</i>?`,

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
          this.mad005Service
            .delete({
              ID_ORIGEN_DATO:
                currentRecord.ID_ORIGEN_DATO
            })
        );


      this.ensureSuccessfulMutation(
        response.data
      );


      const remainingRecords =
        this.records()
          .filter(
            (_, index) =>
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
          Mad005DefaultRecord,
          true
        );

        this.publishToolbarState();
      }


      this.workspaceRuntime
        .setDirty(
          this.applicationId,
          false
        );


      await this.showMessage(
        'Origen de datos eliminado.',
        'Orígenes de Datos',
        'success'
      );

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible eliminar el origen de datos.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


  /**
   * Reloads lookup values.
   */
  private refreshDataLists():
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
      this.mad005Service
        .getDataLists()
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

                const dataLists =
                  this.parseDataLists(
                    response.data
                  );

                this.dataSourceTypes.set(
                  [
                    ...dataLists.origenDatos
                  ]
                );

              } catch (error) {

                void this.showUnknownError(
                  error,
                  'No fue posible refrescar los tipos de origen de datos.'
                );
              }
            },

          error:
            error =>
              void this.showUnknownError(
                error,
                'No fue posible refrescar los tipos de origen de datos.'
              )
        })
    );
  }


  /**
   * Navigates through the current result set.
   *
   * @param requestedIndex Zero-based record index.
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
        records[index]
      );

    this.setFormRecord(
      records[index],
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
   * Validates the complete MAD-005 form.
   */
  private validateForm():
    boolean {

    this.validationRequested.set(
      true
    );

    this.form.markAllAsTouched();

    this.form.updateValueAndValidity();


    if (
      this.form.invalid
    ) {

      void this.showMessage(
        'Hay datos incompletos. Complete todos los campos obligatorios.',
        'Faltan datos',
        'warning'
      );

      return false;
    }


    if (
      this.dataSourceParameters &&
      !this.dataSourceParameters.validate()
    ) {

      const errors =
        this.dataSourceParameters
          .getValidationErrors();

      void this.showMessage(
        errors.length > 0
          ? errors.join('\n')
          : 'Complete todos los parámetros de conexión obligatorios.',
        'Faltan parámetros de conexión',
        'warning'
      );

      return false;
    }


    return true;
  }


  /**
   * Validates whether the current data source name already exists.
   */
  private async validateNameAvailability():
    Promise<boolean> {

    const name =
      this.form.controls.NOMBRE.value
        .trim();


    if (
      !name
    ) {

      return false;
    }


    if (
      this.mode() ===
        RecordToolbarMode.Editing &&
      this.previousRecord?.NOMBRE
        .trim()
        .toUpperCase() ===
      name.toUpperCase()
    ) {

      return true;
    }


    try {

      const response =
        await firstValueFrom(
          this.mad005Service
            .validateKey({
              NOMBRE:
                name
            })
        );


      const records =
        this.parseBackendArray<
          Record<string, unknown>
        >(
          response.data
        );


      const errorMessage =
        this.getBackendErrorMessage(
          records[0]
        );


      const available =
        Boolean(
          errorMessage
        );


      if (
        !available
      ) {

        await this.showMessage(
          `El origen de datos ${name} ya existe.`,
          'Validación',
          'warning'
        );
      }


      return available;

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible validar el nombre del origen de datos.'
      );

      return false;
    }
  }


  /**
   * Validates a default-selection change.
   */
  private async validateDefaultSelection():
    Promise<void> {

    if (
      !await this.validateDefaultAvailability()
    ) {

      this.form.controls.DEFECTO
        .setValue(
          false,
          {
            emitEvent:
              false
          }
        );
    }
  }


  /**
   * Validates whether another default connection already exists.
   */
  private async validateDefaultAvailability():
    Promise<boolean> {

    try {

      const response =
        await firstValueFrom(
          this.mad005Service
            .validateDefault(
              this.form.controls.ID_ORIGEN_DATO.value
            )
        );


      const records =
        this.parseBackendArray<
          Record<string, unknown>
        >(
          response.data
        );


      const errorMessage =
        this.getBackendErrorMessage(
          records[0]
        );


      if (
        errorMessage ===
          'exists'
      ) {

        await this.showMessage(
          'Ya existe una conexión configurada como defecto.',
          'Validación',
          'warning'
        );

        return false;
      }


      if (
        errorMessage
      ) {

        throw new Error(
          errorMessage
        );
      }


      return true;

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible validar la conexión por defecto.'
      );

      return false;
    }
  }


  /**
   * Publishes the current toolbar state.
   */
  private publishToolbarState():
    void {

    this.toolbarRuntime
      .setState(
        createRecordToolbarState({

          applicationId:
            this.applicationId,

          mode:
            this.mode(),

          permissions:
            this.permissions,

          capabilities:
            Mad005ToolbarCapabilities,

          currentIndex:
            this.currentIndex(),

          totalRecords:
            this.records().length
        })
      );
  }


  /**
   * Applies a record to the reactive form.
   */
  private setFormRecord(
    record:
      Readonly<Mad005DataSourceConfiguration>,

    readOnly:
      boolean
  ): void {

    this.synchronizingForm =
      true;


    try {

      this.form.enable({
        emitEvent:
          false
      });


      this.form.reset(
        {
          ID_ORIGEN_DATO:
            record.ID_ORIGEN_DATO,

          NOMBRE:
            record.NOMBRE,

          ORIGEN_DATO:
            record.ORIGEN_DATO,

          PARAMETROS:
            record.PARAMETROS,

          DEFECTO:
            record.DEFECTO,

          ACTIVO:
            record.ACTIVO,

          COMENTARIOS:
            record.COMENTARIOS ??
            null
        },
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
   * Changes form editability.
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

      this.form.controls.ID_ORIGEN_DATO
        .disable({
          emitEvent:
            false
        });

    } else {

      this.form.disable({
        emitEvent:
          false
      });
    }
  }


  /**
   * Returns the complete current form record.
   */
  private getFormRecord():
    Mad005DataSourceConfiguration {

    const value =
      this.form.getRawValue();


    return {

      ID_ORIGEN_DATO:
        value.ID_ORIGEN_DATO,

      NOMBRE:
        value.NOMBRE.trim(),

      ORIGEN_DATO:
        value.ORIGEN_DATO,

      PARAMETROS:
        value.PARAMETROS,

      DEFECTO:
        value.DEFECTO,

      ACTIVO:
        value.ACTIVO,

      COMENTARIOS:
        value.COMENTARIOS?.trim() ||
        null
    };
  }


  /**
   * Returns the current record.
   */
  private getCurrentRecord():
    Mad005DataSourceConfigurationRecord | null {

    return (
      this.records()[
        this.currentIndex()
      ] ??
      null
    );
  }


  /**
   * Indicates whether the application is changing a record.
   */
  private isChanging():
    boolean {

    return (
      this.mode() ===
        RecordToolbarMode.Creating ||
      this.mode() ===
        RecordToolbarMode.Editing
    );
  }


  /**
   * Parses the datalist response.
   */
  private parseDataLists(
    data:
      unknown
  ): Mad005DataLists {

    const records =
      this.parseBackendArray<
        Mad005DataLists
      >(
        data
      );


    const result =
      records[0];


    if (
      !result
    ) {

      throw new Error(
        'The MAD-005 datalist response is empty.'
      );
    }


    const errorMessage =
      result.ErrMensaje
        ?.trim();


    if (
      errorMessage
    ) {

      throw new Error(
        errorMessage
      );
    }


    return {

      ...result,

      origenDatos:
        Array.isArray(
          result.origenDatos
        )
          ? result.origenDatos
          : []
    };
  }


  /**
   * Validates a backend mutation response.
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
        records[0]
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
   * Parses the serialized array returned by the legacy backend.
   */
  private parseBackendArray<T>(
    data:
      unknown
  ): T[] {

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
        'The MAD-005 backend response must contain an array.'
      );
    }


    return parsed as T[];
  }


  /**
   * Reads ErrMensaje from an existing backend response.
   */
  private getBackendErrorMessage(
    record:
      Record<string, unknown> | undefined
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
      value ===
        null ||
      value ===
        undefined
    ) {

      return '';
    }


    return String(
      value
    ).trim();
  }


  /**
   * Creates an independent record snapshot.
   */
  private cloneRecord(
    record:
      Readonly<Mad005DataSourceConfiguration> | null
  ): Mad005DataSourceConfiguration | null {

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
   * Displays a user-facing message.
   */
  private async showMessage(
    message:
      string,

    title:
      string,

    icon:
      'error' |
      'warning' |
      'success' |
      'info'
  ): Promise<void> {

    await Swal.fire({

      title,

      text:
        message,

      icon,

      confirmButtonColor:
        '#0F4C81'
    });
  }


  /**
   * Converts unknown errors into a user-facing error.
   */
  private async showUnknownError(
    error:
      unknown,

    fallbackMessage:
      string
  ): Promise<void> {

    console.error(
      'MAD-005 operation failed.',
      error
    );


    const message =
      error instanceof Error &&
      error.message.trim()

        ? error.message.trim()

        : fallbackMessage;


    await this.showMessage(
      message,
      'Error',
      'error'
    );
  }


  /**
   * Escapes HTML before using record text inside SweetAlert markup.
   */
  private escapeHtml(
    value:
      string
  ): string {

    return value
      .replaceAll(
        '&',
        '&amp;'
      )
      .replaceAll(
        '<',
        '&lt;'
      )
      .replaceAll(
        '>',
        '&gt;'
      )
      .replaceAll(
        '"',
        '&quot;'
      )
      .replaceAll(
        "'",
        '&#039;'
      );
  }
}