import { XteinLookupComponent, XteinGroupLabelComponent } from '@xtein/ui';
import { XteinPopupComponent, XteinLabelComponent } from '@xtein/ui';
import { Ven213SelectionComponent } from './components/ven-213-selection/ven-213-selection.component';
import { Ven213BodegasComponent } from './components/ven-213-bodegas/ven-213-bodegas.component';
import { formatNumber } from 'devextreme/localization';
import { Ven213BusinessService } from './services/ven-213-business.service';
import { Ven213Lookup, Ven213Details, Ven213SourceLink, Ven213SourceLoad, Ven213SettingResult } from './models/ven-213-business.model';
import { Ven213ItemBodega } from './models/ven-213.model';
import { Ven213ItemsComponent } from './components/ven-213-items/ven-213-items.component';
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
  Ven213Application
} from './constants/ven-213.constants';

import {
  Ven213DefaultRecord,
  Ven213Estado,
  Ven213RecordViewColumns,
  Ven213SettingOption,
  Ven213SettingOptions,
  Ven213ToolbarCapabilities,
  Ven213ClientColumns
} from './constants/ven-213-ui.constants';

import {
  Ven213DevolucionItem,
  Ven213DevolucionRecord
} from './models/ven-213.model';

import {
  Ven213Service
} from './services/ven-213.service';

import {
  flattenDistribution,
  groupDistribution,
  productLabel,
  validateItemDistribution
} from './utils/ven-213-distribution';

import {
  changeReturnQuantity,
  mapSourceHeader,
  mapSourceItems,
  mapSourceLine,
  sourceLinkOf,
  toSaveItem
} from './utils/ven-213-source-load';

import {
  sumAmounts
} from './utils/ven-213-amounts';


/**
 * VEN-213 - Devoluciones.
 */
