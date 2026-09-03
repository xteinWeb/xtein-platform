import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
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
  XteinInputComponent,
  XteinLoadingComponent,
  XteinNumberComponent,
  XteinSelectComponent,
  XteinTextareaComponent,
  XteinTreeComponent,
  XteinTreeDataItem
} from '@xtein/ui';

import {
  Mad001Application
} from './constants/mad-001.constants';

import {
  Mad001DefaultRecord,
  Mad001ToolbarCapabilities,
  Mad001TreeSearchFields
} from './constants/mad-001-ui.constants';

import {
  Mad001ApplicationRecord,
  Mad001DataLists,
  Mad001ParentApplication,
  Mad001UnitOfMeasure
} from './models/mad-001.model';

import {
  Mad001Service
} from './services/mad-001.service';


/**
 * MAD-001 - XTEIN application master.
 */
@Component({
  selector:
    'mad-001',

  standalone:
    true,

  imports: [
    ReactiveFormsModule,
    XteinInputComponent,
    XteinSelectComponent,
    XteinNumberComponent,
    XteinTextareaComponent,
    XteinTreeComponent,
    XteinLoadingComponent
  ],

  providers: [
    Mad001Service
  ],

  templateUrl:
    './mad-001.component.html',

  styleUrl:
    './mad-001.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Mad001Component
  implements OnInit, OnDestroy {

  readonly applicationId =
    Mad001Application.Id;


  readonly treeSearchFields =
    Mad001TreeSearchFields;


  readonly form =
    new FormGroup({

      ID_APLICACION:
        new FormControl(
          '',
          {
            nonNullable:
              true,

            validators: [
              Validators.required,
              Validators.maxLength(30)
            ]
          }
        ),

      ID_APLICACION_PADRE:
        new FormControl<
          string | null
        >(
          null
        ),

      NOMBRE:
        new FormControl(
          '',
          {
            nonNullable:
              true,

            validators: [
              Validators.required,
              Validators.maxLength(60)
            ]
          }
        ),

      TIPO:
        new FormControl<
          string | null
        >(
          null,
          {
            validators: [
              Validators.required
            ]
          }
        ),

      ACCION:
        new FormControl<
          string | null
        >(
          null,
          {
            validators: [
              Validators.required
            ]
          }
        ),

      ESTADO:
        new FormControl<
          string | null
        >(
          'ACTIVO'
        ),

      NIVEL:
        new FormControl<
          string | null
        >(
          null
        ),

      META_INFERIOR:
        new FormControl<
          number | null
        >(
          0
        ),

      META_SUPERIOR:
        new FormControl<
          number | null
        >(
          0
        ),

      UDM:
        new FormControl<
          string | null
        >(
          null
        ),

      COMENTARIOS:
        new FormControl(
          '',
          {
            nonNullable:
              true
          }
        )
    });


  readonly mode =
    signal<RecordToolbarMode>(
      RecordToolbarMode.Initial
    );


  readonly loading =
    signal(
      false
    );


  readonly treePanelCollapsed =
    signal(
      false
    );


  readonly applications =
    signal<
      readonly Mad001ApplicationRecord[]
    >(
      []
    );


  readonly currentIndex =
    signal(
      0
    );


  readonly parentApplications =
    signal<
      readonly Mad001ParentApplication[]
    >(
      []
    );


  readonly unitOfMeasures =
    signal<
      readonly Mad001UnitOfMeasure[]
    >(
      []
    );


  readonly typeOptions =
    signal<
      readonly string[]
    >(
      []
    );


  readonly actionOptions =
    signal<
      readonly string[]
    >(
      []
    );


  readonly statusOptions =
    signal<
      readonly string[]
    >(
      []
    );


  readonly levelOptions =
    signal<
      readonly string[]
    >(
      []
    );


  readonly validationRequested =
    signal(
      false
    );


  private permissions:
    Readonly<RecordToolbarPermissions> =
      DeniedRecordToolbarPermissions;


  private previousRecord:
    Mad001ApplicationRecord | null =
      null;


  private synchronizingForm =
    false;


  private readonly subscriptions =
    new Subscription();


  constructor(
    private readonly mad001Service:
      Mad001Service,

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


  ngOnInit():
    void {

    this.subscribeToToolbar();

    this.subscribeToFormChanges();

    this.publishToolbarState();

    this.loadInitialData();
  }


  ngOnDestroy():
    void {

    this.subscriptions
      .unsubscribe();
  }


  /**
   * Indicates whether the application tree must be displayed.
   */
  showTree():
    boolean {

    return !this.isChanging();
  }


  /**
   * Handles selection from the shared application tree.
   */
  selectTreeItem(
    item:
      XteinTreeDataItem
  ): void {

    const applicationId =
      String(
        item[
          'ID_APLICACION'
        ] ?? ''
      ).trim();


    if (
      !applicationId
    ) {

      return;
    }


    const index =
      this.applications()
        .findIndex(
          application =>
            application.ID_APLICACION ===
            applicationId
        );


    if (
      index < 0
    ) {

      return;
    }


    this.navigateTo(
      index
    );
  }


  /**
   * Collapses or expands the application-tree panel.
   */
  toggleTreePanel():
    void {

    this.treePanelCollapsed.update(
      value =>
        !value
    );
  }


  isInvalid(
    controlName:
      keyof typeof this.form.controls
  ): boolean {

    const control =
      this.form.controls[
        controlName
      ];


    return (
      control.invalid &&
      (
        control.touched ||
        this.validationRequested()
      )
    );
  }


  /**
   * Validates the application identifier when focus leaves the field.
   */
  validateApplicationIdOnBlur():
    void {

    if (
      !this.isChanging()
    ) {

      return;
    }


    const applicationId =
      this.form.controls
        .ID_APLICACION
        .value
        .trim();


    if (
      !applicationId
    ) {

      return;
    }


    void this.validateApplicationId();
  }


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

        dataLists:
          this.mad001Service
            .getDataLists(),

        parentApplications:
          this.mad001Service
            .getParentApplications(),

        tree:
          this.mad001Service
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


                this.applyDataLists(
                  this.parseDataLists(
                    result.dataLists.data
                  )
                );


                this.parentApplications.set(
                  this.parseParentApplications(
                    result.parentApplications.data
                  )
                );


                this.applications.set(
                  this.parseApplications(
                    result.tree.data
                  )
                );


                this.publishToolbarState();

              } catch (error) {

                void this.showUnknownError(
                  error,
                  'No fue posible inicializar MAD-001.'
                );
              }
            },


          error:
            error => {

              this.permissions =
                DeniedRecordToolbarPermissions;


              this.publishToolbarState();


              void this.showUnknownError(
                error,
                'No fue posible inicializar MAD-001.'
              );
            }
        })
    );
  }


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

        void this.refreshApplicationData();

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
          this.applications().length - 1
        );

        break;


      default:

        break;
    }
  }


  private startCreating():
    void {

    this.previousRecord =
      this.getCurrentRecord();


    this.mode.set(
      RecordToolbarMode.Creating
    );


    this.validationRequested.set(
      false
    );


    this.setFormRecord(
      Mad001DefaultRecord,
      true
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


  private startEditing():
    void {

    const currentRecord =
      this.getCurrentRecord();


    if (
      !currentRecord
    ) {

      return;
    }


    this.previousRecord = {
      ...currentRecord
    };


    this.mode.set(
      RecordToolbarMode.Editing
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
      !await this.validateApplicationId()
    ) {

      return;
    }


    const record =
      this.getFormRecord();


    this.loading.set(
      true
    );


    try {

      const response =
        this.mode() ===
          RecordToolbarMode.Creating

          ? await firstValueFrom(
              this.mad001Service
                .create({
                  APLICACIONES_ASOCIADAS:
                    record
                })
            )

          : await firstValueFrom(
              this.mad001Service
                .update({
                  APLICACIONES_ASOCIADAS:
                    record
                })
            );


      this.ensureSuccessfulMutation(
        response.data
      );


      this.workspaceRuntime
        .setDirty(
          this.applicationId,
          false
        );


      await this.reloadTreeAndReferences(
        record.ID_APLICACION
      );


      await this.showMessage(
        'Registro actualizado.',
        'MAD-001',
        'success'
      );

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible guardar la aplicación.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


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
        false
      );


      const index =
        this.applications()
          .findIndex(
            application =>
              application.ID_APLICACION ===
              this.previousRecord
                ?.ID_APLICACION
          );


      this.currentIndex.set(
        Math.max(
          index,
          0
        )
      );


      this.mode.set(
        RecordToolbarMode.Browsing
      );

    } else {

      this.setFormRecord(
        Mad001DefaultRecord,
        false
      );


      this.mode.set(
        RecordToolbarMode.Initial
      );
    }


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
          `¿Desea eliminar la aplicación <i>${this.escapeHtml(
            currentRecord.ID_APLICACION
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
          this.mad001Service
            .delete(
              currentRecord.ID_APLICACION
            )
        );


      this.ensureSuccessfulMutation(
        response.data
      );


      await this.reloadTreeAndReferences(
        null
      );


      this.previousRecord =
        null;


      this.mode.set(
        RecordToolbarMode.Initial
      );


      this.setFormRecord(
        Mad001DefaultRecord,
        false
      );


      this.workspaceRuntime
        .setDirty(
          this.applicationId,
          false
        );


      this.publishToolbarState();


      await this.showMessage(
        'Aplicación eliminada.',
        'MAD-001',
        'success'
      );

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible eliminar la aplicación.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


  private async refreshApplicationData():
    Promise<void> {

    if (
      this.loading()
    ) {

      return;
    }


    const selectedApplicationId =
      this.getCurrentRecord()
        ?.ID_APLICACION ??
      null;


    this.loading.set(
      true
    );


    try {

      const result =
        await firstValueFrom(
          forkJoin({

            dataLists:
              this.mad001Service
                .getDataLists(),

            parentApplications:
              this.mad001Service
                .getParentApplications(),

            tree:
              this.mad001Service
                .getApplicationTree()
          })
        );


      this.applyDataLists(
        this.parseDataLists(
          result.dataLists.data
        )
      );


      this.parentApplications.set(
        this.parseParentApplications(
          result.parentApplications.data
        )
      );


      this.applyApplications(
        this.parseApplications(
          result.tree.data
        ),
        selectedApplicationId
      );

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible refrescar MAD-001.'
      );

    } finally {

      this.loading.set(
        false
      );
    }
  }


  private async reloadTreeAndReferences(
    applicationId:
      string | null
  ): Promise<void> {

    const result =
      await firstValueFrom(
        forkJoin({

          parentApplications:
            this.mad001Service
              .getParentApplications(),

          tree:
            this.mad001Service
              .getApplicationTree()
        })
      );


    this.parentApplications.set(
      this.parseParentApplications(
        result.parentApplications.data
      )
    );


    this.applyApplications(
      this.parseApplications(
        result.tree.data
      ),
      applicationId
    );
  }


  private applyApplications(
    applications:
      Mad001ApplicationRecord[],

    selectedApplicationId:
      string | null
  ): void {

    this.applications.set(
      applications
    );


    if (
      selectedApplicationId
    ) {

      const index =
        applications
          .findIndex(
            application =>
              application.ID_APLICACION ===
              selectedApplicationId
          );


      if (
        index >= 0
      ) {

        this.navigateTo(
          index
        );

        return;
      }
    }


    this.currentIndex.set(
      0
    );


    this.previousRecord =
      null;


    this.mode.set(
      RecordToolbarMode.Initial
    );


    this.setFormRecord(
      Mad001DefaultRecord,
      false
    );


    this.publishToolbarState();
  }


  private navigateTo(
    requestedIndex:
      number
  ): void {

    const applications =
      this.applications();


    if (
      applications.length === 0
    ) {

      return;
    }


    const index =
      Math.max(
        0,
        Math.min(
          requestedIndex,
          applications.length - 1
        )
      );


    const record =
      applications[
        index
      ];


    this.currentIndex.set(
      index
    );


    this.previousRecord = {
      ...record
    };


    this.mode.set(
      RecordToolbarMode.Browsing
    );


    this.setFormRecord(
      record,
      false
    );


    this.workspaceRuntime
      .setDirty(
        this.applicationId,
        false
      );


    this.publishToolbarState();
  }


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
      this.form.controls
        .TIPO
        .value ===
        'KPI' &&
      !this.form.controls
        .NIVEL
        .value
    ) {

      void this.showMessage(
        'Nivel es requerido cuando el tipo es KPI.',
        'Faltan datos',
        'warning'
      );

      return false;
    }


    return true;
  }


  private async validateApplicationId():
    Promise<boolean> {

    const applicationId =
      this.form.controls
        .ID_APLICACION
        .value
        .trim()
        .toUpperCase();


    if (
      !applicationId
    ) {

      return false;
    }


    if (
      this.mode() ===
        RecordToolbarMode.Editing &&
      this.previousRecord
        ?.ID_APLICACION ===
        applicationId
    ) {

      return true;
    }


    try {

      const response =
        await firstValueFrom(
          this.mad001Service
            .validateKey(
              applicationId
            )
        );


      const rows =
        this.parseArray<
          Record<string, unknown>
        >(
          response.data
        );


      const errorMessage =
        this.getBackendErrorMessage(
          rows[0]
        );


      const available =
        Boolean(
          errorMessage
        );


      if (
        !available
      ) {

        await this.showMessage(
          `La aplicación ${applicationId} ya existe.`,
          'Validación',
          'warning'
        );
      }


      return available;

    } catch (error) {

      await this.showUnknownError(
        error,
        'No fue posible validar el ID de aplicación.'
      );

      return false;
    }
  }


  private publishToolbarState():
    void {

    const browsing =
      this.mode() ===
        RecordToolbarMode.Browsing;


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
            Mad001ToolbarCapabilities,

          currentIndex:
            browsing
              ? this.currentIndex()
              : 0,

          totalRecords:
            browsing
              ? this.applications().length
              : 0
        })
      );
  }


  private setFormRecord(
    record:
      Readonly<Mad001ApplicationRecord>,

    editable:
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
          ID_APLICACION:
            record.ID_APLICACION,

          ID_APLICACION_PADRE:
            record.ID_APLICACION_PADRE,

          NOMBRE:
            record.NOMBRE,

          TIPO:
            record.TIPO,

          ACCION:
            record.ACCION,

          ESTADO:
            record.ESTADO,

          NIVEL:
            record.NIVEL,

          META_INFERIOR:
            record.META_INFERIOR,

          META_SUPERIOR:
            record.META_SUPERIOR,

          UDM:
            record.UDM,

          COMENTARIOS:
            record.COMENTARIOS ??
            ''
        },
        {
          emitEvent:
            false
        }
      );


      this.setFormEditable(
        editable
      );

    } finally {

      this.synchronizingForm =
        false;
    }
  }


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

    } else {

      this.form.disable({
        emitEvent:
          false
      });
    }
  }


  private getFormRecord():
    Mad001ApplicationRecord {

    const value =
      this.form.getRawValue();


    return {

      ID_APLICACION:
        value.ID_APLICACION
          .trim()
          .toUpperCase(),

      ID_APLICACION_PADRE:
        value.ID_APLICACION_PADRE,

      NOMBRE:
        value.NOMBRE.trim(),

      TIPO:
        value.TIPO,

      COMENTARIOS:
        value.COMENTARIOS
          .trim() ||
        null,

      ESTADO:
        value.ESTADO,

      ACCION:
        value.ACCION,

      META_INFERIOR:
        value.META_INFERIOR,

      META_SUPERIOR:
        value.META_SUPERIOR,

      UDM:
        value.UDM,

      NIVEL:
        value.NIVEL
    };
  }


  private getCurrentRecord():
    Mad001ApplicationRecord | null {

    if (
      this.mode() ===
        RecordToolbarMode.Initial ||
      !this.applications().length
    ) {

      return null;
    }


    return (
      this.applications()[
        this.currentIndex()
      ] ??
      null
    );
  }


  private isChanging():
    boolean {

    return (
      this.mode() ===
        RecordToolbarMode.Creating ||
      this.mode() ===
        RecordToolbarMode.Editing
    );
  }


  private applyDataLists(
    dataLists:
      Mad001DataLists
  ): void {

    this.unitOfMeasures.set(
      [
        ...dataLists.udm
      ]
    );


    this.typeOptions.set(
      [
        ...dataLists.tipo
      ]
    );


    this.actionOptions.set(
      [
        ...dataLists.accion
      ]
    );


    this.statusOptions.set(
      [
        ...dataLists.estado
      ]
    );


    this.levelOptions.set(
      [
        ...dataLists.nivel
      ]
    );
  }


  private parseDataLists(
    data:
      unknown
  ): Mad001DataLists {

    const rows =
      this.parseArray<
        Mad001DataLists
      >(
        data
      );


    const result =
      rows[0];


    if (
      !result
    ) {

      throw new Error(
        'The MAD-001 datalist response is empty.'
      );
    }


    if (
      result.ErrMensaje
        ?.trim()
    ) {

      throw new Error(
        result.ErrMensaje
      );
    }


    return {

      ...result,

      udm:
        Array.isArray(
          result.udm
        )
          ? result.udm
          : [],

      tipo:
        Array.isArray(
          result.tipo
        )
          ? result.tipo
          : [],

      estado:
        Array.isArray(
          result.estado
        )
          ? result.estado
          : [],

      tipoSistema:
        Array.isArray(
          result.tipoSistema
        )
          ? result.tipoSistema
          : [],

      accion:
        Array.isArray(
          result.accion
        )
          ? result.accion
          : [],

      nivel:
        Array.isArray(
          result.nivel
        )
          ? result.nivel
          : []
    };
  }


  private parseParentApplications(
    data:
      unknown
  ): Mad001ParentApplication[] {

    const rows =
      this.parseArray<
        Mad001ParentApplication &
        {
          ErrMensaje?:
            string;
        }
      >(
        data
      );


    const errorMessage =
      rows[0]
        ?.ErrMensaje
        ?.trim();


    if (
      errorMessage
    ) {

      throw new Error(
        errorMessage
      );
    }


    return rows;
  }


  private parseApplications(
    data:
      unknown
  ): Mad001ApplicationRecord[] {

    const rows =
      this.parseArray<
        Mad001ApplicationRecord
      >(
        data
      );


    const errorMessage =
      rows[0]
        ?.ErrMensaje
        ?.trim();


    if (
      errorMessage
    ) {

      throw new Error(
        errorMessage
      );
    }


    return rows;
  }


  private ensureSuccessfulMutation(
    data:
      unknown
  ): void {

    const rows =
      this.parseArray<
        Record<string, unknown>
      >(
        data
      );


    const errorMessage =
      this.getBackendErrorMessage(
        rows[0]
      );


    if (
      errorMessage
    ) {

      throw new Error(
        errorMessage
      );
    }
  }


  private parseArray<T>(
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
        'The MAD-001 backend response must contain an array.'
      );
    }


    return parsed as T[];
  }


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


    return String(
      record[
        'ErrMensaje'
      ] ??
      ''
    ).trim();
  }


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


  private async showUnknownError(
    error:
      unknown,

    fallbackMessage:
      string
  ): Promise<void> {

    console.error(
      'MAD-001 operation failed.',
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