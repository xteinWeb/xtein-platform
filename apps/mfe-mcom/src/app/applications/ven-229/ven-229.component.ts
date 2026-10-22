import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  untracked,
  inject,
  ElementRef
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
  XteinPopupComponent,
  XteinReportEmailContext,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinRecordFilterResult,
  XteinRecordViewColumn,
  XteinGroupLabelComponent
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
  Ven229Lookup,
  Ven229SettingResult
} from './models/ven-229-business.model';

import { Ven229Service } from './services/ven-229.service';
import { Ven229BusinessService } from './services/ven-229-business.service';
import { Ven229SelectionService } from './services/ven-229-selection.service';
import { XteinVen229ItemsComponent } from './components/xtein-ven229-items/xtein-ven229-items.component';
import { XteinVen229SelectionComponent } from './components/xtein-ven229-selection/xtein-ven229-selection.component';

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
    XteinButtonComponent,
    XteinLookupComponent,
    XteinRecordViewComponent,
    XteinRecordFilterComponent,
    XteinRecordReportsComponent,
    XteinPopupComponent,
    XteinLoadingComponent,
    XteinGroupLabelComponent,
    XteinVen229ItemsComponent,
    XteinVen229SelectionComponent
  ],
  providers: [
    Ven229Service,
    Ven229BusinessService,
    Ven229SelectionService
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
  readonly formVersion = signal<number>(0);

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
  defaultUnit = '';
  defaultCurrency = '';

  // Overlays & Settings
  readonly specifications = signal<Ven229Lookup[]>([]);
  readonly settings = signal<Ven229Lookup[]>([]);
  readonly filterVisible = signal<boolean>(false);
  readonly viewVisible = signal<boolean>(false);
  readonly reportsVisible = signal<boolean>(false);
  readonly settingsVisible = signal<boolean>(false);
  readonly selectionVisible = signal<boolean>(false);
  readonly selection = signal<Ven229SettingResult | null>(null);
  selectedSettingsRows: Ven229Lookup[] = [];
  selectedSettingsKeys: unknown[] = [];
  previousCondition = '';
  previousWarehouse = '';
  previousUnit = '';
  private productRequest = 0;

  spec(name: string): Ven229Lookup | undefined {
    return this.specifications().find(s => s.NOMBRE_OBJETO === name);
  }

  enabledSpec(name: string): boolean {
    const value = this.spec(name)?.ACTIVADO;
    return value === true || value === 1;
  }

  // Computed state
  readonly readOnly = computed(() => {
    const current = this.mode();
    return current === RecordToolbarMode.Initial || current === RecordToolbarMode.Browsing;
  });

  readonly isEditing = computed(() => this.mode() === RecordToolbarMode.Editing || this.mode() === RecordToolbarMode.Creating);
  readonly isNew = computed(() => this.mode() === RecordToolbarMode.Creating);

  readonly currentRecord = computed(() => {
    const idx = this.currentIndex();
    const list = this.records();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  readonly header = computed(() => {
    this.formVersion();
    return this.form.getRawValue() as Ven229Header;
  });
  readonly headerLocked = computed(() => this.items().length > 0);
  readonly advances = computed(() => this.payments().reduce((sum, p) => sum + Number(p.VALOR || p.TOTAL || 0), 0));
  readonly totalTaxes = computed(() => this.taxes().reduce((sum, t) => sum + Number(t.VALOR || 0), 0));

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO || this.records().map(r => `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})`).join(' OR ')
  );

  readonly stateStyle = computed<Record<string, string>>(() => {
    try {
      const styles = JSON.parse(this.spec('ESTILOS ESTADO')?.VALOR_DEFECTO || '[]');
      const match = styles.find((s: Record<string, string>) => s['ESTADO'] === this.form.controls.ESTADO.value);
      if (match) {
        const color = match['color'] || match['COLOR'];
        const background = match['background'] || match['BG'];
        const res: Record<string, string> = {};
        if (color) res['color'] = color;
        if (background) res['background'] = background;
        return res;
      }
    } catch {}
    const estado = this.form.controls.ESTADO.value;
    switch (estado) {
      case 'REGISTRADO': return { background: '#e8f5e8', color: '#2e7d32' };
      case 'AUTORIZADO': return { background: 'rgb(132, 223, 170)', color: '#065f46' };
      case 'PARCIAL': return { background: 'rgb(240, 152, 217)', color: '#831843' };
      case 'ANULADO': return { background: 'rgb(242, 161, 169)', color: '#991b1b' };
      case 'PROGRAMADO': return { background: 'rgba(172, 200, 255, 1)', color: '#1e40af' };
      default: return { background: '#f1f5f9', color: '#475569' };
    }
  });

  readonly itemsReady = computed(() => {
    this.formVersion();
    const h = this.header();
    const tipoVenta = String(h.TIPO_VENTA || 'CONTADO').trim().toUpperCase();
    const plazoValid = tipoVenta === 'CONTADO'
      ? true
      : (h.PLAZO !== null && h.PLAZO !== undefined && String(h.PLAZO).trim() !== '');

    const docValid = Boolean(h.DOCUMENTO && String(h.DOCUMENTO).trim() !== '');
    const clientValid = Boolean(h.ID_CLIENTE && String(h.ID_CLIENTE).trim() !== '');
    const fechaValid = Boolean(h.FECHA && String(h.FECHA).trim() !== '');
    const unValid = Boolean(h.ID_UN_ITEM && String(h.ID_UN_ITEM).trim() !== '');
    const adcValid = Boolean(h.ID_ADC && String(h.ID_ADC).trim() !== '');
    const condValid = Boolean(h.ID_CONDICION && String(h.ID_CONDICION).trim() !== '');

    return Boolean(
      docValid &&
      clientValid &&
      fechaValid &&
      unValid &&
      adcValid &&
      condValid &&
      plazoValid
    );
  });

  readonly itemRecordKey = computed(() => {
    const h = this.header();
    return this.isNew()
      ? 'new'
      : `${h.ID_DOCUMENTO || ''}_${h.CONSECUTIVO || 0}`;
  });

  readonly conditionType = computed(() => {
    const condId = String(this.form.controls.ID_CONDICION.value || '').trim();
    if (!condId) return 'CONDICION';
    const cond = this.conditions().find(c =>
      String(c['CODIGO'] || c['ID_CONDICION'] || '').trim() === condId
    );
    const tipo = String(cond?.['TIPO'] || '').trim().toUpperCase();
    return tipo === 'LISTA' ? 'LISTA' : 'CONDICION';
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
    VALOR_CUOTA: new FormControl<number>(0),
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
    private readonly notification: XteinNotificationService,
    private readonly elementRef: ElementRef,
    private readonly cdr: ChangeDetectorRef
  ) {

    // Toolbar state synchronization
    effect(() => {
      this.publishToolbarState();
    });

    // Ensure OnPush ChangeDetection triggers when formVersion, itemsReady, mode or readOnly updates
    effect(() => {
      this.formVersion();
      this.itemsReady();
      this.mode();
      this.readOnly();
      this.cdr.markForCheck();
    });

    // Close overlays on tab focus change
    effect(() => {
      if (this.toolbar.activeApplicationId() !== this.applicationId) {
        this.filterVisible.set(false);
        this.viewVisible.set(false);
        this.reportsVisible.set(false);
        this.settingsVisible.set(false);
        this.selectionVisible.set(false);
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

    // Watch form value changes to trigger reactive computations
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        this.formVersion.update(v => v + 1);
        this.cdr.markForCheck();
      })
    );

    // Watch client changes
    this.subscriptions.add(
      this.form.controls.ID_CLIENTE.valueChanges.subscribe(clienteId => {
        if (!this.readOnly()) {
          void this.onClientChanged(clienteId || '');
        }
      })
    );

    // Watch UN changes
    this.subscriptions.add(
      this.form.controls.ID_UN_ITEM.valueChanges.subscribe(unId => {
        if (!this.readOnly()) {
          void this.handleUnitChange(unId || '');
        }
      })
    );

    // Watch ADC / Vendedor changes -> reload conditions
    this.subscriptions.add(
      this.form.controls.ID_ADC.valueChanges.subscribe(adcId => {
        if (!this.readOnly()) {
          void this.loadConditions();
        }
      })
    );

    // Watch condition changes with confirmation if items exist
    this.subscriptions.add(
      this.form.controls.ID_CONDICION.valueChanges.subscribe(condId => {
        if (condId && !this.readOnly()) {
          void this.handleConditionChange(condId);
        }
      })
    );

    // Watch bodega changes with confirmation if items exist
    this.subscriptions.add(
      this.form.controls.ID_UN_BODEGA.valueChanges.subscribe(bodegaId => {
        if (bodegaId && !this.readOnly()) {
          void this.handleWarehouseChange(bodegaId);
        }
      })
    );

    // Watch sale type changes
    this.subscriptions.add(
      this.form.controls.TIPO_VENTA.valueChanges.subscribe(tipo => {
        if (tipo === 'CONTADO') {
          this.form.controls.PLAZO.setValue(0, { emitEvent: false });
          this.form.controls.FECHA_PRIMER_VENC.setValue(this.form.controls.FECHA.value, { emitEvent: false });
          this.form.controls.CUOTA_INICIAL.setValue(0, { emitEvent: false });
          this.form.controls.PLAZO.disable({ emitEvent: false });
          this.form.controls.FECHA_PRIMER_VENC.disable({ emitEvent: false });
          this.form.controls.CUOTA_INICIAL.disable({ emitEvent: false });
          this.recalculate();
        } else if (!this.readOnly()) {
          this.form.controls.PLAZO.enable({ emitEvent: false });
          this.form.controls.FECHA_PRIMER_VENC.enable({ emitEvent: false });
          this.form.controls.CUOTA_INICIAL.enable({ emitEvent: false });
        }
        this.formVersion.update(v => v + 1);
        if (!this.readOnly()) {
          void this.loadConditions();
        }
      })
    );

    // Watch plazo changes -> recalculate and reload products
    this.subscriptions.add(
      this.form.controls.PLAZO.valueChanges.subscribe(() => {
        this.recalculate();
        if (!this.readOnly() && this.form.controls.ID_CONDICION.value) {
          void this.loadProducts();
        }
      })
    );

    // Watch cuota inicial changes -> recalculate
    this.subscriptions.add(
      this.form.controls.CUOTA_INICIAL.valueChanges.subscribe(() => {
        this.recalculate();
      })
    );

    // Watch fecha changes -> if CONTADO, update FECHA_PRIMER_VENC
    this.subscriptions.add(
      this.form.controls.FECHA.valueChanges.subscribe(fecha => {
        if (this.form.controls.TIPO_VENTA.value === 'CONTADO') {
          this.form.controls.FECHA_PRIMER_VENC.setValue(fecha, { emitEvent: false });
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
        await this.newRecord();
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
      case ToolbarAction.Configure:
        void this.showSettings();
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

  private indexBeforeNew = -1;

  selectDocument(value: string): void {
    const row = this.documents().find(d => d.DOCUMENTO === value);
    if (!row) return;
    this.form.patchValue({
      DOCUMENTO: value,
      ID_DOCUMENTO: String(row.ID_DOCUMENTO || ''),
      CONSECUTIVO: Number(row.CONSECUTIVO || 0),
      PREFIJO: String(row.PREFIJO || ''),
      SUFIJO: String(row.SUFIJO || ''),
      DOCUMENTO_FAC: value
    }, { emitEvent: false });
    this.formVersion.update(v => v + 1);
  }

  async newRecord(): Promise<void> {
    if (this.busy() || !this.readOnly() || !this.permissions().create) return;
    this.indexBeforeNew = this.currentIndex();
    this.mode.set(RecordToolbarMode.Creating);
    this.currentIndex.set(-1);

    this.previousCondition = '';
    this.previousWarehouse = '';
    this.previousUnit = this.defaultUnit || '';
    this.items.set([]);
    this.taxes.set([]);
    this.taxItems.set([]);
    this.payments.set([]);
    this.addresses.set([]);
    this.products.set([]);
    this.conditions.set([]);
    this.terms.set([]);
    this.warehouses.set([]);

    // Query fresh document consecutive from backend on new record
    try {
      const docs = await this.business.catalog('documents', this.business.identity, true);
      this.documents.set(docs);
    } catch (e) {
      console.warn('Error refreshing documents on new record:', e);
    }

    this.form.reset({
      ...Ven229DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_PRIMER_VENC: this.todayDate(),
      USUARIO: this.business.identity.USUARIO,
      ID_UN_ITEM: this.defaultUnit,
      ID_MONEDA: this.defaultCurrency,
      TIPO_VENTA: 'CONTADO',
      PLAZO: 0,
      CUOTA_INICIAL: 0,
      ESTADO: 'REGISTRADO'
    });
    this.formVersion.update(v => v + 1);

    if (this.documents().length === 1) {
      this.selectDocument(String(this.documents()[0].DOCUMENTO));
    }

    if (this.defaultUnit) {
      void this.onUnitChanged(this.defaultUnit);
    }

    this.enableFormControls(true);
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
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
    this.workspace.setDirty(this.applicationId, false);
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
      const previousIndex = this.isNew() ? this.indexBeforeNew : this.currentIndex();
      const idx = this.records().length ? Math.min(Math.max(previousIndex, 0), this.records().length - 1) : -1;
      this.currentIndex.set(idx);
      this.indexBeforeNew = -1;
      this.mode.set(this.records().length > 0 ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
      this.disableFormControls();
      this.itemPending.set(false);
      this.taxItems.set([]);
      this.workspace.setDirty(this.applicationId, false);

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

    if (record.DOCUMENTO && !this.documents().some(d => d.DOCUMENTO === record.DOCUMENTO)) {
      this.documents.update(docs => [
        ...docs,
        {
          DOCUMENTO: record.DOCUMENTO_FAC || record.DOCUMENTO,
          ID_DOCUMENTO: record.ID_DOCUMENTO,
          CONSECUTIVO: record.CONSECUTIVO
        }
      ]);
    }

    this.form.reset({
      ...Ven229DefaultRecord,
      ...record,
      FECHA: record.FECHA ? String(record.FECHA).slice(0, 10) : null,
      FECHA_REGISTRO: record.FECHA_REGISTRO ? String(record.FECHA_REGISTRO).slice(0, 10) : null,
      FECHA_OC: record.FECHA_OC ? String(record.FECHA_OC).slice(0, 10) : null,
      FECHA_PRIMER_VENC: record.FECHA_PRIMER_VENC ? String(record.FECHA_PRIMER_VENC).slice(0, 10) : null
    }, { emitEvent: false });
    this.formVersion.update(v => v + 1);

    this.items.set(record['ITM_PEDIDO'] || record['ITM_Pedido'] || []);
    this.taxes.set(record.PEDIDO_GRAV || record.Pedido_GRAV || []);
    this.payments.set(record.PEDIDO_PAGOS || record.Pedido_PAGOS || []);

    this.previousCondition = record.ID_CONDICION ? String(record.ID_CONDICION).trim() : '';
    this.previousWarehouse = record.ID_UN_BODEGA ? String(record.ID_UN_BODEGA).trim() : '';
    this.previousUnit = record.ID_UN_ITEM ? String(record.ID_UN_ITEM).trim() : '';

    if (record.ID_ADC) {
      void this.loadConditions().then(() => {
        if (record.ID_CONDICION) {
          void this.onConditionChanged(record.ID_CONDICION);
        }
      });
    }
    if (record.ID_UN_ITEM) {
      void this.onUnitChanged(record.ID_UN_ITEM);
    }
    if (record.ID_CLIENTE) {
      void this.onClientChanged(record.ID_CLIENTE);
    }

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
      const prm = { PEDIDO: result?.ESTRUCTURA ?? [] };
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
    list.sort((a, b) => a.ITEM - b.ITEM);
    return this.applyItems(list);
  }

  async removeItem(item: number | number[]): Promise<void> {
    if (this.readOnly() || this.busy()) return;
    const answer = await Swal.fire({
      text: '¿Desea eliminar el producto seleccionado?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (answer.isConfirmed) {
      const toRemove = Array.isArray(item) ? item : [item];
      await this.applyItems(this.items().filter(r => !toRemove.includes(r.ITEM)));
    }
  }

  async removeItems(itemNums: number[]): Promise<void> {
    await this.removeItem(itemNums);
  }

  async applyItems(updatedItems: Ven229PedidoItem[], option = 'items'): Promise<boolean> {
    if (this.readOnly() || this.busy()) return false;
    this.busy.set(true);
    try {
      const taxResults = await this.business.taxes(this.header(), updatedItems.map(row => ({ ...row, APLICACION: 2 })), option);
      const tax = taxResults[0];
      if (!tax) throw new Error('El servidor no devolvió la liquidación de gravámenes.');
      this.taxes.set(tax.ENCAB ?? []);
      this.taxItems.set(tax.ITEMS ?? []);
      this.items.set(updatedItems.map(row => {
        const value = tax.ITEMS?.find(i => i.ITEM === row.ITEM);
        return value ? {
          ...row,
          VALOR_IVA: value.VALOR_IVA,
          SUB_TOTAL: value.SUB_TOTAL,
          TOTAL: value.TOTAL,
          GRAVAMENES: value.GRAV_TOTAL != null ? String(value.GRAV_TOTAL) : row.GRAVAMENES,
          GRAV_TOTAL: value.GRAV_TOTAL
        } : row;
      }));
      this.recalculate();
      this.workspace.setDirty(this.applicationId, true);
      return true;
    } catch (error) {
      this.showError(error);
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  recalculate(): void {
    const subtotal = this.items().reduce((sum, item) => sum + Number(item.SUB_TOTAL || 0), 0);
    const totalTaxes = this.taxes().reduce((sum, tax) => sum + Number(tax.VALOR || 0), 0);
    const discounts = this.items().reduce((sum, item) => sum + Number(item.VALOR_DESCUENTO || 0), 0);
    const total = subtotal - discounts + totalTaxes;
    const h = this.form.getRawValue();
    const cuota = Number(h.PLAZO) > 0 ? (total - Number(h.CUOTA_INICIAL || 0)) / Number(h.PLAZO) : 0;

    this.form.patchValue({
      SUB_TOTAL: subtotal,
      VALOR_DESCUENTO: discounts,
      TOTAL: total,
      VALOR_CUOTA: cuota
    }, { emitEvent: false });
    this.formVersion.update(v => v + 1);
  }

  // ================= Catalog Handlers =================

  async onClientChanged(clienteId: string): Promise<void> {
    if (!this.readOnly()) {
      this.addresses.set([]);
      this.form.patchValue({ NOMBRE_CLIENTE: '', DIRECCION: '' });
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
    const cleanId = String(clienteId || '').trim();
    if (!cleanId) {
      return;
    }
    const cli = this.clients().find(c => String(c.ID_CLIENTE || '').trim() === cleanId);
    if (cli) {
      this.form.patchValue({
        NOMBRE_CLIENTE: String(cli.NOMBRE_COMPLETO || cli.NOMBRE || '')
      });
    }

    try {
      const addresses = await this.business.catalog('addresses', { ID_CLIENTE: cleanId }, true);
      const formatted = (addresses || []).filter(a => a && (a.DIRECCION || a['ID_DIRECCION']));
      this.addresses.set(formatted);
      if (!this.readOnly()) {
        if (formatted.length > 0) {
          const preferred = formatted.find((a: any) => a.TIPO_DIRECCION && String(a.TIPO_DIRECCION).toLowerCase().includes('despacho')) || formatted[0];
          this.form.patchValue({ DIRECCION: String(preferred.DIRECCION || preferred['ID_DIRECCION'] || '') });
        } else {
          this.form.patchValue({ DIRECCION: '' });
          this.notification.warning('No se encontró una dirección del Tipo: Despacho');
        }
      }
    } catch {
      this.addresses.set([]);
      this.form.patchValue({ DIRECCION: '' });
      if (!this.readOnly()) {
        this.notification.warning('No se encontró una dirección del Tipo: Despacho');
      }
    } finally {
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
  }

  async onUnitChanged(unitId: string): Promise<void> {
    if (!this.readOnly()) {
      this.warehouses.set([]);
      this.form.patchValue({ ID_UN_BODEGA: '' });
      this.products.set([]);
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
    const cleanId = String(unitId || '').trim();
    if (!cleanId) {
      return;
    }
    try {
      const warehouses = await this.business.catalog('warehouses', {
        ESTADO: 'ACTIVO',
        MOVIMIENTO: 'PEDIDO',
        ID_UN_ITEM: cleanId,
        USUARIO: this.business.identity.USUARIO
      }, true);
      const formatted = warehouses.map(r => ({
        ...r,
        ID_UN_BODEGA: String(r['ID_UN_BODEGA'] ?? '').trim(),
        DESCRIPCION: String(r['DESCRIPCION'] ?? r['ID_UN_BODEGA'] ?? '').trim(),
        NOMBRE_UN: String(r['NOMBRE_UN'] ?? '').trim(),
        BODEGA_LABEL: String(r['DESCRIPCION'] ? `${r['ID_UN_BODEGA']} - ${r['DESCRIPCION']}` : (r['ID_UN_BODEGA'] ?? '')).trim()
      })).filter(r => r.ID_UN_BODEGA);
      this.warehouses.set(formatted);
      if (!this.readOnly()) {
        const nextBodega = formatted.length > 0 ? formatted[0].ID_UN_BODEGA : '';
        this.form.patchValue({ ID_UN_BODEGA: nextBodega });
      }
    } catch {
      this.warehouses.set([]);
      this.form.patchValue({ ID_UN_BODEGA: '' });
    } finally {
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
      if (!this.readOnly() && this.form.controls.ID_CONDICION.value) {
        void this.loadProducts();
      }
    }
  }

  async refreshClients(): Promise<void> {
    try {
      const clients = await this.business.loadClients(true);
      this.clients.set(clients);
    } catch {
      // Non-critical
    }
  }

  async handleConditionChange(newCond: string): Promise<void> {
    if (this.previousCondition && this.previousCondition !== newCond && this.items().length > 0) {
      const result = await Swal.fire({
        text: `Está cambiando la Condición ${this.previousCondition} por ${newCond}, esto borrará los Productos asociados, ¿Desea Continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#0F4C81',
        confirmButtonText: 'Sí, Borrar',
        cancelButtonText: 'No'
      });

      if (result.isConfirmed) {
        this.items.set([]);
        this.taxes.set([]);
        this.taxItems.set([]);
        this.recalculate();
        this.previousCondition = newCond;
        await this.onConditionChanged(newCond);
      } else {
        this.form.controls.ID_CONDICION.setValue(this.previousCondition, { emitEvent: false });
        return;
      }
    } else {
      this.previousCondition = newCond;
      await this.onConditionChanged(newCond);
    }
  }

  async handleWarehouseChange(newBodega: string): Promise<void> {
    if (this.previousWarehouse && this.previousWarehouse !== newBodega && this.items().length > 0) {
      const result = await Swal.fire({
        text: `Está cambiando la Bodega ${this.previousWarehouse} por ${newBodega}, esto borrará los Productos asociados, ¿Desea Continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#0F4C81',
        confirmButtonText: 'Sí, Borrar',
        cancelButtonText: 'No'
      });

      if (result.isConfirmed) {
        this.items.set([]);
        this.taxes.set([]);
        this.taxItems.set([]);
        this.recalculate();
        this.previousWarehouse = newBodega;
        await this.loadProducts();
      } else {
        this.form.controls.ID_UN_BODEGA.setValue(this.previousWarehouse, { emitEvent: false });
        return;
      }
    } else {
      this.previousWarehouse = newBodega;
      await this.loadProducts();
    }
  }

  async handleUnitChange(newUnit: string): Promise<void> {
    if (this.previousUnit && this.previousUnit !== newUnit && this.items().length > 0) {
      const result = await Swal.fire({
        text: `Está cambiando la Unidad de Negocio ${this.previousUnit} por ${newUnit}, esto borrará los Productos asociados, ¿Desea Continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#0F4C81',
        confirmButtonText: 'Sí, Borrar',
        cancelButtonText: 'No'
      });

      if (result.isConfirmed) {
        this.items.set([]);
        this.taxes.set([]);
        this.taxItems.set([]);
        this.recalculate();
        this.previousUnit = newUnit;
        await this.onUnitChanged(newUnit);
      } else {
        this.form.controls.ID_UN_ITEM.setValue(this.previousUnit, { emitEvent: false });
        return;
      }
    } else {
      this.previousUnit = newUnit;
      await this.onUnitChanged(newUnit);
    }
  }

  async loadConditions(): Promise<void> {
    const adc = this.form.controls.ID_ADC.value;
    const tipo = this.form.controls.TIPO_VENTA.value || 'CONTADO';
    if (!this.readOnly()) {
      this.conditions.set([]);
      this.terms.set([]);
      this.products.set([]);
      this.form.patchValue({ ID_CONDICION: '', PLAZO: 0 });
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
    if (!adc || !tipo) {
      return;
    }
    try {
      const raw = await this.business.catalog('conditions', {
        ID_ADC: adc,
        TIPO_VENTA: tipo,
        ESTADO: 'ACTIVO'
      }, true);
      const rows = raw.map(r => {
        const code = String(r['CODIGO'] ?? r['ID_CONDICION'] ?? '').trim();
        return {
          ...r,
          CODIGO: code,
          ID_CONDICION: code,
          NOMBRE: String(r['NOMBRE'] ?? r['DESCRIPCION'] ?? code).trim(),
          TIPO: String(r['TIPO'] ?? 'CONDICION').trim()
        };
      }).filter(r => r.CODIGO && r.CODIGO !== 'null');

      this.conditions.set(rows);

      if (rows.length === 0) {
        if (!this.readOnly()) {
          this.notification.warning('El Vendedor seleccionado no tiene Condiciones de Venta asociadas');
        }
      } else if (!this.readOnly()) {
        const defaultCond = rows[0].CODIGO;
        this.form.patchValue({ ID_CONDICION: defaultCond });
        await this.onConditionChanged(defaultCond);
      }
    } catch {
      this.conditions.set([]);
      this.terms.set([]);
      this.products.set([]);
      this.form.patchValue({ ID_CONDICION: '', PLAZO: 0 });
      if (!this.readOnly()) {
        this.notification.warning('El Vendedor seleccionado no tiene Condiciones de Venta asociadas');
      }
    } finally {
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
  }

  async onConditionChanged(condId: string): Promise<void> {
    if (!this.readOnly()) {
      this.terms.set([]);
      this.products.set([]);
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
    const cleanId = String(condId || '').trim();
    if (!cleanId) {
      this.form.patchValue({ PLAZO: 0 });
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
      return;
    }

    const cond = this.conditions().find(c =>
      String(c['CODIGO'] || c['ID_CONDICION'] || '').trim() === cleanId
    );
    if (cond) {
      const plazosRaw = cond['PLAZOS'];
      let plazoList: { PLAZO: number }[] = [];
      if (typeof plazosRaw === 'string') {
        try {
          const parsed = JSON.parse(plazosRaw);
          if (Array.isArray(parsed)) {
            plazoList = parsed.map(p => ({ PLAZO: Number(p.PLAZO ?? p) })).filter(p => !isNaN(p.PLAZO));
          }
        } catch {
          plazoList = plazosRaw.split(',').map(p => ({ PLAZO: parseInt(p.trim(), 10) })).filter(p => !isNaN(p.PLAZO));
        }
      } else if (Array.isArray(plazosRaw)) {
        plazoList = plazosRaw.map(p => ({ PLAZO: Number(p.PLAZO || 0) }));
      }

      if (plazoList.length === 0) {
        plazoList = [{ PLAZO: 0 }];
      }
      this.terms.set(plazoList);

      if (this.form.controls.TIPO_VENTA.value === 'CONTADO') {
        this.form.patchValue({
          PLAZO: 0,
          FECHA_PRIMER_VENC: this.form.controls.FECHA.value
        });
      } else {
        if (cond['DIAS_VENC']) {
          const fechaBase = this.form.controls.FECHA.value ? new Date(this.form.controls.FECHA.value + 'T00:00:00') : new Date();
          fechaBase.setDate(fechaBase.getDate() + Number(cond['DIAS_VENC']));
          const vencStr = [
            fechaBase.getFullYear(),
            String(fechaBase.getMonth() + 1).padStart(2, '0'),
            String(fechaBase.getDate()).padStart(2, '0')
          ].join('-');
          this.form.patchValue({ FECHA_PRIMER_VENC: vencStr });
        }
        if (!this.readOnly()) {
          const defaultPlazo = plazoList.length > 0 ? plazoList[0].PLAZO : 0;
          this.form.patchValue({ PLAZO: defaultPlazo });
        }
      }
    } else {
      this.form.patchValue({ PLAZO: 0 });
    }
    this.formVersion.update(v => v + 1);
    this.cdr.markForCheck();
    await this.loadProducts();
  }

  async loadProducts(stockOnly = this.onlyStock()): Promise<void> {
    this.onlyStock.set(stockOnly);
    const req = ++this.productRequest;
    const condId = String(this.form.controls.ID_CONDICION.value || '').trim();
    if (!condId) {
      this.products.set([]);
      this.productsLoading.set(false);
      this.cdr.markForCheck();
      return;
    }
    this.productsLoading.set(true);
    this.cdr.markForCheck();
    try {
      const tipo = this.conditionType();
      const plazoVal = this.form.controls.PLAZO.value ?? 0;
      const bodegaVal = String(this.form.controls.ID_UN_BODEGA.value || '').trim();

      const items = await this.business.catalog('products', {
        ID_LISTA: condId,
        TIPO: tipo || 'CONDICION',
        PLAZO: Number(plazoVal) || 0,
        CON_EXIS: stockOnly ? 'SI' : undefined,
        ID_UN_BODEGA: bodegaVal || undefined
      }, true);
      if (req === this.productRequest) {
        this.products.set(items || []);
      }
    } catch {
      if (req === this.productRequest) {
        this.products.set([]);
      }
    } finally {
      if (req === this.productRequest) {
        this.productsLoading.set(false);
        this.cdr.markForCheck();
      }
    }
  }

  private async loadCatalogs(forceRefresh = false): Promise<void> {
    if (forceRefresh) {
      this.business.clearCache();
    }
    try {
      const identity = this.business.identity;

      // Clients: load immediately in parallel (like Id Legal in VEN-209)
      const pClients = this.business.loadClients(forceRefresh).then(clients => {
        this.clients.set(clients);
      }).catch(e => {
        console.warn('Error loading clients:', e);
      });

      // 1. Documents
      try {
        const docs = await this.business.catalog('documents', identity, true);
        this.documents.set(docs);
        if (docs.length === 1 && !this.form.controls.DOCUMENTO.value) {
          this.selectDocument(String(docs[0].DOCUMENTO));
        }
      } catch (e) {
        console.warn('Error loading documents:', e);
      }

      // 2. Default unit, currency and specifications
      try {
        const [defaultUnit, defaultCurrency, specs] = await Promise.all([
          this.business.catalog('defaultUnit', { USUARIO: identity.USUARIO }),
          this.business.catalog('specifications', { ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'DEF_MONEDA' }),
          this.business.catalog('specifications', { ...identity, ID_APLICACION_BASE: '' })
        ]);
        if (defaultUnit.length > 0) {
          this.defaultUnit = String(defaultUnit[0].ID_UN || '');
          if (!this.form.controls.ID_UN_ITEM.value && this.defaultUnit) {
            this.form.patchValue({ ID_UN_ITEM: this.defaultUnit }, { emitEvent: false });
            void this.onUnitChanged(this.defaultUnit);
          }
        }
        if (defaultCurrency.length > 0) {
          this.defaultCurrency = String(defaultCurrency[0].VALOR_DEFECTO || '');
          if (!this.form.controls.ID_MONEDA.value && this.defaultCurrency) {
            this.form.patchValue({ ID_MONEDA: this.defaultCurrency }, { emitEvent: false });
          }
        }
        this.specifications.set(specs);
      } catch (e) {
        console.warn('Error loading defaults & specs:', e);
      }

      // 3. General catalogs: sellers, units, currencies, saleTypes
      try {
        const [sellers, units, currencies, saleTypes] = await Promise.all([
          this.business.catalog('sellers', { ESTADO: 'ACTIVO' }),
          this.business.catalog('units', { ESTADO: 'ACTIVO', ...identity }),
          this.business.catalog('currencies', { ESTADO: 'ACTIVO' }),
          this.business.catalog('saleTypes', { ID_DOMINIO: 'FACTURA', ID_GRUPO_DOMINIO: 'TIPO VENTA' })
        ]);

        await pClients;

        this.sellers.set(sellers.map(r => ({
          ...r,
          ID_ADC: String(r.ID_ADC ?? ''),
          NOMBRE_COMPLETO: String(r.NOMBRE_COMPLETO ?? ''),
          NUM_NOMBRE: String(r['NUM_NOMBRE'] ?? `${r.ID_ADC} - ${r.NOMBRE_COMPLETO ?? ''}`)
        })));
        this.units.set(units);
        this.currencies.set(currencies);
        if (saleTypes && saleTypes.length > 0) {
          this.saleTypes.set(saleTypes.map(st => String(st['VALOR2'] || st['ID_ITM_DOMINIO'] || st['TIPO_VENTA'] || '')));
        }
      } catch (e) {
        console.warn('Error loading general catalogs:', e);
      }
    } catch {
      // Non-critical fallback
    }
  }

  private async queryDocument(idDoc: string, consecutivo: number): Promise<Ven229PedidoRecord[]> {
    const prm = {
      PEDIDO: [
        { CAMPO: 'ID_DOCUMENTO', EXPRESION: idDoc, TABLA: 'Pedido' },
        { CAMPO: 'CONSECUTIVO', EXPRESION: String(consecutivo), TABLA: 'Pedido' }
      ]
    };
    const response = await this.service.query('consulta', prm).toPromise();
    return this.business.decode<Ven229PedidoRecord>(response);
  }

  // ================= Helpers =================

  money(val: number | string | null | undefined): string {
    return formatNumber(Number(val || 0), this.spec('FORMATO MONEDA')?.FORMATO || '#,##0.00');
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

    if (this.form.controls.TIPO_VENTA.value === 'CONTADO') {
      this.form.controls.PLAZO.disable({ emitEvent: false });
      this.form.controls.FECHA_PRIMER_VENC.disable({ emitEvent: false });
      this.form.controls.CUOTA_INICIAL.disable({ emitEvent: false });
    }
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const initialInput = host.querySelector<HTMLInputElement>(
        '#ven-229-documento input:not([readonly]):not([disabled]), #ven-229-id-cliente input:not([readonly]):not([disabled]), #ven-229-fecha input:not([readonly]):not([disabled])'
      );
      if (initialInput) {
        initialInput.focus();
        initialInput.select?.();
        return true;
      }
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .ven-229__form') || host;
      const candidates = formEl.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      for (const el of Array.from(candidates)) {
        if (el.offsetParent === null) continue;
        if ((el as HTMLInputElement).disabled) continue;
        const dxContainer = el.closest('.dx-widget');
        if (dxContainer) {
          if (
            dxContainer.classList.contains('dx-state-disabled') ||
            dxContainer.classList.contains('dx-state-readonly') ||
            dxContainer.getAttribute('aria-disabled') === 'true' ||
            dxContainer.getAttribute('aria-readonly') === 'true'
          ) {
            continue;
          }
        } else if ((el as HTMLInputElement).readOnly) {
          continue;
        }
        el.focus();
        if (el instanceof HTMLInputElement && typeof el.select === 'function') {
          el.select();
        }
        return true;
      }
      return false;
    };

    setTimeout(() => {
      if (!doFocus()) {
        setTimeout(doFocus, 150);
      }
    }, 100);
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
    this.addresses.set([]);
    this.products.set([]);
    this.conditions.set([]);
    this.terms.set([]);
    this.warehouses.set([]);
    this.formVersion.update(v => v + 1);
    this.cdr.markForCheck();
  }

  private showError(err: unknown): void {
    const msg = err instanceof Error ? err.message : 'Ocurrió un error en la operación.';
    this.notification.error(msg);
  }

  async showSettings(): Promise<void> {
    if (this.busy() || this.itemPending() || !this.permissions().configure) return;
    this.busy.set(true);
    try {
      this.settings.set(await this.business.catalog('settings', {
        APLICACION: this.applicationId,
        USUARIO: this.business.identity.USUARIO.toUpperCase()
      }));
      this.settingsVisible.set(true);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async executeSetting(option: Ven229Lookup): Promise<void> {
    if (this.busy()) return;
    try {
      const config = option.CONFIG ? JSON.parse(option.CONFIG) : { MODO: 'edicion' };
      if (this.readOnly() && config.MODO !== 'consulta') {
        this.notification.warning('Esta operación no está permitida en modo consulta.');
        return;
      }
      this.busy.set(true);
      const result = (await this.business.action<Ven229SettingResult>('settings', {
        ACCION: option.VALOR,
        ...this.business.identity,
        PEDIDO: this.header(),
        ITM_PEDIDO: this.items(),
        PEDIDO_PAGOS: this.payments()
      }))[0];
      if (!result) return;
      this.settingsVisible.set(false);
      if (result.tipoAccion === 'popup') {
        this.selection.set(result);
        this.selectedSettingsRows = (result.dataSource ?? []).filter(row =>
          this.payments().some(p => p.ITEM === row['ITEM'])
        );
        this.selectedSettingsKeys = this.selectedSettingsRows.map(row => row['ITEM']);
        this.selectionVisible.set(true);
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async applySelection(rows: Ven229Lookup[]): Promise<void> {
    this.selectedSettingsRows = rows;
    if (this.readOnly() || this.busy()) return;
    const selected = this.selection();
    if (!selected) return;

    if (selected.titulo === 'Anticipos a aplicar') {
      const payments = this.selectedSettingsRows as unknown as Ven229PedidoPago[];
      if (payments.reduce((sum, p) => sum + Number(p.VALOR || 0), 0) > Number(this.form.controls.TOTAL.value)) {
        this.notification.warning('El valor de los anticipos no puede superar el total del pedido.');
        return;
      }
      this.payments.set(structuredClone(payments));
      this.recalculate();
      this.workspace.setDirty(this.applicationId, true);
      this.selectionVisible.set(false);
      return;
    }

    if (selected.titulo?.toLowerCase().includes('cargar') || selected.titulo === 'Cargar Cotización' || selected.titulo === 'Cargar Pedido') {
      this.busy.set(true);
      try {
        const result = (await this.business.action<Ven229SettingResult>('load', {
          ACCION: selected.titulo,
          ...this.business.identity,
          PEDIDO: this.header(),
          ITM_PEDIDO: this.items(),
          PEDIDO_PAGOS: this.payments(),
          DATOS: this.selectedSettingsRows
        }))[0];
        if (!result) throw new Error('No se recibieron datos del pedido.');
        this.items.set(result.ITM_Pedido ?? (result['ITM_PEDIDO'] as Ven229PedidoItem[]) ?? []);
        this.taxes.set(result.DATA_GRAV?.[0]?.ENCAB ?? []);
        this.taxItems.set(result.DATA_GRAV?.[0]?.ITEMS ?? []);
        this.recalculate();
        if (this.items().length > 0) this.disableFormControls();
        this.workspace.setDirty(this.applicationId, true);
        this.selectionVisible.set(false);
      } catch (error) {
        this.showError(error);
      } finally {
        this.busy.set(false);
      }
    }
  }
}
