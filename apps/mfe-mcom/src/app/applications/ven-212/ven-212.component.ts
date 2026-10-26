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
  XteinSelectComponent,
  XteinNumberComponent,
  XteinDateComponent,
  XteinLookupComponent,
  XteinRecordViewComponent,
  XteinRecordFilterComponent,
  XteinRecordReportsComponent,
  XteinRecordSettingsComponent,
  XteinApplicationSetting,
  XteinReportEmailContext,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinRecordFilterResult,
  XteinRecordViewColumn,
  XteinGroupLabelComponent
} from '@xtein/ui';

import {
  Ven212Application,
  Ven212ToolbarCapabilities
} from './constants/ven-212.constants';

import {
  Ven212DefaultRecord,
  Ven212RecordViewColumns,
  Ven212ClientColumns,
  Ven212UnitColumns,
  Ven212CurrencyColumns,
  Ven212SellerColumns,
  Ven212WarehouseColumns,
  Ven212ConditionColumns,
  Ven212BankColumns
} from './constants/ven-212-ui.constants';

import {
  Ven212FacturaRecord,
  Ven212FacturaItem,
  Ven212FacturaGrav,
  Ven212FacturaPago
} from './models/ven-212.model';

import {
  Ven212Header,
  Ven212Lookup
} from './models/ven-212-business.model';

import { Ven212Service } from './services/ven-212.service';
import { Ven212BusinessService } from './services/ven-212-business.service';
import { Ven212ElectronicService } from './services/ven-212-electronic.service';
import { XteinVen212ItemsComponent } from './components/xtein-ven212-items/xtein-ven212-items.component';

