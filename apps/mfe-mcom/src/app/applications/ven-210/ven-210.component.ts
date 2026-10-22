import { XteinLookupComponent, XteinGroupLabelComponent } from '@xtein/ui';
import { XteinPopupComponent, XteinLabelComponent } from '@xtein/ui';
import { XteinVen210SelectionComponent } from './components/xtein-ven210-selection/xtein-ven210-selection.component';
import { XteinVen210BodegasComponent, Ven210DocumentKeys } from './components/xtein-ven210-bodegas/xtein-ven210-bodegas.component';
import { formatNumber } from 'devextreme/localization';
import { Ven210BusinessService } from './services/ven-210-business.service';
import { Ven210Lookup, Ven210Details, Ven210OrderLink, Ven210OrderLoad, Ven210SettingResult } from './models/ven-210-business.model';
import { Ven210ItemBodega, Ven210RemisionPago } from './models/ven-210.model';
import { XteinVen210ItemsComponent } from './components/xtein-ven210-items/xtein-ven210-items.component';
import { XteinButtonComponent } from '@xtein/ui';
import { ElementRef } from '@angular/core';
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
  Ven210Application
} from './constants/ven-210.constants';

import {
  Ven210DefaultRecord,
  Ven210Estado,
  Ven210RecordViewColumns,
  Ven210SettingOption,
  Ven210SettingOptions,
  Ven210ToolbarCapabilities,
  Ven210ClientColumns,
  Ven210UnitColumns,
  Ven210CurrencyColumns,
  Ven210SellerColumns,
  Ven210ConditionColumns
} from './constants/ven-210-ui.constants';

import {
  Ven210Catalogs,
  Ven210RemisionItem,
  Ven210RemisionRecord
} from './models/ven-210.model';

import {
  Ven210Service
} from './services/ven-210.service';

import {
  flattenDistribution,
  groupDistribution,
  productLabel,
  stripItem,
  validateItemDistribution
} from './utils/ven-210-distribution';

import {
  mapOrderHeader,
  mapOrderItems,
  orderDueDate,
  orderLinkOf,
  validateOrderQuantity
} from './utils/ven-210-order-load';


/**
 * VEN-210 - Remisiones.
 */
