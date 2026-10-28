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
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
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
  XteinNumberComponent,
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
  XteinGroupLabelComponent,
  XteinExcelExportService,
  XteinExportScope,
  XteinRecordExportComponent
} from '@xtein/ui';

import {
  Pro039Action,
  Pro039Application,
  Pro039ToolbarCapabilities
} from './constants/pro-039.constants';

import {
  Pro039DefaultRecord,
  Pro039DestinationColumns,
  Pro039OriginColumns,
  Pro039ProductColumns,
  Pro039ComponentColumns,
  Pro039RecordViewColumns,
  Pro039SectionColumns
} from './constants/pro-039-ui.constants';

import {
  Pro039ConsumptionProduct,
  Pro039MovementGrav,
  Pro039MovementItem,
  Pro039MovementRecord,
  Pro039Presentation,
  Pro039Total
} from './models/pro-039.model';

import {
  Pro039Header,
  Pro039Lookup,
  Pro039Warehouse
} from './models/pro-039-business.model';

import { Pro039Service } from './services/pro-039.service';
import { Pro039BusinessService } from './services/pro-039-business.service';
import { Pro039ExcelHeader, pro039ConsumptionWorkbook, pro039ConsumptionsWorkbook } from './constants/pro-039-excel.constants';
import { Pro039ItemsComponent } from './components/pro-039-items/pro-039-items.component';

/**
 * PRO-039 Consumos: salidas de inventario de tipo CONSUMO de producción.
 * Migrado de Legacy modulos/PRO039 (PRO03901 materiales, PRO03902 origen/destino, PRO03905 totales).
 * PRO03904 (entrada por orden de compra) no aplica a consumos.
 */
