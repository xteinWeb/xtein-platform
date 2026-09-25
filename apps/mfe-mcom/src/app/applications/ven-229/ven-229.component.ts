import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  untracked,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
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
  XteinSelectComponent,
  XteinNumberComponent,
  XteinDateComponent,
  XteinButtonComponent,
  XteinLookupComponent,
  XteinRecordViewComponent,
  XteinRecordFilterComponent,
  XteinRecordReportsComponent,
  XteinReportEmailContext,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinRecordFilterResult,
  XteinRecordViewColumn
} from '@xtein/ui';

import {
  Ven229Application,
  Ven229ToolbarCapabilities
} from './constants/ven-229.constants';

import {
  Ven229DefaultRecord,
  Ven229RecordViewColumns,
  Ven229ClientColumns,
  Ven229UnitColumns,
  Ven229CurrencyColumns,
  Ven229SellerColumns,
  Ven229WarehouseColumns,
  Ven229ConditionColumns
} from './constants/ven-229-ui.constants';

import {
  Ven229PedidoRecord,
  Ven229PedidoItem,
  Ven229PedidoGrav,
  Ven229PedidoPago
} from './models/ven-229.model';

import {
  Ven229Header,
  Ven229Lookup
} from './models/ven-229-business.model';

import { Ven229Service } from './services/ven-229.service';
import { Ven229BusinessService } from './services/ven-229-business.service';
import { XteinVen229ItemsComponent } from './components/xtein-ven229-items/xtein-ven229-items.component';