@Component({
  selector:
    'xtein-ven-210',

  standalone:
    true,

  imports: [XteinLookupComponent,XteinPopupComponent, XteinLabelComponent, XteinGroupLabelComponent,
    CommonModule, XteinVen210SelectionComponent, XteinVen210ItemsComponent, XteinVen210BodegasComponent, XteinButtonComponent, ReactiveFormsModule,
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
    Ven210Service, Ven210BusinessService
  ],

  templateUrl:
    './ven-210.component.html',

  styleUrl:
    './ven-210.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Ven210Component
  implements OnInit, OnDestroy {
  readonly clientColumns = Ven210ClientColumns;
  readonly unitColumns = Ven210UnitColumns;
  readonly currencyColumns = Ven210CurrencyColumns;
  readonly sellerColumns = Ven210SellerColumns;
  readonly conditionColumns = Ven210ConditionColumns;


  readonly applicationId =
    Ven210Application.Id;

  readonly tableBase =
  Ven210Application.Table;

  /**
   * Internal subscription manager.
   */
  private readonly subscriptions =
    new Subscription();

  /**
   * Loaded query records.
   */
  readonly records =
    signal<Ven210RemisionRecord[]>([]);

  /**
   * Currently active record index.
   */
  readonly currentIndex =
    signal<number>(-1);

  /**
   * Detail items of the currently viewed remisión (with their warehouse distribution).
   */
  readonly items =
    signal<Ven210RemisionItem[]>([]);

  /**
   * Application catalogs.
   */
  readonly catalogs =
    signal<Ven210Catalogs>({});

  /** Catalog options exposed to the commercial parameter selectors. */
  readonly unidadesNegocioOptions =
    computed(() => this.catalogs().unidadesNegocio ?? []);

  readonly monedasOptions =
    computed(() => this.catalogs().monedas ?? []);

  readonly condicionesOptions =
    computed(() => this.catalogs().condiciones ?? []);

  readonly tipoVentaOptions =
    computed(() => {
      const options = this.catalogs().tiposVenta;
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

  /**
   * Record view columns.
   */
  readonly viewColumns =
    Ven210RecordViewColumns;

  /**
   * Active record accessor.
   */
  readonly currentRecord =
    computed<Ven210RemisionRecord | null>(() => {
      const list = this.records();
      const index = this.currentIndex();
      return index >= 0 && index < list.length ? list[index] : null;
    });

  /**
   * Only an ACTIVA remisión can be edited or cancelled (unknown states stay read-only).
   */
  readonly activeRecord =
    computed(() => this.currentRecord()?.ESTADO === Ven210Estado.Activa);

  /**
   * Link to the source order: set by populateForm and by the order load, cleared by newRecord and cancel.
   */
  readonly orderLink =
    signal<Ven210OrderLink | null>(null);

  /**
   * Header and new products are locked while the remisión is linked to an order.
   */
  readonly orderLocked =
    computed(() => !!this.orderLink());

  /**
   * Report filter for all queried records.
   */
  readonly queryFilter = computed(() => this.records()[0]?.QFILTRO || this.records().map(record => '('+this.recordFilter(record)+')').join(' OR '));
  private recordFilter(record: Ven210RemisionRecord): string {
    const text=(value:unknown)=>"'"+String(value ?? '').replace(/'/g,"''")+"'";
    return " REMISION.ID_DOCUMENTO = "+text(record.ID_DOCUMENTO)+" AND ISNULL(NULLIF(REMISION.PREFIJO,'SIN'),'') = "+text(record.PREFIJO)
      +" AND REMISION.CONSECUTIVO = "+Number(record.CONSECUTIVO)+" AND ISNULL(NULLIF(REMISION.SUFIJO,'SIN'),'') = "+text(record.SUFIJO);
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
    ESTADO: new FormControl<string>(Ven210Estado.Activa, { nonNullable: true, validators: [Validators.required] }),
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
    FECHA_PRIMER_VENC: new FormControl<string | null>(null),
    CUOTA_INICIAL: new FormControl<number>(0),
    ORIGEN_PEDIDO: new FormControl<string | null>('N'),
    PED_ID_DOCUMENTO: new FormControl<string | null>(null),
    PED_PREFIJO: new FormControl<string | null>(null),
    PED_CONSECUTIVO: new FormControl<number | null>(null),
    PED_SUFIJO: new FormControl<string | null>(null)
  });

  constructor(
    private readonly service: Ven210Service,
    readonly business: Ven210BusinessService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService,
    private readonly elementRef: ElementRef
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
        this.distributionItem.set(null);
        this.itemEditor?.closeProductSearch();
      }
    });
  }

  ngOnInit(): void {
    this.disableFormControls();
    this.subscriptions.add(this.form.valueChanges.subscribe(() => {
      if (!this.readOnly()) this.workspace.setDirty(this.applicationId, true);
    }));

    // Subscribe to toolbar commands for VEN-210
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
    void this.loadCatalogs();
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
    const state = createRecordToolbarState({
      busy: this.loading() || this.itemPending(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: { ...Ven210ToolbarCapabilities, edit: this.detailsReady() && this.activeRecord(), delete: this.activeRecord() },
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
        this.showSettings();
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
      this.detailsReady.set(true);this.mode.set(RecordToolbarMode.Creating);
      this.form.reset({...Ven210DefaultRecord, FECHA:this.localDate(), FECHA_REGISTRO:this.localDate(), FECHA_PRIMER_VENC:this.localDate(),
        USUARIO:this.business.identity.USUARIO,ID_UN_ITEM:this.defaultUnit,ID_MONEDA:this.defaultCurrency}, {emitEvent:false});
      this.items.set([]);this.payments.set([]);this.addresses.set([]);this.orderLink.set(null);this.distributionItem.set(null);
      this.previousCondition="";this.products.set([]);this.conditions.set([]);this.terms.set([]);
      this.enableFormControls();
      if(documents.length===1)this.selectDocument(String(documents[0].DOCUMENTO));
      this.workspace.setDirty(this.applicationId,false);
      this.focusFirstControl();
    } catch(error){this.showError(error);} finally{this.loading.set(false);}
  }

  /**
   * Switches to edit mode for the current record (only ACTIVA).
   */
    editRecord(): void {
    if(this.loading() || !this.readOnly() || !this.permissions().edit || !this.currentRecord() || !this.detailsReady() || !this.activeRecord())return;
    this.mode.set(RecordToolbarMode.Editing);this.enableFormControls();if(this.orderLocked())this.lockHeader();
    this.workspace.setDirty(this.applicationId,false);
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
    this.orderLink.set(null);
    this.distributionItem.set(null);
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
    if(this.loading() || this.readOnly() || this.itemPending()) return;
    const header=this.header();
    const items=this.items();
    const message=this.business.validate(header,items) || this.business.validateDistributions(items)
      || items.map(item=>validateOrderQuantity(item)).find(Boolean) || '';
    if(message){this.form.markAllAsTouched();this.notification.warning(message);return;}
    if(this.payments().some(p=>!Number.isInteger(Number(p.VALOR || 0)))){
      this.notification.warning('El valor de los anticipos debe ser un número entero (sin decimales).');return;
    }
    if(this.payments().reduce((sum,p)=>sum+Number(p.VALOR || 0),0)>Number(header.TOTAL)){
      this.notification.warning('El valor de los anticipos no puede superar el total de la remisión.');return;
    }
    this.loading.set(true);
    try {
      const {REMISION_PAGOS:_payments,...remision}=header;
      const payload={REMISION:[remision],ITM_REMISION:items.map(item=>stripItem(item)),ITM_REMISION_BOD:flattenDistribution(items),
        REMISION_PAGOS:this.payments(),PEDIDO:this.orderLink(),...this.business.identity};
      const isNew=this.mode()===RecordToolbarMode.Creating;
      const result=this.business.decode<Partial<Ven210RemisionRecord>>(await firstValueFrom(isNew ? this.service.create(payload):this.service.update(payload)))[0];
      if(!result)throw new Error('El servidor no devolvió el resultado del guardado.');
      const saved={...remision,...result,DOCUMENTO:result.DOCUMENTO || header.DOCUMENTO,
        REMISION_PAGOS:structuredClone(this.payments())} as Ven210RemisionRecord;
      const list=[...this.records()];let index=this.currentIndex();
      if(isNew){index=list.length;list.push(saved);}else{list[index]=saved;}
      this.records.set(list);this.currentIndex.set(index);this.populateForm(saved);
      this.mode.set(RecordToolbarMode.Browsing);this.disableFormControls();this.workspace.setDirty(this.applicationId,false);
      this.notification.success('Remisión guardada correctamente.');
      await this.loadAdditionalData(saved);
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  /**
   * Prompts confirmation and cancels (ANULADA) the active remisión.
   */
  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete || !this.activeRecord()) return;

    const confirmation = await Swal.fire({
      title: '¿Anular Remisión?',
      text: `¿Desea anular la Remisión ${record.DOCUMENTO || record.ID_DOCUMENTO}?`,
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
        REMISION: {
          ID_DOCUMENTO: record.ID_DOCUMENTO,
          PREFIJO: record.PREFIJO,
          CONSECUTIVO: record.CONSECUTIVO,
          SUFIJO: record.SUFIJO
        },
        ...this.business.identity
      };

      const response = await firstValueFrom(this.service.delete(prm));

      const returned = this.business.decode<Partial<Ven210RemisionRecord>>(response)[0];

      const cancelled = { ...record, ...(returned ?? {}), ESTADO: returned?.ESTADO || Ven210Estado.Anulada } as Ven210RemisionRecord;
      const list = this.records().map(row => row === record ? cancelled : row);
      this.records.set(list);
      if (this.currentRecord() === cancelled) this.populateForm(cancelled);
      this.notification.success('Remisión anulada correctamente.');

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
    if (this.loading() || !this.readOnly()) return;
    const current = this.currentRecord();
    void this.loadCatalogs().then(()=>this.searchRecords(current?.DOCUMENTO || ''));
  }

  /**
   * Searches records matching a filter string or query object.
   */
    async searchRecords(filter: string | XteinRecordFilterResult): Promise<void> {
    if(typeof filter!=='string' && (this.loading() || !this.readOnly() || !this.permissions().search))return;
    this.filterVisible.set(false);this.loading.set(true);
    try {
      const criteria=typeof filter==='string' ? this.lastCriteria : filter.ESTRUCTURA;
      const list=this.business.decode<Ven210RemisionRecord>(await firstValueFrom(this.service.getRecords({REMISION:criteria})));
      this.lastCriteria=criteria;
      this.records.set(list);
      if(list.length){
        const selected=typeof filter==='string' ? this.records().findIndex(r=>r.DOCUMENTO===filter) : 0;
        await this.selectRecordIndex(Math.max(0,selected));
      }else{this.clearRecord();this.notification.warning('No se encontraron registros.');}
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  /**
   * Selects a record by its index and loads additional line items.
   * The order link is set by populateForm (it must not be cleared here).
   */
    async selectRecordIndex(index: number): Promise<void> {
    const record=this.records()[index];if(!record)return;
    this.currentIndex.set(index);this.mode.set(RecordToolbarMode.Browsing);this.disableFormControls();
    this.workspace.setDirty(this.applicationId,false);this.populateForm(record);
    this.documents.set([{DOCUMENTO:record.DOCUMENTO,ID_DOCUMENTO:record.ID_DOCUMENTO,PREFIJO:record.PREFIJO,CONSECUTIVO:record.CONSECUTIVO,SUFIJO:record.SUFIJO}]);
    await this.loadAdditionalData(record);
  }

  /**
   * Selects a record chosen from the XteinRecordView modal.
   */
  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const rec = record as Ven210RemisionRecord;
    const list = this.records();
    const foundIndex = list.findIndex(r => r.DOCUMENTO === rec.DOCUMENTO);

    if (foundIndex >= 0) {
      this.selectRecordIndex(foundIndex);
    }
    this.viewVisible.set(false);
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
   * Populates form fields with values from a record and sets its persistent order link.
   */
  private populateForm(record: Ven210RemisionRecord): void {
    this.form.reset({
      ...Ven210DefaultRecord,
      DOCUMENTO: record.DOCUMENTO || '',
      ID_DOCUMENTO: record.ID_DOCUMENTO || '',
      PREFIJO: record.PREFIJO || '',
      CONSECUTIVO: record.CONSECUTIVO || 0,
      SUFIJO: record.SUFIJO || '',
      FECHA: record.FECHA ? record.FECHA.substring(0, 10) : '',
      FECHA_REGISTRO: record.FECHA_REGISTRO || '',
      ESTADO: record.ESTADO || Ven210Estado.Activa,
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
      FECHA_PRIMER_VENC: record.FECHA_PRIMER_VENC ? String(record.FECHA_PRIMER_VENC).substring(0, 10) : null,
      CUOTA_INICIAL: record.CUOTA_INICIAL || 0,
      ORIGEN_PEDIDO: record.ORIGEN_PEDIDO || 'N',
      PED_ID_DOCUMENTO: record.PED_ID_DOCUMENTO ?? null,
      PED_PREFIJO: record.PED_PREFIJO ?? null,
      PED_CONSECUTIVO: record.PED_CONSECUTIVO ?? null,
      PED_SUFIJO: record.PED_SUFIJO ?? null
    }, { emitEvent: false });
    this.orderLink.set(orderLinkOf(record));
  }

  /**
   * Loads line items, warehouse distribution and advances of a remisión (4 document keys).
   */
    private async loadAdditionalData(record: Ven210RemisionRecord): Promise<void> {
    const version=++this.detailVersion;this.loading.set(true);this.detailsReady.set(false);
    this.items.set([]);this.payments.set(record.REMISION_PAGOS ?? []);
    try {
      const rows=this.business.decode<Ven210Details>(await firstValueFrom(this.service.getAdditionalData({ID_DOCUMENTO:record.ID_DOCUMENTO,PREFIJO:record.PREFIJO,CONSECUTIVO:record.CONSECUTIVO,SUFIJO:record.SUFIJO})));
      if(version!==this.detailVersion)return;
      this.items.set(groupDistribution(rows[0]?.ITM_REMISION ?? [],rows[0]?.ITM_REMISION_BOD ?? []));
      if(rows[0]?.REMISION_PAGOS)this.payments.set(rows[0].REMISION_PAGOS);
      await Promise.all([this.loadAddresses(),this.loadConditions()]);
      if(version!==this.detailVersion)return;
      this.detailsReady.set(true);this.recalculate();
    }catch(error){this.showError(error);}finally{if(version===this.detailVersion)this.loading.set(false);}
  }

  /**
   * Loads general catalogs.
   */
    private async loadCatalogs(forceRefresh = false): Promise<void> {
    if (forceRefresh) {
      this.business.clearCache();
    }
    this.loading.set(true);
    try {
      const identity=this.business.identity;

      // Clients: load in parallel with the other catalogs
      const pClients = this.business.loadClients(forceRefresh).then(clients => {
        this.clients.set(clients);
      }).catch(error => this.showError(error));

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
      this.catalogs.set({unidadesNegocio:units.map(r=>({ID_UN:String(r.ID_UN ?? ''),NOMBRE:String(r.NOMBRE ?? r['UN_NOMBRE'] ?? r.ID_UN ?? ''),UN_NOMBRE:String(r['UN_NOMBRE'] ?? `${r.ID_UN} - ${r.NOMBRE ?? ''}`)})),
        monedas:currencies.map(r=>({ID_MONEDA:String(r.ID_MONEDA ?? ''),DESCRIPCION:String(r['DESCRIPCION'] ?? r.ID_MONEDA ?? ''),MONEDA:String(r['DESCRIPCION'] ?? r.ID_MONEDA ?? '')})),
        tiposVenta:saleTypes.map(r=>({TIPO_VENTA:String(r['VALOR2'] ?? ''),DESCRIPCION:String(r['VALOR2'] ?? '')}))});
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

  /**
   * Locks the header inherited from the order: only FECHA and DESCRIPCION stay editable.
   */
  private lockHeader(): void {
    for (const [name, control] of Object.entries(this.form.controls)) {
      if (name !== 'FECHA' && name !== 'DESCRIPCION') control.disable({ emitEvent: false });
    }
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .ven-210__form') || host;
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

  @ViewChild(XteinVen210ItemsComponent) private itemEditor?: XteinVen210ItemsComponent;
  readonly documents = signal<Ven210Lookup[]>([]);
  readonly clients = signal<Ven210Lookup[]>([]);

  async refreshClients(): Promise<void> {
    try {
      const clients = await this.business.loadClients(true);
      this.clients.set(clients);
    } catch (error) {
      this.showError(error);
    }
  }
  readonly sellers=signal<Ven210Lookup[]>([]);
  readonly addresses=signal<Ven210Lookup[]>([]);
  readonly conditions=signal<Ven210Lookup[]>([]);
  readonly products=signal<Ven210Lookup[]>([]);
  readonly terms=signal<Ven210Lookup[]>([]);
  readonly specifications=signal<Ven210Lookup[]>([]);
  readonly payments=signal<Ven210RemisionPago[]>([]);
  readonly advances=computed(()=>this.payments().reduce((sum,row)=>sum+Number(row.VALOR || 0),0));
  readonly itemPending=signal(false);
  readonly detailsReady=signal(false);
  readonly settingsVisible=signal(false);
  readonly settings=signal<readonly Ven210SettingOption[]>([]);
  readonly selectionVisible=signal(false);
  readonly selection=signal<Ven210SettingResult | null>(null);
  /** Item whose warehouse distribution popup is open. */
  readonly distributionItem=signal<number | null>(null);
  readonly distributionTarget=computed(()=>this.items().find(item=>item.ITEM===this.distributionItem()) ?? null);
  /** The distribution can be changed only while creating, or editing an ACTIVA remisión. */
  readonly distributionEditable=computed(()=>this.mode()===RecordToolbarMode.Creating
    || (this.mode()===RecordToolbarMode.Editing && this.activeRecord()));
  readonly distributionKeys=computed<Ven210DocumentKeys | null>(()=>{
    const record=this.currentRecord();
    return this.mode()===RecordToolbarMode.Creating || !record ? null
      : {ID_DOCUMENTO:record.ID_DOCUMENTO,PREFIJO:record.PREFIJO,CONSECUTIVO:record.CONSECUTIVO,SUFIJO:record.SUFIJO};
  });
  selectedSettingsKeys: unknown[] = [];
  private activeSetting: Ven210SettingOption | null = null;
  private detailVersion=0;
  private defaultUnit='';private defaultCurrency='';
  private lastCriteria: unknown[]=[];
  private previousCondition='';
  conditionType='';
  header(): Ven210RemisionRecord {
    return {...(this.mode()===RecordToolbarMode.Creating ? Ven210DefaultRecord : this.currentRecord() ?? Ven210DefaultRecord),
      ...this.form.getRawValue()} as Ven210RemisionRecord;
  }
  localDate(date=new Date()): string {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  spec(name:string): Ven210Lookup | undefined {return this.specifications().find(s=>s.NOMBRE_OBJETO===name);}
  enabledSpec(name:string): boolean {const value=this.spec(name)?.ACTIVADO;return value===true || value===1;}
  itemsReady(): boolean {
    const h=this.header();return !!(h.DOCUMENTO && h.ID_CLIENTE && h.FECHA && h.ID_UN_ITEM && h.ID_ADC && h.ID_CONDICION && h.PLAZO!=null);
  }
  private showError(error:unknown): void {this.notification.error(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');}
  private clearRecord(): void {
    ++this.detailVersion;this.currentIndex.set(-1);this.mode.set(RecordToolbarMode.Initial);this.form.reset({}, {emitEvent:false});
    this.disableFormControls();this.items.set([]);this.payments.set([]);this.orderLink.set(null);this.detailsReady.set(false);
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
    watch('ID_UN_ITEM',async()=>{
      if(this.items().some(item=>item.BODEGAS?.length))
        this.notification.warning('Se cambió la unidad de negocio de los ítems: se descartó el reparto por bodega, vuelva a repartir cada producto.');
      this.items.update(items=>items.map(item=>({...item,BODEGAS:[],SIN_REPARTO:true})));
      await this.loadProducts();
    });
    watch('ID_ADC',()=>this.resetConditions());
    watch('TIPO_VENTA',async()=>{await this.resetConditions();this.updateCreditControls();});
    watch('ID_CONDICION',()=>this.changeCondition());
    watch('PLAZO',async()=>{this.recalculate();await this.loadProducts();});
    watch('CUOTA_INICIAL',()=>this.recalculate());
    watch('FECHA',()=>this.updateCreditControls());
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
      const rows=await this.business.catalog('addresses',{ID_CLIENTE:id});
      if(this.form.controls.ID_CLIENTE.value!==id)return;
      this.addresses.set(rows || []);
      if(rows && rows.length > 0) {
        if(!this.readOnly()) {
          const preferred = rows.find(a => a['TIPO_DIRECCION'] && String(a['TIPO_DIRECCION']).toLowerCase().includes('cobro')) || rows[0];
          this.form.controls.DIRECCION.setValue(preferred.DIRECCION ?? '',{emitEvent:false});
        }
      } else {
        if(!this.readOnly()) {
          this.form.controls.DIRECCION.setValue('',{emitEvent:false});
          this.notification.warning('No se encontró una dirección del Tipo: Cobro');
        }
      }
    } catch {
      this.addresses.set([]);
      if(!this.readOnly()) {
        this.form.controls.DIRECCION.setValue('',{emitEvent:false});
        this.notification.warning('No se encontró una dirección del Tipo: Cobro');
      }
    }
  }
  private async resetConditions():Promise<void> {
    if(this.items().length){
      const answer=await Swal.fire({text:'Cambiar los datos comerciales eliminará los productos asociados. ¿Desea continuar?',icon:'warning',showCancelButton:true,confirmButtonText:'Continuar',cancelButtonText:'Cancelar'});
      if(!answer.isConfirmed){
        this.form.patchValue({ID_ADC:this.conditionSeller,TIPO_VENTA:this.conditionSaleType},{emitEvent:false});this.updateCreditControls();return;
      }
      this.items.set([]);this.payments.set([]);this.recalculate();
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
    this.catalogs.update(lists => ({...lists, condiciones: []}));
    this.terms.set([]);
    this.products.set([]);
    this.conditionType = '';
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
    this.conditions.set(rows.filter(r=>r.CODIGO));
    this.catalogs.update(d=>({...d,condiciones:rows.filter(r=>r.CODIGO).map(r=>({ID_CONDICION:String(r.CODIGO),CODIGO:String(r.CODIGO),CONDICION:String(r.NOMBRE ?? r.CODIGO),NOMBRE:String(r.NOMBRE ?? r.CODIGO)}))}));
    if(!rows.some(r=>r.CODIGO) && !this.readOnly())this.notification.warning('El vendedor seleccionado no tiene condiciones de venta asociadas.');
    this.previousCondition=h.ID_CONDICION ?? '';this.applyCondition(false);await this.loadProducts();
  }
  private async changeCondition():Promise<void> {
    const value=this.form.controls.ID_CONDICION.value ?? '';
    if(value!==this.previousCondition && this.items().length){
      const answer=await Swal.fire({text:'Cambiar la condición borrará los productos asociados. ¿Desea continuar?',icon:'warning',showCancelButton:true,confirmButtonText:'Continuar',cancelButtonText:'Cancelar'});
      if(!answer.isConfirmed){this.form.controls.ID_CONDICION.setValue(this.previousCondition,{emitEvent:false});return;}
      this.items.set([]);this.payments.set([]);this.recalculate();
    }
    this.previousCondition=value;this.applyCondition(true);await this.loadProducts();
  }
  private applyCondition(assign:boolean):void {
    const cond=this.conditions().find(r=>r.CODIGO===this.form.controls.ID_CONDICION.value);
    this.conditionType=cond?.TIPO ?? '';
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
    if(this.readOnly() || this.orderLocked() || this.itemPending())return;
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
  async loadProducts(): Promise<void> {
    const request = ++this.productRequest;
    const header = this.header();
    this.products.set([]);
    if (!header.ID_CONDICION || !header.ID_UN_ITEM) { this.productsLoading.set(false); return; }
    this.productsLoading.set(true);
    try {
      const rows = await this.business.catalog('products', { ID_LISTA: header.ID_CONDICION,
        TIPO: this.conditionType, PLAZO: header.PLAZO, ID_UN_ITEM: header.ID_UN_ITEM });
      if (request === this.productRequest && this.form.controls.ID_CONDICION.value === header.ID_CONDICION
        && this.form.controls.ID_UN_ITEM.value === header.ID_UN_ITEM
        && this.form.controls.PLAZO.value === header.PLAZO) this.products.set(rows);
    } catch (error) { if (request === this.productRequest) this.showError(error); }
    finally { if (request === this.productRequest) this.productsLoading.set(false); }
  }
  /** Totals: TOTAL = SUB_TOTAL. */
  private recalculate():void {
    const subtotal=this.items().reduce((sum,row)=>sum+Number(row.SUB_TOTAL || 0),0);
    const total=subtotal;const h=this.form.getRawValue();
    this.form.patchValue({SUB_TOTAL:subtotal,TOTAL:total,VALOR_CUOTA:Number(h.PLAZO)>0?(total-Number(h.CUOTA_INICIAL || 0))/Number(h.PLAZO):0},{emitEvent:false});
  }
  /**
   * Applies an edited item; when its distribution no longer matches, it is marked SIN_REPARTO
   * and the warehouse popup is opened.
   */
  async commitItem(row:Ven210RemisionItem):Promise<boolean> {
    const pendingDistribution=!!validateItemDistribution(row,row.BODEGAS ?? []);
    const next={...row,SIN_REPARTO:pendingDistribution};
    const list=this.items().filter(i=>i.ITEM!==row.ITEM);list.push(next);list.sort((a,b)=>a.ITEM-b.ITEM);
    const applied=this.applyItems(list);
    if(applied && pendingDistribution)this.distributionItem.set(row.ITEM);
    return applied;
  }
  async removeItem(item:number | number[]):Promise<void> {
    if(this.readOnly() || this.loading())return;
    const answer=await Swal.fire({text:'¿Desea eliminar el producto seleccionado?',icon:'warning',showCancelButton:true,confirmButtonText:'Eliminar',cancelButtonText:'Cancelar'});
    if(answer.isConfirmed)this.applyItems(this.items().filter(r=>!(Array.isArray(item)?item:[item]).includes(r.ITEM)));
  }
  /** Local item totals: SUB_TOTAL = TOTAL = CANTIDAD × VALOR_UNITARIO. */
  private applyItems(items:Ven210RemisionItem[]):boolean {
    if(this.readOnly() || this.loading())return false;
    this.items.set(items.map(row=>{const subtotal=Number(row.CANTIDAD || 0)*Number(row.VALOR_UNITARIO || 0);return {...row,SUB_TOTAL:subtotal,TOTAL:subtotal};}));
    this.recalculate();this.workspace.setDirty(this.applicationId,true);return true;
  }
  openDistribution(item:number):void {
    if(this.loading() || this.itemPending())return;
    this.distributionItem.set(item);
  }
  applyDistribution(rows:Ven210ItemBodega[]):void {
    const target=this.distributionItem();
    if(target===null || !this.distributionEditable())return;
    this.items.update(items=>items.map(item=>item.ITEM===target ? {...item,BODEGAS:rows,SIN_REPARTO:false} : item));
    this.workspace.setDirty(this.applicationId,true);
    this.distributionItem.set(null);
  }
  /** Cancelling keeps the item in the grid; without a valid distribution it is flagged and saving is blocked. */
  cancelDistribution():void {
    const item=this.distributionTarget();
    this.distributionItem.set(null);
    if(!item || !this.distributionEditable() || !validateItemDistribution(item,item.BODEGAS ?? []))return;
    this.items.update(items=>items.map(row=>row.ITEM===item.ITEM ? {...row,SIN_REPARTO:true} : row));
    this.notification.warning(`El producto ${productLabel(item)} quedó sin reparto por bodega; no se podrá guardar la remisión hasta repartirlo.`);
  }
  showSettings():void{
    if(this.loading() || this.itemPending() || !this.permissions().configure)return;
    this.settings.set(Ven210SettingOptions.filter(option=>option.MODOS.includes(this.mode())));
    this.settingsVisible.set(true);
  }
  async executeSetting(option:Ven210SettingOption):Promise<void>{
    if(this.loading())return;
    if(!option.MODOS.includes(this.mode())){this.notification.warning('Esta operación no está permitida en el modo actual.');return;}
    const h=this.header();
    if(!h.ID_CLIENTE){this.notification.warning('Seleccione el cliente antes de continuar.');return;}
    if(option.CLAVE==='CARGAR_PEDIDO'){
      if(!h.DOCUMENTO){this.notification.warning('Seleccione el documento de la remisión antes de cargar un pedido.');return;}
      if(this.items().length){this.notification.warning('Elimine los productos de la remisión antes de cargar un pedido.');return;}
    }
    this.loading.set(true);
    try{
      const keys=this.distributionKeys() ?? {};
      const rows=option.CLAVE==='ANTICIPOS'
        ? await this.business.action<Ven210Lookup>('advances',{ID_CLIENTE:h.ID_CLIENTE,ID_MONEDA:h.ID_MONEDA,...keys})
        : await this.business.action<Ven210Lookup>('pendingOrders',{ID_CLIENTE:h.ID_CLIENTE,ID_UN_ITEM:h.ID_UN_ITEM});
      if(!rows.length){
        this.notification.warning(option.CLAVE==='ANTICIPOS' ? 'El cliente no tiene anticipos disponibles.' : 'El cliente no tiene pedidos con cantidades pendientes.');
        return;
      }
      const applied=option.CLAVE==='ANTICIPOS' ? this.payments() : [];
      this.activeSetting=option;
      this.selection.set({titulo:option.TITULO,modoSeleccion:option.MODO,colsConfig:option.COLUMNAS,
        dataSource:rows.map(row=>{const payment=applied.find(p=>p.ITEM===row['ITEM']);return payment ? {...row,VALOR:payment.VALOR} : row;})});
      this.selectedSettingsKeys=rows.filter(row=>applied.some(p=>p.ITEM===row['ITEM'])).map(row=>row['ITEM']);
      this.settingsVisible.set(false);
      this.selectionVisible.set(true);
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }
  async applySelection(rows: Ven210Lookup[]):Promise<void>{
    if(this.readOnly() || this.loading())return;
    const option=this.activeSetting;if(!option)return;
    if(option.CLAVE==='ANTICIPOS'){
      const payments=rows as unknown as Ven210RemisionPago[];
      if(payments.some(p=>!Number.isInteger(Number(p.VALOR || 0)))){
        this.notification.warning('El valor de los anticipos debe ser un número entero (sin decimales).');return;
      }
      if(payments.reduce((sum,p)=>sum+Number(p.VALOR || 0),0)>Number(this.form.controls.TOTAL.value)){
        this.notification.warning('El valor de los anticipos no puede superar el total de la remisión.');return;
      }
      this.payments.set(structuredClone(payments));this.recalculate();this.workspace.setDirty(this.applicationId,true);this.selectionVisible.set(false);return;
    }
    await this.loadOrder(rows[0]);
  }
  /**
   * Loads the header and pending lines of an order (Creating only, with client and DOCUMENTO chosen).
   * Either the whole order is applied and the header locked, or the previous state is restored.
   */
  private async loadOrder(order: Ven210Lookup | undefined):Promise<void>{
    if(!order){this.notification.warning('Seleccione un pedido.');return;}
    const h=this.header();
    if(this.mode()!==RecordToolbarMode.Creating || this.items().length || !h.ID_CLIENTE || !h.DOCUMENTO)return;
    const link:Ven210OrderLink={ID_DOCUMENTO:String(order.ID_DOCUMENTO ?? ''),PREFIJO:String(order.PREFIJO ?? ''),
      CONSECUTIVO:Number(order.CONSECUTIVO ?? 0),SUFIJO:String(order.SUFIJO ?? '')};
    const before=this.form.getRawValue();
    let patched=false;
    this.loading.set(true);
    try{
      const result=(await this.business.action<Ven210OrderLoad>('loadOrder',{...link,ID_CLIENTE:h.ID_CLIENTE}))[0];
      if(!result?.REMISION)throw new Error('No se recibieron los datos del pedido.');
      const values=mapOrderHeader(result.REMISION);
      if(values.ID_CLIENTE && values.ID_CLIENTE!==h.ID_CLIENTE)throw new Error('El pedido no pertenece al cliente seleccionado.');
      const items=mapOrderItems(result.ITM_REMISION ?? []);
      if(!items.length)throw new Error('El pedido no tiene ítems con cantidad pendiente.');
      const client=this.clients().find(c=>c.ID_CLIENTE===h.ID_CLIENTE);
      patched=true;
      this.form.patchValue({...values,ID_CLIENTE:h.ID_CLIENTE,NOMBRE_CLIENTE:values.NOMBRE_CLIENTE ?? client?.NOMBRE_COMPLETO ?? h.NOMBRE_CLIENTE ?? '',
        ORIGEN_PEDIDO:'S',PED_ID_DOCUMENTO:link.ID_DOCUMENTO,PED_PREFIJO:link.PREFIJO,PED_CONSECUTIVO:link.CONSECUTIVO,PED_SUFIJO:link.SUFIJO},{emitEvent:false});
      await this.loadAddresses();
      if(values.DIRECCION!==undefined)this.form.controls.DIRECCION.setValue(values.DIRECCION ?? '',{emitEvent:false});
      await this.loadConditions();
      const form=this.form.getRawValue();
      const conditionOk=!!values.ID_CONDICION && form.ID_CONDICION===values.ID_CONDICION && this.previousCondition===values.ID_CONDICION
        && this.conditions().some(c=>c.CODIGO===values.ID_CONDICION);
      const termOk=Number(form.PLAZO ?? 0)===Number(values.PLAZO ?? 0)
        && (form.TIPO_VENTA!=='CREDITO' || this.terms().some(t=>Number(t.PLAZO)===Number(values.PLAZO)));
      if(!conditionOk || !termOk){
        await this.restoreHeader(before);
        this.notification.warning('La condición o el plazo del pedido no están disponibles para el vendedor y tipo de venta; no se cargó el pedido.');
        return;
      }
      if(form.TIPO_VENTA==='CREDITO'){
        const cond=this.conditions().find(c=>c.CODIGO===form.ID_CONDICION);
        const due=orderDueDate(form.FECHA,values.FECHA_PRIMER_VENC,Number(cond?.DIAS_VENC ?? 0));
        if(due)this.form.controls.FECHA_PRIMER_VENC.setValue(due,{emitEvent:false});
      }
      this.items.set(items);
      this.orderLink.set(link);this.lockHeader();
      this.recalculate();this.workspace.setDirty(this.applicationId,true);this.selectionVisible.set(false);
      this.notification.info('Pedido cargado. Reparta cada producto por bodega antes de guardar.');
    }catch(error){
      this.showError(error);
      if(patched)await this.restoreHeader(before).catch(restoreError=>this.showError(restoreError));
    }finally{this.loading.set(false);}
  }
  /** Restores the header (and its dependent lists) captured before an order load. */
  private async restoreHeader(before:ReturnType<typeof this.form.getRawValue>):Promise<void>{
    this.form.patchValue(before,{emitEvent:false});
    await this.loadAddresses();
    this.form.controls.DIRECCION.setValue(before.DIRECCION ?? '',{emitEvent:false});
    await this.loadConditions();
  }

 readonly persistItem=(row:Ven210RemisionItem)=>this.commitItem(row);
 onItemPending(pending:boolean):void {
   this.itemPending.set(pending);
   if(pending){this.disableFormControls();this.workspace.setDirty(this.applicationId,true);}
   else if(!this.readOnly()){this.enableFormControls();if(this.orderLocked())this.lockHeader();}
 }
 money(value:unknown):string{return formatNumber(Number(value || 0),this.spec('FORMATO MONEDA')?.FORMATO ?? '#,##0.00');}
 stateStyle():Record<string,string>{
   try{const styles=JSON.parse(this.spec('ESTILOS ESTADO')?.VALOR_DEFECTO || '[]');
     const style=styles.find((row:{ESTADO:string})=>row.ESTADO===this.form.controls.ESTADO.value);
     return style?{color:style.color,background:style.background}:{};
   }catch{return {};}
 }
  itemRecordKey(): string {
    const record = this.currentRecord();
    return this.mode() === RecordToolbarMode.Creating ? 'new' : JSON.stringify([record?.ID_DOCUMENTO, record?.PREFIJO, record?.CONSECUTIVO, record?.SUFIJO]);
  }
}
