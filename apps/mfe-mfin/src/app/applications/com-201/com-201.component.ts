import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  signal,
  untracked
} from '@angular/core';

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
  ApplicationRegistryService,
  RecordToolbarPermissionsService,
  ToolbarRuntimeService,
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  XteinApplicationSetting,
  XteinDateComponent,
  XteinGroupLabelComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLoadingComponent,
  XteinLookupComponent,
  XteinNotificationService,
  XteinNumberComponent,
  XteinRecordFilterComponent,
  XteinRecordFilterResult,
  XteinRecordReportsComponent,
  XteinRecordSettingsComponent,
  XteinRecordViewComponent,
  XteinSelectComponent,
  XteinSwitchComponent
} from '@xtein/ui';

import {
  Com201Action,
  Com201Application
} from './constants/com-201.constants';

import {
  Com201BasePriceOptions,
  Com201DefaultRecord,
  Com201EmptyRecord,
  Com201MatrixRequest,
  Com201Message,
  Com201PriceApplicationOptions,
  Com201ProviderColumns,
  Com201RecordViewColumns,
  Com201RootGroup,
  Com201RoundingOptions,
  Com201Setting,
  Com201StatusOptions,
  Com201ToolbarCapabilities,
  Com201TypeOptions,
  Com201UpdateOptions
} from './constants/com-201-ui.constants';

import { Com201ListaPrecios } from './models/com-201-record.model';
import { Com201Grupo, Com201Lookup, Com201Producto } from './models/com-201-business.model';
import { Com201Service } from './services/com-201.service';
import { Com201BusinessService } from './services/com-201-business.service';
import { Com201ItemsStore } from './services/com-201-items.store';
import { descendantGroups } from './utils/com-201-groups';
import { mergeLikeLegacy } from './utils/com-201-merge';
import { validateHeader } from './utils/com-201-validation';
import { Com201GroupsComponent } from './components/com-201-groups/com-201-groups.component';
import { Com201ItemsComponent } from './components/com-201-items/com-201-items.component';


/**
 * COM-201 - Listas de precios.
 */
