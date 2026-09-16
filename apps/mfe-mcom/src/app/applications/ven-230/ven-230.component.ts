import { Ven230ElectronicQrEndpoint } from './constants/ven-230-electronic.constants';
import { XteinVen230SelectionComponent } from './components/xtein-ven230-selection/xtein-ven230-selection.component';
import { formatNumber } from 'devextreme/localization';
import { Ven230ElectronicService } from './services/ven-230-electronic.service';
import { Ven230ElectronicDocument, Ven230ElectronicView } from './models/ven-230-electronic.model';
import { Ven230BusinessService } from './services/ven-230-business.service';
import { Ven230Lookup, Ven230Details, Ven230SettingResult, Ven230TaxResult } from './models/ven-230-business.model';
import { Ven230PrefacturaGrav, Ven230PrefacturaPago } from './models/ven-230.model';
import { XteinVen230ItemsComponent } from './components/xtein-ven230-items/xtein-ven230-items.component';
import { XteinButtonComponent } from '@xtein/ui';
import { DxPopupModule, DxDataGridModule } from 'devextreme-angular';
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
    'xtein-ven-230',

  standalone:
    true,

  imports: [
    CommonModule, XteinVen230SelectionComponent, XteinVen230ItemsComponent, XteinButtonComponent, DxPopupModule, DxDataGridModule,
    ReactiveFormsModule,
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
    FECHA_REGISTRO: new FormControl<string | null>(null),
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
    private readonly notification: XteinNotificationService
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
    const state = createRecordToolbarState({
      busy: this.loading() || this.itemPending(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: { ...Ven230ToolbarCapabilities, edit: this.detailsReady() && this.currentRecord()?.ESTADO !== 'ANULADO', delete: this.currentRecord()?.ESTADO !== 'ANULADO' },
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
      this.detailsReady.set(true);this.mode.set(RecordToolbarMode.Creating);
      this.form.reset({...Ven230DefaultRecord, FECHA:this.localDate(), FECHA_PRIMER_VENC:this.localDate(),
        USUARIO:this.business.identity.USUARIO,ID_UN_ITEM:this.defaultUnit,ID_MONEDA:this.defaultCurrency}, {emitEvent:false});
      this.items.set([]);this.taxes.set([]);this.taxItems.set([]);this.payments.set([]);this.headerLocked.set(false);this.previousCondition="";this.products.set([]);this.conditions.set([]);this.terms.set([]);
      this.enableFormControls();
      if(documents.length===1)this.selectDocument(String(documents[0].DOCUMENTO));
      await this.loadWarehouses();
      this.workspace.setDirty(this.applicationId,false);
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
    if(this.loading() || this.readOnly() || this.itemPending()) return;
    const header=this.header();
    const message=this.business.validate(header,this.items());
    if(message){this.form.markAllAsTouched();this.notification.warning(message);return;}
    this.loading.set(true);
    try {
      const payload={PREFACTURAS:header,ITM_PREFACTURAS:this.items(),PREFACTURA_GRAV:this.taxes(),
        PREFACTURA_GRAV_AUX:this.taxItems(),PREFACTURA_PAGOS:this.payments(),...this.business.identity};
      const isNew=this.mode()===RecordToolbarMode.Creating;
      const result=this.business.decode<Partial<Ven230PrefacturaRecord>>(await firstValueFrom(isNew ? this.service.create(payload):this.service.update(payload)))[0];
      if(!result)throw new Error('El servidor no devolvió el resultado del guardado.');
      const saved={...header,...result,DOCUMENTO:result.DOCUMENTO || header.DOCUMENTO,
        DOCUMENTO_FAC:result.DOCUMENTO || header.DOCUMENTO,PREFACTURA_GRAV:structuredClone(this.taxes()),PREFACTURA_PAGOS:structuredClone(this.payments())} as Ven230PrefacturaRecord;
      const list=[...this.records()];let index=this.currentIndex();
      if(isNew){index=list.length;list.push(saved);}else{list[index]=saved;}
      this.records.set(list);this.currentIndex.set(index);this.populateForm(saved);
      this.detailsReady.set(true);this.mode.set(RecordToolbarMode.Browsing);this.disableFormControls();this.workspace.setDirty(this.applicationId,false);
      this.notification.success('Prefactura guardada correctamente.');
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  /**
   * Prompts confirmation and deletes / cancels the active prefactura.
   */
  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete || record.ESTADO==='ANULADO') return;

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

      this.business.decode(response);

      this.notification.success('Prefactura anulada correctamente.');
      const remaining=this.records().filter(r=>r!==record);this.records.set(remaining);
      if(remaining.length)await this.selectRecordIndex(Math.min(this.currentIndex(),remaining.length-1));else this.clearRecord();

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
    void this.loadDataLists().then(()=>this.searchRecords(current?.DOCUMENTO || ''));
  }

  /**
   * Searches records matching a filter string or query object.
   */
    async searchRecords(filter: string | XteinRecordFilterResult): Promise<void> {
    if(typeof filter!=='string' && (this.loading() || !this.readOnly() || !this.permissions().search))return;
    this.filterVisible.set(false);this.loading.set(true);
    try {
      const criteria=typeof filter==='string' ? this.lastCriteria : filter.ESTRUCTURA;
      const list=this.business.decode<Ven230PrefacturaRecord>(await firstValueFrom(this.service.getRecords({PREFACTURA:criteria})));
      this.lastCriteria=criteria;
      this.records.set(list.map(row=>({...row,DOCUMENTO:row.DOCUMENTO_FAC || row.DOCUMENTO})));
      if(list.length){
        const selected=typeof filter==='string' ? this.records().findIndex(r=>r.DOCUMENTO===filter) : 0;
        await this.selectRecordIndex(Math.max(0,selected));
      }else{this.clearRecord();this.notification.warning('No se encontraron registros.');}
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  /**
   * Selects a record by its index and loads additional line items.
   */
    async selectRecordIndex(index: number): Promise<void> {
    const record=this.records()[index];if(!record)return;
    this.currentIndex.set(index);this.mode.set(RecordToolbarMode.Browsing);this.disableFormControls();
    this.workspace.setDirty(this.applicationId,false);this.populateForm(record);
    this.documents.set([{DOCUMENTO:record.DOCUMENTO_FAC || record.DOCUMENTO,ID_DOCUMENTO:record.ID_DOCUMENTO,CONSECUTIVO:record.CONSECUTIVO}]);
    this.headerLocked.set(false);
    await this.loadAdditionalData(record);
  }

  /**
   * Selects a record chosen from the XteinRecordView modal.
   */
  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const rec = record as Ven230PrefacturaRecord;
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
    private async loadDataLists(): Promise<void> {
    this.loading.set(true);
    try {
      const identity=this.business.identity;
      const [clients,sellers,units,currencies,saleTypes,specs,defaultUnit,defaultCurrency,moneySpec,quantitySpec]=await Promise.all([
        this.business.catalog('clients',{ESTADO:'ACTIVO'}),this.business.catalog('sellers',{ESTADO:'ACTIVO'}),
        this.business.catalog('units',{ESTADO:'ACTIVO',...identity}),this.business.catalog('currencies',{ESTADO:'ACTIVO'}),
        this.business.catalog('saleTypes',{ID_DOMINIO:'FACTURA',ID_GRUPO_DOMINIO:'TIPO VENTA'}),
        this.business.catalog('specifications',{...identity,ID_APLICACION_BASE:''}),
        this.business.catalog('defaultUnit',{USUARIO:identity.USUARIO}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'DEF_MONEDA'}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'FORMATO MONEDA'}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'FORMATO CANTIDAD'})]);
      this.clients.set(clients);this.sellers.set(sellers);this.specifications.set([...specs,...moneySpec.map(row=>({...row,NOMBRE_OBJETO:'FORMATO MONEDA'})),...quantitySpec.map(row=>({...row,NOMBRE_OBJETO:'FORMATO CANTIDAD'}))]);
      this.defaultUnit=String(defaultUnit[0]?.ID_UN ?? '');
      this.defaultCurrency=String(defaultCurrency[0]?.VALOR_DEFECTO ?? this.spec('ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '');
      this.dataLists.set({unidadesNegocio:units.map(r=>({ID_UN:String(r.ID_UN ?? ''),NOMBRE:String(r['UN_NOMBRE'] ?? r.NOMBRE ?? r.ID_UN ?? '')})),
        monedas:currencies.map(r=>({ID_MONEDA:String(r.ID_MONEDA ?? ''),MONEDA:String(r['DESCRIPCION'] ?? r.ID_MONEDA ?? '')})),
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

  @ViewChild(XteinVen230ItemsComponent) private itemEditor?: XteinVen230ItemsComponent;
  readonly documents=signal<Ven230Lookup[]>([]);
  readonly clients=signal<Ven230Lookup[]>([]);
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
  private previousCondition='';
  conditionType='';
  onlyStock=false;
  header(): Ven230PrefacturaRecord {
    return {...(this.mode()===RecordToolbarMode.Creating ? Ven230DefaultRecord : this.currentRecord() ?? Ven230DefaultRecord),
      ...this.form.getRawValue()} as Ven230PrefacturaRecord;
  }
  localDate(date=new Date()): string {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  spec(name:string): Ven230Lookup | undefined {return this.specifications().find(s=>s.NOMBRE_OBJETO===name);}
  enabledSpec(name:string): boolean {const value=this.spec(name)?.ACTIVADO;return value===true || value===1;}
  itemsReady(): boolean {
    const h=this.header();return !!(h.DOCUMENTO && h.ID_CLIENTE && h.FECHA && h.ID_UN_ITEM && h.ID_ADC && h.ID_CONDICION && h.ID_UN_BODEGA && h.PLAZO!=null);
  }
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
      this.form.patchValue({NOMBRE_CLIENTE:client?.NOMBRE_COMPLETO ?? '',ID_UBICACION:client?.ID_UBICACION ?? '',DIRECCION:client?.DIRECCION ?? ''},{emitEvent:false});
      await this.loadAddresses();
    });
    watch('ID_UN_ITEM',async()=>{this.form.controls.ID_UN_BODEGA.setValue('',{emitEvent:false});await this.loadWarehouses();this.products.set([]);});
    watch('ID_ADC',()=>this.resetConditions());
    watch('TIPO_VENTA',async()=>{await this.resetConditions();this.updateCreditControls();});
    watch('ID_CONDICION',()=>this.changeCondition());
    watch('PLAZO',async()=>{this.recalculate();await this.loadProducts();});
    watch('ID_UN_BODEGA',()=>this.loadProducts());
    watch('CUOTA_INICIAL',()=>this.recalculate());
    watch('FECHA',()=>this.updateCreditControls());
  }
  private selectDocument(value:string):void {
    const row=this.documents().find(d=>d.DOCUMENTO===value);if(!row)return;
    this.form.patchValue({DOCUMENTO:value,ID_DOCUMENTO:row.ID_DOCUMENTO ?? '',CONSECUTIVO:row.CONSECUTIVO ?? 0,
      PREFIJO:row.PREFIJO ?? '',SUFIJO:row.SUFIJO ?? ''},{emitEvent:false});
  }
  private async loadAddresses():Promise<void> {
    const id=this.form.controls.ID_CLIENTE.value;if(!id){this.addresses.set([]);return;}
    const rows=await this.business.catalog('addresses',{ID_CLIENTE:id});
    if(this.form.controls.ID_CLIENTE.value!==id)return;
    this.addresses.set(rows);
    if(rows.length===1 && !this.readOnly())this.form.controls.DIRECCION.setValue(rows[0].DIRECCION ?? '',{emitEvent:false});
  }
  private async loadWarehouses():Promise<void> {
    const id=this.form.controls.ID_UN_ITEM.value;if(!id){this.dataLists.update(d=>({...d,bodegas:[]}));return;}
    const rows=await this.business.catalog('warehouses',{ESTADO:'ACTIVO',MOVIMIENTO:'Prefactura',ID_UN_ITEM:id,USUARIO:this.business.identity.USUARIO});
    if(this.form.controls.ID_UN_ITEM.value!==id)return;
    this.dataLists.update(d=>({...d,bodegas:rows.map(r=>({ID_BODEGA:String(r['ID_UN_BODEGA'] ?? ''),NOMBRE:String(r['DESCRIPCION'] ?? r['ID_UN_BODEGA'] ?? '')}))}));
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
    this.dataLists.update(d=>({...d,condiciones:rows.filter(r=>r.CODIGO).map(r=>({ID_CONDICION:String(r.CODIGO),CONDICION:String(r.NOMBRE ?? r.CODIGO)}))}));
    if(!rows.some(r=>r.CODIGO) && !this.readOnly())this.notification.warning('El vendedor seleccionado no tiene condiciones de venta asociadas.');
    this.previousCondition=h.ID_CONDICION ?? '';this.applyCondition(false);await this.loadProducts();
  }
  private async changeCondition():Promise<void> {
    const value=this.form.controls.ID_CONDICION.value ?? '';
    if(value!==this.previousCondition && this.items().length){
      const answer=await Swal.fire({text:'Cambiar la condición borrará los productos asociados. ¿Desea continuar?',icon:'warning',showCancelButton:true,confirmButtonText:'Continuar',cancelButtonText:'Cancelar'});
      if(!answer.isConfirmed){this.form.controls.ID_CONDICION.setValue(this.previousCondition,{emitEvent:false});return;}
      this.items.set([]);this.taxes.set([]);this.taxItems.set([]);this.payments.set([]);this.recalculate();
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
    if(this.readOnly() || this.headerLocked() || this.itemPending())return;
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
  async loadProducts(stockOnly = this.onlyStock): Promise<void> {
    this.onlyStock = stockOnly;
    const request = ++this.productRequest;
    const header = this.header();
    this.products.set([]);
    if (!header.ID_CONDICION) { this.productsLoading.set(false); return; }
    this.productsLoading.set(true);
    try {
      const rows = await this.business.catalog('products', { ID_LISTA: header.ID_CONDICION,
        TIPO: this.conditionType, PLAZO: header.PLAZO, CON_EXIS: stockOnly ? 'SI' : undefined,
        ID_UN_BODEGA: header.ID_UN_BODEGA });
      if (request === this.productRequest && this.form.controls.ID_CONDICION.value === header.ID_CONDICION
        && this.form.controls.ID_UN_BODEGA.value === header.ID_UN_BODEGA
        && this.form.controls.PLAZO.value === header.PLAZO) this.products.set(rows);
    } catch (error) { if (request === this.productRequest) this.showError(error); }
    finally { if (request === this.productRequest) this.productsLoading.set(false); }
  }
  private recalculate():void {
    const subtotal=this.items().reduce((sum,row)=>sum+Number(row.SUB_TOTAL || 0),0);
    const tax=this.taxes().reduce((sum,row)=>sum+Number(row.VALOR || 0),0);
    const total=subtotal+tax;const h=this.form.getRawValue();
    this.form.patchValue({SUB_TOTAL:subtotal,TOTAL:total,VALOR_CUOTA:Number(h.PLAZO)>0?(total-Number(h.CUOTA_INICIAL || 0))/Number(h.PLAZO):0},{emitEvent:false});
  }
  async commitItem(row:Ven230PrefacturaItem):Promise<boolean> {
    const list=this.items().filter(i=>i.ITEM!==row.ITEM);list.push(row);list.sort((a,b)=>a.ITEM-b.ITEM);
    return this.applyItems(list);
  }
  async removeItem(item:number | number[]):Promise<void> {
    if(this.readOnly() || this.loading())return;
    const answer=await Swal.fire({text:'¿Desea eliminar el producto seleccionado?',icon:'warning',showCancelButton:true,confirmButtonText:'Eliminar',cancelButtonText:'Cancelar'});
    if(answer.isConfirmed)await this.applyItems(this.items().filter(r=>!(Array.isArray(item)?item:[item]).includes(r.ITEM)));
  }
  private async applyItems(items:Ven230PrefacturaItem[],option='items'):Promise<boolean> {
    if(this.readOnly() || this.loading())return false;this.loading.set(true);
    try {
      const rows=await this.business.taxes(this.header(),items.map(row=>({...row,APLICACION:2})),option);
      const tax=rows[0];if(!tax)throw new Error('El servidor no devolvió la liquidación de gravámenes.');this.taxes.set(tax.ENCAB ?? []);this.taxItems.set(tax.ITEMS ?? []);
      this.items.set(items.map(row=>{const value=tax.ITEMS?.find(i=>i.ITEM===row.ITEM);return value ? {...row,
        VALOR_IVA:value.VALOR_IVA,SUB_TOTAL:value.SUB_TOTAL,TOTAL:value.TOTAL,GRAVAMENES:value.GRAV_TOTAL,GRAV_TOTAL:value.GRAV_TOTAL}:row;}));
      this.recalculate();this.workspace.setDirty(this.applicationId,true);return true;
    }catch(error){this.showError(error);return false;}finally{this.loading.set(false);}
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
        this.recalculate();this.headerLocked.set(this.items().length>0);if(this.headerLocked())this.disableFormControls();this.workspace.setDirty(this.applicationId,true);this.selectionVisible.set(false);
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

 readonly persistItem=(row:Ven230PrefacturaItem)=>this.commitItem(row);
 onItemPending(pending:boolean):void {
   this.itemPending.set(pending);
   if(pending){this.disableFormControls();this.workspace.setDirty(this.applicationId,true);}
   else if(!this.readOnly() && !this.headerLocked())this.enableFormControls();
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
