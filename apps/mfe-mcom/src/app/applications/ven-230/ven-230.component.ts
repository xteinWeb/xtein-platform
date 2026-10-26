import { XteinLookupComponent, XteinGroupLabelComponent } from '@xtein/ui';
import { XteinPopupComponent, XteinDataGridComponent, XteinLabelComponent } from '@xtein/ui';
import { Ven230ElectronicQrEndpoint } from './constants/ven-230-electronic.constants';
import { Ven230SelectionComponent } from './components/ven-230-selection/ven-230-selection.component';
import { formatNumber } from 'devextreme/localization';
import { Ven230ElectronicService } from './services/ven-230-electronic.service';
import { Ven230ElectronicDocument, Ven230ElectronicView } from './models/ven-230-electronic.model';
import { Ven230BusinessService } from './services/ven-230-business.service';
import { Ven230Lookup, Ven230Details, Ven230SettingResult, Ven230TaxResult, Ven230Header } from './models/ven-230-business.model';
import { Ven230PrefacturaGrav, Ven230PrefacturaPago } from './models/ven-230.model';
import { Ven230ItemsComponent } from './components/ven-230-items/ven-230-items.component';
import { XteinButtonComponent } from '@xtein/ui';
import { ElementRef, ChangeDetectorRef } from '@angular/core';
import {
  untracked,
  computed,
  effect,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
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
  Observable,
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
  XteinRecordFilterComponent,
  XteinRecordFilterResult,
  XteinRecordViewComponent,
  XteinRecordReportsComponent,
  XteinDateComponent,
  XteinInputComponent,
  XteinNumberComponent,
  XteinSelectComponent,
  XteinLoadingComponent,
  XteinNotificationService
} from '@xtein/ui';

import {
  Ven230Application
} from './constants/ven-230.constants';

