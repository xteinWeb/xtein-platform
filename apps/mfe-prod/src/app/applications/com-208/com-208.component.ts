import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  untracked,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { formatNumber } from 'devextreme/localization';
import Swal from 'sweetalert2';

import {
  ToolbarRuntimeService,
  RecordToolbarPermissionsService,
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  RecordToolbarMode,
  RecordToolbarPermissions,
  DeniedRecordToolbarPermissions,
  ToolbarCommand,
  ToolbarAction,
  createRecordToolbarState
} from '@xtein/sdk';

import {
  XteinInputComponent,
  XteinLabelComponent,
  XteinDateComponent,
  XteinLookupComponent,
  XteinRecordViewComponent,
  XteinRecordFilterComponent,
  XteinRecordReportsComponent,
  XteinReportEmailContext,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinRecordFilterResult,
  XteinRecordViewColumn,
  XteinGroupLabelComponent
} from '@xtein/ui';

import {
  Com208Action,
  Com208Application,
  Com208ToolbarCapabilities
} from './constants/com-208.constants';

import {
  Com208DefaultRecord,
  Com208DestinationColumns,
  Com208OriginColumns,
  Com208ProductColumns,
  Com208RecordViewColumns,
  Com208SectionColumns
} from './constants/com-208-ui.constants';

import {
  Com208MovementGrav,
  Com208MovementItem,
  Com208MovementRecord,
  Com208Total
} from './models/com-208.model';

import {
  Com208Header,
  Com208Lookup,
  Com208Warehouse
} from './models/com-208-business.model';

import { Com208Service } from './services/com-208.service';
import { Com208BusinessService } from './services/com-208-business.service';
import { XteinCom208ItemsComponent } from './components/xtein-com208-items/xtein-com208-items.component';

/**
 * COM-208 Consumos: salidas de inventario de tipo CONSUMO de producción.
 * Migrado de Legacy modulos/COM208 (COM20801 materiales, COM20802 origen/destino, COM20805 totales).
 * COM20804 (entrada por orden de compra) no aplica a consumos.
 */
