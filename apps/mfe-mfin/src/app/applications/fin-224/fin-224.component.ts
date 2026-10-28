import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
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
  Subscription
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
  XteinApplicationSetting,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinRecordFilterComponent,
  XteinRecordFilterResult,
  XteinRecordReportsComponent,
  XteinRecordSettingsComponent,
  XteinRecordViewComponent,
  XteinSelectComponent
} from '@xtein/ui';

import {
  Fin224Action,
  Fin224Application
} from './constants/fin-224.constants';

import {
  Fin224DefaultRecord,
  Fin224EmptyRecord,
  Fin224RecordViewColumns,
  Fin224StatusOptions,
  Fin224TipoOptions,
  Fin224ToolbarCapabilities
} from './constants/fin-224-ui.constants';

import {
  Fin224CondicionRecord,
  Fin224ItemCondicion,
  Fin224ListaPrecioOption,
  Fin224PlanOption
} from './models/fin-224.model';
import { Fin224Service } from './services/fin-224.service';
import { Fin224BusinessService } from './services/fin-224-business.service';
import { Fin224ItemsComponent } from './components/fin-224-items/fin-224-items.component';

/**
 * FIN-224 - Condiciones de Negociación.
 */
@Component({
  selector: 'fin-224',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Fin224ItemsComponent,
    XteinRecordFilterComponent,
    XteinRecordViewComponent,
    XteinRecordReportsComponent,
    XteinRecordSettingsComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLoadingComponent,
    XteinSelectComponent
  ],
  providers: [
    Fin224Service,
    Fin224BusinessService
  ],
  templateUrl: './fin-224.component.html',
  styleUrl: './fin-224.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Fin224Component implements OnInit, OnDestroy {
  readonly applicationId = Fin224Application.Id;
  readonly tableBase = Fin224Application.Table;

  readonly statusOptions = Fin224StatusOptions;
  readonly tipoOptions = Fin224TipoOptions;
  readonly viewColumns = Fin224RecordViewColumns;
  readonly planColumns = ['ID_PLAN', 'DESCRIPCION'];
  readonly planHeaders = ['Código', 'Descripción'];
  readonly planDropDownOptions = { width: 450, minWidth: 400 };
  readonly RecordToolbarMode = RecordToolbarMode;

  private readonly service = inject(Fin224Service);
  readonly business = inject(Fin224BusinessService);
  private readonly toolbar = inject(ToolbarRuntimeService);
  private readonly permissionsService = inject(RecordToolbarPermissionsService);
  private readonly workspace = inject(WorkspaceRuntimeService);
  private readonly elementRef = inject(ElementRef);
  private readonly notification = inject(XteinNotificationService);

  private readonly subscriptions = new Subscription();

  readonly records = signal<Fin224CondicionRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);

  readonly filterVisible = signal(false);
  readonly viewVisible = signal(false);
  readonly reportsVisible = signal(false);
  readonly settingsVisible = signal(false);

  /** Catalogs */
  readonly planes = signal<Fin224PlanOption[]>([]);
  readonly listasPrecios = signal<Fin224ListaPrecioOption[]>([]);

  /** Items signal for active record */
  readonly items = signal<Fin224ItemCondicion[]>([]);

  readonly readOnly = computed(() =>
    this.mode() !== RecordToolbarMode.Creating &&
    this.mode() !== RecordToolbarMode.Editing &&
    this.mode() !== RecordToolbarMode.Copying
  );

  readonly currentRecord = computed<Fin224CondicionRecord | null>(() => {
    const list = this.records();
    const index = this.currentIndex();
    return index >= 0 && index < list.length ? list[index] : null;
  });

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO ||
    this.records().map(record => `(CONDICIONES_NEGOCIACION.ID_CONDICION = '${record.ID_CONDICION.replace(/'/g, "''")}')`).join(' OR ')
  );

  /** Reactive form definition */
  readonly form = new FormGroup({
    ID_CONDICION: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    DESCRIPCION: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    TIPO: new FormControl<string>('', { nonNullable: true }),
    ID_PLAN: new FormControl<string>('', { nonNullable: true }),
    ESTADO: new FormControl<string>('ACTIVO', { nonNullable: true })
  });

  private idCondicionPrev = '';

  constructor() {
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
      if (!this.readOnly()) {
        this.workspace.setDirty(this.applicationId, true);
      }
    }));

    // Subscribe to toolbar commands
    this.subscriptions.add(
      this.toolbar
        .commandsForApplication(this.applicationId)
        .subscribe(command => this.handleToolbarCommand(command))
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

    void this.loadCatalogs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  private publishToolbarState(): void {
    const state = createRecordToolbarState({
      busy: this.loading() || this.saving(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: Fin224ToolbarCapabilities,
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
  }

  private handleToolbarCommand(command: ToolbarCommand): void {
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
        if (this.readOnly() && this.permissions().search) {
          this.filterVisible.set(true);
        }
        break;
      case ToolbarAction.View:
        if (this.readOnly()) {
          this.viewVisible.set(true);
        }
        break;
      case ToolbarAction.Print:
        if (this.readOnly() && this.permissions().print) {
          this.reportsVisible.set(true);
        }
        break;
      case ToolbarAction.Configure:
        if (this.readOnly()) {
          this.settingsVisible.set(true);
        }
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
      case ToolbarAction.GoTo:
        if (
          this.readOnly() &&
          typeof command.payload === 'number' &&
          Number.isInteger(command.payload) &&
          command.payload >= 1 &&
          command.payload <= this.records().length
        ) {
          this.selectRecordIndex(command.payload - 1);
        }
        break;
      default:
        break;
    }
  }

  private async loadCatalogs(): Promise<void> {
    this.loading.set(true);
    try {
      const [planes, listas] = await Promise.all([
        this.business.loadPlanes(),
        this.business.loadListasPrecios()
      ]);
      this.planes.set(planes);
      this.listasPrecios.set(listas);
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al cargar catálogos.'));
    } finally {
      this.loading.set(false);
    }
  }

  newRecord(): void {
    if (this.loading() || !this.readOnly() || !this.permissions().create) return;
    this.idCondicionPrev = '';
    this.mode.set(RecordToolbarMode.Creating);
    this.setForm({ ...Fin224DefaultRecord });
    this.items.set([]);
    this.form.enable({ emitEvent: false });
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
  }

  editRecord(): void {
    const record = this.currentRecord();
    if (this.loading() || !this.readOnly() || !this.permissions().edit || !record) return;

    this.idCondicionPrev = record.ID_CONDICION;
    this.mode.set(RecordToolbarMode.Editing);
    this.form.enable({ emitEvent: false });
    this.form.controls.ID_CONDICION.disable({ emitEvent: false });
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
  }

  async checkCode(): Promise<void> {
    if (this.readOnly() || this.mode() !== RecordToolbarMode.Creating) {
      return;
    }

    const rawCode = this.form.controls.ID_CONDICION.value?.trim().toUpperCase();
    if (!rawCode) return;

    const existsLocally = this.records().some(r => r.ID_CONDICION?.trim().toUpperCase() === rawCode);
    let existsInDb = false;
    if (!existsLocally) {
      try {
        existsInDb = await this.business.exists(rawCode);
      } catch {
        existsInDb = false;
      }
    }

    if (existsLocally || existsInDb) {
      await Swal.fire({
        title: 'Código ya existe',
        text: `La condición con código "${rawCode}" ya está registrada en el sistema. No se puede usar este código.`,
        iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
        confirmButtonColor: '#0F4C81',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        returnFocus: false
      });

      this.form.controls.ID_CONDICION.setValue('');
      this.focusCodigoInput();
    }
  }

  private focusCodigoInput(): void {
    const focusFn = () => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const input = host.querySelector<HTMLInputElement>('#fin-224-id-condicion input');
      if (input) {
        input.focus();
        input.select?.();
      }
    };

    setTimeout(focusFn, 50);
    setTimeout(focusFn, 150);
    setTimeout(focusFn, 300);
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const initialInput = host.querySelector<HTMLInputElement>(
        '#fin-224-id-condicion input:not([readonly]):not([disabled]), #fin-224-descripcion input:not([readonly]):not([disabled])'
      );
      if (initialInput) {
        initialInput.focus();
        initialInput.select?.();
        return true;
      }
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .fin-224__card') || host;
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

  async cancelEdit(): Promise<void> {
    const dirty = this.workspace.getTab(this.applicationId)?.dirty ?? false;
    if (dirty) {
      const confirm = await Swal.fire({
        title: 'Cancelar operación',
        text: '¿Desea cancelar sin guardar cambios?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
      });
      if (!confirm.isConfirmed) return;
    }

    this.idCondicionPrev = '';
    this.workspace.setDirty(this.applicationId, false);

    if (this.records().length > 0 && this.currentIndex() >= 0) {
      this.selectRecordIndex(this.currentIndex());
    } else {
      this.clearRecord();
    }
  }

  async saveRecord(): Promise<void> {
    if (this.loading() || this.saving() || this.readOnly()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notification.error('Por favor complete los campos obligatorios del formulario.');
      return;
    }

    const currentItems = this.items();
    if (!currentItems || currentItems.length === 0) {
      this.notification.warning('Debe agregar al menos una lista de precios a la condición.');
      return;
    }

    const raw = this.form.getRawValue();
    const idCondicion = raw.ID_CONDICION.trim().toUpperCase();

    // Check duplicate code if creating or if code changed
    if (this.mode() === RecordToolbarMode.Creating || idCondicion !== this.idCondicionPrev) {
      const existsLocally = this.records().some(r => r.ID_CONDICION.toUpperCase() === idCondicion);
      let existsInDb = false;
      if (!existsLocally) {
        try {
          existsInDb = await this.business.exists(idCondicion);
        } catch {
          existsInDb = false;
        }
      }
      if (existsLocally || existsInDb) {
        await Swal.fire({
          title: 'Código ya existe',
          text: `La condición con código "${idCondicion}" ya está registrada en el sistema. No se puede usar este código.`,
          iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
          confirmButtonColor: '#0F4C81',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          returnFocus: false
        });
        this.form.controls.ID_CONDICION.setValue('');
        this.focusCodigoInput();
        return;
      }
    }

    const isEditing = this.mode() === RecordToolbarMode.Editing;
    const condicionRecord: Fin224CondicionRecord = {
      ID_UN: this.currentRecord()?.ID_UN || '',
      ID_CONDICION: idCondicion,
      DESCRIPCION: raw.DESCRIPCION.trim(),
      TIPO: raw.TIPO,
      ID_PLAN: raw.ID_PLAN,
      ESTADO: raw.ESTADO,
      ITM_CONDICIONES: currentItems
    };

    this.saving.set(true);
    try {
      await this.business.saveCondicion(isEditing ? 'update' : 'new', condicionRecord, currentItems);
      this.notification.success('Registro actualizado!');
      this.workspace.setDirty(this.applicationId, false);

      const list = [...this.records()];
      let index = isEditing
        ? this.currentIndex()
        : list.findIndex(r => r.ID_CONDICION === condicionRecord.ID_CONDICION);

      if (index < 0) {
        index = list.length;
        list.push(condicionRecord);
      } else {
        list[index] = { ...list[index], ...condicionRecord };
      }

      this.records.set(list);
      this.selectRecordIndex(index);
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al guardar la condición de negociación.'));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete) return;

    const confirmation = await Swal.fire({
      title: 'Eliminar Condición',
      html: `¿Desea eliminar la condición <i>${record.ID_CONDICION}</i>?`,
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });

    if (!confirmation.isConfirmed) return;

    this.loading.set(true);
    try {
      await this.business.deleteCondicion(record.ID_CONDICION);
      this.notification.success('Condición eliminada!');

      const list = this.records().filter(r => r.ID_CONDICION !== record.ID_CONDICION);
      this.records.set(list);

      if (list.length > 0) {
        const nextIndex = Math.min(this.currentIndex(), list.length - 1);
        this.selectRecordIndex(nextIndex);
      } else {
        this.clearRecord();
      }
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al eliminar la condición de negociación.'));
    } finally {
      this.loading.set(false);
    }
  }

  async searchRecords(event: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    this.loading.set(true);
    try {
      const records = await this.business.queryRecords(event.ESTRUCTURA);
      if (records && records.length > 0) {
        this.records.set(records);
        this.selectRecordIndex(0);
      } else {
        this.records.set([]);
        this.clearRecord();
        this.notification.warning('No se encontraron condiciones con los criterios indicados.');
      }
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al buscar registros.'));
    } finally {
      this.loading.set(false);
    }
  }

  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const id = (record as Fin224CondicionRecord).ID_CONDICION;
    const index = this.records().findIndex(r => r.ID_CONDICION === id);
    if (index >= 0) {
      this.selectRecordIndex(index);
    }
    this.viewVisible.set(false);
  }

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

    if (target !== this.currentIndex()) {
      this.selectRecordIndex(target);
    }
  }

  selectRecordIndex(index: number): void {
    const record = this.records()[index];
    if (!record) return;

    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.form.disable({ emitEvent: false });
    this.idCondicionPrev = '';
    this.setForm(record);

    // Enrich items descriptions from listasPrecios
    const listas = this.listasPrecios();
    const enrichedItems = (record.ITM_CONDICIONES || []).map(i => {
      const found = listas.find(l => l.ID_LISTA === i.ID_LISTA);
      return {
        ...i,
        DESCRIPCION: i.DESCRIPCION || found?.DESCRIPCION || ''
      };
    });
    this.items.set(enrichedItems);
    this.workspace.setDirty(this.applicationId, false);
  }

  private setForm(record: Fin224CondicionRecord): void {
    this.form.reset({
      ID_CONDICION: record.ID_CONDICION ?? '',
      DESCRIPCION: record.DESCRIPCION ?? '',
      TIPO: record.TIPO ?? '',
      ID_PLAN: record.ID_PLAN ?? '',
      ESTADO: record.ESTADO ?? 'ACTIVO'
    }, { emitEvent: false });
  }

  private clearRecord(): void {
    this.currentIndex.set(-1);
    this.mode.set(RecordToolbarMode.Initial);
    this.idCondicionPrev = '';
    this.setForm(Fin224EmptyRecord);
    this.items.set([]);
    this.form.disable({ emitEvent: false });
  }

  onItemsChanged(): void {
    if (!this.readOnly()) {
      this.workspace.setDirty(this.applicationId, true);
    }
  }

  currentReportFilter(): string {
    const record = this.currentRecord();
    if (!record) return '';
    return ` CONDICIONES_NEGOCIACION.ID_CONDICION = '${record.ID_CONDICION.replace(/'/g, "''")}'`;
  }

  executeSetting(setting: XteinApplicationSetting): void {
    this.settingsVisible.set(false);
  }
}