import {
  Ven230DefaultRecord,
  Ven230RecordViewColumns,
  Ven230ToolbarCapabilities,
  Ven230ClientColumns,
  Ven230UnitColumns,
  Ven230CurrencyColumns,
  Ven230SellerColumns,
  Ven230WarehouseColumns,
  Ven230ConditionColumns
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
  selector: 'ven-230',

  standalone:
    true,

  imports: [XteinLookupComponent,XteinPopupComponent, XteinDataGridComponent, XteinLabelComponent, XteinGroupLabelComponent,
    CommonModule, Ven230SelectionComponent, Ven230ItemsComponent, XteinButtonComponent, ReactiveFormsModule,
    XteinRecordFilterComponent,
    XteinRecordViewComponent,
    XteinRecordReportsComponent,
    XteinDateComponent,
    XteinInputComponent,
    XteinNumberComponent,
    XteinSelectComponent,
    XteinLoadingComponent
  ],

  providers: [
    Ven230Service, Ven230BusinessService, Ven230ElectronicService
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
  readonly clientColumns = Ven230ClientColumns;
  readonly unitColumns = Ven230UnitColumns;
  readonly currencyColumns = Ven230CurrencyColumns;
  readonly sellerColumns = Ven230SellerColumns;
  readonly warehouseColumns = Ven230WarehouseColumns;
  readonly conditionColumns = Ven230ConditionColumns;


  readonly applicationId =
    Ven230Application.Id;

  readonly tableBase =
  Ven230Application.Table;

  /**
   * Internal subscription manager.
   */
  private readonly subscriptions =
    new Subscription();

  /**
   * Available document status options.
   */


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

  /** Catalog options exposed to the commercial parameter selectors. */
  readonly unidadesNegocioOptions =
    computed(() => this.dataLists().unidadesNegocio ?? []);

  readonly monedasOptions =
    computed(() => this.dataLists().monedas ?? []);

  readonly condicionesOptions =
    computed(() => this.dataLists().condiciones ?? []);

  readonly bodegasOptions =
    computed(() => this.dataLists().bodegas ?? []);

  readonly tipoVentaOptions =
    computed(() => {
      const options = this.dataLists().tiposVenta;
      return options ?? [];
    });

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

  readonly isEditing = computed(() => this.mode() === RecordToolbarMode.Editing || this.mode() === RecordToolbarMode.Creating);
  readonly isNew = computed(() => this.mode() === RecordToolbarMode.Creating);

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
  readonly queryFilter = computed(() => this.records()[0]?.QFILTRO || this.records().map(record => '('+this.recordFilter(record)+')').join(' OR '));

  readonly formVersion = signal(0);

  readonly stateStyle = computed<Record<string, string>>(() => {
    this.formVersion();
    const estado = String(this.form?.controls?.ESTADO?.value || '').toUpperCase().trim();
    try {
      const styles = JSON.parse(this.spec('ESTILOS ESTADO')?.VALOR_DEFECTO || '[]');
      const match = styles.find((s: Record<string, string>) => String(s['ESTADO'] || '').toUpperCase() === estado);
      if (match) {
        const color = match['color'] || match['COLOR'];
        const background = match['background'] || match['BG'];
        const res: Record<string, string> = {};
        if (color) res['color'] = color;
        if (background) res['background'] = background;
        return res;
      }
    } catch {}
    switch (estado) {
      case 'REGISTRADO': return { background: '#e8f5e8', color: '#2e7d32', border: '1px solid #c8e6c9' };
      case 'AUTORIZADO': return { background: 'rgb(132, 223, 170)', color: '#065f46' };
      case 'PARCIAL': return { background: 'rgb(240, 152, 217)', color: '#831843' };
      case 'ANULADO': return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' };
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
    const condId = String(this.form?.controls?.ID_CONDICION?.value || '').trim();
    if (!condId) return 'CONDICION';
    const cond = this.conditions().find(c =>
      String(c['CODIGO'] || c['ID_CONDICION'] || '').trim() === condId
    );
    const tipo = String(cond?.['TIPO'] || '').trim().toUpperCase();
    return tipo === 'LISTA' ? 'LISTA' : 'CONDICION';
  });

  readonly persistItemBind = (row: Ven230PrefacturaItem): Promise<boolean> => this.persistItem(row);

  onItemPending(pending: boolean): void {
    this.itemPending.set(pending);
    if (pending) {
      this.disableFormControls();
      this.workspace.setDirty(this.applicationId, true);
    } else if (!this.readOnly()) {
      this.enableFormControls();
    }
  }
  private recordFilter(record: Ven230PrefacturaRecord): string {
    return " PREFACTURA.ID_DOCUMENTO = '"+String(record.ID_DOCUMENTO).replace(/'/g,"''")+"' AND PREFACTURA.CONSECUTIVO = "+Number(record.CONSECUTIVO);
  }
  reportEmailContext() {
    const h=this.header();return {defaults:{ASUNTO:this.spec('ASUNTO EMAIL')?.VALOR_DEFECTO ?? '',
      ORIGEN_EMAIL:this.spec('EMAIL USUARIO')?.VALOR_DEFECTO ?? '',ORIGEN:String(this.spec('EMAIL USUARIO')?.['TITULO'] ?? ''),
      DESTINO:h.NOMBRE_CLIENTE ?? '',DESTINO_EMAIL:String(this.clients().find(c=>c.ID_CLIENTE===h.ID_CLIENTE)?.['EMAIL'] ?? '')},
      template:this.spec('TEMPLATE')?.VALOR_DEFECTO ?? '',replacements:{...h}};
  }

  /**
   * Reactive form definition.
   */
  readonly form = new FormGroup({
    DOCUMENTO: new FormControl<string>(''),
    ID_DOCUMENTO: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    PREFIJO: new FormControl<string>(''),
    CONSECUTIVO: new FormControl<number>(0),
    SUFIJO: new FormControl<string>(''),
    FECHA: new FormControl<string>(this.localDate(), { nonNullable: true, validators: [Validators.required] }),
    FECHA_REGISTRO: new FormControl<string | null>(this.localDate()),
    ESTADO: new FormControl<string>('REGISTRADO', { nonNullable: true, validators: [Validators.required] }),
    USUARIO: new FormControl<string>(''),
    ID_CLIENTE: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    NOMBRE_CLIENTE: new FormControl<string>(''),
    DIRECCION: new FormControl<string>(''),
    ID_UBICACION: new FormControl<string>(''),
    ID_ADC: new FormControl<string>(''),
    ID_UN: new FormControl<string>(''),
    ID_UN_ITEM: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    VALOR_CUOTA: new FormControl<number>(0),
    ID_MONEDA: new FormControl<string>(''),
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
    readonly business: Ven230BusinessService,
    private readonly electronicService: Ven230ElectronicService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService,
    private readonly elementRef: ElementRef,
    private readonly cdr: ChangeDetectorRef
  ) {
    // Synchronize toolbar state whenever mode, index, records, loading or permissions change.
    effect(() => {
      this.publishToolbarState();
    });
    effect(() => {
      if (this.toolbar.activeApplicationId() !== this.applicationId) {
        this.filterVisible.set(false);
        this.viewVisible.set(false);
        this.reportsVisible.set(false);
        this.settingsVisible.set(false);
        this.selectionVisible.set(false);
        this.electronicVisible.set(false);
        this.itemEditor?.closeProductSearch();
      }
    });
  }

  ngOnInit(): void {
    this.disableFormControls();
    this.subscriptions.add(this.form.valueChanges.subscribe(() => {
      if (!this.readOnly()) this.workspace.setDirty(this.applicationId, true);
    }));

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
    this.bindBusinessFields();
    void this.loadDataLists();    
  }

  ngOnDestroy(): void {
    this.detailVersion++;
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  /**
   * Publishes the current state to the platform toolbar.
   */
  private publishToolbarState(): void {
    const isAnulado = this.currentRecord()?.ESTADO === 'ANULADO' || this.form?.controls?.ESTADO?.value === 'ANULADO';
    const basePerms = this.permissions();
    const effectivePerms: RecordToolbarPermissions = isAnulado
      ? { ...basePerms, edit: false, delete: false }
      : basePerms;

    const state = createRecordToolbarState({
      busy: this.loading() || this.itemPending(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: effectivePerms,
      capabilities: {
        ...Ven230ToolbarCapabilities,
        edit: this.detailsReady() && !isAnulado,
        delete: !isAnulado
      },
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
  }

  /**
   * Generates single-record SQL filter expression for reports.
   */
  currentReportFilter(): string {
    const record = this.currentRecord();
    return record ? this.recordFilter(record) : '';
  }

  /**
   * Handles incoming toolbar commands.
   */
  private handleToolbarCommand(command: ToolbarCommand): void {
    if (this.loading() || (this.itemPending() && command.action !== ToolbarAction.Cancel)) return;
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
        void this.cancelEdit();
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

      case ToolbarAction.GoTo:
        if (this.readOnly() && typeof command.payload === 'number' && Number.isInteger(command.payload)
          && command.payload >= 1 && command.payload <= this.records().length) {
          this.selectRecordIndex(command.payload - 1);
        }
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

      case ToolbarAction.Configure:
        void this.showSettings();
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
    async newRecord(): Promise<void> {
    if (this.loading() || !this.readOnly() || !this.permissions().create) return;
    this.loading.set(true);
    try {
      const documents=await this.business.catalog('documents',this.business.identity);
      this.documents.set(documents);
      this.form.reset({
        ...Ven230DefaultRecord,
        FECHA: this.localDate(),
        FECHA_REGISTRO: this.localDate(),
        FECHA_PRIMER_VENC: this.localDate(),
        USUARIO: this.business.identity.USUARIO,
        ID_UN_ITEM: this.defaultUnit,
        ID_MONEDA: this.defaultCurrency,
        TIPO_VENTA: 'CONTADO',
        PLAZO: 0,
        CUOTA_INICIAL: 0,
        ESTADO: 'REGISTRADO'
      }, { emitEvent: false });
      this.items.set([]);
      this.taxes.set([]);
      this.taxItems.set([]);
      this.payments.set([]);
      this.addresses.set([]);
      this.headerLocked.set(false);
      this.previousCondition = '';
      this.previousWarehouse = '';
      this.products.set([]);
      this.conditions.set([]);
      this.terms.set([]);
      this.enableFormControls();
      if (documents.length === 1) this.selectDocument(String(documents[0].DOCUMENTO));
      await this.loadWarehouses();
      this.workspace.setDirty(this.applicationId, false);
      this.focusFirstControl();
    } catch(error){this.showError(error);} finally{this.loading.set(false);}
  }

  /**
   * Switches to edit mode for the current record.
   */
    editRecord(): void {
    if(this.loading() || !this.readOnly() || !this.permissions().edit || !this.currentRecord() || !this.detailsReady() || this.currentRecord()?.ESTADO==='ANULADO')return;
    this.mode.set(RecordToolbarMode.Editing);this.enableFormControls();this.workspace.setDirty(this.applicationId,false);
  }

  /**
   * Cancels current creation or edit operation.
   */
  async cancelEdit(): Promise<void> {
    if (this.loading() || this.readOnly()) return;
    const dirty = this.workspace.getTab(this.applicationId)?.dirty ?? false;
    const confirmation = await Swal.fire({
      title: this.workspace.getApplicationTitle(this.applicationId),
      text: dirty ? '¿Desea cancelar sin guardar cambios?' : '¿Desea cancelar la operación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, cancelar'
    });
    if (!confirmation.isConfirmed) return;
    this.itemEditor?.cancel();
    this.headerLocked.set(false);
    this.itemPending.set(false);
    this.mode.set(
      this.records().length
        ? RecordToolbarMode.Browsing
        : RecordToolbarMode.Initial
    );
    this.disableFormControls();
    const current = this.currentRecord();
    if (current) {
      this.populateForm(current);
      void this.loadAdditionalData(current);
    } else {
      this.clearRecord();
    }
    this.workspace.setDirty(this.applicationId, false);
  }

  /**
   * Saves the current record (new or update).
   */
  async saveRecord(): Promise<void> {
    if (this.loading() || this.readOnly() || this.itemPending()) return;
    const header = this.header();
    const message = this.business.validate(header, this.items());
    if (message) {
      this.form.markAllAsTouched();
      this.notification.warning(message);
      return;
    }
    this.loading.set(true);
    try {
      const preparedItems = this.items().map(item => {
        const porIva = Number(item.POR_IVA != null ? item.POR_IVA : (Number(item.PORC_IVA || 0) * 100));
        const subTotal = Number(item.SUB_TOTAL || 0);
        const discount = Number(item.VALOR_DESCUENTO || 0);
        const base = subTotal - discount;
        const valorIva = Number(item.VALOR_IVA != null ? item.VALOR_IVA : (base * (porIva / 100)));

        let taxObj: Record<string, unknown> | null = null;
        if (item.GRAV_ORG && typeof item.GRAV_ORG === 'object' && !Array.isArray(item.GRAV_ORG) && 'ID_TASA' in item.GRAV_ORG) {
          taxObj = item.GRAV_ORG as Record<string, unknown>;
        } else if (item.GRAVAMENES && typeof item.GRAVAMENES === 'object' && !Array.isArray(item.GRAVAMENES) && 'ID_TASA' in item.GRAVAMENES) {
          taxObj = item.GRAVAMENES as Record<string, unknown>;
        } else if (Array.isArray(item.GRAVAMENES) && item.GRAVAMENES.length > 0 && typeof item.GRAVAMENES[0] === 'object') {
          taxObj = item.GRAVAMENES[0] as Record<string, unknown>;
        }

        const idTasa = (taxObj?.['ID_TASA'] as string) || (porIva === 0 ? 'IV-000' : 'IV-GEN');
        const descTasa = (taxObj?.['DESCRIPCION'] as string) || (porIva === 0 ? 'Sin iva' : 'Tarifa general del IVA');

        const cleanTax = {
          ID_TASA: idTasa,
          DESCRIPCION: descTasa,
          POR_TASA: porIva,
          PORCENTAJE: porIva,
          VALOR: valorIva,
          VALOR_BASE: base
        };

        return {
          ...item,
          APLICACION: 2,
          VALOR_IVA: valorIva,
          POR_IVA: porIva,
          PORC_IVA: porIva / 100,
          TOTAL: base + valorIva,
          GRAV_ORG: cleanTax,
          GRAVAMENES: [cleanTax]
        };
      });

      const auxItems = (this.taxItems()?.length ? this.taxItems() : preparedItems.map(item => ({
        ITEM: item.ITEM,
        PRODUCTO: item.PRODUCTO,
        SUB_TOTAL: item.SUB_TOTAL,
        GRAV_TOTAL: [{
          ITEM: item.ITEM,
          ID_TASA: (item.GRAV_ORG as any)?.ID_TASA || 'IV-GEN',
          POR_TASA: Number(item.POR_IVA ?? 0),
          VALOR: Number(item.VALOR_IVA ?? 0)
        }]
      })));

      const payload = {
        PREFACTURAS: header,
        ITM_PREFACTURAS: preparedItems,
        PREFACTURA_GRAV: this.taxes(),
        PREFACTURA_GRAV_AUX: auxItems,
        PREFACTURA_PAGOS: this.payments(),
        ...this.business.identity
      };

      const isNew = this.mode() === RecordToolbarMode.Creating;
      const result = this.business.decode<Partial<Ven230PrefacturaRecord>>(
        await firstValueFrom(isNew ? this.service.create(payload) : this.service.update(payload))
      )[0];
      if (!result) throw new Error('El servidor no devolvió el resultado del guardado.');

      const saved = {
        ...header,
        ...result,
        ESTADO: result.ESTADO || header.ESTADO || 'REGISTRADO',
        DOCUMENTO: result.DOCUMENTO || header.DOCUMENTO,
        DOCUMENTO_FAC: result.DOCUMENTO || header.DOCUMENTO,
        PREFACTURA_GRAV: structuredClone(this.taxes()),
        PREFACTURA_PAGOS: structuredClone(this.payments())
      } as Ven230PrefacturaRecord;

      const list = [...this.records()];
      let index = this.currentIndex();
      if (isNew) {
        index = list.length;
        list.push(saved);
      } else {
        list[index] = saved;
      }
      this.records.set(list);
      this.currentIndex.set(index);
      this.populateForm(saved);

      // Refresh to newly saved document from DB
      const docId = result.ID_DOCUMENTO || header.ID_DOCUMENTO;
      const docConsec = result.CONSECUTIVO ?? header.CONSECUTIVO;
      if (docId && docConsec != null) {
        try {
          const fullRecords = await this.queryDocument(docId, Number(docConsec));
          if (fullRecords.length > 0) {
            this.records.set(fullRecords);
            await this.selectRecordIndex(0);
          }
        } catch {
          // ignore query refresh errors
        }
      }

      this.detailsReady.set(true);
      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();
      this.workspace.setDirty(this.applicationId, false);
      this.notification.success('Prefactura guardada correctamente.');
    } catch(error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Prompts confirmation and cancels the active prefactura.
   */
  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete) return;

    if (record.ESTADO === 'ANULADO') {
      this.notification.warning('La prefactura ya se encuentra anulada.');
      return;
    }

    const confirmation = await Swal.fire({
      title: '¿Anular Prefactura?',
      html: `¿Está seguro de anular la prefactura <b>${record.DOCUMENTO || record.ID_DOCUMENTO}</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#0F4C81',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.loading.set(true);

    try {
      const prm = {
        PREFACTURAS: {
          ID_DOCUMENTO: record.ID_DOCUMENTO,
          PREFIJO: record.PREFIJO || 'SIN',
          CONSECUTIVO: record.CONSECUTIVO,
          SUFIJO: record.SUFIJO || 'SIN'
        },
        DOCUMENTO: record.DOCUMENTO,
        ID_DOCUMENTO: record.ID_DOCUMENTO,
        CONSECUTIVO: record.CONSECUTIVO,
        ID_APLICACION: this.applicationId,
        USUARIO: this.business.identity.USUARIO
      };

      const response = await firstValueFrom(this.service.delete(prm));
      const decoded = this.business.decode<any>(response);
      if (decoded.length > 0 && decoded[0]?.ErrMensaje) {
        this.notification.error(decoded[0].ErrMensaje);
        return;
      }

      this.notification.success('Prefactura anulada correctamente.');
      await this.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al anular la prefactura.';
      this.notification.error(message);
    } finally {
      this.loading.set(false);
      this.publishToolbarState();
    }
  }

  private async queryDocument(idDoc: string, consecutivo: number): Promise<Ven230PrefacturaRecord[]> {
    const prm = {
      PREFACTURA: [
        { CAMPO: 'ID_DOCUMENTO', EXPRESION: idDoc, TABLA: 'Prefactura' },
        { CAMPO: 'CONSECUTIVO', EXPRESION: String(consecutivo), TABLA: 'Prefactura' }
      ]
    };
    const response = await firstValueFrom(this.service.getRecords(prm));
    const rows = this.business.decode<Ven230PrefacturaRecord>(response);
    return rows.map(r => {
      const docVal = String(r.DOCUMENTO_FAC || r.DOCUMENTO || `${r.ID_DOCUMENTO}-${r.CONSECUTIVO}`).trim();
      return { ...r, DOCUMENTO: docVal, DOCUMENTO_FAC: docVal };
    });
  }

  /**
   * Refreshes the active view or dataset.
   */
  async refresh(): Promise<void> {
    if (this.loading() || !this.readOnly()) return;
    const current = this.currentRecord();
    if (!current) return;
    this.loading.set(true);
    try {
      const refreshed = await this.queryDocument(current.ID_DOCUMENTO, current.CONSECUTIVO);
      if (refreshed.length > 0) {
        const list = [...this.records()];
        list[this.currentIndex()] = refreshed[0];
        this.records.set(list);
        this.populateForm(refreshed[0]);
        this.formVersion.update(v => v + 1);
        await this.loadAdditionalData(refreshed[0]);
      }
    } catch (err) {
      console.error('Error refreshing prefactura:', err);
    } finally {
      this.loading.set(false);
      this.publishToolbarState();
    }
  }

  /**
   * Searches records matching a filter string or query object.
   */
  async searchRecords(filter: string | XteinRecordFilterResult): Promise<void> {
    if (typeof filter !== 'string' && (this.loading() || !this.readOnly() || !this.permissions().search)) return;
    this.filterVisible.set(false);
    this.loading.set(true);
    try {
      const criteria = typeof filter === 'string' ? this.lastCriteria : filter.ESTRUCTURA;
      const list = this.business.decode<Ven230PrefacturaRecord>(await firstValueFrom(this.service.getRecords({ PREFACTURA: criteria }))).map(row => {
        const docVal = String(row.DOCUMENTO_FAC || row.DOCUMENTO || `${row.ID_DOCUMENTO}-${row.CONSECUTIVO}`).trim();
        return { ...row, DOCUMENTO: docVal, DOCUMENTO_FAC: docVal };
      });
      this.lastCriteria = criteria;
      this.records.set(list);
      if (list.length) {
        const selected = typeof filter === 'string' ? this.records().findIndex(r => r.DOCUMENTO === filter) : 0;
        await this.selectRecordIndex(Math.max(0, selected));
      } else {
        this.clearRecord();
        this.notification.warning('No se encontraron registros.');
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Selects a record by its index and loads additional line items.
   */
  async selectRecordIndex(index: number): Promise<void> {
    const record = this.records()[index];
    if (!record) return;
    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.disableFormControls();
    this.previousCondition = String(record.ID_CONDICION || '');
    this.previousWarehouse = String(record.ID_UN_BODEGA || '');
    this.workspace.setDirty(this.applicationId, false);
    this.populateForm(record);
    this.documents.set([{ DOCUMENTO: record.DOCUMENTO_FAC || record.DOCUMENTO, ID_DOCUMENTO: record.ID_DOCUMENTO, CONSECUTIVO: record.CONSECUTIVO }]);
    this.headerLocked.set(false);
    this.formVersion.update(v => v + 1);
    this.cdr.markForCheck();
    await this.loadAdditionalData(record);
  }

  /**
   * Selects a record chosen from the XteinRecordView modal.
   */
  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    this.viewVisible.set(false);
    const rec = record as Ven230PrefacturaRecord;
    const docVal = String(rec?.DOCUMENTO_FAC || rec?.DOCUMENTO || `${rec?.ID_DOCUMENTO}-${rec?.CONSECUTIVO}`).trim();
    const foundIndex = this.records().findIndex(r =>
      r.DOCUMENTO === docVal ||
      r.DOCUMENTO_FAC === docVal ||
      (r.ID_DOCUMENTO === rec?.ID_DOCUMENTO && Number(r.CONSECUTIVO) === Number(rec?.CONSECUTIVO))
    );

    if (foundIndex >= 0) {
      void this.selectRecordIndex(foundIndex);
    }
  }

  /**
   * Handles toolbar record navigation.
   */
  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    if (this.loading() || !this.readOnly()) return;
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
    this.form.reset({
      ...Ven230DefaultRecord,
      DOCUMENTO: record.DOCUMENTO_FAC || record.DOCUMENTO || '',
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
      ID_UN_ITEM: record.ID_UN_ITEM || '',
      VALOR_CUOTA: record.VALOR_CUOTA ?? 0,
      ID_MONEDA: record.ID_MONEDA || '',
      TASA_CAMBIO: record.TASA_CAMBIO || 1,
      ID_CONDICION: record.ID_CONDICION || '',
      PLAZO: record.PLAZO || 0,
      TIPO_VENTA: record.TIPO_VENTA || '',
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
    }, { emitEvent: false });
  }

  /**
   * Loads line items and additional details for a prefactura.
   */
    private async loadAdditionalData(record: Ven230PrefacturaRecord): Promise<void> {
    const version=++this.detailVersion;this.loading.set(true);this.detailsReady.set(false);
    this.items.set([]);this.taxItems.set([]);this.taxes.set(record.PREFACTURA_GRAV ?? record.Prefactura_GRAV ?? []);
    this.payments.set(record.PREFACTURA_PAGOS ?? record.Prefactura_PAGOS ?? []);
    try {
      const rows=this.business.decode<Ven230Details>(await firstValueFrom(this.service.getAdditionalData({ID_DOCUMENTO:record.ID_DOCUMENTO,CONSECUTIVO:record.CONSECUTIVO})));
      if(version!==this.detailVersion)return;
      this.items.set(rows[0]?.ITM_PREFACTURA ?? []);this.taxItems.set(rows[0]?.PREFACTURA_GRAV_AUX ?? []);
      if(rows[0]?.PREFACTURA_GRAV)this.taxes.set(rows[0].PREFACTURA_GRAV);
      if(rows[0]?.PREFACTURA_PAGOS)this.payments.set(rows[0].PREFACTURA_PAGOS);
      await Promise.all([this.loadAddresses(),this.loadWarehouses(),this.loadConditions()]);
      if(version!==this.detailVersion)return;
      this.detailsReady.set(true);this.recalculate();
    }catch(error){this.showError(error);}finally{if(version===this.detailVersion)this.loading.set(false);}
  }

  /**
   * Loads general catalogs.
   */
    private async loadDataLists(forceRefresh = false): Promise<void> {
    if (forceRefresh) {
      this.business.clearCache();
    }
    this.loading.set(true);
    try {
      const identity=this.business.identity;

      // Clients: load immediately in parallel (like Id Legal in VEN-209)
      const pClients = this.business.loadClients(forceRefresh).then(clients => {
        this.clients.set(clients);
      }).catch(e => {
        console.warn('Error loading clients in VEN-230:', e);
      });

      const [sellers,units,currencies,saleTypes,specs,defaultUnit,defaultCurrency,moneySpec,quantitySpec]=await Promise.all([
        this.business.catalog('sellers',{ESTADO:'ACTIVO'}),
        this.business.catalog('units',{ESTADO:'ACTIVO',...identity}),this.business.catalog('currencies',{ESTADO:'ACTIVO'}),
        this.business.catalog('saleTypes',{ID_DOMINIO:'FACTURA',ID_GRUPO_DOMINIO:'TIPO VENTA'}),
        this.business.catalog('specifications',{...identity,ID_APLICACION_BASE:''}),
        this.business.catalog('defaultUnit',{USUARIO:identity.USUARIO}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'DEF_MONEDA'}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'FORMATO MONEDA'}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'FORMATO CANTIDAD'})]);
      await pClients;
      this.sellers.set(sellers.map(r => ({ ...r, ID_ADC: String(r.ID_ADC ?? ''), NOMBRE_COMPLETO: String(r.NOMBRE_COMPLETO ?? ''), NUM_NOMBRE: String(r['NUM_NOMBRE'] ?? `${r.ID_ADC} - ${r.NOMBRE_COMPLETO ?? ''}`) })));
      this.specifications.set([...specs,...moneySpec.map(row=>({...row,NOMBRE_OBJETO:'FORMATO MONEDA'})),...quantitySpec.map(row=>({...row,NOMBRE_OBJETO:'FORMATO CANTIDAD'}))]);
      this.defaultUnit=String(defaultUnit[0]?.ID_UN ?? '');
      this.defaultCurrency=String(defaultCurrency[0]?.VALOR_DEFECTO ?? this.spec('ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '');
      this.dataLists.set({unidadesNegocio:units.map(r=>({ID_UN:String(r.ID_UN ?? ''),NOMBRE:String(r.NOMBRE ?? r['UN_NOMBRE'] ?? r.ID_UN ?? ''),UN_NOMBRE:String(r['UN_NOMBRE'] ?? `${r.ID_UN} - ${r.NOMBRE ?? ''}`)})),
        monedas:currencies.map(r=>({ID_MONEDA:String(r.ID_MONEDA ?? ''),DESCRIPCION:String(r['DESCRIPCION'] ?? r.ID_MONEDA ?? ''),MONEDA:String(r['DESCRIPCION'] ?? r.ID_MONEDA ?? '')})),
        tiposVenta:saleTypes.map(r=>({TIPO_VENTA:String(r['VALOR2'] ?? ''),DESCRIPCION:String(r['VALOR2'] ?? '')}))});
      if (!this.form.controls.ID_UN_ITEM.value && this.defaultUnit) {
        this.form.patchValue({ ID_UN_ITEM: this.defaultUnit }, { emitEvent: false });
        void this.loadWarehouses();
      }
      if (!this.form.controls.ID_MONEDA.value && this.defaultCurrency) {
        this.form.patchValue({ ID_MONEDA: this.defaultCurrency }, { emitEvent: false });
      }
      if (!this.form.controls.TIPO_VENTA.value) {
        this.form.patchValue({ TIPO_VENTA: 'CONTADO' }, { emitEvent: false });
      }
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  private disableFormControls(): void {
    this.form.disable({ emitEvent: false });
  }

    private enableFormControls(): void {
    this.form.enable({emitEvent:false});
    for(const name of ['ID_DOCUMENTO','PREFIJO','CONSECUTIVO','SUFIJO','FECHA_REGISTRO','USUARIO','ESTADO','TOTAL','SUB_TOTAL','NOMBRE_CLIENTE','VALOR_COSTOS','VALOR_CUOTA'] as const)
      this.form.controls[name].disable({emitEvent:false});
    if(this.mode()!==RecordToolbarMode.Creating)this.form.controls.DOCUMENTO.disable({emitEvent:false});
    this.updateCreditControls();
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const initialInput = host.querySelector<HTMLInputElement>(
        '#ven-230-documento input:not([readonly]):not([disabled]), #ven-230-id-cliente input:not([readonly]):not([disabled]), #ven-230-fecha input:not([readonly]):not([disabled])'
      );
      if (initialInput) {
        initialInput.focus();
        initialInput.select?.();
        return true;
      }
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .ven-230__form') || host;
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

  @ViewChild(Ven230ItemsComponent) private itemEditor?: Ven230ItemsComponent;
  readonly documents = signal<Ven230Lookup[]>([]);
  readonly clients = signal<Ven230Lookup[]>([]);

  async refreshClients(): Promise<void> {
    try {
      const clients = await this.business.loadClients(true);
      this.clients.set(clients);
    } catch (e) {
      console.warn('Error refreshing clients in VEN-230:', e);
    }
  }
  readonly sellers=signal<Ven230Lookup[]>([]);
  readonly addresses=signal<Ven230Lookup[]>([]);
  readonly conditions=signal<Ven230Lookup[]>([]);
  readonly products=signal<Ven230Lookup[]>([]);
  readonly terms=signal<Ven230Lookup[]>([]);
  readonly specifications=signal<Ven230Lookup[]>([]);
  readonly taxes=signal<Ven230PrefacturaGrav[]>([]);
  readonly taxItems=signal<Ven230PrefacturaItem[]>([]);
  readonly payments=signal<Ven230PrefacturaPago[]>([]);
  readonly advances=computed(()=>this.payments().reduce((sum,row)=>sum+Number(row.VALOR || 0),0));
  readonly itemPending=signal(false);
  readonly detailsReady=signal(false);
  readonly headerLocked=signal(false);
  readonly settingsVisible=signal(false);
  readonly settings=signal<Ven230Lookup[]>([]);
  readonly selectionVisible=signal(false);
  readonly selection=signal<Ven230SettingResult | null>(null);
  selectedSettingsRows: Ven230Lookup[]=[];
  selectedSettingsKeys: unknown[] = [];
  private detailVersion=0;
  private defaultUnit='';private defaultCurrency='';
  private lastCriteria: unknown[]=[];
  previousCondition='';
  previousWarehouse='';
  readonly onlyStock = signal<boolean>(false);
  header(): Ven230PrefacturaRecord {
    return {...(this.mode()===RecordToolbarMode.Creating ? Ven230DefaultRecord : this.currentRecord() ?? Ven230DefaultRecord),
      ...this.form.getRawValue()} as Ven230PrefacturaRecord;
  }
  localDate(date=new Date()): string {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  spec(name:string): Ven230Lookup | undefined {return this.specifications().find(s=>s.NOMBRE_OBJETO===name);}
  enabledSpec(name:string): boolean {const value=this.spec(name)?.ACTIVADO;return value===true || value===1;}
  private showError(error:unknown): void {this.notification.error(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');}
  private clearRecord(): void {
    ++this.detailVersion;this.currentIndex.set(-1);this.mode.set(RecordToolbarMode.Initial);this.form.reset({}, {emitEvent:false});
    this.disableFormControls();this.items.set([]);this.taxes.set([]);this.taxItems.set([]);this.payments.set([]);this.detailsReady.set(false);
  }
  private bindBusinessFields(): void {
    const watch=<K extends keyof typeof this.form.controls>(key:K, action:()=>void|Promise<void>)=>{
      this.subscriptions.add((this.form.controls[key].valueChanges as Observable<unknown>).subscribe(()=>{
        if(this.readOnly())return;
        void Promise.resolve().then(action).catch(error=>this.showError(error));
      }));
    };
    watch('DOCUMENTO',()=>this.selectDocument(this.form.controls.DOCUMENTO.value ?? ''));
    watch('ID_CLIENTE',async()=>{
      const client=this.clients().find(c=>c.ID_CLIENTE===this.form.controls.ID_CLIENTE.value);
      this.form.patchValue({NOMBRE_CLIENTE:client?.NOMBRE_COMPLETO ?? '',ID_UBICACION:client?.ID_UBICACION ?? ''},{emitEvent:false});
      await this.loadAddresses();
    });
    watch('ID_UN_ITEM',async()=>{this.form.controls.ID_UN_BODEGA.setValue('',{emitEvent:false});await this.loadWarehouses();this.products.set([]);});
    watch('ID_ADC',()=>this.resetConditions());
    watch('TIPO_VENTA',async()=>{await this.resetConditions();this.updateCreditControls();});
    watch('PLAZO',async()=>{this.recalculate();await this.loadProducts();});
    watch('CUOTA_INICIAL',()=>this.recalculate());
    watch('FECHA',()=>this.updateCreditControls());
    watch('ID_CONDICION', async () => {
      const cond = this.form.controls.ID_CONDICION.value;
      if (cond && !this.readOnly()) {
        await this.handleConditionChange(cond);
      }
    });
    watch('ID_UN_BODEGA', async () => {
      const bodega = this.form.controls.ID_UN_BODEGA.value;
      if (bodega && !this.readOnly()) {
        await this.handleWarehouseChange(bodega);
      }
    });
  }
  private selectDocument(value:string):void {
    const row=this.documents().find(d=>d.DOCUMENTO===value);if(!row)return;
    this.form.patchValue({DOCUMENTO:value,ID_DOCUMENTO:row.ID_DOCUMENTO ?? '',CONSECUTIVO:row.CONSECUTIVO ?? 0,
      PREFIJO:row.PREFIJO ?? '',SUFIJO:row.SUFIJO ?? ''},{emitEvent:false});
  }
  private async loadAddresses():Promise<void> {
    const id=this.form.controls.ID_CLIENTE.value;
    if(!id){
      this.addresses.set([]);
      this.form.controls.DIRECCION.setValue('',{emitEvent:false});
      return;
    }
    try {
      const rows = await this.business.catalog('addresses', { ID_CLIENTE: id }, true);
      if (this.form.controls.ID_CLIENTE.value !== id) return;
      const formatted = (rows || []).filter(a => a && (a.DIRECCION || a['ID_DIRECCION']));
      this.addresses.set(formatted);
      if (formatted.length > 0) {
        if (!this.readOnly()) {
          const preferred = formatted.find((a: any) => a.TIPO_DIRECCION && String(a.TIPO_DIRECCION).toLowerCase().includes('cobro')) || formatted[0];
          this.form.controls.DIRECCION.setValue(String(preferred.DIRECCION || preferred['ID_DIRECCION'] || ''), { emitEvent: false });
        }
      } else {
        if (!this.readOnly()) {
          this.form.controls.DIRECCION.setValue('', { emitEvent: false });
          this.notification.warning('No se encontró una dirección del Tipo: Cobro');
        }
      }
    } catch {
      this.addresses.set([]);
      if (!this.readOnly()) {
        this.form.controls.DIRECCION.setValue('', { emitEvent: false });
        this.notification.warning('No se encontró una dirección del Tipo: Cobro');
      }
    } finally {
      this.formVersion.update(v => v + 1);
      this.cdr.markForCheck();
    }
  }
  private async loadWarehouses():Promise<void> {
    const id=this.form.controls.ID_UN_ITEM.value;if(!id){this.dataLists.update(d=>({...d,bodegas:[]}));return;}
    const rows=await this.business.catalog('warehouses',{ESTADO:'ACTIVO',MOVIMIENTO:'Prefactura',ID_UN_ITEM:id,USUARIO:this.business.identity.USUARIO});
    if(this.form.controls.ID_UN_ITEM.value!==id)return;
    const bodegas = rows.map(r=>({ID_UN_BODEGA:String(r['ID_UN_BODEGA'] ?? ''),ID_BODEGA:String(r['ID_UN_BODEGA'] ?? ''),DESCRIPCION:String(r['DESCRIPCION'] ?? r['ID_UN_BODEGA'] ?? ''),NOMBRE:String(r['DESCRIPCION'] ?? r['ID_UN_BODEGA'] ?? ''),NOMBRE_UN:String(r['NOMBRE_UN'] ?? ''),BODEGA_LABEL:String(r['DESCRIPCION'] ? `${r['ID_UN_BODEGA']} - ${r['DESCRIPCION']}` : (r['ID_UN_BODEGA'] ?? ''))}));
    this.dataLists.update(d=>({...d,bodegas}));
    if(!this.readOnly() && bodegas.length > 0 && !this.form.controls.ID_UN_BODEGA.value) {
      this.form.controls.ID_UN_BODEGA.setValue(bodegas[0].ID_UN_BODEGA, {emitEvent:false});
    }
  }
  private async resetConditions():Promise<void> {
    if(this.items().length){
      const answer=await Swal.fire({text:'Cambiar los datos comerciales eliminará los productos asociados. ¿Desea continuar?',icon:'warning',showCancelButton:true,confirmButtonText:'Continuar',cancelButtonText:'Cancelar'});
      if(!answer.isConfirmed){
        const condition=this.conditions().find(c=>c.CODIGO===this.previousCondition);
        this.form.patchValue({ID_ADC:this.conditionSeller,TIPO_VENTA:this.conditionSaleType},{emitEvent:false});this.updateCreditControls();return;
      }
      this.items.set([]);this.taxes.set([]);this.taxItems.set([]);this.payments.set([]);this.recalculate();
    }
    this.form.controls.ID_CONDICION.setValue('',{emitEvent:false});this.previousCondition='';this.products.set([]);
    await this.loadConditions();
  }
  private conditionRequest = 0;
  private productRequest = 0;
  readonly productsLoading = signal(false);
  private conditionSeller='';private conditionSaleType='';
  private async loadConditions():Promise<void> {
    const h=this.header();
    const request = ++this.conditionRequest;
    ++this.productRequest;
    this.productsLoading.set(false);
    this.conditions.set([]);
    this.dataLists.update(lists => ({...lists, condiciones: []}));
    this.terms.set([]);
    this.products.set([]);
    if (!h.ID_ADC || !h.TIPO_VENTA) {
      this.previousCondition = '';
      this.form.controls.ID_CONDICION.setValue('', {emitEvent: false});
      this.form.controls.PLAZO.setValue(0, {emitEvent: false});
      this.updateCreditControls();
      return;
    }
    const rows=await this.business.catalog('conditions',{ID_ADC:h.ID_ADC,TIPO_VENTA:h.TIPO_VENTA,ESTADO:'ACTIVO'});
    if(request !== this.conditionRequest || this.form.controls.ID_ADC.value!==h.ID_ADC || this.form.controls.TIPO_VENTA.value!==h.TIPO_VENTA)return;
    this.conditionSeller=h.ID_ADC;this.conditionSaleType=h.TIPO_VENTA;
    const validRows = rows.filter(r=>r.CODIGO);
    this.conditions.set(validRows);
    this.dataLists.update(d=>({...d,condiciones:validRows.map(r=>({ID_CONDICION:String(r.CODIGO),CODIGO:String(r.CODIGO),CONDICION:String(r.NOMBRE ?? r.CODIGO),NOMBRE:String(r.NOMBRE ?? r.CODIGO)}))}));
    if(!validRows.length && !this.readOnly())this.notification.warning('El vendedor seleccionado no tiene condiciones de venta asociadas.');
    if (!this.readOnly() && validRows.length > 0 && !this.form.controls.ID_CONDICION.value) {
      const defCond = String(validRows[0].CODIGO);
      this.form.patchValue({ ID_CONDICION: defCond }, { emitEvent: false });
      this.previousCondition = defCond;
      this.applyCondition(false);
      await this.loadProducts();
    } else {
      this.previousCondition=h.ID_CONDICION ?? '';this.applyCondition(false);await this.loadProducts();
    }
  }
  async handleConditionChange(newCond: string): Promise<void> {
    const value = newCond ?? '';
    if (this.previousCondition && value !== this.previousCondition && this.items().length > 0) {
      const answer = await Swal.fire({
        text: `Está cambiando la Condición ${this.previousCondition} por ${value}, esto borrará los Productos asociados, ¿Desea Continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#0F4C81',
        confirmButtonText: 'Sí, Borrar',
        cancelButtonText: 'No'
      });
      if (!answer.isConfirmed) {
        this.form.controls.ID_CONDICION.setValue(this.previousCondition, { emitEvent: false });
        return;
      }
      this.items.set([]);
      this.taxes.set([]);
      this.taxItems.set([]);
      this.payments.set([]);
      this.recalculate();
    }
    this.previousCondition = value;
    this.form.patchValue({ ID_CONDICION: value }, { emitEvent: false });
    this.applyCondition(true);
    await this.loadProducts();
  }

  async handleWarehouseChange(newBodega: string): Promise<void> {
    const value = newBodega ?? '';
    if (this.previousWarehouse && value !== this.previousWarehouse && this.items().length > 0) {
      const result = await Swal.fire({
        text: `Está cambiando la Bodega ${this.previousWarehouse} por ${value}, esto borrará los Productos asociados, ¿Desea Continuar?`,
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
        this.payments.set([]);
        this.recalculate();
        this.previousWarehouse = value;
        this.form.patchValue({ ID_UN_BODEGA: value }, { emitEvent: false });
        await this.loadProducts();
      } else {
        this.form.controls.ID_UN_BODEGA.setValue(this.previousWarehouse, { emitEvent: false });
        return;
      }
    } else {
      this.previousWarehouse = value;
      this.form.patchValue({ ID_UN_BODEGA: value }, { emitEvent: false });
      await this.loadProducts();
    }
  }
  private applyCondition(assign:boolean):void {
    const cond=this.conditions().find(r=>r.CODIGO===this.form.controls.ID_CONDICION.value);
    const terms=typeof cond?.PLAZOS==='string' ? JSON.parse(cond.PLAZOS) : cond?.PLAZOS ?? [];
    this.terms.set(Array.isArray(terms)?terms:[]);
    if(assign && this.form.controls.TIPO_VENTA.value==='CREDITO'){
      if(this.terms().length===1)this.form.controls.PLAZO.setValue(Number(this.terms()[0].PLAZO),{emitEvent:false});
      const date=new Date(this.form.controls.FECHA.value+'T00:00:00');date.setDate(date.getDate()+Number(cond?.DIAS_VENC ?? 0));
      this.form.controls.FECHA_PRIMER_VENC.setValue(this.localDate(date),{emitEvent:false});
    }
    this.updateCreditControls();
  }
  private updateCreditControls():void {
    if (this.readOnly() || this.itemPending()) return;
    const allowed = !!(this.form.controls.ID_ADC.value && this.form.controls.TIPO_VENTA.value);
    if (allowed) this.form.controls.ID_CONDICION.enable({emitEvent: false});
    else this.form.controls.ID_CONDICION.disable({emitEvent: false});
    const credit=this.form.controls.TIPO_VENTA.value==='CREDITO';
    for(const key of ['PLAZO','FECHA_PRIMER_VENC'] as const){
      if(credit)this.form.controls[key].enable({emitEvent:false});else this.form.controls[key].disable({emitEvent:false});
    }
    if(!credit)this.form.patchValue({PLAZO:0,FECHA_PRIMER_VENC:this.form.controls.FECHA.value},{emitEvent:false});
    this.recalculate();
  }
  async loadProducts(stockOnly = this.onlyStock()): Promise<void> {
    this.onlyStock.set(stockOnly);
    const request = ++this.productRequest;
    const header = this.header();
    this.products.set([]);
    if (!header.ID_CONDICION) { this.productsLoading.set(false); return; }
    this.productsLoading.set(true);
    try {
      const rows = await this.business.catalog('products', { ID_LISTA: header.ID_CONDICION,
        TIPO: this.conditionType(), PLAZO: header.PLAZO, CON_EXIS: stockOnly ? 'SI' : undefined,
        ID_UN_BODEGA: header.ID_UN_BODEGA });
      if (request === this.productRequest && this.form.controls.ID_CONDICION.value === header.ID_CONDICION
        && this.form.controls.ID_UN_BODEGA.value === header.ID_UN_BODEGA
        && this.form.controls.PLAZO.value === header.PLAZO) this.products.set(rows);
    } catch (error) { if (request === this.productRequest) this.showError(error); }
    finally { if (request === this.productRequest) this.productsLoading.set(false); }
  }
  recalculate(): void {
    if (this.readOnly()) return;
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
    this.cdr.markForCheck();
  }

  async persistItem(row: Ven230PrefacturaItem): Promise<boolean> {
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

  async commitItem(row: Ven230PrefacturaItem): Promise<boolean> {
    return this.persistItem(row);
  }

  async removeItem(item: number | number[]): Promise<void> {
    if (this.readOnly() || this.loading()) return;
    const answer = await Swal.fire({
      text: '¿Desea eliminar el producto seleccionado?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (answer.isConfirmed) {
      await this.applyItems(this.items().filter(r => !(Array.isArray(item) ? item : [item]).includes(r.ITEM)));
    }
  }

  async applyItems(updatedItems: Ven230PrefacturaItem[], option?: string): Promise<boolean> {
    if (this.readOnly() || this.loading()) return false;
    this.loading.set(true);
    try {
      const currentHeader = this.header();
      const sanitizedHeader: Ven230Header = {
        ...currentHeader,
        FECHA: currentHeader.FECHA || new Date().toISOString().slice(0, 10),
        FECHA_REGISTRO: currentHeader.FECHA_REGISTRO || currentHeader.FECHA || new Date().toISOString().slice(0, 10)
      };

      const sanitizedItems: Ven230PrefacturaItem[] = updatedItems.map(row => {
        const qty = Number(row.CANTIDAD || 0);
        const price = Number(row.VALOR_UNITARIO || 0);
        const subTotal = qty * price;
        const discount = Number(row.VALOR_DESCUENTO || 0);
        const base = subTotal - discount;

        let porIva = Number(row.POR_IVA != null ? row.POR_IVA : (Number(row.PORC_IVA || 0) * 100));
        if (!Number.isFinite(porIva)) porIva = 0;
        const effectiveRate = porIva / 100;
        const valorIva = base * effectiveRate;
        const total = base + valorIva;

        let taxObj: Record<string, unknown> | null = null;
        if (row.GRAV_ORG && typeof row.GRAV_ORG === 'object' && !Array.isArray(row.GRAV_ORG) && 'ID_TASA' in row.GRAV_ORG) {
          taxObj = row.GRAV_ORG as Record<string, unknown>;
        } else if (row.GRAVAMENES && typeof row.GRAVAMENES === 'object' && !Array.isArray(row.GRAVAMENES) && 'ID_TASA' in row.GRAVAMENES) {
          taxObj = row.GRAVAMENES as Record<string, unknown>;
        }

        const idTasa = (taxObj?.['ID_TASA'] as string) || (porIva === 0 ? 'IV-000' : 'IV-GEN');
        const descTasa = (taxObj?.['DESCRIPCION'] as string) || (porIva === 0 ? 'Sin iva' : 'Tarifa general del IVA');
        const cleanTax = {
          ID_TASA: idTasa,
          DESCRIPCION: descTasa,
          POR_TASA: porIva,
          PORCENTAJE: porIva,
          VALOR: valorIva,
          VALOR_BASE: base
        };

        return {
          ...row,
          APLICACION: 2,
          CANTIDAD: qty,
          VALOR_UNITARIO: price,
          VALOR_DESCUENTO: discount,
          VALOR_COSTOS: Number(row.VALOR_COSTOS || 0),
          VALOR_BASE: Number(row.VALOR_BASE || 0),
          SUB_TOTAL: subTotal,
          POR_IVA: porIva,
          PORC_IVA: effectiveRate,
          VALOR_IVA: valorIva,
          TOTAL: total,
          GRAV_ORG: cleanTax,
          GRAVAMENES: cleanTax
        };
      });

      let serverEncab: Ven230PrefacturaGrav[] = [];
      let serverItems: Ven230PrefacturaItem[] = [];
      try {
        const taxResults = await this.business.taxes(sanitizedHeader, sanitizedItems, option);
        const tax = taxResults[0];
        if (tax) {
          serverEncab = tax.ENCAB ?? [];
          serverItems = tax.ITEMS ?? [];
        }
      } catch (err) {
        console.warn('Error calculando gravámenes en servidor:', err);
      }

      this.taxItems.set(serverItems);

      this.items.set(sanitizedItems.map(row => {
        const value = serverItems.find(i => i.ITEM === row.ITEM);
        return {
          ...row,
          GRAV_TOTAL: value?.GRAV_TOTAL ?? row.GRAV_TOTAL
        };
      }));

      this.updateSummaryTaxes(sanitizedItems, serverEncab);
      this.recalculate();
      this.workspace.setDirty(this.applicationId, true);
      return true;
    } catch (error) {
      this.showError(error);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  private updateSummaryTaxes(items: Ven230PrefacturaItem[], serverEncab: Ven230PrefacturaGrav[]): void {
    if (!items.length) {
      this.taxes.set([]);
      return;
    }

    const ivaGroups = new Map<number, { valor: number; base: number; idTasa: string; descripcion: string }>();
    for (const item of items) {
      const pct = Number(item.POR_IVA || 0);
      const current = ivaGroups.get(pct) ?? {
        valor: 0,
        base: 0,
        idTasa: pct === 0 ? 'IV-000' : 'IV-GEN',
        descripcion: pct === 0 ? 'Sin iva' : 'Tarifa general del IVA'
      };
      current.valor += Number(item.VALOR_IVA || 0);
      current.base += Number(item.SUB_TOTAL || 0) - Number(item.VALOR_DESCUENTO || 0);
      const taxObj = item.GRAVAMENES as { ID_TASA?: string; DESCRIPCION?: string } | undefined;
      if (taxObj?.ID_TASA) current.idTasa = taxObj.ID_TASA;
      if (taxObj?.DESCRIPCION) current.descripcion = taxObj.DESCRIPCION;
      ivaGroups.set(pct, current);
    }

    const summaryTaxes: Ven230PrefacturaGrav[] = [];
    const sortedPcts = Array.from(ivaGroups.keys()).sort((a, b) => b - a);
    let taxIdx = 1;
    for (const pct of sortedPcts) {
      const g = ivaGroups.get(pct)!;
      summaryTaxes.push({
        ITEM: taxIdx++,
        CLASE: 'IVA',
        ID_TASA: g.idTasa,
        POR_TASA: pct,
        VALOR: g.valor,
        BASE: g.base
      });
    }

    for (const enc of serverEncab) {
      if (enc.CLASE && enc.CLASE !== 'IVA') {
        summaryTaxes.push(enc);
      }
    }

    this.taxes.set(summaryTaxes);
  }
  async restoreTaxes():Promise<void>{await this.applyItems(this.items(),'original');}
  async showSettings():Promise<void>{
    if(this.loading() || this.itemPending() || !this.permissions().configure)return;
    this.loading.set(true);
    try{this.settings.set(await this.business.catalog('settings',{APLICACION:this.applicationId,USUARIO:this.business.identity.USUARIO.toUpperCase()}));this.settingsVisible.set(true);}
    catch(error){this.showError(error);}finally{this.loading.set(false);}
  }
  async executeSetting(option:Ven230Lookup):Promise<void>{
    if(this.loading())return;
    try{
      const config=option.CONFIG ? JSON.parse(option.CONFIG):{MODO:'edicion'};
      if(this.readOnly() && config.MODO!=='consulta'){this.notification.warning('Esta operación no está permitida en modo consulta.');return;}
      this.loading.set(true);
      const result=(await this.business.action<Ven230SettingResult>('settings',{ACCION:option.VALOR,...this.business.identity,
        PREFACTURA:this.header(),ITM_PREFACTURA:this.items(),PREFACTURA_PAGOS:this.payments()}))[0];
      if(!result)return;
      this.settingsVisible.set(false);
      if(result.tipoAccion==='popup'){
        this.selection.set(result);
        this.selectedSettingsRows=(result.dataSource ?? []).filter(row=>this.payments().some(p=>p.ITEM===row['ITEM']));
        this.selectedSettingsKeys=this.selectedSettingsRows.map(row=>row["ITEM"]);
        this.selectionVisible.set(true);
      }else if(result.tipoAccion==='componente'){this.openElectronic(result);}
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }
  async applySelection(rows: Ven230Lookup[]):Promise<void>{
    this.selectedSettingsRows = rows;
    if(this.readOnly() || this.loading())return;
    const selected=this.selection();if(!selected)return;
    if(selected.titulo==='Anticipos a aplicar'){
      const payments=this.selectedSettingsRows as unknown as Ven230PrefacturaPago[];
      if(payments.reduce((sum,p)=>sum+Number(p.VALOR || 0),0)>Number(this.form.controls.TOTAL.value)){
        this.notification.warning('El valor de los anticipos no puede superar el total de la prefactura.');return;
      }
      this.payments.set(structuredClone(payments));this.recalculate();this.workspace.setDirty(this.applicationId,true);this.selectionVisible.set(false);return;
    }
    if(selected.titulo==='Cargar Prefactura'){
      this.loading.set(true);
      try{
        const result=(await this.business.action<Ven230SettingResult>('load',{ACCION:selected.titulo,...this.business.identity,
          PREFACTURA:this.header(),ITM_PREFACTURA:this.items(),Prefactura_PAGOS:this.payments(),DATOS:this.selectedSettingsRows}))[0];
        if(!result)throw new Error('No se recibieron datos de la prefactura.');
        this.items.set(result.ITM_Prefactura ?? []);this.taxes.set(result.DATA_GRAV?.[0]?.ENCAB ?? []);this.taxItems.set(result.DATA_GRAV?.[0]?.ITEMS ?? []);
        this.recalculate();this.workspace.setDirty(this.applicationId,true);this.selectionVisible.set(false);
      }catch(error){this.showError(error);}finally{this.loading.set(false);}
    }
  }

 readonly electronicVisible=signal(false);
 readonly electronicBusy=signal(false);
 readonly electronicEvents=signal<Ven230Lookup[]>([]);
 readonly electronicView = signal<Ven230ElectronicView | null>(null);
 readonly electronicOperation = signal('');
 electronicQrUrl(): string { return Ven230ElectronicQrEndpoint + encodeURIComponent(this.electronicView()?.qr ?? ''); }
 private electronicFailure(error: unknown): void {
   this.showError(error);
   const now = new Date();
   const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2,'0')).join(':');
   this.electronicEvents.update(rows => [...rows, {ITEM: rows.length+1, FECHA:this.localDate(), HORA:time, STATUS:error instanceof Error ? error.message : String(error)}]);
 }
 electronicDocument:Ven230ElectronicDocument|null=null;
 private openElectronic(result:Ven230SettingResult):void{
   const h=this.header();this.electronicDocument={tipoDocElectronico:'Prefactura',ID_DOCUMENTO:h.ID_DOCUMENTO,
     NC_DOCUMENTO:String(h.CONSECUTIVO),ID_EMPRESA:this.electronicService.companyId,EMISOR_NIT:String(result.NIT_EMPRESA ?? '')};
   const status = result.dataElecStatus?.[0];
   this.electronicView.set({document: String(h.DOCUMENTO ?? ''), date: String(h.FECHA ?? '').slice(0,10),
     client: [h.ID_CLIENTE, h.NOMBRE_CLIENTE].filter(Boolean).join(' '), email: result.EMAIL ?? '',
     cufe: String(status?.['CUFE'] ?? ''), qr: String(status?.['QR'] ?? '')});
   this.electronicOperation.set('');
   this.electronicEvents.set(result.dataElecStatus ?? []);this.electronicVisible.set(true);
 }
 async sendElectronic():Promise<void>{
   this.electronicOperation.set('Enviando documento a la DIAN…');
   if(!this.electronicDocument || this.electronicBusy())return;this.electronicBusy.set(true);
   try{
     const response=await firstValueFrom(this.electronicService.send(this.electronicDocument));
     const rows=typeof response.data==='string'?JSON.parse(response.data):response.data;
     const message=Array.isArray(rows)?String(rows[0]?.ErrMensaje ?? ''):'';
     if(message && (!message.includes('00:') || message.includes('ERR99')))throw new Error(message);
     this.notification.success(message || 'Documento enviado.');
   }catch(error){this.electronicFailure(error);}
   finally{this.electronicBusy.set(false);}
 }
 async downloadElectronic():Promise<void>{
   this.electronicOperation.set('Descargando PDF…');
   if(!this.electronicDocument || this.electronicBusy())return;this.electronicBusy.set(true);
   try{
     const file=await firstValueFrom(this.electronicService.pdf(this.electronicDocument));const url=URL.createObjectURL(file);
     const link=document.createElement('a');link.href=url;link.download=this.header().DOCUMENTO+'.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }catch(error){this.electronicFailure(error);}finally{this.electronicBusy.set(false);}
 }
  money(value: unknown): string {
    return formatNumber(Number(value || 0), this.spec('FORMATO MONEDA')?.FORMATO ?? '#,##0.00');
  }
}
