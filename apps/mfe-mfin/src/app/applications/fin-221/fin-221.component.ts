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
  XteinGroupLabelComponent,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinNumberComponent,
  XteinRecordFilterComponent,
  XteinRecordFilterResult,
  XteinRecordReportsComponent,
  XteinRecordSettingsComponent,
  XteinRecordViewComponent,
  XteinSelectComponent
} from '@xtein/ui';

import {
  Fin221Action,
  Fin221Application
} from './constants/fin-221.constants';

import {
  Fin221DefaultRecord,
  Fin221EmptyRecord,
  Fin221FinanciarGravOptions,
  Fin221FrecuenciaOptions,
  Fin221RecordViewColumns,
  Fin221StatusOptions,
  Fin221ToolbarCapabilities
} from './constants/fin-221-ui.constants';

import {
  Fin221PlanRecord,
  Fin221ItemPlan,
  Fin221TasaOption,
  Fin221CondicionOption
} from './models/fin-221.model';
import { Fin221Service } from './services/fin-221.service';
import { Fin221BusinessService } from './services/fin-221-business.service';
import { Fin221ItemsComponent } from './components/fin-221-items/fin-221-items.component';

/**
 * FIN-221 - Planes de Financiación.
 */
@Component({
  selector: 'fin-221',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Fin221ItemsComponent,
    XteinRecordFilterComponent,
    XteinRecordViewComponent,
    XteinRecordReportsComponent,
    XteinRecordSettingsComponent,
    XteinGroupLabelComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLoadingComponent,
    XteinNumberComponent,
    XteinSelectComponent
  ],
  providers: [
    Fin221Service,
    Fin221BusinessService
  ],
  templateUrl: './fin-221.component.html',
  styleUrl: './fin-221.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Fin221Component implements OnInit, OnDestroy {
  readonly applicationId = Fin221Application.Id;
  readonly tableBase = Fin221Application.Table;

  readonly statusOptions = Fin221StatusOptions;
  readonly frecuenciaOptions = Fin221FrecuenciaOptions;
  readonly financiarGravOptions = Fin221FinanciarGravOptions;
  readonly viewColumns = Fin221RecordViewColumns;

  private readonly service = inject(Fin221Service);
  readonly business = inject(Fin221BusinessService);
  private readonly toolbar = inject(ToolbarRuntimeService);
  private readonly permissionsService = inject(RecordToolbarPermissionsService);
  private readonly workspace = inject(WorkspaceRuntimeService);
  private readonly elementRef = inject(ElementRef);
  private readonly notification = inject(XteinNotificationService);

  private readonly subscriptions = new Subscription();

  readonly records = signal<Fin221PlanRecord[]>([]);
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
  readonly tasas = signal<Fin221TasaOption[]>([]);
  readonly condiciones = signal<Fin221CondicionOption[]>([]);

  /** Items signal for active record */
  readonly items = signal<Fin221ItemPlan[]>([]);

  readonly readOnly = computed(() =>
    this.mode() !== RecordToolbarMode.Creating &&
    this.mode() !== RecordToolbarMode.Editing &&
    this.mode() !== RecordToolbarMode.Copying
  );

  readonly currentRecord = computed<Fin221PlanRecord | null>(() => {
    const list = this.records();
    const index = this.currentIndex();
    return index >= 0 && index < list.length ? list[index] : null;
  });

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO ||
    this.records().map(record => `(PLANES.ID_PLAN = '${record.ID_PLAN.replace(/'/g, "''")}')`).join(' OR ')
  );

  /** Reactive form definition */
  readonly form = new FormGroup({
    ID_PLAN: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    ESTADO: new FormControl<string>('ACTIVO', { nonNullable: true }),
    DESCRIPCION: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    TIPO_FRECUENCIA: new FormControl<'Constante' | 'Variable'>('Constante', { nonNullable: true }),
    FRECUENCIA: new FormControl<number>(30, { nonNullable: true }),
    DIAS_PRIMERA_CUOTA: new FormControl<number>(30, { nonNullable: true }),
    FINANCIAR_GRAV: new FormControl<string>('FINANCIADOS', { nonNullable: true }),
    NUMERO_PAGOS: new FormControl<number>(1, { nonNullable: true, validators: [Validators.min(1)] })
  });

  private idPlanPrev = '';

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

    this.bindFormEvents();
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
      capabilities: Fin221ToolbarCapabilities,
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
      const [tasas, condiciones] = await Promise.all([
        this.business.loadTasas(),
        this.business.loadCondiciones()
      ]);
      this.tasas.set(tasas);
      this.condiciones.set(condiciones);
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al cargar catálogos.'));
    } finally {
      this.loading.set(false);
    }
  }

  private bindFormEvents(): void {
    // Watch TIPO_FRECUENCIA changes
    this.subscriptions.add(
      this.form.controls.TIPO_FRECUENCIA.valueChanges.subscribe(value => {
        if (this.readOnly() || !value) return;

        if (this.items().length > 0) {
          Swal.fire({
            title: 'Cambio de Frecuencia',
            text: 'Esta acción borrará los ítems configurados. ¿Desea continuar?',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'No'
          }).then(result => {
            if (result.isConfirmed) {
              this.items.set([]);
              this.workspace.setDirty(this.applicationId, true);
            } else {
              // Revert
              const prev = value === 'Constante' ? 'Variable' : 'Constante';
              this.form.controls.TIPO_FRECUENCIA.setValue(prev, { emitEvent: false });
            }
          });
        }
      })
    );

    // Watch NUMERO_PAGOS changes when Variable
    this.subscriptions.add(
      this.form.controls.NUMERO_PAGOS.valueChanges.subscribe(value => {
        if (this.readOnly() || !value || value < 1) return;
        const tipo = this.form.controls.TIPO_FRECUENCIA.value;

        if (tipo === 'Variable') {
          const initItems = () => {
            const newItems: Fin221ItemPlan[] = [];
            for (let i = 1; i <= value; i++) {
              newItems.push({
                ITEM: i,
                PAGO: i,
                DIAS: 30,
                PORC_GRAV: 0,
                PORC_PAGO: 0,
                ID_TASA: 'Manual',
                FACTOR: 1,
                PORC_TASA: 0,
                CUOTA_INICIAL: 'No',
                TIPO_CI: 'Porcentaje',
                MINIMO_CI: 0,
                MAXIMO_CI: 0,
                DIAS_PLAZO_CI: 0,
                DIFERIR_CI: 'No',
                DESCONTAR_CI: 'No',
                DESCUENTO_PPP: 0,
                ID_CONDICION: ''
              });
            }
            this.items.set(newItems);
            this.workspace.setDirty(this.applicationId, true);
          };

          if (this.items().length > 0) {
            Swal.fire({
              title: 'Inicializar ítems',
              text: '¿Desea inicializar los ítems y perder lo configurado?',
              iconHtml: "<i class='icon-alert-ol'></i>",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              confirmButtonText: 'Sí, inicializar',
              cancelButtonText: 'No, conservar'
            }).then(result => {
              if (result.isConfirmed) {
                initItems();
              }
            });
          } else {
            initItems();
          }
        }
      })
    );
  }

  newRecord(): void {
    if (this.loading() || !this.readOnly() || !this.permissions().create) return;
    this.idPlanPrev = '';
    this.mode.set(RecordToolbarMode.Creating);
    this.setForm({ ...Fin221DefaultRecord });
    this.items.set([]);
    this.form.enable({ emitEvent: false });
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
  }

  editRecord(): void {
    const record = this.currentRecord();
    if (this.loading() || !this.readOnly() || !this.permissions().edit || !record) return;

    this.idPlanPrev = record.ID_PLAN;
    this.mode.set(RecordToolbarMode.Editing);
    this.form.enable({ emitEvent: false });
    this.workspace.setDirty(this.applicationId, false);
    this.focusFirstControl();
  }

  private focusFirstControl(): void {
    const doFocus = (): boolean => {
      const host = this.elementRef.nativeElement as HTMLElement;
      const initialInput = host.querySelector<HTMLInputElement>(
        '#fin-221-id-plan input:not([readonly]):not([disabled]), #fin-221-descripcion input:not([readonly]):not([disabled])'
      );
      if (initialInput) {
        initialInput.focus();
        initialInput.select?.();
        return true;
      }
      const formEl = host.querySelector<HTMLElement>('form, [formGroup], .fin-221__card') || host;
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

    this.idPlanPrev = '';
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
      this.notification.warning('Debe agregar al menos un ítem al plan de financiamiento.');
      return;
    }

    const raw = this.form.getRawValue();
    const idPlan = raw.ID_PLAN.trim().toUpperCase();

    // Check code uniqueness if creating or if code changed
    if (this.mode() === RecordToolbarMode.Creating || idPlan !== this.idPlanPrev) {
      const existsLocally = this.records().some(r => r.ID_PLAN.toUpperCase() === idPlan);
      if (existsLocally) {
        Swal.fire({
          title: 'Plan ya existe',
          text: `El plan con código "${idPlan}" ya existe en el sistema.`,
          iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
          confirmButtonColor: '#0F4C81',
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }

    const isEditing = this.mode() === RecordToolbarMode.Editing;
    const planRecord: Fin221PlanRecord = {
      ID_UN: this.currentRecord()?.ID_UN || '',
      ID_PLAN: idPlan,
      DESCRIPCION: raw.DESCRIPCION.trim(),
      DIAS_PRIMERA_CUOTA: Number(raw.DIAS_PRIMERA_CUOTA) || 0,
      FINANCIAR_GRAV: raw.FINANCIAR_GRAV,
      TIPO_FRECUENCIA: raw.TIPO_FRECUENCIA,
      FRECUENCIA: Number(raw.FRECUENCIA) || 0,
      NUMERO_PAGOS: Number(raw.NUMERO_PAGOS) || 1,
      ESTADO: raw.ESTADO,
      ITM_PLANES: currentItems
    };

    this.saving.set(true);
    try {
      await this.business.savePlan(isEditing ? 'update' : 'new', planRecord, currentItems);
      this.notification.success('Registro actualizado!');
      this.workspace.setDirty(this.applicationId, false);

      const list = [...this.records()];
      let index = isEditing ? this.currentIndex() : list.findIndex(r => r.ID_PLAN === planRecord.ID_PLAN);

      if (index < 0) {
        index = list.length;
        list.push(planRecord);
      } else {
        list[index] = { ...list[index], ...planRecord };
      }

      this.records.set(list);
      this.selectRecordIndex(index);
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al guardar el plan de financiamiento.'));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete) return;

    const confirmation = await Swal.fire({
      title: 'Eliminar Plan',
      html: `¿Desea eliminar el PLAN <i>${record.ID_PLAN}</i>?`,
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
      await this.business.deletePlan(record.ID_PLAN);
      this.notification.success('Plan eliminado!');

      const list = this.records().filter(r => r.ID_PLAN !== record.ID_PLAN);
      this.records.set(list);

      if (list.length > 0) {
        const nextIndex = Math.min(this.currentIndex(), list.length - 1);
        this.selectRecordIndex(nextIndex);
      } else {
        this.clearRecord();
      }
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al eliminar el plan de financiamiento.'));
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
        this.notification.warning('No se encontraron planes con los criterios indicados.');
      }
    } catch (error) {
      this.notification.error(this.business.errorMessage(error, 'Error al buscar registros.'));
    } finally {
      this.loading.set(false);
    }
  }

  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const id = (record as Fin221PlanRecord).ID_PLAN;
    const index = this.records().findIndex(r => r.ID_PLAN === id);
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
    this.idPlanPrev = '';
    this.setForm(record);
    this.items.set(record.ITM_PLANES ? [...record.ITM_PLANES] : []);
    this.workspace.setDirty(this.applicationId, false);
  }

  private setForm(record: Fin221PlanRecord): void {
    this.form.reset({
      ID_PLAN: record.ID_PLAN ?? '',
      ESTADO: record.ESTADO ?? 'ACTIVO',
      DESCRIPCION: record.DESCRIPCION ?? '',
      TIPO_FRECUENCIA: record.TIPO_FRECUENCIA ?? 'Constante',
      FRECUENCIA: Number(record.FRECUENCIA ?? 30),
      DIAS_PRIMERA_CUOTA: Number(record.DIAS_PRIMERA_CUOTA ?? 30),
      FINANCIAR_GRAV: record.FINANCIAR_GRAV ?? 'FINANCIADOS',
      NUMERO_PAGOS: Number(record.NUMERO_PAGOS ?? 1)
    }, { emitEvent: false });
  }

  private clearRecord(): void {
    this.currentIndex.set(-1);
    this.mode.set(RecordToolbarMode.Initial);
    this.idPlanPrev = '';
    this.setForm(Fin221EmptyRecord);
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
    return ` PLANES.ID_PLAN = '${record.ID_PLAN.replace(/'/g, "''")}'`;
  }

  executeSetting(setting: XteinApplicationSetting): void {
    this.settingsVisible.set(false);
  }
}