@Component({
  selector:
    'com-201',

  standalone:
    true,

  imports: [
    ReactiveFormsModule,
    Com201GroupsComponent,
    Com201ItemsComponent,
    XteinRecordFilterComponent,
    XteinRecordViewComponent,
    XteinRecordReportsComponent,
    XteinRecordSettingsComponent,
    XteinDateComponent,
    XteinGroupLabelComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLoadingComponent,
    XteinLookupComponent,
    XteinNumberComponent,
    XteinSelectComponent,
    XteinSwitchComponent
  ],

  providers: [
    Com201Service, Com201BusinessService, Com201ItemsStore
  ],

  templateUrl:
    './com-201.component.html',

  styleUrl:
    './com-201.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Com201Component
  implements OnInit, OnDestroy {

  readonly applicationId =
    Com201Application.Id;

  readonly tableBase =
    Com201Application.Table;

  readonly statusOptions = Com201StatusOptions;
  readonly typeOptions = Com201TypeOptions;
  readonly basePriceOptions = Com201BasePriceOptions;
  readonly priceApplicationOptions = Com201PriceApplicationOptions;
  readonly roundingOptions = Com201RoundingOptions;
  readonly updateOptions = Com201UpdateOptions;
  readonly providerColumns = Com201ProviderColumns;
  readonly viewColumns = Com201RecordViewColumns;

  /**
   * Internal subscription manager.
   */
  private readonly subscriptions =
    new Subscription();

  /**
   * Loaded query records.
   */
  readonly records =
    signal<Com201ListaPrecios[]>([]);

  /**
   * Currently active record index.
   */
  readonly currentIndex =
    signal<number>(-1);

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

  readonly filterVisible = signal(false);
  readonly viewVisible = signal(false);
  readonly reportsVisible = signal(false);
  readonly settingsVisible = signal(false);
  readonly itemPending = signal(false);

  /** Catalogs. */
  readonly providers = signal<Com201Lookup[]>([]);
  readonly groups = signal<Com201Grupo[]>([]);
  readonly products = signal<Com201Producto[]>([]);
  readonly baseLists = signal<Com201Lookup[]>([]);
  readonly specifications = signal<Com201Lookup[]>([]);

  /**
   * Header values as a signal (visibility rules and child inputs).
   */
  readonly header =
    signal<Com201ListaPrecios>({ ...Com201EmptyRecord });

  /**
   * Computed read-only flag: only Creating, Editing and Copying allow changes.
   */
  readonly readOnly =
    computed(() =>
      this.mode() !== RecordToolbarMode.Creating &&
      this.mode() !== RecordToolbarMode.Editing &&
      this.mode() !== RecordToolbarMode.Copying
    );

  /**
   * ID_LISTA and structural fields are locked in Editing while the list has items (legacy COM201.component.ts:924-927).
   */
  readonly structuralLocked =
    computed(() => this.mode() === RecordToolbarMode.Editing && this.store.hasItems());

  readonly showBasePrice =
    computed(() => this.header().ACTUALIZACION !== 'Manual' && this.header().TIPO !== 'PROVEEDOR');

  readonly showBaseList =
    computed(() => {
      const h = this.header();
      return h.TIPO !== 'PROVEEDOR' && h.BASE_PRECIO !== 'Ultima Compra' && h.BASE_PRECIO !== 'Ultimo Costo C/P' && h.ACTUALIZACION !== 'Manual';
    });

  readonly showProvider =
    computed(() => this.header().TIPO === 'PROVEEDOR' && this.header().ACTUALIZACION === 'Manual');

  readonly selectedGroupId =
    computed(() => this.store.groupFilter()?.id ?? null);

  /**
   * Active record accessor.
   */
  readonly currentRecord =
    computed<Com201ListaPrecios | null>(() => {
      const list = this.records();
      const index = this.currentIndex();
      return index >= 0 && index < list.length ? list[index] : null;
    });

  /**
   * Report filter for all queried records.
   */
  readonly queryFilter =
    computed(() => this.records()[0]?.QFILTRO || this.records().map(record => '(' + this.recordFilter(record) + ')').join(' OR '));

  /**
   * Reactive form definition.
   */
  readonly form = new FormGroup({
    ID_LISTA: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    ESTADO: new FormControl<string>('', { nonNullable: true }),
    DESCRIPCION: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    TIPO: new FormControl<string>('', { nonNullable: true }),
    ACTUALIZACION: new FormControl<string>('', { nonNullable: true }),
    BASE_PRECIO: new FormControl<string>('', { nonNullable: true }),
    LISTA_BASE: new FormControl<string>('', { nonNullable: true }),
    ID_PROVEEDOR: new FormControl<string>('', { nonNullable: true }),
    NOMBRE_PROVEEDOR: new FormControl<string>('', { nonNullable: true }),
    APLICACION_PRECIO: new FormControl<string>('', { nonNullable: true }),
    MARGEN: new FormControl<number>(0, { nonNullable: true }),
    FECHA_INICIO: new FormControl<string | null>(null),
    FECHA_FINAL: new FormControl<string | null>(null),
    INCLUYE_IVA: new FormControl<boolean>(false, { nonNullable: true }),
    PRINCIPAL: new FormControl<boolean>(false, { nonNullable: true }),
    APROXIMACION: new FormControl<number>(1, { nonNullable: true })
  });

  @ViewChild(Com201ItemsComponent) private itemEditor?: Com201ItemsComponent;

  /** ID_LISTA before entering Editing ('' in Creating and Copying), sent as ID_LISTA_PREV. */
  private idListaPrev = '';
  private lastCriteria: unknown[] = [];
  private productsFilter = '';

  constructor(
    private readonly service: Com201Service,
    readonly business: Com201BusinessService,
    readonly store: Com201ItemsStore,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly registry: ApplicationRegistryService,
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
      }
    });
  }

  ngOnInit(): void {
    this.form.disable({ emitEvent: false });
    this.subscriptions.add(this.form.valueChanges.subscribe(() => {
      // Editors echo the values written by setForm; only real changes mark the tab as dirty.
      const previous = JSON.stringify(this.header());
      this.syncHeader();
      if (!this.readOnly() && JSON.stringify(this.header()) !== previous) this.workspace.setDirty(this.applicationId, true);
    }));

    // Subscribe to toolbar commands for COM-201
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

    this.bindBusinessFields();
    void this.loadDataLists();
  }

  ngOnDestroy(): void {
    this.store.reset();
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  /**
   * Publishes the current state to the platform toolbar.
   */
  private publishToolbarState(): void {
    const state = createRecordToolbarState({
      busy: this.loading() || this.itemPending() || this.store.loading(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: Com201ToolbarCapabilities,
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
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
        void this.editRecord();
        break;

      case ToolbarAction.Copy:
        void this.copyRecord();
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
        if (this.readOnly() && this.permissions().search) this.filterVisible.set(true);
        break;

      case ToolbarAction.Refresh:
        void this.refresh();
        break;

      case ToolbarAction.View:
        if (this.readOnly()) this.viewVisible.set(true);
        break;

      case ToolbarAction.First:
        this.navigateRecord('first');
        break;

      case ToolbarAction.GoTo:
        if (this.readOnly() && typeof command.payload === 'number' && Number.isInteger(command.payload)
          && command.payload >= 1 && command.payload <= this.records().length) {
          void this.selectRecordIndex(command.payload - 1);
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
        if (this.permissions().configure) this.settingsVisible.set(true);
        break;

      case ToolbarAction.Print:
        if (this.readOnly() && this.currentRecord()) this.reportsVisible.set(true);
        break;

      default:
        break;
    }
  }

  /**
   * Switches to creation mode with the legacy defaults (COM201.component.ts:826-842).
   */
  newRecord(): void {
    if (this.loading() || !this.readOnly() || !this.permissions().create) return;
    const today = this.localDate();
    this.idListaPrev = '';
    this.store.startNew();
    this.mode.set(RecordToolbarMode.Creating);
    this.setForm({ ...Com201DefaultRecord, FECHA_INICIO: today, FECHA_FINAL: today });
    this.form.enable({ emitEvent: false });
    void this.prepareEdition();
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
  }

  /**
   * Switches to edit mode after loading the complete item list.
   */
  async editRecord(): Promise<void> {
    const record = this.currentRecord();
    if (this.loading() || !this.readOnly() || !this.permissions().edit || !record) return;
    this.loading.set(true);
    try {
      if (!(await this.store.materialize(record.ID_LISTA))) return;
      this.idListaPrev = record.ID_LISTA;
      this.mode.set(RecordToolbarMode.Editing);
      this.form.enable({ emitEvent: false });
      await this.prepareEdition();
      this.workspace.setDirty(this.applicationId, false);
    } catch (error) {
      this.showError(error);
      await this.store.load(record.ID_LISTA).catch(() => undefined);
    } finally {
      this.loading.set(false);
      this.focusFirstControl();
    }
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const initialInput = host.querySelector<HTMLInputElement>(
        '#com-201-id-lista input:not([readonly]):not([disabled]), #com-201-descripcion input:not([readonly]):not([disabled])'
      );
      if (initialInput) {
        initialInput.focus();
        initialInput.select?.();
        return true;
      }
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .com-201__card') || host;
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

  /**
   * Copies the current list: header and complete item list, with an empty ID_LISTA.
   */
  async copyRecord(): Promise<void> {
    const record = this.currentRecord();
    if (this.loading() || !this.readOnly() || !this.permissions().create || !record) return;
    const notice = await Swal.fire({
      text: Com201Message.copyNotice,
      icon: 'info',
      showCancelButton: false,
      confirmButtonColor: '#DF3E3E',
      confirmButtonText: 'Aceptar'
    });
    if (!notice.isConfirmed) return;
    this.loading.set(true);
    try {
      if (!(await this.store.materialize(record.ID_LISTA))) return;
      this.idListaPrev = '';
      this.mode.set(RecordToolbarMode.Copying);
      this.form.enable({ emitEvent: false });
      this.form.controls.ID_LISTA.setValue('', { emitEvent: false });
      this.syncHeader();
      await this.prepareEdition();
      this.workspace.setDirty(this.applicationId, false);
    } catch (error) {
      this.showError(error);
      await this.store.load(record.ID_LISTA).catch(() => undefined);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cancels current creation, edit or copy operation.
   */
  async cancelEdit(): Promise<void> {
    if (this.loading() || this.readOnly()) return;
    const dirty = this.workspace.getTab(this.applicationId)?.dirty ?? false;
    const confirmation = await Swal.fire({
      title: this.workspace.getApplicationTitle(this.applicationId),
      text: dirty ? Com201Message.cancelDirty : Com201Message.cancelClean,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, cancelar'
    });
    if (!confirmation.isConfirmed) return;
    this.itemEditor?.closeEditor();
    this.itemPending.set(false);
    const current = this.currentRecord();
    if (current) {
      void this.selectRecordIndex(this.currentIndex());
    } else {
      this.clearRecord();
    }
    this.workspace.setDirty(this.applicationId, false);
  }

  /**
   * Saves the list with the complete item array (new or update).
   */
  async saveRecord(): Promise<void> {
    if (this.loading() || this.readOnly() || this.itemPending()) return;
    const header = this.formRecord();
    const message = validateHeader(header);
    if (message) {
      this.form.markAllAsTouched();
      this.notification.warning(message);
      return;
    }
    const editing = this.mode() === RecordToolbarMode.Editing;
    this.loading.set(true);
    try {
      if (!editing || header.ID_LISTA !== this.idListaPrev) {
        const exists = await this.business.exists(header.ID_LISTA);
        if (exists) throw new Error(exists);
      }
      const payload = await this.store.buildSavePayload({
        checkConcurrency: editing,
        idListaPrev: this.idListaPrev,
        byAttribute: header.APLICACION_PRECIO === 'Atributo'
      });
      if (payload.warnings.length) this.notification.warning(payload.warnings.join(' '));
      const request = { LISTA_PRECIOS: header, ITM_LISTA_PRECIOS: payload.items, ID_LISTA_PREV: this.idListaPrev };
      this.business.decode(await firstValueFrom(this.service.save(editing ? Com201Action.Update : Com201Action.New, request)));
      const saved: Com201ListaPrecios = { ...header };
      const list = [...this.records()];
      let index = editing ? this.currentIndex() : list.findIndex(row => row.ID_LISTA === saved.ID_LISTA);
      if (index < 0) { index = list.length; list.push(saved); } else { list[index] = { ...list[index], ...saved }; }
      this.records.set(list);
      this.notification.success(Com201Message.saved);
      await this.selectRecordIndex(index);
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Prompts confirmation and removes the active price list.
   */
  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete) return;
    const confirmation = await Swal.fire({
      title: this.workspace.getApplicationTitle(this.applicationId),
      text: Com201Message.deleteConfirm(record.ID_LISTA),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    });
    if (!confirmation.isConfirmed) return;
    this.loading.set(true);
    try {
      this.business.decode(await firstValueFrom(this.service.delete({ ID_LISTA: record.ID_LISTA })));
      this.notification.success(Com201Message.deleted);
      const remaining = this.records().filter(row => row !== record);
      this.records.set(remaining);
      if (remaining.length) await this.selectRecordIndex(Math.min(this.currentIndex(), remaining.length - 1));
      else this.clearRecord();
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Re-executes the last search keeping the current list selected.
   */
  async refresh(): Promise<void> {
    if (this.loading() || !this.readOnly()) return;
    if (!this.lastCriteria.length) {
      if (this.currentRecord()) await this.selectRecordIndex(this.currentIndex());
      return;
    }
    await this.queryRecords(this.lastCriteria, this.currentRecord()?.ID_LISTA ?? '');
  }

  /**
   * Searches records with the shared record filter (LISTAS_PRECIOS).
   */
  async searchRecords(filter: XteinRecordFilterResult): Promise<void> {
    if (this.loading() || !this.readOnly() || !this.permissions().search) return;
    this.filterVisible.set(false);
    await this.queryRecords(filter.ESTRUCTURA, '');
  }

  private async queryRecords(criteria: unknown[], selectedId: string): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.business.action<Com201ListaPrecios>(Com201Action.Query, { LISTAS_PRECIOS: criteria });
      this.lastCriteria = criteria;
      this.records.set(list.filter(row => row?.ID_LISTA));
      if (this.records().length) {
        const selected = this.records().findIndex(row => row.ID_LISTA === selectedId);
        await this.selectRecordIndex(Math.max(0, selected));
      } else {
        this.clearRecord();
        this.notification.warning(Com201Message.notFound);
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Selects a record by its index and loads its items in browsing mode.
   */
  async selectRecordIndex(index: number): Promise<void> {
    const record = this.records()[index];
    if (!record) return;
    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.form.disable({ emitEvent: false });
    this.idListaPrev = '';
    this.setForm(record);
    this.workspace.setDirty(this.applicationId, false);
    void this.loadBaseLists();
    this.store.reset();
    try {
      await this.store.load(record.ID_LISTA);
    } catch (error) {
      this.showError(error);
    }
  }

  /**
   * Selects a record chosen from the XteinRecordView modal.
   */
  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const id = (record as Com201ListaPrecios).ID_LISTA;
    const index = this.records().findIndex(row => row.ID_LISTA === id);
    if (index >= 0) void this.selectRecordIndex(index);
    this.viewVisible.set(false);
  }

  /**
   * Handles toolbar record navigation.
   */
  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    if (this.loading() || !this.readOnly()) return;
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
    if (target !== this.currentIndex()) void this.selectRecordIndex(target);
  }

  /**
   * Validates EXISTE LISTA when ID_LISTA loses focus (Creating / Copying, or Editing with a new code).
   */
  async checkCode(): Promise<void> {
    const id = this.form.controls.ID_LISTA.value.trim();
    if (this.readOnly() || !id || (this.mode() === RecordToolbarMode.Editing && id === this.idListaPrev)) return;
    try {
      const message = await this.business.exists(id);
      if (message && this.form.controls.ID_LISTA.value.trim() === id) this.notification.error(message);
    } catch (error) {
      this.showError(error);
    }
  }

  /**
   * Filters the items by the group and its subgroups.
   */
  onGroupSelected(group: Com201Grupo | null): void {
    if (this.itemPending()) {
      this.notification.warning(Com201Message.groupLocked);
      return;
    }
    const filter = group ? { id: group.ID_GRUPO, groups: descendantGroups(this.groups(), group.ID_GRUPO) } : null;
    this.store.setGroup(filter).catch(error => this.showError(error));
  }

  onItemPending(pending: boolean): void {
    this.itemPending.set(pending);
  }

  onItemsChanged(): void {
    this.workspace.setDirty(this.applicationId, true);
  }

  /**
   * Executes one option of the Configurar popup (legacy COM201.component.ts:572-587).
   */
  async executeSetting(option: XteinApplicationSetting): Promise<void> {
    if (this.loading() || this.itemPending()) return;
    try {
      const config = typeof option.CONFIG === 'string' && option.CONFIG.trim()
        ? JSON.parse(option.CONFIG) as { MODO?: string }
        : option.CONFIG && typeof option.CONFIG === 'object' ? option.CONFIG : { MODO: 'edicion' };
      if (this.readOnly() && config.MODO !== 'consulta') {
        this.notification.warning(Com201Message.modeNotAllowed);
        return;
      }
      switch (option.VALOR) {
        case Com201Setting.GenerateGroup: {
          const id = this.selectedGroupId();
          if (!this.canGenerate()) return;
          if (!id) {
            this.notification.warning(Com201Message.groupRequired);
            return;
          }
          const name = this.groups().find(group => group.ID_GRUPO === id)?.NOMBRE ?? '';
          await this.generatePrices(id, Com201Message.generateConfirm(`[${id}] ${name}`.trim()));
          break;
        }

        case Com201Setting.UpdatePrices:
          if (!this.canGenerate()) return;
          await this.generatePrices(Com201RootGroup, Com201Message.updatePricesConfirm);
          break;

        case Com201Setting.UpdateMatrices:
          this.openMatrix();
          break;

        default:
          break;
      }
    } catch (error) {
      this.showError(error);
    }
  }

  /**
   * Opens MA-019 with the legacy filter (ApplicationRequest.parameters).
   */
  private openMatrix(): void {
    const { applicationId, parameters } = Com201MatrixRequest;
    const title = this.registry.getApplication(applicationId)?.name ?? Com201MatrixRequest.title;
    const alreadyOpen = this.workspace.isOpen(applicationId);
    try {
      this.workspace.openApplication({ applicationId, title, parameters });
    } catch {
      this.notification.warning(Com201Message.matrixUnavailable);
      return;
    }
    if (alreadyOpen) this.notification.warning(Com201Message.matrixAlreadyOpen);
  }

  /**
   * Generar precio grupo / Actualizar Precios: legacy merge over the complete list, without saving.
   */
  private async generatePrices(idGrupo: string, question: string): Promise<void> {
    const answer = await Swal.fire({
      title: this.workspace.getApplicationTitle(this.applicationId),
      text: question,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, continuar'
    });
    if (!answer.isConfirmed) return;
    this.loading.set(true);
    try {
      const operacion = this.mode() === RecordToolbarMode.Editing ? Com201Action.Update : Com201Action.New;
      const rows = await this.business.generateGroup(this.formRecord(), idGrupo, operacion);
      const result = mergeLikeLegacy(this.store.full() ?? [], rows, descendantGroups(this.groups(), idGrupo));
      this.store.replaceAll(result.items, result.mergedKeys);
      this.workspace.setDirty(this.applicationId, true);
      this.notification.success(Com201Message.merged);
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  private canGenerate(): boolean {
    if (this.readOnly()) {
      this.notification.warning(Com201Message.editModeRequired);
      return false;
    }
    if (this.header().ACTUALIZACION === 'Automática') {
      this.notification.warning(Com201Message.automaticNotAllowed);
      return false;
    }
    return true;
  }

  /**
   * Generates single-record SQL filter expression for reports.
   */
  currentReportFilter(): string {
    const record = this.currentRecord();
    return record ? this.recordFilter(record) : '';
  }

  /**
   * Email context: subject, sender and template from the specifications; recipient always empty.
   */
  reportEmailContext() {
    return {
      defaults: {
        ASUNTO: this.spec('ASUNTO EMAIL')?.VALOR_DEFECTO ?? '',
        ORIGEN_EMAIL: this.spec('EMAIL USUARIO')?.VALOR_DEFECTO ?? '',
        ORIGEN: String(this.spec('EMAIL USUARIO')?.TITULO ?? ''),
        DESTINO: '',
        DESTINO_EMAIL: ''
      },
      template: this.spec('TEMPLATE')?.VALOR_DEFECTO ?? '',
      replacements: { ...this.header() }
    };
  }

  /** Header fields that stay editable in Editing even when the list has items (legacy readOnlyEdicion). */
  lockedField(): boolean {
    return this.readOnly() || this.structuralLocked() || this.itemPending();
  }

  editableField(): boolean {
    return !this.readOnly() && !this.itemPending();
  }

  private recordFilter(record: Com201ListaPrecios): string {
    return " LISTAS_PRECIOS.ID_LISTA = '" + String(record.ID_LISTA).replace(/'/g, "''") + "'";
  }

  private spec(name: string): Com201Lookup | undefined {
    return this.specifications().find(row => row.NOMBRE_OBJETO === name);
  }

  /**
   * Loads general catalogs (legacy valoresObjetos 'todos' plus specifications for email).
   */
  private async loadDataLists(): Promise<void> {
    this.loading.set(true);
    try {
      const [providers, groups, specifications] = await Promise.all([
        this.business.catalog('providers'),
        this.business.catalog('groups'),
        this.business.specifications()
      ]);
      this.providers.set(providers);
      this.groups.set(groups.filter(group => group['ID_GRUPO']) as unknown as Com201Grupo[]);
      this.specifications.set(specifications);
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Products for the Manual item editor; loaded once per TIPO (legacy COM201.component.ts:277-296).
   */
  private async loadProducts(): Promise<void> {
    const h = this.header();
    if (this.readOnly() || h.ACTUALIZACION !== 'Manual') return;
    const filter = h.TIPO === 'VENTAS' ? 'ventas' : 'materiales';
    if (filter === this.productsFilter) return;
    this.productsFilter = filter;
    try {
      const rows = await this.business.catalog('products', { FILTRO: filter, MODO: 'simple' });
      if (this.productsFilter === filter) this.products.set(rows as unknown as Com201Producto[]);
    } catch (error) {
      this.productsFilter = '';
      this.showError(error);
    }
  }

  /**
   * LISTA BASE only for VENTAS + Generada + Precio Mercado (legacy COM201.component.ts:766-768).
   */
  private async loadBaseLists(): Promise<void> {
    const h = this.header();
    if (!(h.TIPO === 'VENTAS' && h.ACTUALIZACION === 'Generada' && h.BASE_PRECIO === 'Precio Mercado')) {
      this.baseLists.set([]);
      return;
    }
    try {
      const rows = await this.business.baseLists(h);
      const current = this.header();
      if (current.TIPO === h.TIPO && current.ACTUALIZACION === h.ACTUALIZACION && current.BASE_PRECIO === h.BASE_PRECIO) this.baseLists.set(rows);
    } catch (error) {
      this.showError(error);
    }
  }

  private async prepareEdition(): Promise<void> {
    await Promise.all([this.loadProducts(), this.loadBaseLists()]);
  }

  private bindBusinessFields(): void {
    const watch = <K extends keyof typeof this.form.controls>(key: K, action: () => void | Promise<void>) => {
      this.subscriptions.add((this.form.controls[key].valueChanges as Observable<unknown>).subscribe(() => {
        if (this.readOnly()) return;
        void Promise.resolve().then(action).catch(error => this.showError(error));
      }));
    };
    watch('TIPO', () => this.prepareEdition());
    watch('ACTUALIZACION', () => this.prepareEdition());
    watch('BASE_PRECIO', () => this.loadBaseLists());
    watch('ID_PROVEEDOR', () => {
      this.form.controls.NOMBRE_PROVEEDOR.setValue(this.providerName(this.form.controls.ID_PROVEEDOR.value), { emitEvent: false });
      this.syncHeader();
    });
  }

  private providerName(id: string): string {
    return String(this.providers().find(row => row.ID_PROVEEDOR === id)?.NOMBRE ?? '');
  }

  /**
   * Populates the form from a record without emitting changes.
   */
  private setForm(record: Com201ListaPrecios): void {
    this.form.reset({
      ID_LISTA: record.ID_LISTA ?? '',
      ESTADO: record.ESTADO ?? '',
      DESCRIPCION: record.DESCRIPCION ?? '',
      TIPO: record.TIPO ?? '',
      ACTUALIZACION: record.ACTUALIZACION ?? '',
      BASE_PRECIO: record.BASE_PRECIO ?? '',
      LISTA_BASE: record.LISTA_BASE ?? '',
      ID_PROVEEDOR: record.ID_PROVEEDOR ?? '',
      NOMBRE_PROVEEDOR: record.NOMBRE_PROVEEDOR || this.providerName(record.ID_PROVEEDOR ?? ''),
      APLICACION_PRECIO: record.APLICACION_PRECIO ?? '',
      MARGEN: Number(record.MARGEN ?? 0),
      FECHA_INICIO: record.FECHA_INICIO ? String(record.FECHA_INICIO).substring(0, 10) : null,
      FECHA_FINAL: record.FECHA_FINAL ? String(record.FECHA_FINAL).substring(0, 10) : null,
      INCLUYE_IVA: this.flag(record.INCLUYE_IVA),
      PRINCIPAL: this.flag(record.PRINCIPAL),
      APROXIMACION: Number(record.APROXIMACION ?? 1)
    }, { emitEvent: false });
    this.syncHeader();
  }

  private formRecord(): Com201ListaPrecios {
    return { ...this.form.getRawValue(), ID_LISTA: this.form.controls.ID_LISTA.value.trim() };
  }

  private syncHeader(): void {
    this.header.set(this.formRecord());
  }

  private clearRecord(): void {
    this.store.reset();
    this.currentIndex.set(-1);
    this.mode.set(RecordToolbarMode.Initial);
    this.idListaPrev = '';
    this.setForm(Com201EmptyRecord);
    this.form.disable({ emitEvent: false });
    this.baseLists.set([]);
  }

  private flag(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
  }

  private localDate(date = new Date()): string {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  private showError(error: unknown): void {
    this.notification.error(this.business.errorMessage(error, 'No se pudieron cargar los datos.'));
  }
}