@Component({
  selector: 'xtein-com-208',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    XteinInputComponent,
    XteinLabelComponent,
    XteinDateComponent,
    XteinLookupComponent,
    XteinRecordViewComponent,
    XteinRecordFilterComponent,
    XteinRecordReportsComponent,
    XteinLoadingComponent,
    XteinGroupLabelComponent,
    XteinCom208ItemsComponent
  ],
  providers: [
    Com208Service,
    Com208BusinessService
  ],
  templateUrl: './com-208.component.html',
  styleUrls: ['./com-208.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Com208Component implements OnInit, OnDestroy {
  readonly applicationId = Com208Application.Id;
  readonly tableBase = Com208Application.Table;

  readonly viewColumns: XteinRecordViewColumn[] = [...Com208RecordViewColumns];
  readonly productColumns = Com208ProductColumns;
  readonly sectionColumns = Com208SectionColumns;
  readonly originColumns = Com208OriginColumns;
  readonly destinationColumns = Com208DestinationColumns;

  // Estado
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Com208MovementRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly busy = signal<boolean>(false);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);

  // Detalle
  readonly items = signal<Com208MovementItem[]>([]);
  readonly taxes = signal<Com208MovementGrav[]>([]);
  readonly totals = signal<Com208Total[]>([]);

  // Catálogos
  readonly documents = signal<Com208Lookup[]>([]);
  readonly products = signal<Com208Lookup[]>([]);
  readonly sections = signal<Com208Lookup[]>([]);
  readonly origins = signal<Com208Warehouse[]>([]);
  readonly destinations = signal<Com208Warehouse[]>([]);
  readonly itemProducts = signal<Com208Lookup[]>([]);
  readonly itemProductsLoading = signal<boolean>(false);
  readonly specifications = signal<Com208Lookup[]>([]);

  // Ventanas
  readonly filterVisible = signal<boolean>(false);
  readonly viewVisible = signal<boolean>(false);
  readonly reportsVisible = signal<boolean>(false);

  spec(name: string): Com208Lookup | undefined {
    return this.specifications().find(s => s.NOMBRE_OBJETO === name);
  }

  readonly readOnly = computed(() => {
    const current = this.mode();
    return current === RecordToolbarMode.Initial || current === RecordToolbarMode.Browsing;
  });

  readonly isNew = computed(() => this.mode() === RecordToolbarMode.Creating);

  readonly currentRecord = computed(() => {
    const idx = this.currentIndex();
    const list = this.records();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  // Métodos y no computed(): el formulario reactivo no es una señal, un computed() que solo lo lee
  // se queda con el primer valor y nunca se recalcula.
  header(): Com208Header {
    return this.form.getRawValue() as Com208Header;
  }

  itemsReady(): boolean {
    const h = this.header();
    return !!(h.DOCUMENTO && h.ID_UN_ORIGEN && h.ID_UN_DESTINO);
  }

  itemRecordKey(): string {
    const h = this.header();
    return this.isNew() ? 'new' : `${h.ID_DOCUMENTO || ''}_${h.CONSECUTIVO || 0}`;
  }

  readonly totalValue = computed(() => this.items().reduce((sum, item) => sum + Number(item.TOTAL || 0), 0));

  /** Filas de totales de la liquidación (el total general se muestra aparte). */
  readonly totalRows = computed(() =>
    this.totals().filter(row => String(row.CONCEPTO ?? row.DESCRIPCION ?? '').toUpperCase() !== 'TOTAL')
  );

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO || this.records().map(r => `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})`).join(' OR ')
  );

  readonly currentReportFilter = computed(() => {
    const r = this.currentRecord();
    return r ? `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})` : '';
  });

  reportEmailContext(): XteinReportEmailContext {
    const h = this.header();
    return {
      defaults: { ASUNTO: `Consumo ${h.DOCUMENTO ?? ''}`, DESTINO: '', DESTINO_EMAIL: '' },
      template: '',
      replacements: { ...h }
    };
  }

  readonly form = new FormGroup({
    ID_UN: new FormControl<string>(''),
    ID_DOCUMENTO: new FormControl<string>(''),
    PREFIJO: new FormControl<string>(''),
    CONSECUTIVO: new FormControl<number>(0),
    SUFIJO: new FormControl<string>(''),
    DOCUMENTO: new FormControl<string>('', [Validators.required]),
    FECHA: new FormControl<string | null>(this.todayDate(), [Validators.required]),
    FECHA_REGISTRO: new FormControl<string | null>(this.todayDate()),
    FECHA_VENCIMIENTO: new FormControl<string | null>(this.todayDate()),
    HORA: new FormControl<string | null>(null),
    MOVIMIENTO: new FormControl<string>(Com208Application.Movement),
    TIPO: new FormControl<string>(Com208Application.Type),
    TIPO_INVENTARIO: new FormControl<string>(Com208Application.InventoryType),
    TIPO_COMPRA: new FormControl<string>('CONTADO'),
    PRODUCTO: new FormControl<string>('', [Validators.required]),
    SECCION: new FormControl<string>(''),
    ID_UN_ORIGEN: new FormControl<string>('', [Validators.required]),
    ID_UN_DESTINO: new FormControl<string>('', [Validators.required]),
    ID_SOPORTE: new FormControl<string>(''),
    NC_SOPORTE: new FormControl<number>(0),
    ID_PROVEEDOR: new FormControl<string>(''),
    ID_CONDICION: new FormControl<string>(''),
    PLAZO: new FormControl<number>(0),
    ID_MONEDA: new FormControl<string>(''),
    TASA_CAMBIO: new FormControl<number>(1),
    DETALLE: new FormControl<string>(''),
    USUARIO: new FormControl<string>(''),
    ESTADO: new FormControl<string>('REGISTRADO'),
    SUB_TOTAL: new FormControl<number>(0),
    TOTAL: new FormControl<number>(0)
  });

  private readonly subscriptions = new Subscription();
  private indexBeforeNew = -1;

  constructor(
    private readonly service: Com208Service,
    readonly business: Com208BusinessService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService,
    private readonly elementRef: ElementRef
  ) {
    effect(() => {
      this.publishToolbarState();
    });

    effect(() => {
      if (this.toolbar.activeApplicationId() !== this.applicationId) {
        this.filterVisible.set(false);
        this.viewVisible.set(false);
        this.reportsVisible.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.disableFormControls();

    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        if (!this.readOnly()) {
          this.workspace.setDirty(this.applicationId, true);
        }
      })
    );

    this.subscriptions.add(
      this.form.controls.DOCUMENTO.valueChanges.subscribe(value => {
        if (value && !this.readOnly()) this.selectDocument(value);
      })
    );

    // Producto de producción: carga sus secciones con materiales
    this.subscriptions.add(
      this.form.controls.PRODUCTO.valueChanges.subscribe(product => {
        if (this.readOnly()) return;
        this.form.patchValue({ SECCION: '' }, { emitEvent: false });
        this.setItems([]);
        void this.loadSections(product ?? '');
      })
    );

    // Sección: carga los materiales de la matriz
    this.subscriptions.add(
      this.form.controls.SECCION.valueChanges.subscribe(() => {
        if (!this.readOnly()) void this.loadMaterials();
      })
    );

    // Bodega origen: productos disponibles para materiales adicionales
    this.subscriptions.add(
      this.form.controls.ID_UN_ORIGEN.valueChanges.subscribe(() => {
        if (!this.readOnly()) void this.loadItemProducts();
      })
    );

    this.subscriptions.add(
      this.toolbar
        .commandsForApplication(this.applicationId)
        .subscribe(command => void this.handleToolbarCommand(command))
    );

    this.subscriptions.add(
      this.permissionsService
        .getPermissions(this.applicationId)
        .subscribe({
          next: perms => {
            this.permissions.set(perms);
            this.publishToolbarState();
          },
          error: () => {
            this.permissions.set(DeniedRecordToolbarPermissions);
            this.publishToolbarState();
          }
        })
    );

    void this.loadCatalogs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  // ================= Toolbar =================

  private publishToolbarState(): void {
    const state = createRecordToolbarState({
      busy: this.busy(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: Com208ToolbarCapabilities,
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
  }

  private async handleToolbarCommand(command: ToolbarCommand): Promise<void> {
    if (this.busy()) return;
    switch (command.action) {
      case ToolbarAction.New:
        await this.newRecord();
        break;
      case ToolbarAction.Delete:
        await this.deleteRecord();
        break;
      case ToolbarAction.Save:
        await this.saveRecord();
        break;
      case ToolbarAction.Cancel:
        await this.cancelEdit();
        break;
      case ToolbarAction.Search:
        this.filterVisible.set(true);
        break;
      case ToolbarAction.Refresh:
        await this.refresh();
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
      case ToolbarAction.View:
        this.viewVisible.set(true);
        break;
      case ToolbarAction.Print:
        this.reportsVisible.set(true);
        break;
      case ToolbarAction.GoTo:
        if (typeof command.payload === 'number' && Number.isInteger(command.payload)) {
          this.selectRecordIndex(command.payload - 1);
        }
        break;
      default:
        break;
    }
  }

  // ================= Registro =================

  selectDocument(value: string): void {
    const row = this.documents().find(d => d.DOCUMENTO === value);
    if (!row) return;
    this.form.patchValue({
      DOCUMENTO: value,
      ID_DOCUMENTO: String(row.ID_DOCUMENTO || ''),
      CONSECUTIVO: Number(row.CONSECUTIVO || 0),
      PREFIJO: String(row['PREFIJO'] || ''),
      SUFIJO: String(row['SUFIJO'] || '')
    }, { emitEvent: false });
  }

  async newRecord(): Promise<void> {
    if (this.busy() || !this.readOnly() || !this.permissions().create) return;
    this.indexBeforeNew = this.currentIndex();
    this.mode.set(RecordToolbarMode.Creating);
    this.currentIndex.set(-1);
    this.setItems([]);
    this.sections.set([]);

    // Documento de COM-208 (SCO) con el consecutivo siguiente
    try {
      this.documents.set(await this.business.catalog('documents', this.documentsFilter(), true));
    } catch (error) {
      this.showError(error);
    }

    this.form.reset({
      ...Com208DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_VENCIMIENTO: this.todayDate(),
      USUARIO: this.business.identity.USUARIO,
      ID_UN_ORIGEN: this.origins().length === 1 ? String(this.origins()[0].ID_UN_ORIGEN ?? '') : '',
      ID_UN_DESTINO: this.destinations().length === 1 ? String(this.destinations()[0].ID_UN_DESTINO ?? '') : ''
    }, { emitEvent: false });

    if (this.documents().length === 1) {
      this.selectDocument(String(this.documents()[0].DOCUMENTO));
    }

    this.enableFormControls(true);
    this.workspace.setDirty(this.applicationId, false);
    if (this.form.controls.ID_UN_ORIGEN.value) void this.loadItemProducts();
    this.focusFirstControl();
  }

  async cancelEdit(): Promise<void> {
    const result = await Swal.fire({
      text: '¿Desea deshacer las modificaciones del registro actual?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#0F4C81',
      confirmButtonText: 'Sí, deshacer',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    const previousIndex = this.isNew() ? this.indexBeforeNew : this.currentIndex();
    const idx = this.records().length ? Math.min(Math.max(previousIndex, 0), this.records().length - 1) : -1;
    this.indexBeforeNew = -1;
    this.mode.set(this.records().length > 0 ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
    this.disableFormControls();
    this.workspace.setDirty(this.applicationId, false);

    if (idx >= 0) {
      this.selectRecordIndex(idx);
    } else {
      this.currentIndex.set(-1);
      this.clearForm();
    }
  }

  async saveRecord(): Promise<void> {
    if (!this.isNew()) return;
    this.form.markAllAsTouched();
    const headerData: Com208Header = {
      ...this.header(),
      MOVIMIENTO: Com208Application.Movement,
      TIPO: Com208Application.Type,
      ID_APLICACION: Com208Application.Id
    };
    const validationError = this.business.validate(headerData, this.items());
    if (validationError) {
      this.notification.warning(validationError);
      return;
    }

    this.busy.set(true);
    try {
      // Los materiales de la matriz en 0 no se guardan (el SP no acepta cantidades en 0).
      // Se liquidan los gravámenes sobre lo que se guarda: el SP exige GRAVAMENES por ítem y MOVIMIENTOS_GRAV.
      const toSave = this.items().filter(row => Number(row.CANTIDAD) > 0);
      const liquidation = await this.business.taxes(headerData, toSave);

      const payload = {
        MOVIMIENTOS: headerData,
        ITM_MOVIMIENTOS: liquidation.items,
        MOVIMIENTOS_GRAV: liquidation.taxes,
        ID_APLICACION: Com208Application.Id,
        USUARIO: this.business.identity.USUARIO
      };
      const response = await firstValueFrom(this.service.save(Com208Action.New, payload));
      const saved = this.business.decode<Com208MovementRecord & { MsgAccion?: string }>(response)[0];

      this.notification.success(`Consumo ${saved?.DOCUMENTO ?? headerData.DOCUMENTO ?? ''} guardado.`);
      if (saved?.MsgAccion) this.notification.info(saved.MsgAccion);

      this.workspace.setDirty(this.applicationId, false);
      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();

      const fullRecords = await this.queryDocument(
        String(saved?.ID_DOCUMENTO ?? headerData.ID_DOCUMENTO ?? ''),
        Number(saved?.CONSECUTIVO ?? headerData.CONSECUTIVO ?? 0)
      );
      if (fullRecords.length > 0) {
        this.records.set(fullRecords);
        this.selectRecordIndex(0);
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async deleteRecord(): Promise<void> {
    const current = this.currentRecord();
    if (!current || this.busy() || !this.readOnly() || !this.permissions().delete) return;
    if (current.ESTADO === 'ANULADO') {
      this.notification.warning('El consumo ya se encuentra anulado.');
      return;
    }

    const result = await Swal.fire({
      html: `¿Está seguro de anular el consumo <b>${current.DOCUMENTO || `${current.ID_DOCUMENTO}-${current.CONSECUTIVO}`}</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#0F4C81',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    this.busy.set(true);
    try {
      const response = await firstValueFrom(this.service.delete({
        MOVIMIENTOS: this.header(),
        ITM_MOVIMIENTOS: this.items(),
        MOVIMIENTOS_GRAV: this.taxes(),
        ID_APLICACION: Com208Application.Id,
        USUARIO: this.business.identity.USUARIO
      }));
      this.business.decode(response);
      this.notification.success('Consumo anulado.');
      await this.refresh(false);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async refresh(showMessage = true): Promise<void> {
    const current = this.currentRecord();
    if (!current) return;
    try {
      const refreshed = await this.queryDocument(current.ID_DOCUMENTO, current.CONSECUTIVO);
      if (refreshed.length > 0) {
        const list = [...this.records()];
        list[this.currentIndex()] = refreshed[0];
        this.records.set(list);
        this.selectRecordIndex(this.currentIndex());
        if (showMessage) this.notification.success('Registro actualizado.');
      }
    } catch (error) {
      this.showError(error);
    }
  }

  // ================= Navegación =================

  selectRecordIndex(index: number): void {
    const list = this.records();
    if (index < 0 || index >= list.length) return;
    const record = list[index];
    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.disableFormControls();

    const documentLabel = record.DOCUMENTO || `${record.ID_DOCUMENTO}-${record.CONSECUTIVO}`;
    if (!this.documents().some(d => d.DOCUMENTO === documentLabel)) {
      this.documents.update(docs => [...docs, { DOCUMENTO: documentLabel, ID_DOCUMENTO: record.ID_DOCUMENTO, CONSECUTIVO: record.CONSECUTIVO }]);
    }
    this.ensureOption(this.origins, 'ID_UN_ORIGEN', record.ID_UN_ORIGEN, record.ORIGEN);
    this.ensureOption(this.destinations, 'ID_UN_DESTINO', record.ID_UN_DESTINO, record.DESTINO);

    this.form.reset({
      ...Com208DefaultRecord,
      ...record,
      DOCUMENTO: documentLabel,
      SECCION: String(record.ID_SECCION ?? record.SECCION ?? ''),
      FECHA: record.FECHA ? String(record.FECHA).slice(0, 10) : null,
      FECHA_REGISTRO: record.FECHA_REGISTRO ? String(record.FECHA_REGISTRO).slice(0, 10) : null,
      FECHA_VENCIMIENTO: record.FECHA_VENCIMIENTO ? String(record.FECHA_VENCIMIENTO).slice(0, 10) : null
    }, { emitEvent: false });

    this.setItems([]);
    this.workspace.setDirty(this.applicationId, false);
    void this.loadRecordDetail(record);
  }

  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    if (this.busy() || !this.readOnly()) return;
    const total = this.records().length;
    if (total === 0) return;
    let target = this.currentIndex();
    switch (direction) {
      case 'first': target = 0; break;
      case 'prev': target = Math.max(0, target - 1); break;
      case 'next': target = Math.min(total - 1, target + 1); break;
      case 'last': target = total - 1; break;
    }
    if (target !== this.currentIndex()) this.selectRecordIndex(target);
  }

  selectViewedRecord(record: unknown): void {
    this.viewVisible.set(false);
    const rec = record as Com208MovementRecord;
    const idx = this.records().findIndex(r => r.ID_DOCUMENTO === rec?.ID_DOCUMENTO && r.CONSECUTIVO === rec?.CONSECUTIVO);
    if (idx >= 0) this.selectRecordIndex(idx);
  }

  async searchRecords(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    this.busy.set(true);
    try {
      const response = await firstValueFrom(this.service.query(Com208Action.Query, { MOVIMIENTOS: result?.ESTRUCTURA ?? [] }));
      const found = this.business.decode<Com208MovementRecord>(response);
      if (found.length > 0) {
        this.records.set(found);
        this.selectRecordIndex(0);
        this.notification.success(`Se encontraron ${found.length} consumo(s).`);
      } else {
        this.notification.warning('No se encontraron registros con el criterio especificado.');
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  // ================= Materiales =================

  async onQuantityChanged(change: { item: number; quantity: number }): Promise<void> {
    if (this.readOnly()) return;
    const list = this.items().map(row => row.ITEM === change.item ? this.business.withQuantity(row, change.quantity) : row);
    await this.applyItems(list);
  }

  async addProduct(product: string): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    if (this.items().some(row => row.PRODUCTO === product)) {
      this.notification.warning(`El material ${product} ya está en el consumo.`);
      return;
    }
    this.busy.set(true);
    try {
      const next = this.items().reduce((max, row) => Math.max(max, row.ITEM), 0) + 1;
      const row = await this.business.productItem(product, this.header(), next);
      this.setItems([...this.items(), row]);
      this.workspace.setDirty(this.applicationId, true);
      this.notification.info(`Material ${product} agregado: indique la cantidad consumida.`);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async removeItems(itemNumbers: number[]): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    // Los materiales de la matriz no se eliminan: si no se usan se dejan en 0
    const removable = this.items().filter(row => itemNumbers.includes(row.ITEM) && !row.ES_MATRIZ).map(row => row.ITEM);
    if (removable.length === 0) return;
    const answer = await Swal.fire({
      text: '¿Desea eliminar los materiales adicionales seleccionados?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!answer.isConfirmed) return;
    await this.applyItems(this.items().filter(row => !removable.includes(row.ITEM)));
  }

  /** Aplica la lista de materiales y liquida gravámenes/totales (como Legacy al cargar o editar ítems). */
  private async applyItems(list: Com208MovementItem[]): Promise<void> {
    this.setItems(list);
    this.workspace.setDirty(this.applicationId, true);
    const toLiquidate = list.filter(row => Number(row.CANTIDAD) > 0);
    if (toLiquidate.length === 0) {
      this.taxes.set([]);
      this.totals.set([]);
      return;
    }
    try {
      const liquidation = await this.business.taxes(this.header(), toLiquidate);
      this.taxes.set(liquidation.taxes);
      this.totals.set(liquidation.totals);
      const byItem = new Map(liquidation.items.map(row => [row.ITEM, row]));
      this.setItems(this.items().map(row => byItem.get(row.ITEM) ?? row));
    } catch (error) {
      this.showError(error);
    }
  }

  private setItems(list: Com208MovementItem[]): void {
    this.items.set(list);
    const total = list.reduce((sum, row) => sum + Number(row.TOTAL || 0), 0);
    const subtotal = list.reduce((sum, row) => sum + Number(row.SUB_TOTAL || 0), 0);
    this.form.patchValue({ SUB_TOTAL: subtotal, TOTAL: total }, { emitEvent: false });
    if (list.length === 0) {
      this.taxes.set([]);
      this.totals.set([]);
    }
  }

  private async loadSections(product: string): Promise<void> {
    this.sections.set([]);
    if (!product) return;
    try {
      const rows = await this.business.catalog('sections', { PRODUCTO: product, ...this.business.identity });
      this.sections.set(rows.map(row => ({
        ...row,
        ID_SECCION: String(row.ID_SECCION ?? ''),
        NOMBRE_SECCION: String(row.NOMBRE_SECCION ?? '')
      })));
      if (rows.length === 1) {
        this.form.controls.SECCION.setValue(String(rows[0].ID_SECCION ?? ''));
      }
    } catch (error) {
      // Producto sin matriz: se avisa, pero el consumo sigue y los materiales se agregan a mano
      this.warnNoMatrix(error);
    }
  }

  private async loadMaterials(): Promise<void> {
    const h = this.header();
    if (!h.PRODUCTO || !h.SECCION) {
      this.setItems([]);
      return;
    }
    this.busy.set(true);
    try {
      const materials = await this.business.materials(h.PRODUCTO, h.SECCION, String(h.ID_UN_ORIGEN ?? ''));
      this.busy.set(false);
      if (!materials.length) throw new Error(`No hay materiales en la matriz para ${h.PRODUCTO}`);
      await this.applyItems(materials);
      this.notification.success(`Se cargaron ${materials.length} material(es) de la matriz.`);
    } catch (error) {
      // Se quitan solo los de la matriz anterior: los agregados a mano se conservan
      this.setItems(this.items().filter(row => !row.ES_MATRIZ));
      this.warnNoMatrix(error);
    } finally {
      this.busy.set(false);
    }
  }

  async loadItemProducts(): Promise<void> {
    const h = this.header();
    if (!h.ID_UN_ORIGEN) {
      this.itemProducts.set([]);
      return;
    }
    this.itemProductsLoading.set(true);
    try {
      this.itemProducts.set(await this.business.catalog('itemProducts', {
        ID_CONDICION: '',
        ID_PROVEEDOR: '',
        ID_UN_ORIGEN: h.ID_UN_ORIGEN,
        ID_UN_DESTINO: h.ID_UN_DESTINO,
        MOVIMIENTO: Com208Application.Movement,
        TIPO: Com208Application.Type
      }));
    } catch {
      this.itemProducts.set([]);
    } finally {
      this.itemProductsLoading.set(false);
    }
  }

  private async loadRecordDetail(record: Com208MovementRecord): Promise<void> {
    try {
      const detail = await this.business.additional(record.ID_DOCUMENTO, record.CONSECUTIVO);
      if (this.currentRecord() !== record) return;
      const items = (detail.ITM_MOVIMIENTOS ?? []).map(row => ({
        ...row,
        ES_MATRIZ: row.ES_MATRIZ === true || Number(row.ES_MATRIZ) === 1,
        CONSUMO_BASE: Number(row.CONSUMO_BASE ?? 0)
      }));
      this.setItems(items);
      this.taxes.set(detail.MOVIMIENTOS_GRAV ?? []);
      this.totals.set(detail.TOTALES ?? []);
    } catch (error) {
      this.showError(error);
    }
  }

  // ================= Catálogos =================

  private documentsFilter() {
    return {
      ID_APLICACION: Com208Application.Id,
      MOVIMIENTO: Com208Application.Movement,
      TIPO: Com208Application.Type,
      USUARIO: this.business.identity.USUARIO
    };
  }

  private async loadCatalogs(): Promise<void> {
    const identity = this.business.identity;

    const tasks: Promise<void>[] = [
      this.business.catalog('documents', this.documentsFilter(), true)
        .then(docs => this.documents.set(docs))
        .catch(error => console.warn('COM-208 documentos:', error)),

      // Igual que Legacy: el tipo CONSUMO debe estar autorizado para el usuario en las salidas
      this.business.catalog<Com208Lookup>('types', { MOVIMIENTO: Com208Application.Movement, ID_APLICACION: 'COM-205', USUARIO: identity.USUARIO })
        .then(types => {
          if (!types.some(t => String(t['TIPO'] ?? '').toUpperCase() === Com208Application.Type)) {
            this.notification.warning('El usuario no tiene autorizado el tipo de salida CONSUMO.');
          }
        })
        .catch(error => this.notification.warning(error instanceof Error ? error.message : 'No fue posible validar el tipo CONSUMO.')),

      this.business.catalog<{ ORIGEN?: Com208Warehouse[]; DESTINO?: Com208Warehouse[] }>('warehouses', {
        MOVIMIENTOS: { MOVIMIENTO: Com208Application.Movement, TIPO: Com208Application.Type, USUARIO: identity.USUARIO }
      }).then(rows => {
        this.origins.set((rows[0]?.ORIGEN ?? []).map(r => ({ ...r, ID_UN_ORIGEN: String(r.ID_UN_ORIGEN ?? '') })));
        this.destinations.set((rows[0]?.DESTINO ?? []).map(r => ({ ...r, ID_UN_DESTINO: String(r.ID_UN_DESTINO ?? '') })));
      }).catch(error => console.warn('COM-208 bodegas:', error)),

      this.business.catalog('products', { MODO: 'BASICO' })
        .then(rows => this.products.set(rows.map(r => ({ ...r, PRODUCTO: String(r.PRODUCTO ?? ''), NOMBRE: String(r.NOMBRE ?? '') }))))
        .catch(error => console.warn('COM-208 productos:', error)),

      this.business.catalog('specifications', { ...identity, ID_APLICACION_BASE: '' })
        .then(specs => this.specifications.set(specs))
        .catch(() => this.specifications.set([]))
    ];
    await Promise.all(tasks);
  }

  private async queryDocument(idDocument: string, consecutive: number): Promise<Com208MovementRecord[]> {
    const prm = {
      MOVIMIENTOS: [
        { CAMPO: 'ID_DOCUMENTO', EXPRESION: idDocument, TABLA: this.tableBase },
        { CAMPO: 'CONSECUTIVO', EXPRESION: String(consecutive), TABLA: this.tableBase }
      ]
    };
    const response = await firstValueFrom(this.service.query(Com208Action.Query, prm));
    return this.business.decode<Com208MovementRecord>(response);
  }

  // ================= Utilidades =================

  money(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.spec('FORMATO MONEDA')?.FORMATO || '#,##0.00');
  }

  private ensureOption(target: typeof this.origins, key: 'ID_UN_ORIGEN' | 'ID_UN_DESTINO', value: string, label?: string): void {
    if (!value || target().some(row => row[key] === value)) return;
    target.update(rows => [...rows, { [key]: value, DESCRIPCION: label ?? value } as Com208Warehouse]);
  }

  private todayDate(): string {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  private disableFormControls(): void {
    this.form.disable({ emitEvent: false });
  }

  private enableFormControls(isNew = false): void {
    this.form.enable({ emitEvent: false });
    const locked: (keyof typeof this.form.controls)[] = [
      'MOVIMIENTO', 'TIPO', 'TIPO_INVENTARIO', 'ESTADO', 'FECHA_REGISTRO', 'USUARIO', 'SUB_TOTAL', 'TOTAL'
    ];
    locked.forEach(name => this.form.controls[name].disable({ emitEvent: false }));
    if (!isNew) this.form.controls.DOCUMENTO.disable({ emitEvent: false });
  }

  private focusFirstControl(): void {
    setTimeout(() => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const input = Array.from(host.querySelectorAll<HTMLInputElement>('.com-208__form input:not([type="hidden"])'))
        .find(el => el.offsetParent !== null && !el.disabled && !el.readOnly && !el.closest('.dx-state-readonly, .dx-state-disabled'));
      input?.focus();
    }, 150);
  }

  private clearForm(): void {
    this.form.reset({
      ...Com208DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_VENCIMIENTO: this.todayDate()
    }, { emitEvent: false });
    this.setItems([]);
  }

  private showError(err: unknown): void {
    this.notification.error(err instanceof Error ? err.message : 'Ocurrió un error en la operación.');
  }

  private warnNoMatrix(err: unknown): void {
    const message = err instanceof Error ? err.message : 'No se pudieron cargar los materiales de la matriz';
    this.notification.warning(`${message}. Puede agregar los materiales manualmente con "+ Agregar material".`);
  }
}
