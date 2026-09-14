import {
  untracked,
  computed,
  effect,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Subscription,
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
  buildReportRecordFilter,
  XteinRecordFilterComponent,
  XteinRecordFilterResult,
  XteinRecordViewComponent,
  XteinRecordReportsComponent,
  XteinInputComponent,
  XteinNumberComponent,
  XteinSelectComponent,
  XteinTextareaComponent,
  XteinLoadingComponent,
  XteinNotificationService
} from '@xtein/ui';

import {
  Ven230Application
} from './constants/ven-230.constants';

import {
  Ven230DefaultRecord,
  Ven230RecordViewColumns,
  Ven230StatusOptions,
  Ven230TipoVentaOptions,
  Ven230ToolbarCapabilities
} from './constants/ven-230-ui.constants';

import {
  Ven230DataLists,
  Ven230PrefacturaItem,
  Ven230PrefacturaRecord
} from './models/ven-230.model';

import {
  Ven230Service
} from './services/ven-230.service';


/**
 * VEN-230 - Prefacturación comercial.
 */
@Component({
  selector:
    'ven-230',

  standalone:
    true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    XteinRecordFilterComponent,
    XteinRecordViewComponent,
    XteinRecordReportsComponent,
    XteinInputComponent,
    XteinNumberComponent,
    XteinSelectComponent,
    XteinTextareaComponent,
    XteinLoadingComponent
  ],

  providers: [
    Ven230Service
  ],

  templateUrl:
    './ven-230.component.html',

  styleUrl:
    './ven-230.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Ven230Component
  implements OnInit, OnDestroy {

  readonly applicationId =
    Ven230Application.Id;

  /**
   * Internal subscription manager.
   */
  private readonly subscriptions =
    new Subscription();

  /**
   * Available document status options.
   */
  readonly statusOptions =
    Ven230StatusOptions;

  /**
   * Available sale type options.
   */
  readonly tipoVentaOptions =
    Ven230TipoVentaOptions;

  /**
   * Loaded query records.
   */
  readonly records =
    signal<Ven230PrefacturaRecord[]>([]);

  /**
   * Currently active record index.
   */
  readonly currentIndex =
    signal<number>(-1);

  /**
   * Detail items of the currently viewed prefactura.
   */
  readonly items =
    signal<Ven230PrefacturaItem[]>([]);

  /**
   * Application catalogs.
   */
  readonly dataLists =
    signal<Ven230DataLists>({});

  /**
   * General loading indicator state.
   */
  readonly loading =
    signal<boolean>(false);

  /**
   * Active record toolbar mode.
   */
  readonly mode =
    signal<RecordToolbarMode>(
      RecordToolbarMode.Initial
    );

  /**
   * Current permissions.
   */
  readonly permissions =
    signal<RecordToolbarPermissions>(
      DeniedRecordToolbarPermissions
    );

  /**
   * Filter modal visibility.
   */
  readonly filterVisible =
    signal<boolean>(false);

  /**
   * Quick view modal visibility.
   */
  readonly viewVisible =
    signal<boolean>(false);

  /**
   * Reports modal visibility.
   */
  readonly reportsVisible =
    signal<boolean>(false);

  /**
   * Computed read-only flag.
   */
  readonly readOnly =
    computed(() =>
      this.mode() !== RecordToolbarMode.Creating &&
      this.mode() !== RecordToolbarMode.Editing
    );

  /**
   * Record view columns.
   */
  readonly viewColumns =
    Ven230RecordViewColumns;

  /**
   * Active record accessor.
   */
  readonly currentRecord =
    computed<Ven230PrefacturaRecord | null>(() => {
      const list = this.records();
      const index = this.currentIndex();
      return index >= 0 && index < list.length ? list[index] : null;
    });

  /**
   * Report filter for all queried records.
   */
  readonly queryFilter =
    computed(() =>
      buildReportRecordFilter(
        Ven230Application.Table,
        'DOCUMENTO',
        this.records().map(r => r.DOCUMENTO)
      )
    );

  /**
   * Reactive form definition.
   */
  readonly form = new FormGroup({
    DOCUMENTO: new FormControl<string>(''),
    ID_DOCUMENTO: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    PREFIJO: new FormControl<string>(''),
    CONSECUTIVO: new FormControl<number>(0),
    SUFIJO: new FormControl<string>(''),
    FECHA: new FormControl<string>(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: [Validators.required] }),
    FECHA_REGISTRO: new FormControl<string | null>(null),
    ESTADO: new FormControl<string>('REGISTRADO', { nonNullable: true, validators: [Validators.required] }),
    USUARIO: new FormControl<string>(''),
    ID_CLIENTE: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    NOMBRE_CLIENTE: new FormControl<string>(''),
    DIRECCION: new FormControl<string>(''),
    ID_UBICACION: new FormControl<string>(''),
    ID_ADC: new FormControl<string>(''),
    ID_UN: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    ID_MONEDA: new FormControl<string>('COP'),
    TASA_CAMBIO: new FormControl<number>(1),
    ID_CONDICION: new FormControl<string>(''),
    PLAZO: new FormControl<number>(0),
    TIPO_VENTA: new FormControl<string>('CONTADO'),
    SUB_TOTAL: new FormControl<number>(0),
    VALOR_DESCUENTO: new FormControl<number>(0),
    VALOR_COSTOS: new FormControl<number>(0),
    TOTAL: new FormControl<number>(0),
    DESCRIPCION: new FormControl<string>(''),
    CONDICIONES_GENERALES: new FormControl<string>(''),
    ID_DOC_SOPORTE: new FormControl<string>(''),
    FECHA_OC: new FormControl<string | null>(null),
    ID_UN_BODEGA: new FormControl<string>(''),
    FECHA_PRIMER_VENC: new FormControl<string | null>(null),
    CUOTA_INICIAL: new FormControl<number>(0)
  });

  constructor(
    private readonly service: Ven230Service,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService
  ) {
    // Synchronize toolbar state whenever mode, index, records, loading or permissions change.
    effect(() => {
      this.publishToolbarState();
    });
  }

  ngOnInit(): void {
    this.disableFormControls();

    // Subscribe to toolbar commands for VEN-230
    this.subscriptions.add(
      this.toolbar
        .commandsForApplication(this.applicationId)
        .subscribe(command => this.handleToolbarCommand(command))
    );

    // Retrieve user permissions for this application
    this.subscriptions.add(
      this.permissionsService
        .getPermissions(this.applicationId)
        .subscribe({
          next: permissions => {
            this.permissions.set(permissions);
            this.publishToolbarState();
          },
          error: () => {
            this.permissions.set(DeniedRecordToolbarPermissions);
            this.publishToolbarState();
          }
        })
    );

    // Load initial catalogs and data
    void this.loadDataLists();
    void this.searchRecords('');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  /**
   * Publishes the current state to the platform toolbar.
   */
  private publishToolbarState(): void {
    untracked(() => {
      this.toolbar.setState(
        createRecordToolbarState({
          busy: this.loading(),
          applicationId: this.applicationId,
          mode: this.mode(),
          permissions: this.permissions(),
          capabilities: Ven230ToolbarCapabilities,
          currentIndex: this.currentIndex(),
          totalRecords: this.records().length
        })
      );
    });
  }

  /**
   * Generates single-record SQL filter expression for reports.
   */
  currentReportFilter(): string {
    const record = this.currentRecord();
    return record
      ? ` ${Ven230Application.Table}.DOCUMENTO = '${String(record.DOCUMENTO).replace(/'/g, "''")}'`
      : '';
  }

  /**
   * Handles incoming toolbar commands.
   */
  private handleToolbarCommand(command: ToolbarCommand): void {
    switch (command.action) {
      case ToolbarAction.New:
        this.newRecord();
        break;

      case ToolbarAction.Edit:
        this.editRecord();
        break;

      case ToolbarAction.Save:
        void this.saveRecord();
        break;

      case ToolbarAction.Delete:
        void this.deleteRecord();
        break;

      case ToolbarAction.Cancel:
        this.cancelEdit();
        break;

      case ToolbarAction.Search:
        this.filterVisible.set(true);
        break;

      case ToolbarAction.Refresh:
        this.refresh();
        break;

      case ToolbarAction.View:
        this.viewVisible.set(true);
        break;

      case ToolbarAction.First:
        this.navigateRecord('first');
        break;

      case ToolbarAction.Previous:
        this.navigateRecord('prev');
        break;

      case ToolbarAction.Next:
        this.navigateRecord('next');
        break;

      case ToolbarAction.Last:
        this.navigateRecord('last');
        break;

      case ToolbarAction.Print:
        this.reportsVisible.set(true);
        break;

      default:
        break;
    }
  }

  /**
   * Switches to creation mode.
   */
  newRecord(): void {
    this.mode.set(RecordToolbarMode.Creating);
    this.enableFormControls();
    this.form.reset({
      ...Ven230DefaultRecord,
      FECHA: new Date().toISOString().substring(0, 10),
      ESTADO: 'REGISTRADO'
    });
    this.items.set([]);
  }

  /**
   * Switches to edit mode for the current record.
   */
  editRecord(): void {
    if (!this.currentRecord()) {
      return;
    }
    this.mode.set(RecordToolbarMode.Editing);
    this.enableFormControls();
  }

  /**
   * Cancels current creation or edit operation.
   */
  cancelEdit(): void {
    this.mode.set(
      this.records().length
        ? RecordToolbarMode.Browsing
        : RecordToolbarMode.Initial
    );
    this.disableFormControls();
    const current = this.currentRecord();
    if (current) {
      this.populateForm(current);
    } else {
      this.form.reset();
      this.items.set([]);
    }
  }

  /**
   * Saves the current record (new or update).
   */
  async saveRecord(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.warning('Complete todos los campos requeridos antes de guardar.');
      return;
    }

    const formValue = this.form.getRawValue();
    const isNew = this.mode() === RecordToolbarMode.Creating;

    const payload = {
      PREFACTURAS: formValue,
      ITM_PREFACTURAS: this.items()
    };

    this.loading.set(true);

    try {
      const response = isNew
        ? await firstValueFrom(this.service.create(payload))
        : await firstValueFrom(this.service.update(payload));

      if (response && response.data) {
        const parsed = typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;
        if (Array.isArray(parsed) && parsed[0]?.ErrMensaje) {
          throw new Error(String(parsed[0].ErrMensaje));
        }
      }

      this.notification.success(
        isNew
          ? 'Prefactura creada correctamente.'
          : 'Prefactura actualizada correctamente.'
      );

      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();

      // Refresh list to reflect changes
      await this.searchRecords(formValue.DOCUMENTO || '');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error inesperado al guardar.';
      this.notification.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Prompts confirmation and deletes / cancels the active prefactura.
   */
  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record) {
      return;
    }

    const confirmation = await Swal.fire({
      title: '¿Anular Prefactura?',
      text: `¿Desea anular la Prefactura ${record.DOCUMENTO || record.ID_DOCUMENTO}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#244d73',
      cancelButtonColor: '#8a99a8',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.loading.set(true);

    try {
      const prm = {
        PrefacturaS: {
          ID_DOCUMENTO: record.ID_DOCUMENTO,
          PREFIJO: record.PREFIJO,
          CONSECUTIVO: record.CONSECUTIVO,
          SUFIJO: record.SUFIJO
        }
      };

      const response = await firstValueFrom(this.service.delete(prm));

      if (response && response.data) {
        const parsed = typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;
        if (Array.isArray(parsed) && parsed[0]?.ErrMensaje) {
          throw new Error(String(parsed[0].ErrMensaje));
        }
      }

      this.notification.success('Prefactura anulada correctamente.');
      await this.searchRecords('');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al anular.';
      this.notification.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Refreshes the active view or dataset.
   */
  refresh(): void {
    const current = this.currentRecord();
    void this.searchRecords(current?.DOCUMENTO || '');
  }

  /**
   * Searches records matching a filter string or query object.
   */
  async searchRecords(filter: string | XteinRecordFilterResult): Promise<void> {
    this.loading.set(true);

    try {
      const prm = typeof filter === 'string'
        ? { filtro: filter }
        : filter;

      const response = await firstValueFrom(this.service.getRecords(prm));

      let list: Ven230PrefacturaRecord[] = [];
      if (response && response.data) {
        const parsed = typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;
        list = Array.isArray(parsed) ? parsed : [];
      }

      this.records.set(list);

      if (list.length > 0) {
        this.mode.set(RecordToolbarMode.Browsing);
        this.selectRecordIndex(0);
      } else {
        this.currentIndex.set(-1);
        this.mode.set(RecordToolbarMode.Initial);
        this.form.reset();
        this.items.set([]);
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al consultar prefacturas.';
      this.notification.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Selects a record by its index and loads additional line items.
   */
  selectRecordIndex(index: number): void {
    const list = this.records();
    if (index < 0 || index >= list.length) {
      return;
    }

    this.currentIndex.set(index);
    const selected = list[index];
    this.populateForm(selected);
    void this.loadAdditionalData(selected);
  }

  /**
   * Selects a record chosen from the XteinRecordView modal.
   */
  selectViewedRecord(record: unknown): void {
    const rec = record as Ven230PrefacturaRecord;
    const list = this.records();
    const foundIndex = list.findIndex(r => r.DOCUMENTO === rec.DOCUMENTO);

    if (foundIndex >= 0) {
      this.selectRecordIndex(foundIndex);
    } else {
      this.records.set([rec, ...list]);
      this.selectRecordIndex(0);
    }
    this.viewVisible.set(false);
  }

  /**
   * Handles toolbar record navigation.
   */
  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    const total = this.records().length;
    if (total === 0) {
      return;
    }

    let target = this.currentIndex();

    switch (direction) {
      case 'first':
        target = 0;
        break;
      case 'prev':
        target = Math.max(0, target - 1);
        break;
      case 'next':
        target = Math.min(total - 1, target + 1);
        break;
      case 'last':
        target = total - 1;
        break;
    }

    if (target !== this.currentIndex()) {
      this.selectRecordIndex(target);
    }
  }

  /**
   * Populates form fields with values from a record.
   */
  private populateForm(record: Ven230PrefacturaRecord): void {
    this.form.patchValue({
      DOCUMENTO: record.DOCUMENTO || '',
      ID_DOCUMENTO: record.ID_DOCUMENTO || '',
      PREFIJO: record.PREFIJO || '',
      CONSECUTIVO: record.CONSECUTIVO || 0,
      SUFIJO: record.SUFIJO || '',
      FECHA: record.FECHA ? record.FECHA.substring(0, 10) : '',
      FECHA_REGISTRO: record.FECHA_REGISTRO || '',
      ESTADO: record.ESTADO || 'REGISTRADO',
      USUARIO: record.USUARIO || '',
      ID_CLIENTE: record.ID_CLIENTE || '',
      NOMBRE_CLIENTE: record.NOMBRE_CLIENTE || '',
      DIRECCION: record.DIRECCION || '',
      ID_UBICACION: record.ID_UBICACION || '',
      ID_ADC: record.ID_ADC || '',
      ID_UN: record.ID_UN || '',
      ID_MONEDA: record.ID_MONEDA || 'COP',
      TASA_CAMBIO: record.TASA_CAMBIO || 1,
      ID_CONDICION: record.ID_CONDICION || '',
      PLAZO: record.PLAZO || 0,
      TIPO_VENTA: record.TIPO_VENTA || 'CONTADO',
      SUB_TOTAL: record.SUB_TOTAL || 0,
      VALOR_DESCUENTO: record.VALOR_DESCUENTO || 0,
      VALOR_COSTOS: record.VALOR_COSTOS || 0,
      TOTAL: record.TOTAL || 0,
      DESCRIPCION: record.DESCRIPCION || '',
      CONDICIONES_GENERALES: record.CONDICIONES_GENERALES || '',
      ID_DOC_SOPORTE: record.ID_DOC_SOPORTE || '',
      FECHA_OC: record.FECHA_OC ? String(record.FECHA_OC).substring(0, 10) : null,
      ID_UN_BODEGA: record.ID_UN_BODEGA || '',
      FECHA_PRIMER_VENC: record.FECHA_PRIMER_VENC ? String(record.FECHA_PRIMER_VENC).substring(0, 10) : null,
      CUOTA_INICIAL: record.CUOTA_INICIAL || 0
    });
  }

  /**
   * Loads line items and additional details for a prefactura.
   */
  private async loadAdditionalData(record: Ven230PrefacturaRecord): Promise<void> {
    try {
      const prm = {
        PrefacturaS: {
          ID_DOCUMENTO: record.ID_DOCUMENTO,
          PREFIJO: record.PREFIJO,
          CONSECUTIVO: record.CONSECUTIVO,
          SUFIJO: record.SUFIJO
        }
      };

      const response = await firstValueFrom(this.service.getAdditionalData(prm));

      if (response && response.data) {
        const parsed = typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

        if (parsed && typeof parsed === 'object' && 'ITM_PREFACTURAS' in parsed && Array.isArray((parsed as Record<string, unknown>)['ITM_PREFACTURAS'])) {
          this.items.set((parsed as Record<string, unknown>)['ITM_PREFACTURAS'] as Ven230PrefacturaItem[]);
        } else if (Array.isArray(parsed)) {
          this.items.set(parsed as Ven230PrefacturaItem[]);
        } else {
          this.items.set([]);
        }
      }
    } catch {
      this.items.set([]);
    }
  }

  /**
   * Loads general catalogs.
   */
  private async loadDataLists(): Promise<void> {
    try {
      const response = await firstValueFrom(this.service.getDataLists());
      if (response && response.data) {
        const parsed = typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;
        this.dataLists.set(parsed || {});
      }
    } catch {
      // Catalogs load gracefully without blocking the view
    }
  }

  private disableFormControls(): void {
    this.form.disable();
  }

  private enableFormControls(): void {
    this.form.enable();
    // System-generated key/audit fields remain read-only
    this.form.controls.DOCUMENTO.disable();
    this.form.controls.FECHA_REGISTRO.disable();
    this.form.controls.USUARIO.disable();
    this.form.controls.TOTAL.disable();
    this.form.controls.SUB_TOTAL.disable();
    this.form.controls.NOMBRE_CLIENTE.disable();
    this.form.controls.VALOR_COSTOS.disable();
  }
}