@Component({
  selector: 'xtein-ven-212',
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
    XteinRecordSettingsComponent,
    XteinLoadingComponent,
    XteinGroupLabelComponent,
    XteinVen212ItemsComponent
  ],
  providers: [
    Ven212Service,
    Ven212BusinessService,
    Ven212ElectronicService
  ],
  templateUrl: './ven-212.component.html',
  styleUrls: ['./ven-212.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ven212Component implements OnInit, OnDestroy {
  readonly applicationId = Ven212Application.Id;
  readonly tableBase = Ven212Application.Table;

  // UI Column definitions
  readonly viewColumns: XteinRecordViewColumn[] = [...Ven212RecordViewColumns];
  readonly clientColumns = Ven212ClientColumns;
  readonly unitColumns = Ven212UnitColumns;
  readonly currencyColumns = Ven212CurrencyColumns;
  readonly sellerColumns = Ven212SellerColumns;
  readonly warehouseColumns = Ven212WarehouseColumns;
  readonly conditionColumns = Ven212ConditionColumns;
  readonly bankColumns = Ven212BankColumns;

  // Active state signals
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Ven212FacturaRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly busy = signal<boolean>(false);
  readonly itemPending = signal<boolean>(false);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);

  // Document details signals
  readonly items = signal<Ven212FacturaItem[]>([]);
  readonly taxes = signal<Ven212FacturaGrav[]>([]);
  readonly taxItems = signal<Ven212FacturaItem[]>([]);
  readonly payments = signal<Ven212FacturaPago[]>([]);

  // Catalogs signals
  readonly documents = signal<Ven212Lookup[]>([]);
  readonly clients = signal<Ven212Lookup[]>([]);
  readonly addresses = signal<Ven212Lookup[]>([]);
  readonly sellers = signal<Ven212Lookup[]>([]);
  readonly units = signal<Ven212Lookup[]>([]);
  readonly warehouses = signal<Ven212Lookup[]>([]);
  readonly currencies = signal<Ven212Lookup[]>([]);
  readonly conditions = signal<Ven212Lookup[]>([]);
  readonly banks = signal<Ven212Lookup[]>([]);
  readonly terms = signal<{ PLAZO: number }[]>([]);
  readonly saleTypes = signal<string[]>(['CONTADO', 'CREDITO', 'LIBRANZA']);
  readonly products = signal<Ven212Lookup[]>([]);
  readonly productsLoading = signal<boolean>(false);
  readonly onlyStock = signal<boolean>(false);

  // Overlays
  readonly filterVisible = signal<boolean>(false);
  readonly viewVisible = signal<boolean>(false);
  readonly reportsVisible = signal<boolean>(false);
  readonly settingsVisible = signal<boolean>(false);

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

  readonly formVersion = signal(0);

  readonly header = computed(() => {
    this.formVersion();
    return this.form.getRawValue() as Ven212Header;
  });
  readonly headerLocked = computed(() => this.items().length > 0);
  readonly advances = computed(() => this.payments().reduce((sum, p) => sum + Number(p.VALOR || p.TOTAL || 0), 0));
  readonly totalTaxes = computed(() => this.taxes().reduce((sum, t) => sum + Number(t.VALOR || 0), 0));

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO ||
    this.records().map(r => `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})`).join(' OR ')
  );

  readonly stateStyle = computed(() => {
    const estado = (this.form.controls.ESTADO.value || 'REGISTRADO').toUpperCase().trim();
    switch (estado) {
      case 'REGISTRADO':
        return { background: '#eafaf1', color: '#27ae60', border: '1px solid #a9dfbf' };
      case 'ANULADO':
        return { background: '#fdedec', color: '#c0392b', border: '1px solid #f5b7b1' };
      case 'AUTORIZADO':
        return { background: 'rgb(132, 223, 170)', color: '#065f46' };
      case 'PARCIAL':
        return { background: 'rgb(240, 152, 217)', color: '#831843' };
      case 'COMPLETADO':
        return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
      case 'EN PROCESO':
        return { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
      default:
        return { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' };
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
    const monedaValid = Boolean(h.ID_MONEDA && String(h.ID_MONEDA).trim() !== '');

    return Boolean(
      docValid &&
      clientValid &&
      fechaValid &&
      unValid &&
      adcValid &&
      condValid &&
      monedaValid &&
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
    const condId = this.form.controls.ID_CONDICION.value;
    const cond = this.conditions().find(c => c['CODIGO'] === condId || c['ID_CONDICION'] === condId);
    return String(cond?.['TIPO'] || '');
  });

  readonly persistItemBind = (row: Ven212FacturaItem): Promise<boolean> => this.persistItem(row);

  readonly currentReportFilter = computed(() => {
    const r = this.currentRecord();
    return r ? `(ID_DOCUMENTO='${r.ID_DOCUMENTO}' AND CONSECUTIVO=${r.CONSECUTIVO})` : '';
  });

  reportEmailContext(): XteinReportEmailContext {
    const h = this.header();
    return {
      defaults: {
        ASUNTO: 'Factura Comercial',
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
    ESTADO: new FormControl<string>('REGISTRADO'),
    CUFE: new FormControl<string>(''),
    FECHA_ULT_VENC: new FormControl<string | null>(null),
    BANCO: new FormControl<string>(''),
    CLIENTE_PADRE: new FormControl<string>('')
  });

  // Tracking previous condition and warehouse for confirmation dialogs
  previousCondition = '';
  previousWarehouse = '';
  private productRequest = 0;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly service: Ven212Service,
    readonly business: Ven212BusinessService,
    readonly electronic: Ven212ElectronicService,
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

    // Close overlays on tab focus change
    effect(() => {
      if (this.toolbar.activeApplicationId() !== this.applicationId) {
        this.filterVisible.set(false);
        this.viewVisible.set(false);
        this.reportsVisible.set(false);
        this.settingsVisible.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.disableFormControls();

    // Mark dirty and update formVersion on form changes
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        this.formVersion.update(v => v + 1);
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
        } else if (!clienteId && !this.readOnly()) {
          this.addresses.set([]);
          this.form.patchValue({ DIRECCION: '', NOMBRE_CLIENTE: '' }, { emitEvent: false });
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

    // Watch ADC / Seller changes to load conditions
    this.subscriptions.add(
      this.form.controls.ID_ADC.valueChanges.subscribe(adc => {
        if (!this.readOnly()) {
          void this.loadConditions();
        }
      })
    );

    // Watch sale type changes
    this.subscriptions.add(
      this.form.controls.TIPO_VENTA.valueChanges.subscribe(tipo => {
        if (!this.readOnly()) {
          if (tipo === 'CONTADO') {
            this.form.patchValue({
              PLAZO: 0,
              FECHA_PRIMER_VENC: this.form.controls.FECHA.value
            }, { emitEvent: false });
            this.form.controls.PLAZO.disable({ emitEvent: false });
            this.form.controls.FECHA_PRIMER_VENC.disable({ emitEvent: false });
            this.form.controls.CUOTA_INICIAL.disable({ emitEvent: false });
          } else {
            this.form.controls.PLAZO.enable({ emitEvent: false });
            this.form.controls.FECHA_PRIMER_VENC.enable({ emitEvent: false });
            this.form.controls.CUOTA_INICIAL.enable({ emitEvent: false });
          }
          void this.loadConditions();
        }
      })
    );

    // Watch PLAZO changes to reload products
    this.subscriptions.add(
      this.form.controls.PLAZO.valueChanges.subscribe(() => {
        if (!this.readOnly()) {
          void this.loadProducts();
        }
      })
    );

    // Watch Condition changes with confirmation if items exist
    this.subscriptions.add(
      this.form.controls.ID_CONDICION.valueChanges.subscribe(condId => {
        if (condId && !this.readOnly()) {
          void this.handleConditionChange(condId);
        }
      })
    );

    // Watch Bodega changes with confirmation if items exist
    this.subscriptions.add(
      this.form.controls.ID_UN_BODEGA.valueChanges.subscribe(bodegaId => {
        if (bodegaId && !this.readOnly()) {
          void this.handleWarehouseChange(bodegaId);
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
    const isAnulado = this.currentRecord()?.ESTADO === 'ANULADO' || this.form?.controls?.ESTADO?.value === 'ANULADO';
    const basePerms = this.permissions();
    const effectivePerms: RecordToolbarPermissions = isAnulado
      ? { ...basePerms, edit: false, delete: false }
      : basePerms;

    const state = createRecordToolbarState({
      busy: this.busy() || this.itemPending(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: effectivePerms,
      capabilities: {
        ...Ven212ToolbarCapabilities,
        edit: !isAnulado,
        delete: !isAnulado
      },
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
      case ToolbarAction.Configure:
        this.settingsVisible.set(true);
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

  newRecord(): void {
    if (this.busy() || !this.readOnly() || !this.permissions().create) return;
    this.indexBeforeNew = this.currentIndex();
    this.mode.set(RecordToolbarMode.Creating);
    this.currentIndex.set(-1);

    this.previousCondition = '';
    this.previousWarehouse = '';
    this.conditions.set([]);
    this.terms.set([]);
    this.products.set([]);

    this.items.set([]);
    this.taxes.set([]);
    this.taxItems.set([]);
    this.payments.set([]);
    this.addresses.set([]);

    this.form.reset({
      ...Ven212DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_PRIMER_VENC: this.todayDate(),
      USUARIO: this.business.identity.USUARIO
    });

    this.enableFormControls(true);
    this.formVersion.update(v => v + 1);
    void this.loadConditions();
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
  }

  editRecord(): void {
    const current = this.currentRecord();
    if (!current || this.busy() || !this.readOnly() || !this.permissions().edit) return;
    if (current.ESTADO === 'ANULADO') {
      this.notification.warning('No se puede modificar una factura anulada.');
      return;
    }

    this.mode.set(RecordToolbarMode.Editing);
    this.enableFormControls(false);
    this.formVersion.update(v => v + 1);
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

    const preparedItems = this.items().map(item => ({
      ...item,
      GRAVAMENES: [{
        ID_TASA: String((item.GRAVAMENES as any)?.ID_TASA || (Number(item.POR_IVA ?? 0) === 0 ? 'IV-000' : 'IV-GEN')),
        DESCRIPCION: String((item.GRAVAMENES as any)?.DESCRIPCION || (Number(item.POR_IVA ?? 0) === 0 ? 'Sin iva' : 'Tarifa general del IVA')),
        POR_TASA: Number(item.POR_IVA ?? 0),
        VALOR: Number(item.VALOR_IVA ?? 0)
      }]
    }));

    const payload = {
      FACTURAS: headerData,
      ITM_FACTURAS: preparedItems,
      FACTURA_GRAV: this.taxes(),
      FACTURA_GRAV_AUX: this.taxItems(),
      FACTURA_PAGOS: this.payments(),
      ID_APLICACION: this.applicationId,
      USUARIO: this.business.identity.USUARIO
    };

    this.busy.set(true);
    try {
      const response = await firstValueFrom(this.service.save(isNewRecord ? 'new' : 'update', payload));
      const decoded = this.business.decode<Ven212FacturaRecord>(response);
      const savedDoc = decoded[0] || headerData;

      this.notification.success('Factura guardada exitosamente.');
      this.workspace.setDirty(this.applicationId, false);
      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();

      // Refresh to newly saved document
      const docId = savedDoc.ID_DOCUMENTO || headerData.ID_DOCUMENTO;
      const docConsec = savedDoc.CONSECUTIVO ?? headerData.CONSECUTIVO;
      if (docId && docConsec != null) {
        try {
          const fullRecords = await this.queryDocument(docId, Number(docConsec));
          if (fullRecords.length > 0) {
            this.records.set(fullRecords);
            await this.selectRecordIndex(0);
          }
        } catch {
          // ignore query refresh error
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la factura.';
      this.notification.error(msg);
    } finally {
      this.busy.set(false);
      this.publishToolbarState();
    }
  }

  async deleteRecord(): Promise<void> {
    const current = this.currentRecord();
    if (!current || this.busy() || !this.readOnly() || !this.permissions().delete) return;

    if (current.ESTADO === 'ANULADO') {
      this.notification.warning('La factura ya se encuentra anulada.');
      return;
    }

    const result = await Swal.fire({
      title: '¿Anular Factura?',
      html: `¿Está seguro de anular la factura <b>${current.DOCUMENTO || current.ID_DOCUMENTO}</b>?`,
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
      const response = await firstValueFrom(
        this.service.delete({
          FACTURAS: {
            DOCUMENTO: current.DOCUMENTO,
            ID_DOCUMENTO: current.ID_DOCUMENTO,
            PREFIJO: current.PREFIJO || 'SIN',
            CONSECUTIVO: current.CONSECUTIVO,
            SUFIJO: current.SUFIJO || 'SIN'
          },
          DOCUMENTO: current.DOCUMENTO,
          ID_DOCUMENTO: current.ID_DOCUMENTO,
          CONSECUTIVO: current.CONSECUTIVO,
          ID_APLICACION: this.applicationId,
          USUARIO: this.business.identity.USUARIO
        })
      );

      const decoded = this.business.decode<any>(response);
      if (decoded.length > 0 && decoded[0]?.ErrMensaje) {
        this.notification.error(decoded[0].ErrMensaje);
        return;
      }

      this.notification.success('Factura anulada exitosamente.');
      const updated = { ...current, ESTADO: 'ANULADO' };
      const list = [...this.records()];
      list[this.currentIndex()] = updated;
      this.records.set(list);
      this.form.controls.ESTADO.setValue('ANULADO');
      await this.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al anular la factura.';
      this.notification.error(msg);
    } finally {
      this.busy.set(false);
      this.publishToolbarState();
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
      const msg = err instanceof Error ? err.message : 'Error al refrescar la factura.';
      this.notification.error(msg);
    }
  }

  // ================= Navigation & Records =================

  async selectRecordIndex(index: number): Promise<void> {
    const list = this.records();
    if (index < 0 || index >= list.length) return;
    const record = list[index];
    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.disableFormControls();

    this.form.reset(
      {
        ...Ven212DefaultRecord,
        ...record,
        ID_UN: record.ID_UN || record.ID_UN_ITEM || '',
        ID_UN_ITEM: record.ID_UN_ITEM || record.ID_UN || '',
        DOCUMENTO: record.DOCUMENTO || record.DOCUMENTO_FAC || '',
        DOCUMENTO_FAC: record.DOCUMENTO_FAC || record.DOCUMENTO || '',
        FECHA: record.FECHA ? String(record.FECHA).slice(0, 10) : null,
        FECHA_REGISTRO: record.FECHA_REGISTRO ? String(record.FECHA_REGISTRO).slice(0, 10) : null,
        FECHA_OC: record.FECHA_OC ? String(record.FECHA_OC).slice(0, 10) : null,
        FECHA_PRIMER_VENC: record.FECHA_PRIMER_VENC ? String(record.FECHA_PRIMER_VENC).slice(0, 10) : null,
        FECHA_ULT_VENC: record.FECHA_ULT_VENC ? String(record.FECHA_ULT_VENC).slice(0, 10) : null
      },
      { emitEvent: false }
    );
    this.formVersion.update(v => v + 1);

    this.taxes.set(record.FACTURA_GRAV || record.Factura_GRAV || []);
    this.payments.set(record.FACTURA_PAGOS || record.Factura_PAGOS || []);

    // Load additional data (items, aux taxes) if not already loaded
    if (record.ITM_FACTURA || record.ITM_Factura) {
      this.items.set(record.ITM_FACTURA || record.ITM_Factura || []);
    } else {
      await this.loadAdditionalData(record.ID_DOCUMENTO, record.CONSECUTIVO);
    }

    this.previousCondition = String(record.ID_CONDICION || '');
    this.previousWarehouse = String(record.ID_UN_BODEGA || '');
    await this.loadConditions();
    await this.loadProducts();

    this.workspace.setDirty(this.applicationId, false);
  }

  private async loadAdditionalData(idDoc: string, consecutivo: number): Promise<void> {
    try {
      const prm = { ID_DOCUMENTO: idDoc, CONSECUTIVO: consecutivo };
      const res = await this.business.catalog('additionalData', prm);
      const data = res[0];
      if (data) {
        this.items.set((data['ITM_FACTURA'] as unknown as Ven212FacturaItem[]) || []);
        this.taxItems.set((data['FACTURA_GRAV_AUX'] as unknown as Ven212FacturaItem[]) || []);
      }
    } catch {
      // Non-critical fallback
    }
  }

  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    if (this.busy() || !this.readOnly()) return;
    const total = this.records().length;
    if (total === 0) return;
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
      void this.selectRecordIndex(target);
    }
  }

  selectViewedRecord(record: unknown): void {
    this.viewVisible.set(false);
    const rec = record as Ven212FacturaRecord;
    const idx = this.records().findIndex(r => r.DOCUMENTO === rec?.DOCUMENTO);
    if (idx >= 0) {
      void this.selectRecordIndex(idx);
    }
  }

  async searchRecords(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    this.busy.set(true);
    try {
      const prm = { FACTURA: result?.ESTRUCTURA ?? [] };
      const response = await firstValueFrom(this.service.query('consulta', prm));
      const facturas = this.business.decode<Ven212FacturaRecord>(response);
      const mapped = facturas.map(r => {
        const docVal = String(r.DOCUMENTO_FAC || r.DOCUMENTO || `${r.ID_DOCUMENTO}-${r.CONSECUTIVO}`).trim();
        const unVal = String(r.ID_UN_ITEM || r.ID_UN || '').trim();
        return { ...r, DOCUMENTO: docVal, DOCUMENTO_FAC: docVal, ID_UN_ITEM: unVal, ID_UN: unVal };
      });
      if (mapped.length > 0) {
        this.records.set(mapped);
        await this.selectRecordIndex(0);
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

  async persistItem(row: Ven212FacturaItem): Promise<boolean> {
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

  async applyItems(updatedItems: Ven212FacturaItem[], option?: string): Promise<void> {
    this.busy.set(true);
    try {
      const taxResults = await this.business.taxes(this.header(), updatedItems, option);
      const tax = taxResults[0];
      this.items.set(updatedItems);
      this.taxes.set(tax?.ENCAB ?? []);
      this.taxItems.set(tax?.ITEMS ?? []);
      this.recalculate();
      if (!this.readOnly()) this.workspace.setDirty(this.applicationId, true);
    } finally {
      this.busy.set(false);
    }
  }

  recalculate(): void {
    const subtotal = this.items().reduce((sum, item) => sum + Number(item.SUB_TOTAL || 0), 0);
    const totalTaxes = this.taxes().reduce((sum, tax) => sum + Number(tax.VALOR || 0), 0);
    const discounts = this.items().reduce((sum, item) => sum + Number(item.VALOR_DESCUENTO || 0), 0);
    const total = subtotal - discounts + totalTaxes;

    this.form.patchValue(
      {
        SUB_TOTAL: subtotal,
        VALOR_DESCUENTO: discounts,
        TOTAL: total
      },
      { emitEvent: false }
    );
  }

  // ================= Catalog Handlers =================

  async onClientChanged(clienteId: string): Promise<void> {
    const cli = this.clients().find(c => c.ID_CLIENTE === clienteId);
    if (cli) {
      this.form.patchValue(
        {
          NOMBRE_CLIENTE: String(cli.NOMBRE_COMPLETO || cli.NOMBRE || '')
        },
        { emitEvent: false }
      );
    }

    try {
      const addresses = await this.business.catalog('addresses', { ID_CLIENTE: clienteId });
      this.addresses.set(addresses || []);
      if (addresses && addresses.length > 0) {
        const preferred = addresses.find((a: any) => a.TIPO_DIRECCION && String(a.TIPO_DIRECCION).toLowerCase().includes('cobro')) || addresses[0];
        this.form.patchValue({ DIRECCION: String(preferred.DIRECCION || '') }, { emitEvent: false });
      } else {
        this.form.patchValue({ DIRECCION: '' }, { emitEvent: false });
        if (!this.readOnly()) {
          this.notification.warning('No se encontró una dirección del Tipo: Cobro');
        }
      }
    } catch {
      this.addresses.set([]);
      this.form.patchValue({ DIRECCION: '' }, { emitEvent: false });
      if (!this.readOnly()) {
        this.notification.warning('No se encontró una dirección del Tipo: Cobro');
      }
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
        this.form.patchValue({ ID_CONDICION: newCond }, { emitEvent: false });
        await this.onConditionChanged(newCond);
      } else {
        this.form.controls.ID_CONDICION.setValue(this.previousCondition, { emitEvent: false });
        return;
      }
    } else {
      this.previousCondition = newCond;
      this.form.patchValue({ ID_CONDICION: newCond }, { emitEvent: false });
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
        this.form.patchValue({ ID_UN_BODEGA: newBodega }, { emitEvent: false });
        await this.loadProducts();
      } else {
        this.form.controls.ID_UN_BODEGA.setValue(this.previousWarehouse, { emitEvent: false });
        return;
      }
    } else {
      this.previousWarehouse = newBodega;
      this.form.patchValue({ ID_UN_BODEGA: newBodega }, { emitEvent: false });
      await this.loadProducts();
    }
  }

  async loadConditions(): Promise<void> {
    const adc = this.form.controls.ID_ADC.value;
    const tipo = this.form.controls.TIPO_VENTA.value || 'CONTADO';
    if (!adc) {
      this.conditions.set([]);
      return;
    }
    try {
      const raw = await this.business.catalog('conditions', {
        ID_ADC: adc,
        TIPO_VENTA: tipo,
        ESTADO: 'ACTIVO'
      }, true);
      const rows = raw.map(r => {
        const code = String(r['CODIGO'] ?? r['ID_CONDICION'] ?? '');
        const desc = String(r['NOMBRE'] ?? r['DESCRIPCION'] ?? code);
        return {
          ...r,
          CODIGO: code,
          ID_CONDICION: code,
          NOMBRE: desc,
          DESCRIPCION: desc
        };
      }).filter(r => r.CODIGO && r.CODIGO !== 'null');

      this.conditions.set(rows);

      if (raw.length > 0 && raw[0]['CODIGO'] === null) {
        this.notification.warning('El Vendedor seleccionado no tiene Condiciones de Venta asociadas');
      }

      const current = this.form.controls.ID_CONDICION.value;
      if (rows.length === 1 && (!current || !rows.some(r => r.CODIGO === current))) {
        this.form.patchValue({ ID_CONDICION: rows[0].CODIGO });
      } else if (current && !rows.some(r => r.CODIGO === current)) {
        this.form.patchValue({ ID_CONDICION: '' });
        this.terms.set([]);
      }
    } catch {
      this.conditions.set([]);
    }
  }

  async onConditionChanged(condId: string): Promise<void> {
    const cond = this.conditions().find(c => c['CODIGO'] === condId || c['ID_CONDICION'] === condId);
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
          plazoList = plazosRaw
            .split(',')
            .map(p => ({ PLAZO: parseInt(p.trim(), 10) }))
            .filter(p => !isNaN(p.PLAZO));
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
        }, { emitEvent: false });
      } else {
        if (cond['DIAS_VENC']) {
          const fechaBase = this.form.controls.FECHA.value ? new Date(this.form.controls.FECHA.value + 'T00:00:00') : new Date();
          fechaBase.setDate(fechaBase.getDate() + Number(cond['DIAS_VENC']));
          const vencStr = [
            fechaBase.getFullYear(),
            String(fechaBase.getMonth() + 1).padStart(2, '0'),
            String(fechaBase.getDate()).padStart(2, '0')
          ].join('-');
          this.form.patchValue({ FECHA_PRIMER_VENC: vencStr }, { emitEvent: false });
        }
        if (plazoList.length === 1) {
          this.form.patchValue({ PLAZO: plazoList[0].PLAZO }, { emitEvent: false });
        }
      }
    }
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

  async refreshClients(): Promise<void> {
    try {
      const clients = await this.business.loadClients(true);
      this.clients.set(clients);
    } catch (e) {
      console.warn('Error refreshing clients in VEN-212:', e);
    }
  }

  private async loadCatalogs(forceRefresh = false): Promise<void> {
    if (forceRefresh) {
      this.business.clearCache();
    }
    try {
      // Clients: load immediately in parallel (like Id Legal in VEN-209)
      const pClients = this.business.loadClients(forceRefresh).then(clients => {
        this.clients.set(clients);
      }).catch(e => {
        console.warn('Error loading clients in VEN-212:', e);
      });

      const [docs, sellers, units, currencies, banks, defaultUnit] = await Promise.all([
        this.business.catalog('documents', { ID_APLICACION: this.applicationId, USUARIO: this.business.identity.USUARIO }),
        this.business.catalog('sellers', { ESTADO: 'ACTIVO' }),
        this.business.catalog('units', { ESTADO: 'ACTIVO', USUARIO: this.business.identity.USUARIO, ID_APLICACION: this.applicationId }),
        this.business.catalog('currencies', { ESTADO: 'ACTIVO' }),
        this.business.catalog('bancos', { ID_APLICACION: 'FIN-012', USUARIO: this.business.identity.USUARIO }),
        this.business.catalog('defaultUnit', { USUARIO: this.business.identity.USUARIO })
      ]);

      await pClients;

      this.documents.set(docs);
      this.sellers.set(sellers);
      this.units.set(units);
      this.currencies.set(currencies);
      this.banks.set(banks);

      if (defaultUnit.length > 0 && !this.form.controls.ID_UN_ITEM.value) {
        this.form.patchValue({ ID_UN_ITEM: String(defaultUnit[0].ID_UN || '') }, { emitEvent: false });
      }
    } catch {
      // Non-critical fallback
    }
  }

  private async queryDocument(idDoc: string, consecutivo: number): Promise<Ven212FacturaRecord[]> {
    const prm = {
      FACTURA: [
        { CAMPO: 'ID_DOCUMENTO', EXPRESION: idDoc, TABLA: 'FACTURA' },
        { CAMPO: 'CONSECUTIVO', EXPRESION: String(consecutivo), TABLA: 'FACTURA' }
      ]
    };
    const response = await firstValueFrom(this.service.query('consulta', prm));
    const rows = this.business.decode<Ven212FacturaRecord>(response);
    return rows.map(r => {
      const docVal = String(r.DOCUMENTO_FAC || r.DOCUMENTO || `${r.ID_DOCUMENTO}-${r.CONSECUTIVO}`).trim();
      return { ...r, DOCUMENTO: docVal, DOCUMENTO_FAC: docVal };
    });
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
    this.form.controls.CUFE.disable({ emitEvent: false });
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
        '#ven-212-documento input:not([readonly]):not([disabled]), #ven-212-id-cliente input:not([readonly]):not([disabled]), #ven-212-fecha input:not([readonly]):not([disabled])'
      );
      if (initialInput) {
        initialInput.focus();
        initialInput.select?.();
        return true;
      }
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .ven-212__form') || host;
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
      ...Ven212DefaultRecord,
      FECHA: this.todayDate(),
      FECHA_REGISTRO: this.todayDate(),
      FECHA_PRIMER_VENC: this.todayDate()
    });
    this.items.set([]);
    this.taxes.set([]);
    this.payments.set([]);
    this.formVersion.update(v => v + 1);
  }

  onSettingSelected(setting: XteinApplicationSetting): void {
    const optionName = setting.VALOR || setting.text || '';
    this.notification.info(`Opción seleccionada: ${optionName}`);
  }
}