@Component({
  selector: 'pro-039',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    XteinInputComponent,
    XteinNumberComponent,
    XteinLabelComponent,
    XteinDateComponent,
    XteinLookupComponent,
    XteinRecordViewComponent,
    XteinRecordFilterComponent,
    XteinRecordReportsComponent,
    XteinLoadingComponent,
    XteinGroupLabelComponent,
    Pro039ItemsComponent,
    XteinRecordExportComponent
  ],
  providers: [
    Pro039Service,
    Pro039BusinessService
  ],
  templateUrl: './pro-039.component.html',
  styleUrls: ['./pro-039.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Pro039Component implements OnInit, OnDestroy {
  readonly applicationId = Pro039Application.Id;
  readonly tableBase = Pro039Application.Table;

  readonly viewColumns: XteinRecordViewColumn[] = [...Pro039RecordViewColumns];
  readonly productColumns = Pro039ProductColumns;
  readonly componentColumns = Pro039ComponentColumns;
  readonly sectionColumns = Pro039SectionColumns;
  readonly originColumns = Pro039OriginColumns;
  readonly destinationColumns = Pro039DestinationColumns;

  // Estado
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Pro039MovementRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly busy = signal<boolean>(false);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);

  // Detalle
  readonly items = signal<Pro039MovementItem[]>([]);
  readonly taxes = signal<Pro039MovementGrav[]>([]);
  readonly totals = signal<Pro039Total[]>([]);

  // Catálogos
  readonly documents = signal<Pro039Lookup[]>([]);
  readonly products = signal<Pro039Lookup[]>([]);
  readonly sections = signal<Pro039Lookup[]>([]);
  /** Productos del consumo: varios, todos en la misma sección. */
  readonly consumptionProducts = signal<Pro039ConsumptionProduct[]>([]);
  /** Productos que componen cada juego (clase Juego), por código del juego. */
  readonly productComponents = signal<Record<string, Pro039Lookup[]>>({});
  /** Valor del selector "Agregar producto" (se limpia al agregarlo). */
  readonly productToAdd = signal<string | null>(null);
  /** Fila nueva abierta en la tabla de productos (botón +). */
  readonly addingProduct = signal(false);
  /** Juego al que se le está agregando un componente (fila nueva debajo del juego). */
  readonly addingComponentFor = signal<string | null>(null);
  readonly componentToAdd = signal<string | null>(null);
  readonly origins = signal<Pro039Warehouse[]>([]);
  readonly destinations = signal<Pro039Warehouse[]>([]);
  readonly itemProducts = signal<Pro039Lookup[]>([]);
  readonly itemProductsLoading = signal<boolean>(false);
  /** ITEM de los materiales agregados cuyos datos (precio, presentación) aún se están consultando. */
  readonly pendingProducts = signal<number[]>([]);
  readonly specifications = signal<Pro039Lookup[]>([]);

  // Ventanas
  readonly filterVisible = signal<boolean>(false);
  readonly viewVisible = signal<boolean>(false);
  readonly reportsVisible = signal<boolean>(false);
  readonly exportVisible = signal<boolean>(false);

  spec(name: string): Pro039Lookup | undefined {
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
  header(): Pro039Header {
    return this.form.getRawValue() as Pro039Header;
  }

  itemsReady(): boolean {
    const h = this.header();
    return !!(h.DOCUMENTO && h.ID_UN_ORIGEN && h.ID_UN_DESTINO);
  }

  itemRecordKey(): string {
    const h = this.header();
    return this.isNew() ? 'new' : `${h.ID_DOCUMENTO || ''}_${h.CONSECUTIVO || 0}`;
  }

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
    MOVIMIENTO: new FormControl<string>(Pro039Application.Movement),
    TIPO: new FormControl<string>(Pro039Application.Type),
    TIPO_INVENTARIO: new FormControl<string>(Pro039Application.InventoryType),
    TIPO_COMPRA: new FormControl<string>('CONTADO'),
    PRODUCTO: new FormControl<string>('', [Validators.required]),
    SECCION: new FormControl<string>(''),
    COMPONENTE: new FormControl<string>(''),
    CANTIDAD_LOTE: new FormControl<number>(1, [Validators.required, Validators.min(0.0001)]),
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
    private readonly service: Pro039Service,
    readonly business: Pro039BusinessService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService,
    private readonly excel: XteinExcelExportService,
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
        this.exportVisible.set(false);
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

    // Sección: primero se elige; al cambiarla se recargan los materiales de los productos ya agregados
    this.subscriptions.add(
      this.form.controls.SECCION.valueChanges.subscribe(section => {
        if (!this.readOnly()) void this.onSectionChanged(section ?? '');
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
      capabilities: Pro039ToolbarCapabilities,
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
      case ToolbarAction.Download:
        this.exportVisible.set(true);
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
    this.consumptionProducts.set([]);
    this.cancelAddProduct();
    void this.loadSections();

    // Documentos de PRO-039 de las sedes del usuario (SC100, SC101, SC102) con su consecutivo siguiente
    try {
      this.documents.set(await this.business.catalog('documents', this.documentsFilter(), true));
    } catch (error) {
      this.showError(error);
    }

    this.form.reset({
      ...Pro039DefaultRecord,
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
    if (this.pendingProducts().length > 0) {
      this.notification.warning('Espere a que terminen de cargarse los materiales agregados.');
      return;
    }
    this.form.markAllAsTouched();
    const headerData: Pro039Header = {
      ...this.header(),
      MOVIMIENTO: Pro039Application.Movement,
      TIPO: Pro039Application.Type,
      ID_APLICACION: Pro039Application.Id
    };
    const validationError = this.business.validate(headerData, this.items(), this.consumptionProducts());
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
        // Productos del consumo (MOVIMIENTOS_PRO_PRODUCTOS); el encabezado lleva el primero
        PRODUCTOS: this.consumptionProducts().map(p => ({ ITEM: p.ITEM, PRODUCTO: p.PRODUCTO, COMPONENTE: p.COMPONENTE || '', CANTIDAD_LOTE: Number(p.CANTIDAD_LOTE) || 1 })),
        ID_APLICACION: Pro039Application.Id,
        USUARIO: this.business.identity.USUARIO
      };
      const response = await firstValueFrom(this.service.save(Pro039Action.New, payload));
      const saved = this.business.decode<Pro039MovementRecord & { MsgAccion?: string }>(response)[0];

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
        ID_APLICACION: Pro039Application.Id,
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
    this.cancelAddProduct();
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
      ...Pro039DefaultRecord,
      ...record,
      DOCUMENTO: documentLabel,
      SECCION: String(record.ID_SECCION ?? record.SECCION ?? ''),
      COMPONENTE: String(record.PRODUCTO_COMPONENTE ?? record.COMPONENTE ?? ''),
      CANTIDAD_LOTE: Number(record.CANTIDAD_LOTE ?? 1) || 1,
      FECHA: record.FECHA ? String(record.FECHA).slice(0, 10) : null,
      FECHA_REGISTRO: record.FECHA_REGISTRO ? String(record.FECHA_REGISTRO).slice(0, 10) : null,
      FECHA_VENCIMIENTO: record.FECHA_VENCIMIENTO ? String(record.FECHA_VENCIMIENTO).slice(0, 10) : null
    }, { emitEvent: false });

    this.setItems([]);
    this.workspace.setDirty(this.applicationId, false);
    // Mientras llega el detalle se muestra el producto del encabezado; el detalle trae todos
    this.consumptionProducts.set(record.PRODUCTO ? [this.productFrom({
      ITEM: 1,
      PRODUCTO: record.PRODUCTO,
      COMPONENTE: String(record.PRODUCTO_COMPONENTE ?? ''),
      CANTIDAD_LOTE: Number(record.CANTIDAD_LOTE ?? 1) || 1
    })] : []);
    void this.loadSections();
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
    const rec = record as Pro039MovementRecord;
    const idx = this.records().findIndex(r => r.ID_DOCUMENTO === rec?.ID_DOCUMENTO && r.CONSECUTIVO === rec?.CONSECUTIVO);
    if (idx >= 0) this.selectRecordIndex(idx);
  }

  async searchRecords(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    this.busy.set(true);
    try {
      const response = await firstValueFrom(this.service.query(Pro039Action.Query, { MOVIMIENTOS: result?.ESTRUCTURA ?? [] }));
      const found = this.business.decode<Pro039MovementRecord>(response);
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

  /** "UM Pres." elegida en la grilla: actualiza la equivalencia y la cantidad que descuenta el kárdex. */
  async onPresentationChanged(change: { item: number; presentation: Pro039Presentation | null }): Promise<void> {
    if (this.readOnly()) return;
    const list = this.items().map(row => row.ITEM === change.item ? this.business.withPresentation(row, change.presentation) : row);
    await this.applyItems(list);
  }

  /**
   * La fila aparece al instante con el código y nombre de la lista; precio y presentación
   * ('EXISTENCIAS PRODUCTO') se completan después sin bloquear la pantalla.
   */
  /** Material agregado a mano a un producto del consumo: queda registrado como de ese producto. */
  async addProduct(change: { material: string; line: number }): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    const product = change.material;
    const consumptionProduct = this.consumptionProducts().find(p => p.ITEM === change.line);
    if (!consumptionProduct) return;
    if (this.items().some(row => row.PRODUCTO === product && row.ITEM_PRODUCTO === consumptionProduct.ITEM)) {
      this.notification.warning(`El material ${product} ya está en ${consumptionProduct.COMPONENTE || consumptionProduct.PRODUCTO}.`);
      return;
    }
    const next = this.items().reduce((max, row) => Math.max(max, row.ITEM), 0) + 1;
    const name = String(this.itemProducts().find(p => p.PRODUCTO === product)?.NOMBRE ?? '');
    this.setItems([...this.items(), this.business.pendingItem(product, name, next, consumptionProduct)]);
    this.workspace.setDirty(this.applicationId, true);
    this.pendingProducts.update(list => [...list, next]);
    try {
      const row = await this.business.productItem(product, this.header(), next, consumptionProduct);
      // Conserva la cantidad que el usuario haya escrito mientras cargaba
      this.setItems(this.items().map(current => current.ITEM === next
        ? this.business.withQuantity(row, Number(current.CANTIDAD || 0))
        : current));
    } catch (error) {
      this.setItems(this.items().filter(current => current.ITEM !== next));
      this.showError(error);
    } finally {
      this.pendingProducts.update(list => list.filter(item => item !== next));
    }
  }

  async removeItems(itemNumbers: number[]): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    const removable = this.items().filter(row => itemNumbers.includes(row.ITEM)).map(row => row.ITEM);
    if (removable.length === 0) return;
    const answer = await Swal.fire({
      text: '¿Desea eliminar los materiales seleccionados?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!answer.isConfirmed) return;
    await this.applyItems(this.items().filter(row => !removable.includes(row.ITEM)));
  }

  /** Aplica la lista de materiales y liquida gravámenes/totales (como Legacy al cargar o editar ítems). */
  private async applyItems(list: Pro039MovementItem[]): Promise<void> {
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

  private setItems(list: Pro039MovementItem[]): void {
    this.items.set(list);
    const total = list.reduce((sum, row) => sum + Number(row.TOTAL || 0), 0);
    const subtotal = list.reduce((sum, row) => sum + Number(row.SUB_TOTAL || 0), 0);
    this.form.patchValue({ SUB_TOTAL: subtotal, TOTAL: total }, { emitEvent: false });
    if (list.length === 0) {
      this.taxes.set([]);
      this.totals.set([]);
    }
  }

  // ================= Productos del consumo =================

  /**
   * Los productos se conservan al cambiar la sección (la lista ofrece todos, tengan o no matriz en ella):
   * solo se vuelven a cargar sus materiales de la nueva sección.
   */
  private async onSectionChanged(section: string): Promise<void> {
    if (!section) {
      this.setItems(this.items().filter(row => !row.ES_MATRIZ));
      return;
    }
    await this.loadMaterials();
  }

  /** Botón +: abre una fila para elegir el producto (se puede repetir para agregar varios). */
  beginAddProduct(): void {
    if (this.readOnly() || this.busy() || !this.form.controls.SECCION.value) return;
    this.productToAdd.set(null);
    this.addingProduct.set(true);
  }

  cancelAddProduct(): void {
    this.addingProduct.set(false);
    this.productToAdd.set(null);
    this.addingComponentFor.set(null);
    this.componentToAdd.set(null);
  }

  async addConsumptionProduct(code: string | null): Promise<void> {
    const product = String(code ?? '');
    if (!product) return;
    this.cancelAddProduct();
    if (this.readOnly() || this.busy()) return;
    if (this.consumptionProducts().some(p => p.PRODUCTO === product)) {
      this.notification.warning(`El producto ${product} ya está en el consumo.`);
      return;
    }
    const next = this.consumptionProducts().reduce((max, p) => Math.max(max, p.ITEM), 0) + 1;
    const added = this.productFrom({ ITEM: next, PRODUCTO: product, COMPONENTE: '' });
    this.consumptionProducts.update(list => [...list, added]);
    this.syncHeaderProduct();
    this.workspace.setDirty(this.applicationId, true);
    if (added.ES_JUEGO) void this.loadComponents(product);
    await this.loadMaterials();
  }

  /** Componente de un juego: sus materiales salen solo de la matriz de ese componente (vacío = todo el juego). */
  async setProductComponent(item: number, component: string | null): Promise<void> {
    if (this.readOnly()) return;
    const value = String(component ?? '');
    const current = this.consumptionProducts().find(p => p.ITEM === item);
    if (!current || current.COMPONENTE === value) return;
    if (this.consumptionProducts().some(p => p.ITEM !== item && p.PRODUCTO === current.PRODUCTO && p.COMPONENTE === value)) {
      this.notification.warning(value ? `El componente ${value} ya está en ${current.PRODUCTO}.` : `${current.PRODUCTO} ya tiene la línea "Todo el juego".`);
      return;
    }
    const name = String(this.componentsOf(current.PRODUCTO).find(c => c.PRODUCTO === value)?.NOMBRE ?? '');
    this.consumptionProducts.update(list => list.map(p => p.ITEM === item ? { ...p, COMPONENTE: value, NOMBRE_COMPONENTE: name } : p));
    this.syncHeaderProduct();
    await this.loadMaterials();
  }

  /** Lote de un producto: sus materiales de la matriz recalculan la cantidad (unitario x lote) sin volver a consultar. */
  async setProductLot(item: number, value: number | null): Promise<void> {
    if (this.readOnly()) return;
    const lot = Number(value);
    const current = this.consumptionProducts().find(p => p.ITEM === item);
    if (!current || !(lot > 0) || lot === current.CANTIDAD_LOTE) return;
    this.consumptionProducts.update(list => list.map(p => p.ITEM === item ? { ...p, CANTIDAD_LOTE: lot } : p));
    this.syncHeaderProduct();
    await this.applyItems(this.items().map(row => this.business.withProductLot(row, current.ITEM, lot)));
  }

  /** Quita una línea (producto o componente del juego) con todos sus materiales (de su matriz y agregados a mano). */
  async removeConsumptionProduct(item: number): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    const removed = this.consumptionProducts().find(p => p.ITEM === item);
    if (!removed) return;
    if (this.items().some(row => !row.ES_MATRIZ && row.ITEM_PRODUCTO === removed.ITEM)) {
      const label = removed.COMPONENTE ? `${removed.PRODUCTO} / ${removed.COMPONENTE}` : removed.PRODUCTO;
      const answer = await Swal.fire({
        text: `${label} tiene materiales agregados a mano. ¿Desea quitarlo con todos sus materiales?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Quitar',
        cancelButtonText: 'Cancelar'
      });
      if (!answer.isConfirmed) return;
    }
    this.setItems(this.items().filter(row => row.ITEM_PRODUCTO !== removed.ITEM));
    this.consumptionProducts.update(list => list.filter(p => p.ITEM !== item));
    this.syncHeaderProduct();
    await this.loadMaterials();
  }

  componentsOf(product: string): Pro039Lookup[] {
    return this.productComponents()[product] ?? [];
  }

  /** Líneas agrupadas por producto, en el orden en que se agregaron (un juego reúne sus componentes). */
  productGroups(): { PRODUCTO: string; NOMBRE: string; ES_JUEGO: boolean; lines: Pro039ConsumptionProduct[] }[] {
    const groups = new Map<string, { PRODUCTO: string; NOMBRE: string; ES_JUEGO: boolean; lines: Pro039ConsumptionProduct[] }>();
    for (const line of this.consumptionProducts()) {
      const group = groups.get(line.PRODUCTO) ?? { PRODUCTO: line.PRODUCTO, NOMBRE: line.NOMBRE, ES_JUEGO: line.ES_JUEGO, lines: [] };
      group.lines.push(line);
      groups.set(line.PRODUCTO, group);
    }
    return [...groups.values()];
  }

  componentLabel(line: Pro039ConsumptionProduct): string {
    const name = line.NOMBRE_COMPONENTE || String(this.componentsOf(line.PRODUCTO).find(c => c.PRODUCTO === line.COMPONENTE)?.NOMBRE ?? '');
    return name ? `${line.COMPONENTE} - ${name}` : line.COMPONENTE;
  }

  /** "+ Componente" de un juego: abre una fila para elegir otro componente (cada uno con su cantidad). */
  beginAddComponent(product: string): void {
    if (this.readOnly() || this.busy()) return;
    this.componentToAdd.set(null);
    this.addingComponentFor.set(product);
    void this.loadComponents(product);
  }

  cancelAddComponent(): void {
    this.addingComponentFor.set(null);
    this.componentToAdd.set(null);
  }

  /**
   * Agrega un componente al juego. Si el juego estaba como "Todo el juego" (una sola línea sin componente),
   * esa línea pasa a ser la del componente; si no, se crea una línea nueva con cantidad 1.
   */
  async addComponentLine(product: string, component: string | null): Promise<void> {
    const value = String(component ?? '');
    if (!value) return;
    this.cancelAddComponent();
    if (this.readOnly() || this.busy()) return;
    const lines = this.consumptionProducts().filter(p => p.PRODUCTO === product);
    if (lines.some(p => p.COMPONENTE === value)) {
      this.notification.warning(`El componente ${value} ya está en ${product}.`);
      return;
    }
    const whole = lines.length === 1 && !lines[0].COMPONENTE ? lines[0] : null;
    if (whole) {
      await this.setProductComponent(whole.ITEM, value);
      return;
    }
    const name = String(this.componentsOf(product).find(c => c.PRODUCTO === value)?.NOMBRE ?? '');
    const next = this.consumptionProducts().reduce((max, p) => Math.max(max, p.ITEM), 0) + 1;
    const added = this.productFrom({ ITEM: next, PRODUCTO: product, COMPONENTE: value, NOMBRE_COMPONENTE: name });
    // La línea nueva va junto a las demás del mismo juego
    const list = [...this.consumptionProducts()];
    const lastIndex = list.map(p => p.PRODUCTO).lastIndexOf(product);
    list.splice(lastIndex + 1, 0, added);
    this.consumptionProducts.set(list);
    this.syncHeaderProduct();
    this.workspace.setDirty(this.applicationId, true);
    await this.loadMaterials();
  }

  /** Quita el juego (o producto) con todas sus líneas y sus materiales. */
  async removeProduct(product: string): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    const lines = this.consumptionProducts().filter(p => p.PRODUCTO === product).map(p => p.ITEM);
    if (this.items().some(row => !row.ES_MATRIZ && lines.includes(Number(row.ITEM_PRODUCTO)))) {
      const answer = await Swal.fire({
        text: `${product} tiene materiales agregados a mano. ¿Desea quitarlo con todos sus componentes y materiales?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Quitar',
        cancelButtonText: 'Cancelar'
      });
      if (!answer.isConfirmed) return;
    }
    this.setItems(this.items().filter(row => !lines.includes(Number(row.ITEM_PRODUCTO))));
    this.consumptionProducts.update(list => list.filter(p => p.PRODUCTO !== product));
    this.syncHeaderProduct();
    await this.loadMaterials();
  }

  /** Producto del consumo con su nombre y si es juego, tomados de los catálogos cargados. */
  private productFrom(values: Partial<Pro039ConsumptionProduct> & Pick<Pro039ConsumptionProduct, 'ITEM' | 'PRODUCTO'>): Pro039ConsumptionProduct {
    const row = this.products().find(p => p.PRODUCTO === values.PRODUCTO);
    return {
      NOMBRE: String(row?.NOMBRE ?? ''),
      ES_JUEGO: !!row?.ES_JUEGO,
      COMPONENTE: '',
      CANTIDAD_LOTE: 1,
      ...values
    };
  }

  /** MOVIMIENTOS_PRO.PRODUCTO / PRODUCTO_COMPONENTE / CANTIDAD_LOTE guardan el primer producto (consultas y reportes anteriores). */
  private syncHeaderProduct(): void {
    const first = this.consumptionProducts()[0];
    this.form.patchValue({
      PRODUCTO: first?.PRODUCTO ?? '',
      COMPONENTE: first?.COMPONENTE ?? '',
      CANTIDAD_LOTE: first?.CANTIDAD_LOTE ?? 1
    }, { emitEvent: false });
  }

  private async loadComponents(product: string): Promise<void> {
    if (!product || this.productComponents()[product]) return;
    try {
      const rows = await this.business.catalog('components', { PRODUCTO: product, ...this.business.identity });
      const list = rows.map(row => ({ ...row, PRODUCTO: String(row.PRODUCTO ?? ''), LABEL: this.label(row.PRODUCTO, row.NOMBRE) }));
      this.productComponents.update(map => ({ ...map, [product]: list }));
    } catch (error) {
      this.warnNoMatrix(error);
    }
  }

  /** Secciones marcadas como "Asignable materiales" (se elige la sección antes que los productos). */
  private async loadSections(): Promise<void> {
    if (this.sections().length) return;
    try {
      const rows = await this.business.catalog('sections', { PRODUCTO: '', COMPONENTE: '', ...this.business.identity });
      this.sections.set(rows.map(row => ({
        ...row,
        ID_SECCION: String(row.ID_SECCION ?? ''),
        NOMBRE_SECCION: String(row.NOMBRE_SECCION ?? ''),
        LABEL: this.label(row.ID_SECCION, row.NOMBRE_SECCION)
      })));
    } catch (error) {
      this.sections.set([]);
      this.showError(error);
    }
  }

  /**
   * Materiales de la matriz de todos los productos en la sección (el mismo material de varios productos
   * llega sumado, con su origen). Los agregados a mano se conservan.
   */
  private async loadMaterials(): Promise<void> {
    const h = this.header();
    const products = this.consumptionProducts();
    // Los agregados a mano se conservan si su producto sigue en el consumo
    const manual = this.items().filter(row => !row.ES_MATRIZ && products.some(p => p.ITEM === row.ITEM_PRODUCTO));
    if (!products.length || !h.SECCION) {
      await this.applyItems(manual);
      return;
    }
    this.busy.set(true);
    try {
      const materials = await this.business.materials(products, h.SECCION, String(h.ID_UN_ORIGEN ?? ''));
      this.busy.set(false);
      if (!materials.length) throw new Error(`No hay materiales en la matriz de ${products.length > 1 ? 'los productos elegidos' : products[0].PRODUCTO} para la sección ${h.SECCION}`);
      // Los materiales de la matriz toman ITEM después de los agregados a mano, que conservan el suyo
      const offset = manual.reduce((max, row) => Math.max(max, row.ITEM), 0);
      await this.applyItems([...materials.map((row, index) => ({ ...row, ITEM: offset + index + 1 })), ...manual]);
      this.notification.success(`Se cargaron ${materials.length} material(es) de la matriz.`);
      // Los productos sin matriz en la sección se pueden dejar: sus materiales se agregan a mano
      const withMaterials = new Set(materials.map(row => row.ITEM_PRODUCTO));
      const without = products.filter(p => !withMaterials.has(p.ITEM)).map(p => p.COMPONENTE ? `${p.PRODUCTO} / ${p.COMPONENTE}` : p.PRODUCTO);
      if (without.length) {
        this.notification.warning(`Sin materiales en la matriz de la sección ${h.SECCION}: ${without.join(', ')}. Puede agregarlos manualmente con el + de cada producto.`);
      }
    } catch (error) {
      // Se quitan solo los de la matriz anterior: los agregados a mano se conservan
      this.setItems(manual);
      this.warnNoMatrix(error);
    } finally {
      this.busy.set(false);
    }
  }

  /** Lote del encabezado (el del primer producto): solo lo usan los consumos anteriores, de un producto. */
  lot(): number {
    const value = Number(this.form.controls.CANTIDAD_LOTE.value);
    return value > 0 ? value : 1;
  }

  async loadItemProducts(): Promise<void> {
    const h = this.header();
    if (!h.ID_UN_ORIGEN) {
      this.itemProducts.set([]);
      return;
    }
    this.itemProductsLoading.set(true);
    try {
      // Materiales (MA) activos ubicados en la bodega de origen
      this.itemProducts.set(await this.business.catalog('itemProducts', { ID_UN_ORIGEN: h.ID_UN_ORIGEN, ...this.business.identity }));
    } catch {
      this.itemProducts.set([]);
    } finally {
      this.itemProductsLoading.set(false);
    }
  }

  private async loadRecordDetail(record: Pro039MovementRecord): Promise<void> {
    try {
      const detail = await this.business.additional(record.ID_DOCUMENTO, record.CONSECUTIVO);
      if (this.currentRecord() !== record) return;
      const products = this.detailProducts(detail.PRODUCTOS);
      this.consumptionProducts.set(products);
      // Consumos anteriores (un producto, sin PRODUCTO_CONSUMO en los materiales): todos son de ese producto
      const single = products.length === 1 ? products[0] : null;
      const items = (detail.ITM_MOVIMIENTOS ?? []).map(row => ({
        ...row,
        PRODUCTO_CONSUMO: row.PRODUCTO_CONSUMO || single?.PRODUCTO || null,
        ITEM_PRODUCTO: Number(row.ITEM_PRODUCTO) || single?.ITEM || null,
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
      ID_APLICACION: Pro039Application.Id,
      MOVIMIENTO: Pro039Application.Movement,
      TIPO: Pro039Application.Type,
      USUARIO: this.business.identity.USUARIO
    };
  }

  private async loadCatalogs(): Promise<void> {
    const identity = this.business.identity;

    const tasks: Promise<void>[] = [
      this.business.catalog('documents', this.documentsFilter(), true)
        .then(docs => this.documents.set(docs))
        .catch(error => console.warn('PRO-039 documentos:', error)),

      // Igual que Legacy: el tipo CONSUMO debe estar autorizado para el usuario en las salidas
      this.business.catalog<Pro039Lookup>('types', { MOVIMIENTO: Pro039Application.Movement, ID_APLICACION: 'COM-205', USUARIO: identity.USUARIO })
        .then(types => {
          if (!types.some(t => String(t['TIPO'] ?? '').toUpperCase() === Pro039Application.Type)) {
            this.notification.warning('El usuario no tiene autorizado el tipo de salida CONSUMO.');
          }
        })
        .catch(error => this.notification.warning(error instanceof Error ? error.message : 'No fue posible validar el tipo CONSUMO.')),

      this.business.catalog<{ ORIGEN?: Pro039Warehouse[]; DESTINO?: Pro039Warehouse[] }>('warehouses', {
        MOVIMIENTOS: { MOVIMIENTO: Pro039Application.Movement, TIPO: Pro039Application.Type, USUARIO: identity.USUARIO }
      }).then(rows => {
        this.origins.set((rows[0]?.ORIGEN ?? []).map(r => ({ ...r, ID_UN_ORIGEN: String(r.ID_UN_ORIGEN ?? '') })));
        this.destinations.set((rows[0]?.DESTINO ?? []).map(r => ({ ...r, ID_UN_DESTINO: String(r.ID_UN_DESTINO ?? '') })));
      }).catch(error => console.warn('PRO-039 bodegas:', error)),

      this.business.catalog('products', identity)
        .then(rows => this.products.set(rows.map(r => ({ ...r, PRODUCTO: String(r.PRODUCTO ?? ''), NOMBRE: String(r.NOMBRE ?? ''), LABEL: this.label(r.PRODUCTO, r.NOMBRE) }))))
        .catch(error => console.warn('PRO-039 productos:', error)),

      this.business.catalog('specifications', { ...identity, ID_APLICACION_BASE: '' })
        .then(specs => this.specifications.set(specs))
        .catch(() => this.specifications.set([]))
    ];
    await Promise.all(tasks);
  }

  private async queryDocument(idDocument: string, consecutive: number): Promise<Pro039MovementRecord[]> {
    const prm = {
      MOVIMIENTOS: [
        { CAMPO: 'ID_DOCUMENTO', EXPRESION: idDocument, TABLA: this.tableBase },
        { CAMPO: 'CONSECUTIVO', EXPRESION: String(consecutive), TABLA: this.tableBase }
      ]
    };
    const response = await firstValueFrom(this.service.query(Pro039Action.Query, prm));
    return this.business.decode<Pro039MovementRecord>(response);
  }

  // ================= Utilidades =================

  private ensureOption(target: typeof this.origins, key: 'ID_UN_ORIGEN' | 'ID_UN_DESTINO', value: string, label?: string): void {
    if (!value || target().some(row => row[key] === value)) return;
    target.update(rows => [...rows, { [key]: value, DESCRIPCION: label ?? value } as Pro039Warehouse]);
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
      const input = Array.from(host.querySelectorAll<HTMLInputElement>('.pro-039__form input:not([type="hidden"])'))
        .find(el => el.offsetParent !== null && !el.disabled && !el.readOnly && !el.closest('.dx-state-readonly, .dx-state-disabled'));
      input?.focus();
    }, 150);
  }

  private clearForm(): void {
    this.form.reset({
      ...Pro039DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_VENCIMIENTO: this.todayDate()
    }, { emitEvent: false });
    this.setItems([]);
    this.consumptionProducts.set([]);
    this.cancelAddProduct();
  }

  /** Productos que devuelve 'consulta adicionales' (los consumos anteriores traen solo el del encabezado). */
  private detailProducts(rows: Partial<Pro039ConsumptionProduct>[] | null | undefined): Pro039ConsumptionProduct[] {
    return (rows ?? []).map((row, index) => ({
      ITEM: Number(row.ITEM ?? index + 1),
      PRODUCTO: String(row.PRODUCTO ?? ''),
      NOMBRE: String(row.NOMBRE ?? ''),
      ES_JUEGO: row.ES_JUEGO === true || Number(row.ES_JUEGO) === 1,
      COMPONENTE: String(row.COMPONENTE ?? ''),
      NOMBRE_COMPONENTE: String(row.NOMBRE_COMPONENTE ?? ''),
      CANTIDAD_LOTE: Number(row.CANTIDAD_LOTE ?? 1) || 1
    })).filter(row => row.PRODUCTO);
  }

  /**
   * Exportar a Excel (ventana de exportación): el consumo actual o, como en los informes,
   * todos los consumos de la búsqueda.
   */
  async exportExcel(scope: XteinExportScope): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.busy()) return;
    const all = this.records();
    try {
      if (scope === 'actual') {
        await this.excel.export(pro039ConsumptionWorkbook(this.excelHeader({ ...record, ...this.header() }, this.lot(), this.consumptionProducts()), this.items()));
        this.exportVisible.set(false);
        return;
      }
      this.busy.set(true);
      const consumptions: { header: Pro039ExcelHeader; items: Pro039MovementItem[] }[] = [];
      // Materiales de cada consumo ('consulta adicionales'), de a 4 a la vez
      for (let i = 0; i < all.length; i += 4) {
        const block = await Promise.all(all.slice(i, i + 4).map(async row => {
          const detail = await this.business.additional(row.ID_DOCUMENTO, row.CONSECUTIVO);
          const items = (detail.ITM_MOVIMIENTOS ?? []).map(item => ({
            ...item,
            ES_MATRIZ: item.ES_MATRIZ === true || Number(item.ES_MATRIZ) === 1,
            CONSUMO_BASE: Number(item.CONSUMO_BASE ?? 0)
          }));
          return { header: this.excelHeader(row, Number(row.CANTIDAD_LOTE ?? 1) || 1, this.detailProducts(detail.PRODUCTOS)), items };
        }));
        consumptions.push(...block);
      }
      await this.excel.export(pro039ConsumptionsWorkbook(consumptions));
      this.exportVisible.set(false);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  /** Encabezado del consumo para el Excel, con código y nombre cuando están en los catálogos cargados. */
  private excelHeader(row: Partial<Pro039MovementRecord>, lot: number, products: Pro039ConsumptionProduct[]): Pro039ExcelHeader {
    const find = (list: Pro039Lookup[], key: string, value: unknown) => list.find(item => String(item[key] ?? '') === String(value ?? ''));
    const date = (value: unknown) => value ? String(value).slice(0, 10) : '';
    const section = row.SECCION || row.ID_SECCION || '';
    // Varios productos por consumo: "PF000005 - Cama..., JU000001 - Alcoba... (PF000010)"
    const productLabel = (p: Pro039ConsumptionProduct) =>
      `${this.label(p.PRODUCTO, p.NOMBRE)}${p.COMPONENTE ? ' / ' + p.COMPONENTE : ''} (cantidad ${p.CANTIDAD_LOTE})`;
    const componentLabel = (p: Pro039ConsumptionProduct) => p.COMPONENTE ? this.label(p.COMPONENTE, p.NOMBRE_COMPONENTE) : '';
    return {
      documento: String(row.DOCUMENTO || `${row.ID_DOCUMENTO ?? ''}-${row.CONSECUTIVO ?? ''}`),
      fecha: date(row.FECHA),
      fechaRegistro: date(row.FECHA_REGISTRO),
      estado: String(row.ESTADO ?? ''),
      movimiento: `${row.MOVIMIENTO ?? ''} ${row.TIPO ?? ''}`.trim(),
      usuario: String(row.USUARIO ?? ''),
      producto: products.length ? products.map(productLabel).join(', ') : String(find(this.products(), 'PRODUCTO', row.PRODUCTO)?.LABEL ?? row.PRODUCTO ?? ''),
      componente: products.map(componentLabel).filter(Boolean).join(', '),
      seccion: String(find(this.sections(), 'ID_SECCION', section)?.LABEL ?? section),
      lote: lot,
      lotes: Object.fromEntries(products.map(p => [String(p.ITEM), Number(p.CANTIDAD_LOTE) || 1])),
      lineas: Object.fromEntries(products.map(p => [String(p.ITEM), p.COMPONENTE ? `${p.PRODUCTO} / ${p.COMPONENTE}` : p.PRODUCTO])),
      origen: String(row.ORIGEN ?? row.ID_UN_ORIGEN ?? ''),
      destino: String(row.DESTINO ?? row.ID_UN_DESTINO ?? ''),
      observacion: String(row.DETALLE ?? '')
    };
  }

  private label(code: unknown, name: unknown): string {
    const c = String(code ?? '');
    const n = String(name ?? '');
    return n ? `${c} - ${n}` : c;
  }

  private showError(err: unknown): void {
    this.notification.error(err instanceof Error ? err.message : 'Ocurrió un error en la operación.');
  }

  private warnNoMatrix(err: unknown): void {
    const message = err instanceof Error ? err.message : 'No se pudieron cargar los materiales de la matriz';
    this.notification.warning(`${message}. Puede agregar los materiales manualmente con el + de cada producto.`);
  }
}
