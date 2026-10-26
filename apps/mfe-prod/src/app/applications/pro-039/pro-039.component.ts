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
  XteinGroupLabelComponent
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
  Pro039MovementGrav,
  Pro039MovementItem,
  Pro039MovementRecord,
  Pro039Total
} from './models/pro-039.model';

import {
  Pro039Header,
  Pro039Lookup,
  Pro039Warehouse
} from './models/pro-039-business.model';

import { Pro039Service } from './services/pro-039.service';
import { Pro039BusinessService } from './services/pro-039-business.service';
import { Pro039ExcelHeader, Pro039ExcelService } from './services/pro-039-excel.service';
import { Pro039ItemsComponent } from './components/pro-039-items/pro-039-items.component';
import { Pro039ExportScope, Pro039ExportComponent } from './components/pro-039-export/pro-039-export.component';

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
    Pro039ExportComponent
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
  /** Productos que componen el juego (solo si el producto es un JU). */
  readonly components = signal<Pro039Lookup[]>([]);
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
    private readonly excel: Pro039ExcelService,
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

    // Producto de producción: si es un juego, carga sus componentes; recarga las secciones
    this.subscriptions.add(
      this.form.controls.PRODUCTO.valueChanges.subscribe(product => {
        if (this.readOnly()) return;
        this.form.patchValue({ SECCION: '', COMPONENTE: '' }, { emitEvent: false });
        this.setItems([]);
        void this.loadComponents(product ?? '');
        void this.loadSections(product ?? '', '');
      })
    );

    // Componente del juego: la matriz sale solo de ese producto
    this.subscriptions.add(
      this.form.controls.COMPONENTE.valueChanges.subscribe(component => {
        if (this.readOnly()) return;
        void this.loadSections(this.form.controls.PRODUCTO.value ?? '', component ?? '')
          .then(() => this.form.controls.SECCION.value ? this.loadMaterials() : undefined);
      })
    );

    // Sección: carga los materiales de la matriz
    this.subscriptions.add(
      this.form.controls.SECCION.valueChanges.subscribe(() => {
        if (!this.readOnly()) void this.loadMaterials();
      })
    );

    // Cantidad del lote: recalcula el consumo de los materiales de la matriz (unitario x lote)
    this.subscriptions.add(
      this.form.controls.CANTIDAD_LOTE.valueChanges.subscribe(() => {
        if (!this.readOnly()) void this.applyLot();
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
    this.sections.set([]);
    this.components.set([]);

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
    // Para mostrar código y nombre de la sección y del componente guardados
    const component = String(record.PRODUCTO_COMPONENTE ?? '');
    void this.loadComponents(record.PRODUCTO);
    void this.loadSections(record.PRODUCTO, component);
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

  /**
   * La fila aparece al instante con el código y nombre de la lista; precio y presentación
   * ('EXISTENCIAS PRODUCTO') se completan después sin bloquear la pantalla.
   */
  async addProduct(product: string): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    if (this.items().some(row => row.PRODUCTO === product)) {
      this.notification.warning(`El material ${product} ya está en el consumo.`);
      return;
    }
    const next = this.items().reduce((max, row) => Math.max(max, row.ITEM), 0) + 1;
    const name = String(this.itemProducts().find(p => p.PRODUCTO === product)?.NOMBRE ?? '');
    this.setItems([...this.items(), this.business.pendingItem(product, name, next)]);
    this.workspace.setDirty(this.applicationId, true);
    this.pendingProducts.update(list => [...list, next]);
    try {
      const row = await this.business.productItem(product, this.header(), next);
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

  /** Producto JU: el consumo se puede hacer por uno de los productos que lo componen. */
  isJuego(): boolean {
    const product = this.form.controls.PRODUCTO.value ?? '';
    const row = this.products().find(p => p.PRODUCTO === product);
    return row ? !!row.ES_JUEGO : product.toUpperCase().startsWith('JU');
  }

  private async loadComponents(product: string): Promise<void> {
    this.components.set([]);
    if (!product || !product.toUpperCase().startsWith('JU')) return;
    try {
      const rows = await this.business.catalog('components', { PRODUCTO: product, ...this.business.identity });
      this.components.set(rows.map(row => ({ ...row, PRODUCTO: String(row.PRODUCTO ?? ''), LABEL: this.label(row.PRODUCTO, row.NOMBRE) })));
    } catch (error) {
      this.warnNoMatrix(error);
    }
  }

  /** Secciones marcadas como "Asignable materiales"; MATRIZ indica si el producto tiene materiales en ella. */
  private async loadSections(product: string, component: string): Promise<void> {
    if (!product) {
      this.sections.set([]);
      return;
    }
    try {
      const rows = await this.business.catalog('sections', { PRODUCTO: product, COMPONENTE: component, ...this.business.identity });
      this.sections.set(rows.map(row => ({
        ...row,
        ID_SECCION: String(row.ID_SECCION ?? ''),
        NOMBRE_SECCION: String(row.NOMBRE_SECCION ?? ''),
        LABEL: this.label(row.ID_SECCION, row.NOMBRE_SECCION),
        MATRIZ: row.TIENE_MATRIZ ? 'Sí' : ''
      })));
    } catch (error) {
      this.sections.set([]);
      this.showError(error);
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
      const materials = await this.business.materials(h.PRODUCTO, h.SECCION, String(h.ID_UN_ORIGEN ?? ''), String(h.COMPONENTE ?? ''), this.lot());
      this.busy.set(false);
      if (!materials.length) throw new Error(`No hay materiales en la matriz para ${h.COMPONENTE || h.PRODUCTO}`);
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

  /** Cantidad del lote (1 si está vacía o no es válida). */
  lot(): number {
    const value = Number(this.form.controls.CANTIDAD_LOTE.value);
    return value > 0 ? value : 1;
  }

  private async applyLot(): Promise<void> {
    const lot = this.lot();
    if (!this.items().some(row => row.ES_MATRIZ)) return;
    await this.applyItems(this.items().map(row => row.ES_MATRIZ
      ? this.business.withQuantity(row, Number(row.CONSUMO_BASE || 0) * lot)
      : row));
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
  }

  /**
   * Exportar a Excel (ventana de exportación): el consumo actual o, como en los informes,
   * todos los consumos de la búsqueda.
   */
  async exportExcel(scope: Pro039ExportScope): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.busy()) return;
    const all = this.records();
    try {
      if (scope === 'actual') {
        await this.excel.export(this.excelHeader({ ...record, ...this.header() }, this.lot()), this.items());
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
          return { header: this.excelHeader(row, Number(row.CANTIDAD_LOTE ?? 1) || 1), items };
        }));
        consumptions.push(...block);
      }
      await this.excel.exportMany(consumptions);
      this.exportVisible.set(false);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  /** Encabezado del consumo para el Excel, con código y nombre cuando están en los catálogos cargados. */
  private excelHeader(row: Partial<Pro039MovementRecord>, lot: number): Pro039ExcelHeader {
    const find = (list: Pro039Lookup[], key: string, value: unknown) => list.find(item => String(item[key] ?? '') === String(value ?? ''));
    const date = (value: unknown) => value ? String(value).slice(0, 10) : '';
    const section = row.SECCION || row.ID_SECCION || '';
    const component = row.COMPONENTE || row.PRODUCTO_COMPONENTE || '';
    return {
      documento: String(row.DOCUMENTO || `${row.ID_DOCUMENTO ?? ''}-${row.CONSECUTIVO ?? ''}`),
      fecha: date(row.FECHA),
      fechaRegistro: date(row.FECHA_REGISTRO),
      estado: String(row.ESTADO ?? ''),
      movimiento: `${row.MOVIMIENTO ?? ''} ${row.TIPO ?? ''}`.trim(),
      usuario: String(row.USUARIO ?? ''),
      producto: String(find(this.products(), 'PRODUCTO', row.PRODUCTO)?.LABEL ?? row.PRODUCTO ?? ''),
      componente: String(find(this.products(), 'PRODUCTO', component)?.LABEL ?? find(this.components(), 'PRODUCTO', component)?.LABEL ?? component),
      seccion: String(find(this.sections(), 'ID_SECCION', section)?.LABEL ?? section),
      lote: lot,
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
    this.notification.warning(`${message}. Puede agregar los materiales manualmente con "+ Agregar material".`);
  }
}