@Component({
  selector: 'xtein-ven-229',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    XteinInputComponent,
    XteinLabelComponent,
    XteinSelectComponent,
    XteinNumberComponent,
    XteinDateComponent,
    XteinLookupComponent,
    XteinRecordViewComponent,
    XteinRecordFilterComponent,
    XteinRecordReportsComponent,
    XteinLoadingComponent,
    XteinVen229ItemsComponent
  ],
  providers: [
    Ven229Service,
    Ven229BusinessService
  ],
  templateUrl: './ven-229.component.html',
  styleUrls: ['./ven-229.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ven229Component implements OnInit, OnDestroy {
  readonly applicationId = Ven229Application.Id;
  readonly tableBase = Ven229Application.Table;

  // UI Column definitions
  readonly viewColumns: XteinRecordViewColumn[] = [...Ven229RecordViewColumns];
  readonly clientColumns = Ven229ClientColumns;
  readonly unitColumns = Ven229UnitColumns;
  readonly currencyColumns = Ven229CurrencyColumns;
  readonly sellerColumns = Ven229SellerColumns;
  readonly warehouseColumns = Ven229WarehouseColumns;
  readonly conditionColumns = Ven229ConditionColumns;

  // Active state signals
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Ven229PedidoRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly busy = signal<boolean>(false);
  readonly itemPending = signal<boolean>(false);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);

  // Document details signals
  readonly items = signal<Ven229PedidoItem[]>([]);
  readonly taxes = signal<Ven229PedidoGrav[]>([]);
  readonly taxItems = signal<Ven229PedidoItem[]>([]);
  readonly payments = signal<Ven229PedidoPago[]>([]);

  // Catalogs signals
  readonly documents = signal<Ven229Lookup[]>([]);
  readonly clients = signal<Ven229Lookup[]>([]);
  readonly addresses = signal<Ven229Lookup[]>([]);
  readonly sellers = signal<Ven229Lookup[]>([]);
  readonly units = signal<Ven229Lookup[]>([]);
  readonly warehouses = signal<Ven229Lookup[]>([]);
  readonly currencies = signal<Ven229Lookup[]>([]);
  readonly conditions = signal<Ven229Lookup[]>([]);
  readonly terms = signal<{ PLAZO: number }[]>([]);
  readonly saleTypes = signal<string[]>(['CONTADO', 'CREDITO']);
  readonly products = signal<Ven229Lookup[]>([]);
  readonly productsLoading = signal<boolean>(false);
  readonly onlyStock = signal<boolean>(false);

  // Overlays
  readonly filterVisible = signal<boolean>(false);
  readonly viewVisible = signal<boolean>(false);
  readonly reportsVisible = signal<boolean>(false);

  // Computed state
  readonly readOnly = computed(() => {
    const current = this.mode();
    return current === RecordToolbarMode.Initial || current === RecordToolbarMode.Browsing;
  });

  readonly isEditing = computed(() => this.mode() === RecordToolbarMode.Editing);
  readonly isNew = computed(() => this.currentIndex() === -1 && this.isEditing());

  readonly currentRecord = computed(() => {
    const idx = this.currentIndex();
    const list = this.records();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  readonly header = computed(() => this.form.getRawValue() as Ven229Header);
  readonly headerLocked = computed(() => this.items().length > 0);
  readonly advances = computed(() => this.payments().reduce((sum, p) => sum + Number(p.VALOR || p.TOTAL || 0), 0));
  readonly totalTaxes = computed(() => this.taxes().reduce((sum, t) => sum + Number(t.VALOR || 0), 0));

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO || this.records().map(r => `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})`).join(' OR ')
  );

  readonly stateStyle = computed(() => {
    const estado = this.form.controls.ESTADO.value || 'REGISTRADO';
    switch (estado) {
      case 'ANULADO':
        return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
      case 'COMPLETADO':
        return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
      case 'EN PROCESO':
      case 'PROGRAMADO':
        return { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
      default:
        return { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' };
    }
  });

  readonly itemsReady = computed(() => {
    const h = this.header();
    return !!(h.DOCUMENTO && h.ID_CLIENTE && h.ID_UN_ITEM && h.ID_ADC && h.ID_CONDICION && h.ID_MONEDA);
  });

  readonly itemRecordKey = computed(() => {
    const h = this.header();
    return this.mode() === RecordToolbarMode.Editing && this.currentIndex() === -1
      ? 'new'
      : `${h.ID_DOCUMENTO || ''}_${h.CONSECUTIVO || 0}`;
  });

  readonly conditionType = computed(() => {
    const condId = this.form.controls.ID_CONDICION.value;
    const cond = this.conditions().find(c => c['CODIGO'] === condId || c['ID_CONDICION'] === condId);
    return String(cond?.['TIPO'] || '');
  });

  readonly persistItemBind = (row: Ven229PedidoItem): Promise<boolean> => this.persistItem(row);

  readonly currentReportFilter = computed(() => {
    const r = this.currentRecord();
    return r ? `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})` : '';
  });

  reportEmailContext(): XteinReportEmailContext {
    const h = this.header();
    return {
      defaults: {
        ASUNTO: 'Pedido comercial',
        DESTINO: h.NOMBRE_CLIENTE ?? '',
        DESTINO_EMAIL: String(this.clients().find(c => c.ID_CLIENTE === h.ID_CLIENTE)?.['EMAIL'] ?? '')
      },
      template: '',
      replacements: { ...h }
    };
  }

  onItemPending(pending: boolean): void {
    this.itemPending.set(pending);
    if (pending) {
      this.disableFormControls();
      this.workspace.setDirty(this.applicationId, true);
    } else if (!this.readOnly() && !this.headerLocked()) {
      this.enableFormControls(this.isNew());
    }
  }

  // Reactive Form
  readonly form = new FormGroup({
    ID_UN: new FormControl<string>(''),
    ID_UN_ITEM: new FormControl<string>('', [Validators.required]),
    ID_DOCUMENTO: new FormControl<string>(''),
    PREFIJO: new FormControl<string>(''),
    CONSECUTIVO: new FormControl<number>(0),
    SUFIJO: new FormControl<string>(''),
    DOCUMENTO: new FormControl<string>('', [Validators.required]),
    DOCUMENTO_FAC: new FormControl<string>(''),
    FECHA_REGISTRO: new FormControl<string | null>(this.todayDate()),
    FECHA: new FormControl<string | null>(this.todayDate(), [Validators.required]),
    ID_CLIENTE: new FormControl<string>('', [Validators.required]),
    NOMBRE_CLIENTE: new FormControl<string>(''),
    DIRECCION: new FormControl<string>(''),
    ID_DOC_SOPORTE: new FormControl<string>(''),
    FECHA_OC: new FormControl<string | null>(null),
    ID_ADC: new FormControl<string>('', [Validators.required]),
    ID_CONDICION: new FormControl<string>('', [Validators.required]),
    DESCRIPCION: new FormControl<string>(''),
    ID_MONEDA: new FormControl<string>('', [Validators.required]),
    TASA_CAMBIO: new FormControl<number>(1),
    TIPO_VENTA: new FormControl<string>('CONTADO', [Validators.required]),
    PLAZO: new FormControl<number>(0),
    FECHA_PRIMER_VENC: new FormControl<string | null>(this.todayDate(), [Validators.required]),
    CUOTA_INICIAL: new FormControl<number>(0),
    ID_UN_BODEGA: new FormControl<string>(''),
    SUB_TOTAL: new FormControl<number>(0),
    VALOR_DESCUENTO: new FormControl<number>(0),
    VALOR_COSTOS: new FormControl<number>(0),
    TOTAL: new FormControl<number>(0),
    USUARIO: new FormControl<string>(''),
    ESTADO: new FormControl<string>('REGISTRADO')
  });

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly service: Ven229Service,
    readonly business: Ven229BusinessService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService
  ) {
    // Toolbar state synchronization
    effect(() => {
      this.publishToolbarState();
    });

    // Close overlays on tab focus change
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

    // Mark dirty on form changes
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        if (!this.readOnly()) {
          this.workspace.setDirty(this.applicationId, true);
        }
      })
    );

    // Watch document changes
    this.subscriptions.add(
      this.form.controls.DOCUMENTO.valueChanges.subscribe(docVal => {
        if (docVal && !this.readOnly()) {
          const doc = this.documents().find(d => d.DOCUMENTO === docVal);
          if (doc) {
            this.form.patchValue({
              ID_DOCUMENTO: String(doc.ID_DOCUMENTO || ''),
              CONSECUTIVO: Number(doc.CONSECUTIVO || 0),
              PREFIJO: String(doc.PREFIJO || ''),
              SUFIJO: String(doc.SUFIJO || ''),
              DOCUMENTO_FAC: docVal
            }, { emitEvent: false });
          }
        }
      })
    );

    // Watch client changes
    this.subscriptions.add(
      this.form.controls.ID_CLIENTE.valueChanges.subscribe(clienteId => {
        if (clienteId && !this.readOnly()) {
          void this.onClientChanged(clienteId);
        }
      })
    );

    // Watch UN changes
    this.subscriptions.add(
      this.form.controls.ID_UN_ITEM.valueChanges.subscribe(unId => {
        if (unId && !this.readOnly()) {
          void this.onUnitChanged(unId);
        }
      })
    );

    // Watch condition changes
    this.subscriptions.add(
      this.form.controls.ID_CONDICION.valueChanges.subscribe(condId => {
        if (condId && !this.readOnly()) {
          void this.onConditionChanged(condId);
        }
      })
    );

    // Watch sale type changes
    this.subscriptions.add(
      this.form.controls.TIPO_VENTA.valueChanges.subscribe(tipo => {
        if (tipo === 'CONTADO') {
          this.form.controls.PLAZO.setValue(0);
          this.form.controls.FECHA_PRIMER_VENC.setValue(this.form.controls.FECHA.value);
        }
      })
    );

    // Subscribe to toolbar commands
    this.subscriptions.add(
      this.toolbar
        .commandsForApplication(this.applicationId)
        .subscribe(command => void this.handleToolbarCommand(command))
    );

    // Retrieve user permissions
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

    // Load initial catalogs
    void this.loadCatalogs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  // ================= Toolbar & Commands =================

  private publishToolbarState(): void {
    const state = createRecordToolbarState({
      busy: this.busy(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: Ven229ToolbarCapabilities,
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
  }

  private async handleToolbarCommand(command: ToolbarCommand): Promise<void> {
    if (this.busy()) return;
    switch (command.action) {
      case ToolbarAction.New:
        this.newRecord();
        break;
      case ToolbarAction.Edit:
        this.editRecord();
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

  // ================= CRUD Operations =================

  newRecord(): void {
    if (this.busy() || !this.readOnly() || !this.permissions().create) return;
    this.mode.set(RecordToolbarMode.Editing);
    this.currentIndex.set(-1);

    this.items.set([]);
    this.taxes.set([]);
    this.taxItems.set([]);
    this.payments.set([]);

    this.form.reset({
      ...Ven229DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_PRIMER_VENC: this.todayDate(),
      USUARIO: this.business.identity.USUARIO
    });

    this.enableFormControls(true);
    this.workspace.setDirty(this.applicationId, true);
  }

  editRecord(): void {
    const current = this.currentRecord();
    if (!current || this.busy() || !this.readOnly() || !this.permissions().edit) return;
    if (current.ESTADO === 'ANULADO') {
      this.notification.warning('No se puede modificar un pedido anulado.');
      return;
    }

    this.mode.set(RecordToolbarMode.Editing);
    this.enableFormControls(false);
    this.workspace.setDirty(this.applicationId, true);
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

    if (result.isConfirmed) {
      this.mode.set(this.records().length > 0 ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
      this.disableFormControls();
      this.workspace.setDirty(this.applicationId, false);

      const idx = this.currentIndex();
      if (idx >= 0 && idx < this.records().length) {
        this.selectRecordIndex(idx);
      } else {
        this.clearForm();
      }
    }
  }

  async saveRecord(): Promise<void> {
    if (this.itemPending()) {
      this.notification.warning('Finalice o cancele la edición del producto en proceso.');
      return;
    }

    this.form.markAllAsTouched();
    const validationError = this.business.validate(this.header(), this.items());
    if (validationError) {
      this.notification.warning(validationError);
      return;
    }

    const isNewRecord = this.isNew();
    const headerData = this.header();

    const payload = {
      PEDIDOS: headerData,
      ITM_PEDIDOS: this.items(),
      PEDIDO_GRAV: this.taxes(),
      PEDIDO_GRAV_AUX: this.taxItems(),
      PEDIDO_PAGOS: this.payments(),
      ID_APLICACION: this.applicationId,
      USUARIO: this.business.identity.USUARIO
    };

    this.busy.set(true);
    try {
      const response = await this.service.save(isNewRecord ? 'new' : 'update', payload).toPromise();
      const decoded = this.business.decode<Ven229PedidoRecord>(response);
      const savedDoc = decoded[0] || headerData;

      this.notification.success('Pedido guardado exitosamente.');
      this.workspace.setDirty(this.applicationId, false);
      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();

      // Refresh to newly saved document
      const queryResult = await this.business.catalog('documents', {
        ID_DOCUMENTO: savedDoc.ID_DOCUMENTO,
        CONSECUTIVO: savedDoc.CONSECUTIVO
      });
      if (queryResult.length > 0) {
        const fullRecords = await this.queryDocument(savedDoc.ID_DOCUMENTO, savedDoc.CONSECUTIVO);
        if (fullRecords.length > 0) {
          this.records.set(fullRecords);
          this.selectRecordIndex(0);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el pedido.';
      this.notification.error(msg);
    } finally {
      this.busy.set(false);
    }
  }

  async deleteRecord(): Promise<void> {
    const current = this.currentRecord();
    if (!current || this.busy() || !this.readOnly() || !this.permissions().delete) return;

    if (current.ESTADO === 'ANULADO') {
      this.notification.warning('El pedido ya se encuentra anulado.');
      return;
    }

    const result = await Swal.fire({
      html: `¿Está seguro de anular el pedido <b>${current.DOCUMENTO}</b>?`,
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
      await this.service.delete({
        DOCUMENTO: current.DOCUMENTO,
        ID_DOCUMENTO: current.ID_DOCUMENTO,
        CONSECUTIVO: current.CONSECUTIVO,
        ID_APLICACION: this.applicationId,
        USUARIO: this.business.identity.USUARIO
      }).toPromise();

      this.notification.success('Pedido anulado exitosamente.');
      await this.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al anular el pedido.';
      this.notification.error(msg);
    } finally {
      this.busy.set(false);
    }
  }

  async refresh(): Promise<void> {
    const current = this.currentRecord();
    if (!current) return;
    try {
      const refreshed = await this.queryDocument(current.ID_DOCUMENTO, current.CONSECUTIVO);
      if (refreshed.length > 0) {
        const list = [...this.records()];
        list[this.currentIndex()] = refreshed[0];
        this.records.set(list);
        this.selectRecordIndex(this.currentIndex());
        this.notification.success('Registro actualizado.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al refrescar el pedido.';
      this.notification.error(msg);
    }
  }

  // ================= Navigation & Records =================

  selectRecordIndex(index: number): void {
    const list = this.records();
    if (index < 0 || index >= list.length) return;
    const record = list[index];
    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.disableFormControls();

    this.form.patchValue({
      ...record,
      FECHA: record.FECHA ? String(record.FECHA).slice(0, 10) : null,
      FECHA_REGISTRO: record.FECHA_REGISTRO ? String(record.FECHA_REGISTRO).slice(0, 10) : null,
      FECHA_OC: record.FECHA_OC ? String(record.FECHA_OC).slice(0, 10) : null,
      FECHA_PRIMER_VENC: record.FECHA_PRIMER_VENC ? String(record.FECHA_PRIMER_VENC).slice(0, 10) : null
    }, { emitEvent: false });

    this.items.set(record['ITM_PEDIDO'] || record['ITM_Pedido'] || []);
    this.taxes.set(record.PEDIDO_GRAV || record.Pedido_GRAV || []);
    this.payments.set(record.PEDIDO_PAGOS || record.Pedido_PAGOS || []);

    this.workspace.setDirty(this.applicationId, false);
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
    if (target !== this.currentIndex()) {
      this.selectRecordIndex(target);
    }
  }

  selectViewedRecord(record: unknown): void {
    this.viewVisible.set(false);
    const rec = record as Ven229PedidoRecord;
    const idx = this.records().findIndex(r => r.DOCUMENTO === rec?.DOCUMENTO);
    if (idx >= 0) {
      this.selectRecordIndex(idx);
    }
  }

  async searchRecords(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    this.busy.set(true);
    try {
      const prm = { PEDIDOS: result?.ESTRUCTURA ?? [] };
      const response = await this.service.query('consulta', prm).toPromise();
      const users = this.business.decode<Ven229PedidoRecord>(response);
      if (users.length > 0) {
        this.records.set(users);
        this.selectRecordIndex(0);
        this.notification.success(`Se encontraron ${users.length} pedido(s).`);
      } else {
        this.notification.warning('No se encontraron registros con el criterio especificado.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en la búsqueda.';
      this.notification.error(msg);
    } finally {
      this.busy.set(false);
    }
  }

  // ================= Item Management =================

  async persistItem(row: Ven229PedidoItem): Promise<boolean> {
    const list = [...this.items()];
    const idx = list.findIndex(i => i.ITEM === row.ITEM);
    if (idx >= 0) {
      list[idx] = row;
    } else {
      list.push(row);
    }

    try {
      await this.applyItems(list);
      return true;
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'Error al aplicar el ítem.');
      return false;
    }
  }

  async removeItem(itemNum: number): Promise<void> {
    const updated = this.items().filter(i => i.ITEM !== itemNum);
    await this.applyItems(updated);
  }

  async removeItems(itemNums: number[]): Promise<void> {
    const updated = this.items().filter(i => !itemNums.includes(i.ITEM));
    await this.applyItems(updated);
  }

  async applyItems(updatedItems: Ven229PedidoItem[], option?: string): Promise<void> {
    this.busy.set(true);
    try {
      const taxResults = await this.business.taxes(this.header(), updatedItems, option);
      const tax = taxResults[0];
      this.items.set(updatedItems);
      this.taxes.set(tax?.ENCAB ?? []);
      this.taxItems.set(tax?.ITEMS ?? []);
      this.recalculate();
    } finally {
      this.busy.set(false);
    }
  }

  recalculate(): void {
    const subtotal = this.items().reduce((sum, item) => sum + Number(item.SUB_TOTAL || 0), 0);
    const totalTaxes = this.taxes().reduce((sum, tax) => sum + Number(tax.VALOR || 0), 0);
    const discounts = this.items().reduce((sum, item) => sum + Number(item.VALOR_DESCUENTO || 0), 0);
    const total = subtotal - discounts + totalTaxes;

    this.form.patchValue({
      SUB_TOTAL: subtotal,
      VALOR_DESCUENTO: discounts,
      TOTAL: total
    }, { emitEvent: false });
  }

  // ================= Catalog Handlers =================

  async onClientChanged(clienteId: string): Promise<void> {
    const cli = this.clients().find(c => c.ID_CLIENTE === clienteId);
    if (cli) {
      this.form.patchValue({
        NOMBRE_CLIENTE: String(cli.NOMBRE_COMPLETO || cli.NOMBRE || '')
      }, { emitEvent: false });
    }

    try {
      const addresses = await this.business.catalog('addresses', { ID_CLIENTE: clienteId });
      this.addresses.set(addresses);
      if (addresses.length > 0) {
        this.form.patchValue({ DIRECCION: String(addresses[0].DIRECCION || '') }, { emitEvent: false });
      }
    } catch {
      // Non-critical
    }
  }

  async onUnitChanged(unitId: string): Promise<void> {
    try {
      const warehouses = await this.business.catalog('warehouses', { ID_UN: unitId });
      this.warehouses.set(warehouses);
      if (warehouses.length > 0) {
        this.form.patchValue({ ID_UN_BODEGA: String(warehouses[0]['ID_UN_BODEGA'] || '') }, { emitEvent: false });
      }
    } catch {
      // Non-critical
    }
  }

  async onConditionChanged(condId: string): Promise<void> {
    const cond = this.conditions().find(c => c['CODIGO'] === condId || c['ID_CONDICION'] === condId);
    if (cond) {
      const plazosRaw = cond['PLAZOS'];
      let plazoList: { PLAZO: number }[] = [];
      if (typeof plazosRaw === 'string') {
        plazoList = plazosRaw.split(',').map(p => ({ PLAZO: parseInt(p.trim(), 10) })).filter(p => !isNaN(p.PLAZO));
      } else if (Array.isArray(plazosRaw)) {
        plazoList = plazosRaw.map(p => ({ PLAZO: Number(p.PLAZO || 0) }));
      }
      this.terms.set(plazoList);
      if (plazoList.length > 0) {
        this.form.patchValue({ PLAZO: plazoList[0].PLAZO }, { emitEvent: false });
      }
    }
  }

  async loadProducts(): Promise<void> {
    this.productsLoading.set(true);
    try {
      const items = await this.business.catalog('products', {
        ID_UN_ITEM: this.form.controls.ID_UN_ITEM.value,
        ID_UN_BODEGA: this.form.controls.ID_UN_BODEGA.value,
        SOLO_EXISTENCIAS: this.onlyStock()
      });
      this.products.set(items);
    } catch {
      // Non-critical
    } finally {
      this.productsLoading.set(false);
    }
  }

  private async loadCatalogs(): Promise<void> {
    try {
      const [docs, clients, sellers, units, currencies, conditions, defaultUnit] = await Promise.all([
        this.business.catalog('documents', { TIPO: 'PEDIDOS' }),
        this.business.catalog('clients', { ESTADO: 'ACTIVO' }),
        this.business.catalog('sellers', { ESTADO: 'ACTIVO' }),
        this.business.catalog('units', { ESTADO: 'ACTIVO' }),
        this.business.catalog('currencies', { ESTADO: 'ACTIVO' }),
        this.business.catalog('conditions', { ESTADO: 'ACTIVO' }),
        this.business.catalog('defaultUnit', { USUARIO: this.business.identity.USUARIO })
      ]);

      this.documents.set(docs);
      this.clients.set(clients);
      this.sellers.set(sellers);
      this.units.set(units);
      this.currencies.set(currencies);
      this.conditions.set(conditions);

      if (defaultUnit.length > 0 && !this.form.controls.ID_UN_ITEM.value) {
        this.form.patchValue({ ID_UN_ITEM: String(defaultUnit[0].ID_UN || '') }, { emitEvent: false });
      }
    } catch {
      // Non-critical fallback
    }
  }

  private async queryDocument(idDoc: string, consecutivo: number): Promise<Ven229PedidoRecord[]> {
    const prm = {
      PEDIDOS: [
        { CAMPO: 'ID_DOCUMENTO', EXPRESION: idDoc, TABLA: 'Pedido' },
        { CAMPO: 'CONSECUTIVO', EXPRESION: String(consecutivo), TABLA: 'Pedido' }
      ]
    };
    const response = await this.service.query('consulta', prm).toPromise();
    return this.business.decode<Ven229PedidoRecord>(response);
  }

  // ================= Helpers =================

  money(val: number | string | null | undefined): string {
    return formatNumber(Number(val || 0), '#,##0.00');
  }

  private todayDate(): string {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  }

  private disableFormControls(): void {
    this.form.disable({ emitEvent: false });
  }

  private enableFormControls(isNew = false): void {
    this.form.enable({ emitEvent: false });
    this.form.controls.ESTADO.disable({ emitEvent: false });
    this.form.controls.FECHA_REGISTRO.disable({ emitEvent: false });
    this.form.controls.USUARIO.disable({ emitEvent: false });
    this.form.controls.NOMBRE_CLIENTE.disable({ emitEvent: false });
    this.form.controls.SUB_TOTAL.disable({ emitEvent: false });
    this.form.controls.VALOR_DESCUENTO.disable({ emitEvent: false });
    this.form.controls.VALOR_COSTOS.disable({ emitEvent: false });
    this.form.controls.TOTAL.disable({ emitEvent: false });

    if (!isNew) {
      this.form.controls.DOCUMENTO.disable({ emitEvent: false });
    }
  }

  private clearForm(): void {
    this.form.reset({
      ...Ven229DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_PRIMER_VENC: this.todayDate()
    });
    this.items.set([]);
    this.taxes.set([]);
    this.payments.set([]);
  }
}