@Component({
  selector: 'ven-213',

  standalone:
    true,

  imports: [XteinLookupComponent,XteinPopupComponent, XteinLabelComponent, XteinGroupLabelComponent,
    CommonModule, Ven213SelectionComponent, Ven213ItemsComponent, Ven213BodegasComponent, XteinButtonComponent, ReactiveFormsModule,
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
    Ven213Service, Ven213BusinessService
  ],

  templateUrl:
    './ven-213.component.html',

  styleUrl:
    './ven-213.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Ven213Component
  implements OnInit, OnDestroy {
  readonly clientColumns = Ven213ClientColumns;


  readonly applicationId =
    Ven213Application.Id;

  readonly tableBase =
  Ven213Application.Table;

  /**
   * Internal subscription manager.
   */
  private readonly subscriptions =
    new Subscription();

  /**
   * Loaded query records.
   */
  readonly records =
    signal<Ven213DevolucionRecord[]>([]);

  /**
   * Currently active record index.
   */
  readonly currentIndex =
    signal<number>(-1);

  /**
   * Detail items of the currently viewed devolución (with their restock distribution).
   */
  readonly items =
    signal<Ven213DevolucionItem[]>([]);

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
   * Computed read-only flag (a devolución is only created, never edited).
   */
  readonly readOnly =
    computed(() =>
      this.mode() !== RecordToolbarMode.Creating
    );

  /**
   * Record view columns.
   */
  readonly viewColumns =
    Ven213RecordViewColumns;

  /**
   * Active record accessor.
   */
  readonly currentRecord =
    computed<Ven213DevolucionRecord | null>(() => {
      const list = this.records();
      const index = this.currentIndex();
      return index >= 0 && index < list.length ? list[index] : null;
    });

  /**
   * Only an ACTIVA devolución can be cancelled (unknown states stay read-only).
   */
  readonly activeRecord =
    computed(() => this.currentRecord()?.ESTADO === Ven213Estado.Activa);

  /**
   * Link to the source document: set by populateForm and by the source load, cleared by newRecord, cancel and clearRecord.
   */
  readonly sourceLink =
    signal<Ven213SourceLink | null>(null);

  /**
   * The header is locked (except FECHA, DESCRIPCION and ID_CAUSA) while the devolución is linked to a source document.
   */
  readonly sourceLocked =
    computed(() => !!this.sourceLink());

  /**
   * Report filter for all queried records.
   */
  readonly queryFilter = computed(() => this.records()[0]?.QFILTRO || this.records().map(record => '('+this.recordFilter(record)+')').join(' OR '));
  private recordFilter(record: Ven213DevolucionRecord): string {
    const text=(value:unknown)=>"'"+String(value ?? '').replace(/'/g,"''")+"'";
    return " DEVOLUCION.ID_DOCUMENTO = "+text(record.ID_DOCUMENTO)+" AND ISNULL(NULLIF(DEVOLUCION.PREFIJO,'SIN'),'') = "+text(record.PREFIJO)
      +" AND DEVOLUCION.CONSECUTIVO = "+Number(record.CONSECUTIVO)+" AND ISNULL(NULLIF(DEVOLUCION.SUFIJO,'SIN'),'') = "+text(record.SUFIJO);
  }
  reportEmailContext() {
    const h=this.header();return {defaults:{ASUNTO:this.spec('ASUNTO EMAIL')?.VALOR_DEFECTO ?? '',
      ORIGEN_EMAIL:this.spec('EMAIL USUARIO')?.VALOR_DEFECTO ?? '',ORIGEN:String(this.spec('EMAIL USUARIO')?.['TITULO'] ?? ''),
      DESTINO:h.NOMBRE_CLIENTE ?? '',DESTINO_EMAIL:String(this.clients().find(c=>c.ID_CLIENTE===h.ID_CLIENTE)?.['EMAIL'] ?? '')},
      template:this.spec('TEMPLATE')?.VALOR_DEFECTO ?? '',replacements:{...h}};
  }

  /**
   * Reactive form definition. Fields inherited from the source document are always read-only.
   */
  readonly form = new FormGroup({
    DOCUMENTO: new FormControl<string>(''),
    ID_DOCUMENTO: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    PREFIJO: new FormControl<string>(''),
    CONSECUTIVO: new FormControl<number>(0),
    SUFIJO: new FormControl<string>(''),
    FECHA: new FormControl<string>(this.localDate(), { nonNullable: true, validators: [Validators.required] }),
    FECHA_REGISTRO: new FormControl<string | null>(this.localDate()),
    ESTADO: new FormControl<string>(Ven213Estado.Activa, { nonNullable: true, validators: [Validators.required] }),
    USUARIO: new FormControl<string>(''),
    ID_CLIENTE: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    NOMBRE_CLIENTE: new FormControl<string>(''),
    DIRECCION: new FormControl<string>(''),
    ID_ADC: new FormControl<string>(''),
    ID_UN: new FormControl<string>(''),
    ID_UN_ITEM: new FormControl<string>(''),
    ID_MONEDA: new FormControl<string>(''),
    TASA_CAMBIO: new FormControl<number>(1),
    ID_CONDICION: new FormControl<string>(''),
    PLAZO: new FormControl<number>(0),
    TIPO_VENTA: new FormControl<string>(''),
    ID_CAUSA: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    DESCRIPCION: new FormControl<string>(''),
    SUB_TOTAL: new FormControl<number>(0),
    VALOR_DESCUENTO: new FormControl<number>(0),
    IMPUESTOS: new FormControl<number>(0),
    TOTAL: new FormControl<number>(0),
    VALOR_CARTERA: new FormControl<number>(0),
    VALOR_NO_APLICADO: new FormControl<number>(0),
    ORIGEN_TIPO: new FormControl<string | null>(null),
    ORIGEN_ID_DOCUMENTO: new FormControl<string | null>(null),
    ORIGEN_PREFIJO: new FormControl<string | null>(null),
    ORIGEN_CONSECUTIVO: new FormControl<number | null>(null),
    ORIGEN_SUFIJO: new FormControl<string | null>(null),
    ORIGEN_DOCUMENTO: new FormControl<string | null>(null)
  });

  constructor(
    private readonly service: Ven213Service,
    readonly business: Ven213BusinessService,
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
      }
    });
  }

  ngOnInit(): void {
    this.disableFormControls();
    this.subscriptions.add(this.form.valueChanges.subscribe(() => {
      if (!this.readOnly()) this.workspace.setDirty(this.applicationId, true);
    }));

    // Subscribe to toolbar commands for VEN-213
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
   * Publishes the current state to the platform toolbar (never Editar).
   */
  private publishToolbarState(): void {
    const state = createRecordToolbarState({
      busy: this.loading() || this.itemPending(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: { ...Ven213ToolbarCapabilities, edit: false, delete: this.activeRecord() },
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
      this.form.reset({...Ven213DefaultRecord, FECHA:this.localDate(), FECHA_REGISTRO:this.localDate(),
        USUARIO:this.business.identity.USUARIO}, {emitEvent:false});
      this.items.set([]);this.addresses.set([]);this.sourceLink.set(null);this.distributionItem.set(null);
      this.enableFormControls();
      if(documents.length===1)this.selectDocument(String(documents[0].DOCUMENTO));
      this.workspace.setDirty(this.applicationId,false);
      this.focusFirstControl();
    } catch(error){this.showError(error);} finally{this.loading.set(false);}
  }

  /**
   * Cancels current creation.
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
    this.sourceLink.set(null);
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
   * Saves the new devolución: quantities, source line keys and distribution only (the SP computes the amounts).
   */
    async saveRecord(): Promise<void> {
    if(this.loading() || this.readOnly() || this.itemPending()) return;
    const header=this.header();
    const items=this.items();
    const link=this.sourceLink();
    const message=this.business.validate(header,items,!!link) || this.business.validateDistributions(items);
    if(message || !link){this.form.markAllAsTouched();this.notification.warning(message);return;}
    this.loading.set(true);
    try {
      const devolucion={ID_DOCUMENTO:header.ID_DOCUMENTO,PREFIJO:header.PREFIJO,CONSECUTIVO:header.CONSECUTIVO,SUFIJO:header.SUFIJO,
        FECHA:header.FECHA,ID_CLIENTE:header.ID_CLIENTE,ID_UN_ITEM:header.ID_UN_ITEM,ID_CAUSA:header.ID_CAUSA,DESCRIPCION:header.DESCRIPCION ?? ''};
      const payload={DEVOLUCION:[devolucion],ORIGEN:link,ITM_DEVOLUCION:items.map(item=>toSaveItem(item)),
        ITM_DEVOLUCION_BOD:flattenDistribution(items),...this.business.identity};
      const result=this.business.decode<Partial<Ven213DevolucionRecord>>(await firstValueFrom(this.service.create(payload)))[0];
      if(!result)throw new Error('El servidor no devolvió el resultado del guardado.');
      const saved={...header,...result,DOCUMENTO:result.DOCUMENTO || header.DOCUMENTO,ESTADO:result.ESTADO || Ven213Estado.Activa} as Ven213DevolucionRecord;
      const list=[...this.records(),saved];
      this.records.set(list);this.currentIndex.set(list.length-1);this.populateForm(saved);
      this.mode.set(RecordToolbarMode.Browsing);this.disableFormControls();this.workspace.setDirty(this.applicationId,false);
      this.notification.success('Devolución guardada correctamente.');
      await this.loadAdditionalData(saved);
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  /**
   * Prompts confirmation and cancels (ANULADA) the active devolución.
   */
  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete || !this.activeRecord()) return;

    const confirmation = await Swal.fire({
      title: '¿Anular Devolución?',
      text: `¿Desea anular la Devolución ${record.DOCUMENTO || record.ID_DOCUMENTO}? Se revierten el inventario, lo devuelto en el origen y la cartera.`,
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
        DEVOLUCION: {
          ID_DOCUMENTO: record.ID_DOCUMENTO,
          PREFIJO: record.PREFIJO,
          CONSECUTIVO: record.CONSECUTIVO,
          SUFIJO: record.SUFIJO
        },
        ...this.business.identity
      };

      const response = await firstValueFrom(this.service.delete(prm));

      const returned = this.business.decode<Partial<Ven213DevolucionRecord>>(response)[0];

      // delete does not return the cartera amounts; consulta returns 0 for both once the devolución is ANULADA.
      const cancelled = { ...record, ...(returned ?? {}), ESTADO: returned?.ESTADO || Ven213Estado.Anulada,
        VALOR_CARTERA: 0, VALOR_NO_APLICADO: 0 } as Ven213DevolucionRecord;
      const list = this.records().map(row => row === record ? cancelled : row);
      this.records.set(list);
      if (this.currentRecord() === cancelled) {
        this.populateForm(cancelled);
        await this.loadAdditionalData(cancelled);
      }
      this.notification.success('Devolución anulada correctamente.');

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
      const list=this.business.decode<Ven213DevolucionRecord>(await firstValueFrom(this.service.getRecords({DEVOLUCION:criteria})));
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
   * The source link is set by populateForm (it must not be cleared here).
   */
    async selectRecordIndex(index: number): Promise<void> {
    const record=this.records()[index];if(!record)return;
    this.currentIndex.set(index);this.mode.set(RecordToolbarMode.Browsing);this.disableFormControls();
    this.workspace.setDirty(this.applicationId,false);this.populateForm(record);
    await this.loadAdditionalData(record);
  }

  /**
   * Selects a record chosen from the XteinRecordView modal.
   */
  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const rec = record as Ven213DevolucionRecord;
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
   * Populates form fields with values from a record and sets its persistent source link.
   */
  private populateForm(record: Ven213DevolucionRecord): void {
    // The select only shows values present in its items: in consulta the items are the record's own document.
    const documento = record.DOCUMENTO || (record.ID_DOCUMENTO ? `${record.ID_DOCUMENTO}-${record.CONSECUTIVO ?? ''}` : '');
    this.documents.set([{DOCUMENTO:documento,ID_DOCUMENTO:record.ID_DOCUMENTO,PREFIJO:record.PREFIJO,CONSECUTIVO:record.CONSECUTIVO,SUFIJO:record.SUFIJO}]);
    this.form.reset({
      ...Ven213DefaultRecord,
      DOCUMENTO: documento,
      ID_DOCUMENTO: record.ID_DOCUMENTO || '',
      PREFIJO: record.PREFIJO || '',
      CONSECUTIVO: record.CONSECUTIVO || 0,
      SUFIJO: record.SUFIJO || '',
      FECHA: record.FECHA ? record.FECHA.substring(0, 10) : '',
      FECHA_REGISTRO: record.FECHA_REGISTRO || '',
      ESTADO: record.ESTADO || Ven213Estado.Activa,
      USUARIO: record.USUARIO || '',
      ID_CLIENTE: record.ID_CLIENTE || '',
      NOMBRE_CLIENTE: record.NOMBRE_CLIENTE || '',
      DIRECCION: record.DIRECCION || '',
      ID_ADC: record.ID_ADC || '',
      ID_UN: record.ID_UN || '',
      ID_UN_ITEM: record.ID_UN_ITEM || '',
      ID_MONEDA: record.ID_MONEDA || '',
      TASA_CAMBIO: record.TASA_CAMBIO || 1,
      ID_CONDICION: record.ID_CONDICION || '',
      PLAZO: record.PLAZO || 0,
      TIPO_VENTA: record.TIPO_VENTA || '',
      ID_CAUSA: record.ID_CAUSA || '',
      DESCRIPCION: record.DESCRIPCION || '',
      SUB_TOTAL: record.SUB_TOTAL || 0,
      VALOR_DESCUENTO: record.VALOR_DESCUENTO || 0,
      TOTAL: record.TOTAL || 0,
      VALOR_CARTERA: record.VALOR_CARTERA ?? 0,
      VALOR_NO_APLICADO: record.VALOR_NO_APLICADO ?? 0,
      ORIGEN_TIPO: record.ORIGEN_TIPO ?? null,
      ORIGEN_ID_DOCUMENTO: record.ORIGEN_ID_DOCUMENTO ?? null,
      ORIGEN_PREFIJO: record.ORIGEN_PREFIJO ?? null,
      ORIGEN_CONSECUTIVO: record.ORIGEN_CONSECUTIVO ?? null,
      ORIGEN_SUFIJO: record.ORIGEN_SUFIJO ?? null,
      ORIGEN_DOCUMENTO: record.ORIGEN_DOCUMENTO ?? null
    }, { emitEvent: false });
    this.sourceLink.set(sourceLinkOf(record));
  }

  /**
   * Loads line items and the restock distribution of a devolución (4 document keys), with the amounts of the SP.
   */
    private async loadAdditionalData(record: Ven213DevolucionRecord): Promise<void> {
    const version=++this.detailVersion;this.loading.set(true);this.detailsReady.set(false);
    this.items.set([]);
    try {
      const rows=this.business.decode<Ven213Details>(await firstValueFrom(this.service.getAdditionalData({ID_DOCUMENTO:record.ID_DOCUMENTO,PREFIJO:record.PREFIJO,CONSECUTIVO:record.CONSECUTIVO,SUFIJO:record.SUFIJO})));
      if(version!==this.detailVersion)return;
      this.items.set(groupDistribution((rows[0]?.ITM_DEVOLUCION ?? []).map(row=>mapSourceLine(row)),rows[0]?.ITM_DEVOLUCION_BOD ?? []));
      await this.loadAddresses();
      if(version!==this.detailVersion)return;
      this.detailsReady.set(true);this.recalculate();
    }catch(error){this.showError(error);}finally{if(version===this.detailVersion)this.loading.set(false);}
  }

  /**
   * Loads general catalogs.
   */
    private async loadCatalogs(): Promise<void> {
    this.loading.set(true);
    try {
      const identity=this.business.identity;

      // Clients: load in parallel with the other catalogs
      const pClients = this.business.loadClients().then(clients => {
        this.clients.set(clients);
      }).catch(error => this.showError(error));

      const [causes,specs,moneySpec,quantitySpec]=await Promise.all([
        this.business.catalog('causes',{}),
        this.business.catalog('specifications',{...identity,ID_APLICACION_BASE:''}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'FORMATO MONEDA'}),
        this.business.catalog('specifications',{ID_ESPECIFICACION:'OBJETOS',ID_APLICACION:'GENERAL',NOMBRE_OBJETO:'FORMATO CANTIDAD'})]);
      await pClients;
      this.causes.set(causes.map(r=>({...r,ID_CAUSA:String(r.ID_CAUSA ?? ''),LABEL:[r.ID_CAUSA,r.DESCRIPCION ?? r.NOMBRE].filter(Boolean).join(' - ')})));
      this.specifications.set([...specs,...moneySpec.map(row=>({...row,NOMBRE_OBJETO:'FORMATO MONEDA'})),...quantitySpec.map(row=>({...row,NOMBRE_OBJETO:'FORMATO CANTIDAD'}))]);
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }

  private disableFormControls(): void {
    this.form.disable({ emitEvent: false });
  }

    private enableFormControls(): void {
    this.form.enable({emitEvent:false});
    for(const name of ['ID_DOCUMENTO','PREFIJO','CONSECUTIVO','SUFIJO','FECHA_REGISTRO','USUARIO','ESTADO','NOMBRE_CLIENTE',
      'ID_UN','ID_UN_ITEM','ID_MONEDA','TASA_CAMBIO','ID_ADC','TIPO_VENTA','ID_CONDICION','PLAZO',
      'SUB_TOTAL','VALOR_DESCUENTO','IMPUESTOS','TOTAL','VALOR_CARTERA','VALOR_NO_APLICADO',
      'ORIGEN_TIPO','ORIGEN_ID_DOCUMENTO','ORIGEN_PREFIJO','ORIGEN_CONSECUTIVO','ORIGEN_SUFIJO','ORIGEN_DOCUMENTO'] as const)
      this.form.controls[name].disable({emitEvent:false});
    if(this.sourceLocked())this.lockHeader();
  }

  /**
   * Locks the header inherited from the source document: only FECHA, DESCRIPCION and ID_CAUSA stay editable.
   */
  private lockHeader(): void {
    for (const [name, control] of Object.entries(this.form.controls)) {
      if (name !== 'FECHA' && name !== 'DESCRIPCION' && name !== 'ID_CAUSA') control.disable({ emitEvent: false });
    }
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .ven-213__form') || host;
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

  @ViewChild(Ven213ItemsComponent) private itemEditor?: Ven213ItemsComponent;
  readonly documents = signal<Ven213Lookup[]>([]);
  readonly clients = signal<Ven213Lookup[]>([]);
  readonly addresses=signal<Ven213Lookup[]>([]);
  readonly causes=signal<Ven213Lookup[]>([]);
  readonly specifications=signal<Ven213Lookup[]>([]);
  readonly itemPending=signal(false);
  readonly detailsReady=signal(false);
  readonly settingsVisible=signal(false);
  readonly settings=signal<readonly Ven213SettingOption[]>([]);
  readonly selectionVisible=signal(false);
  readonly selection=signal<Ven213SettingResult | null>(null);
  /** Item whose restock distribution popup is open. */
  readonly distributionItem=signal<number | null>(null);
  readonly distributionTarget=computed(()=>this.items().find(item=>item.ITEM===this.distributionItem()) ?? null);
  /** The distribution can be changed only while creating. */
  readonly distributionEditable=computed(()=>this.mode()===RecordToolbarMode.Creating);
  selectedSettingsKeys: unknown[] = [];
  private activeSetting: Ven213SettingOption | null = null;
  private detailVersion=0;
  private lastCriteria: unknown[]=[];
  /** True while a source header is applied: field watchers must not reset what the source brings. */
  private applyingSource = false;
  header(): Ven213DevolucionRecord {
    return {...(this.mode()===RecordToolbarMode.Creating ? Ven213DefaultRecord : this.currentRecord() ?? Ven213DefaultRecord),
      ...this.form.getRawValue()} as Ven213DevolucionRecord;
  }
  localDate(date=new Date()): string {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  spec(name:string): Ven213Lookup | undefined {return this.specifications().find(s=>s.NOMBRE_OBJETO===name);}
  private showError(error:unknown): void {this.notification.error(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');}
  private clearRecord(): void {
    ++this.detailVersion;this.currentIndex.set(-1);this.mode.set(RecordToolbarMode.Initial);this.form.reset({}, {emitEvent:false});
    this.disableFormControls();this.items.set([]);this.sourceLink.set(null);this.detailsReady.set(false);
  }
  private bindBusinessFields(): void {
    const watch=<K extends keyof typeof this.form.controls>(key:K, action:()=>void|Promise<void>)=>{
      this.subscriptions.add((this.form.controls[key].valueChanges as Observable<unknown>).subscribe(()=>{
        if(this.readOnly() || this.applyingSource)return;
        void Promise.resolve().then(action).catch(error=>this.showError(error));
      }));
    };
    watch('DOCUMENTO',()=>this.selectDocument(this.form.controls.DOCUMENTO.value ?? ''));
    // A different client invalidates the loaded source document.
    watch('ID_CLIENTE',async()=>{
      const client=this.clients().find(c=>c.ID_CLIENTE===this.form.controls.ID_CLIENTE.value);
      this.form.patchValue({NOMBRE_CLIENTE:client?.NOMBRE_COMPLETO ?? ''},{emitEvent:false});
      if(this.items().length || this.sourceLink()){this.items.set([]);this.sourceLink.set(null);this.recalculate();}
      await this.loadAddresses();
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
    this.keepAddressOption(this.form.controls.DIRECCION.value);
  }
  /**
   * The address of a devolución comes from its source document and may not match the client's address list
   * (which usually carries a city suffix): it is offered as its own option so the select can show it.
   */
  private keepAddressOption(value:string | null):void {
    if(value && !this.addresses().some(a=>a.DIRECCION===value))this.addresses.update(list=>[{DIRECCION:value},...list]);
  }
  /** Header totals: Σ of the line amounts (preview; the SP returns the final values). */
  private recalculate():void {
    this.form.patchValue(sumAmounts(this.items()),{emitEvent:false});
  }
  /**
   * Applies an edited quantity: amounts and distribution are recalculated; when the distribution no longer
   * matches, the item is marked SIN_REPARTO and the warehouse popup is opened (never for lines without inventory).
   */
  async commitItem(row:Ven213DevolucionItem):Promise<boolean> {
    const current=this.items().find(item=>item.ITEM===row.ITEM);
    if(!current)return false;
    const next=changeReturnQuantity(current,Number(row.CANTIDAD));
    const applied=this.applyItems(this.items().map(item=>item.ITEM===row.ITEM ? next : item));
    if(applied && next.SIN_REPARTO && !next.SIN_INVENTARIO)this.distributionItem.set(row.ITEM);
    return applied;
  }
  /** Lines can be removed, never added. */
  async removeItem(item:number | number[]):Promise<void> {
    if(this.readOnly() || this.loading())return;
    const count=Array.isArray(item)?item.length:1;
    const answer=await Swal.fire({text:count>1?`¿Desea quitar los ${count} productos seleccionados de la devolución?`:'¿Desea quitar el producto seleccionado de la devolución?',icon:'warning',showCancelButton:true,confirmButtonText:'Quitar',cancelButtonText:'Cancelar'});
    if(answer.isConfirmed)this.applyItems(this.items().filter(r=>!(Array.isArray(item)?item:[item]).includes(r.ITEM)));
  }
  private applyItems(items:Ven213DevolucionItem[]):boolean {
    if(this.readOnly() || this.loading())return false;
    this.items.set(items);
    this.recalculate();this.workspace.setDirty(this.applicationId,true);return true;
  }
  openDistribution(item:number):void {
    if(this.loading() || this.itemPending() || this.items().find(row=>row.ITEM===item)?.SIN_INVENTARIO)return;
    this.distributionItem.set(item);
  }
  applyDistribution(rows:Ven213ItemBodega[]):void {
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
    this.notification.warning(`El producto ${productLabel(item)} quedó sin reparto por bodega; no se podrá guardar la devolución hasta repartirlo.`);
  }
  showSettings():void{
    if(this.loading() || this.itemPending() || !this.permissions().configure)return;
    this.settings.set(Ven213SettingOptions.filter(option=>option.MODOS.includes(this.mode())));
    this.settingsVisible.set(true);
  }
  async executeSetting(option:Ven213SettingOption):Promise<void>{
    if(this.loading())return;
    if(!option.MODOS.includes(this.mode())){this.notification.warning('Esta operación no está permitida en el modo actual.');return;}
    const h=this.header();
    if(!h.ID_CLIENTE){this.notification.warning('Seleccione el cliente antes de continuar.');return;}
    if(!h.DOCUMENTO){this.notification.warning('Seleccione el documento de la devolución antes de cargar el documento origen.');return;}
    if(this.sourceLink() || this.items().length){this.notification.warning('Ya hay un documento origen cargado; cancele y cree una devolución nueva para cambiarlo.');return;}
    this.loading.set(true);
    try{
      const rows=await this.business.action<Ven213Lookup>('sources',{ID_CLIENTE:h.ID_CLIENTE});
      if(!rows.length){
        this.notification.warning('El cliente no tiene facturas ni remisiones con cantidades por devolver.');
        return;
      }
      this.activeSetting=option;
      // Room for a full page of the grid (10 rows); the popup caps it at 95vw x 90dvh and the grid scrolls inside.
      this.selection.set({titulo:option.TITULO,modoSeleccion:option.MODO,colsConfig:option.COLUMNAS,dataSource:rows,width:760,height:640});
      this.selectedSettingsKeys=[];
      this.settingsVisible.set(false);
      this.selectionVisible.set(true);
    }catch(error){this.showError(error);}finally{this.loading.set(false);}
  }
  async applySelection(rows: Ven213Lookup[]):Promise<void>{
    if(this.readOnly() || this.loading() || !this.activeSetting)return;
    await this.loadSource(rows[0]);
  }
  /**
   * Loads the header and returnable lines of one factura or remisión (Creating only, with client and DOCUMENTO chosen).
   * Either the whole source is applied and the header locked, or the previous state is restored.
   */
  private async loadSource(source: Ven213Lookup | undefined):Promise<void>{
    if(!source){this.notification.warning('Seleccione un documento origen.');return;}
    const h=this.header();
    if(this.mode()!==RecordToolbarMode.Creating || this.items().length || !h.ID_CLIENTE || !h.DOCUMENTO)return;
    const link:Ven213SourceLink={TIPO:String(source.TIPO ?? ''),ID_DOCUMENTO:String(source.ID_DOCUMENTO ?? ''),PREFIJO:String(source.PREFIJO ?? ''),
      CONSECUTIVO:Number(source.CONSECUTIVO ?? 0),SUFIJO:String(source.SUFIJO ?? '')};
    const before=this.form.getRawValue();
    let patched=false;
    this.loading.set(true);this.applyingSource=true;
    try{
      const result=(await this.business.action<Ven213SourceLoad>('loadSource',{...link,ID_CLIENTE:h.ID_CLIENTE}))[0];
      if(!result?.DEVOLUCION)throw new Error('No se recibieron los datos del documento origen.');
      const values=mapSourceHeader(result.DEVOLUCION);
      if(values.ID_CLIENTE && values.ID_CLIENTE!==h.ID_CLIENTE)throw new Error('El documento origen no pertenece al cliente seleccionado.');
      const items=mapSourceItems(result.ITM_DEVOLUCION ?? [],link.TIPO);
      if(!items.length)throw new Error('El documento origen no tiene líneas con cantidad por devolver.');
      const client=this.clients().find(c=>c.ID_CLIENTE===h.ID_CLIENTE);
      patched=true;
      this.form.patchValue({...values,ID_CLIENTE:h.ID_CLIENTE,NOMBRE_CLIENTE:values.NOMBRE_CLIENTE ?? client?.NOMBRE_COMPLETO ?? h.NOMBRE_CLIENTE ?? '',
        ORIGEN_TIPO:link.TIPO,ORIGEN_ID_DOCUMENTO:link.ID_DOCUMENTO,ORIGEN_PREFIJO:link.PREFIJO,ORIGEN_CONSECUTIVO:link.CONSECUTIVO,
        ORIGEN_SUFIJO:link.SUFIJO,ORIGEN_DOCUMENTO:String(source.DOCUMENTO ?? link.ID_DOCUMENTO)},{emitEvent:false});
      await this.loadAddresses();
      if(values.DIRECCION!==undefined){this.form.controls.DIRECCION.setValue(values.DIRECCION ?? '',{emitEvent:false});this.keepAddressOption(values.DIRECCION ?? '');}
      this.items.set(items);
      this.sourceLink.set(link);this.lockHeader();
      this.recalculate();this.workspace.setDirty(this.applicationId,true);this.selectionVisible.set(false);
      this.notification.info(items.some(item=>item.SIN_REPARTO)
        ? 'Documento origen cargado. Hay productos sin reparto por bodega: repártalos antes de guardar.'
        : 'Documento origen cargado. Revise las cantidades, la causa y el reparto antes de guardar.');
    }catch(error){
      this.showError(error);
      if(patched)await this.restoreHeader(before).catch(restoreError=>this.showError(restoreError));
    }finally{
      // Let the editors echo the patched values back before the field watchers listen again.
      await new Promise(resolve=>setTimeout(resolve));
      this.applyingSource=false;this.loading.set(false);
    }
  }
  /** Restores the header captured before a source load. */
  private async restoreHeader(before:ReturnType<typeof this.form.getRawValue>):Promise<void>{
    this.form.patchValue(before,{emitEvent:false});
    await this.loadAddresses();
    this.form.controls.DIRECCION.setValue(before.DIRECCION ?? '',{emitEvent:false});
    this.keepAddressOption(before.DIRECCION ?? '');
  }

 readonly persistItem=(row:Ven213DevolucionItem)=>this.commitItem(row);
 onItemPending(pending:boolean):void {
   this.itemPending.set(pending);
   if(pending){this.disableFormControls();this.workspace.setDirty(this.applicationId,true);}
   else if(!this.readOnly())this.enableFormControls();
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
