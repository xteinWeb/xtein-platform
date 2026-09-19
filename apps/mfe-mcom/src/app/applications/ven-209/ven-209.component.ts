import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { Subscription, firstValueFrom, Observable } from 'rxjs';
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
  XteinDateComponent,
  XteinLookupComponent,
  XteinTextareaComponent,
  XteinRecordViewComponent,
  XteinRecordFilterComponent,
  XteinRecordReportsComponent,
  XteinNotificationService,
  XteinRecordFilterResult
} from '@xtein/ui';

import {
  Ven209Application,
  Ven209ToolbarCapabilities
} from './constants/ven-209.constants';
import {
  Ven209ClasesCliente,
  Ven209DefaultRecord,
  Ven209Estados,
  Ven209LookupColumns,
  Ven209RecordViewColumns,
  Ven209TiposPersona
} from './constants/ven-209-ui.constants';
import {
  Ven209ClienteRecord,
  Ven209ContactoAdicional,
  Ven209Direccion,
  Ven209Email,
  Ven209Lookup,
  Ven209Telefono,
  Ven209Condicion
} from './models/ven-209.model';
import { Ven209Service } from './services/ven-209.service';
import { Ven209BusinessService } from './services/ven-209-business.service';
import { XteinVen209UbicacionesComponent } from './components/xtein-ven209-ubicaciones/xtein-ven209-ubicaciones.component';
import { XteinVen209FinancierosComponent } from './components/xtein-ven209-financieros/xtein-ven209-financieros.component';

@Component({
  selector: 'app-ven-209',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    XteinInputComponent,
    XteinLabelComponent,
    XteinSelectComponent,
    XteinDateComponent,
    XteinLookupComponent,
    XteinTextareaComponent,
    XteinRecordViewComponent,
    XteinRecordFilterComponent,
    XteinRecordReportsComponent,
    XteinVen209UbicacionesComponent,
    XteinVen209FinancierosComponent
  ],
  providers: [
    Ven209Service,
    Ven209BusinessService
  ],
  templateUrl: './ven-209.component.html',
  styleUrls: ['./ven-209.component.scss']
})
export class Ven209Component implements OnInit, OnDestroy {
  readonly applicationId = Ven209Application.Id;
  private readonly subscriptions = new Subscription();

  // State signals
  readonly loading = signal(false);
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);
  readonly records = signal<Ven209ClienteRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly activeMainTab = signal<'general' | 'ubicaciones' | 'financieros' | 'ventas' | 'historico'>('general');

  // Sub-items signals
  readonly direcciones = signal<Ven209Direccion[]>([]);
  readonly telefonos = signal<Ven209Telefono[]>([]);
  readonly emails = signal<Ven209Email[]>([]);
  readonly condiciones = signal<Ven209Condicion[]>([]);
  readonly contactoAdicional = signal<Ven209ContactoAdicional>({ URL: '', CIIU: '' });

  // Catalogs
  readonly idLegales = signal<Ven209Lookup[]>([]);
  readonly tiposId = signal<string[]>(['CEDULA', 'NIT', 'CC', 'CE', 'TI', 'PASAPORTE', 'RUT', 'PEP', 'PPT']);
  readonly personas = signal<string[]>(['JURIDICA', 'NATURAL']);
  readonly grupos = signal<Ven209Lookup[]>([]);
  readonly zonas = signal<Ven209Lookup[]>([]);
  readonly adcs = signal<Ven209Lookup[]>([]);
  readonly statuses = signal<Ven209Lookup[]>([]);
  readonly rts = signal<Ven209Lookup[]>([]);
  readonly availableCondiciones = signal<Ven209Lookup[]>([]);

  // Modals
  readonly filterVisible = signal(false);
  readonly viewVisible = signal(false);
  readonly reportsVisible = signal(false);

  // Constants for UI
  readonly tableBase = Ven209Application.Table;
  readonly viewColumns = Ven209RecordViewColumns;
  readonly clasesCliente = signal<string[]>([...Ven209ClasesCliente]);
  readonly tiposPersona = Ven209TiposPersona;
  readonly estados = Ven209Estados;
  readonly lookupCols = Ven209LookupColumns;

  // View state computations
  readonly readOnly = computed(() => {
    const currentMode = this.mode();
    return currentMode === RecordToolbarMode.Initial || currentMode === RecordToolbarMode.Browsing;
  });

  readonly isEditing = computed(() => this.mode() === RecordToolbarMode.Editing);

  readonly currentRecord = computed(() => {
    const idx = this.currentIndex();
    const list = this.records();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  readonly queryFilter = computed(() => this.records()[0]?.QFILTRO || this.records().map(r => `(ID_CLIENTE='${r.ID_CLIENTE}')`).join(' OR '));

  private lastCriteria: unknown[] = [];

  // Reactive Form Definition
  readonly form = new FormGroup({
    ID_CLIENTE: new FormControl<string>('', [Validators.required]),
    ID_LEGAL: new FormControl<number | string>('', [Validators.required]),
    ESTADO: new FormControl<string>('ACTIVO', [Validators.required]),
    FECHA_REGISTRO: new FormControl<string | null>(this.localDate()),
    NOMBRE: new FormControl<string>('', [Validators.required]),
    NOMBRE2: new FormControl<string>(''),
    APELLIDO: new FormControl<string>('', [Validators.required]),
    APELLIDO2: new FormControl<string>(''),
    TIPO_ID: new FormControl<string>('NIT', [Validators.required]),
    PERSONA: new FormControl<string>('JURIDICA', [Validators.required]),
    ID_GRUPO: new FormControl<string>('', [Validators.required]),
    CLASE: new FormControl<string>('CLIENTES', [Validators.required]),
    PERFIL_TRIBUTARIO: new FormControl<string>('', [Validators.required]),
    RT: new FormControl<string>(''),
    CONTACTO: new FormControl<string>(''),
    COMENTARIOS: new FormControl<string>(''),
    ZONA: new FormControl<string>(''),
    ID_ADC: new FormControl<string>(''),
    STATUS: new FormControl<string>(''),
    CUPO_CREDITO: new FormControl<number>(0),
    TIEMPO_ENTREGA: new FormControl<number>(0)
  });

  constructor(
    private readonly service: Ven209Service,
    readonly business: Ven209BusinessService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService
  ) {
    // Synchronize toolbar state
    effect(() => {
      this.publishToolbarState();
    });

    // Handle tab focus changes
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

    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        if (!this.readOnly()) {
          this.workspace.setDirty(this.applicationId, true);
        }
      })
    );

    this.subscriptions.add(
      this.form.controls.ID_LEGAL.valueChanges.subscribe(val => {
        if (val) this.onIdLegalChanged(val);
      })
    );

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

    // Load initial catalogs
    void this.loadCatalogs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.toolbar.removeApplication(this.applicationId);
  }

  private publishToolbarState(): void {
    const state = createRecordToolbarState({
      busy: this.loading(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: Ven209ToolbarCapabilities,
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
  }

  localDate(date = new Date()): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  private disableFormControls(): void {
    this.form.disable({ emitEvent: false });
  }

  private enableFormControls(isNew = false): void {
    this.form.enable({ emitEvent: false });
    this.form.controls.ESTADO.disable({ emitEvent: false });
    this.form.controls.FECHA_REGISTRO.disable({ emitEvent: false });
    if (!isNew) {
      this.form.controls.ID_CLIENTE.disable({ emitEvent: false });
    }
  }

  private async loadCatalogs(): Promise<void> {
    this.loading.set(true);
    try {
      const results = await Promise.allSettled([
        this.business.loadIdLegalesWithTypes(),
        this.business.catalog('grupos', { ID_GRUPO_PADRE: 'DEUDORES' }),
        this.business.catalog('zonas', { TIPO_UBICACION: 'ZONA' }),
        this.business.catalog('adc', { ESTADO: 'ACTIVO' }),
        this.business.catalog('status', { STATUS: {} }),
        this.business.catalog('rt', {}),
        this.business.catalog('condiciones', { TIPO: 'VENTAS' })
      ]);

      const [legalRes, gruposRes, zonasRes, adcsRes, statusesRes, rtsRes, condRes] = results;

      if (legalRes.status === 'fulfilled') {
        const legalData = legalRes.value;
        this.idLegales.set(legalData.idLegales);
        if (legalData.tiposId?.length) {
          this.tiposId.set([...new Set([...this.tiposId(), ...legalData.tiposId])]);
        }
        if (legalData.personas?.length) {
          this.personas.set(legalData.personas);
        }
      }

      if (gruposRes.status === 'fulfilled') {
        this.grupos.set(gruposRes.value);
      }

      if (zonasRes.status === 'fulfilled') {
        this.zonas.set(zonasRes.value);
      }

      if (adcsRes.status === 'fulfilled') {
        this.adcs.set(adcsRes.value);
      }

      if (statusesRes.status === 'fulfilled') {
        this.statuses.set(statusesRes.value);
      }

      if (rtsRes.status === 'fulfilled') {
        this.rts.set(rtsRes.value);
      }

      if (condRes.status === 'fulfilled') {
        this.availableCondiciones.set(condRes.value);
      }

      // If a record is currently loaded, re-populate to resolve lookups and selects
      const current = this.currentRecord();
      if (current) {
        this.populateForm(current);
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  private handleToolbarCommand(command: ToolbarCommand): void {
    if (this.loading()) return;
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
        if (typeof command.payload === 'number' && Number.isInteger(command.payload)) {
          this.selectRecordIndex(command.payload - 1);
        }
        break;
      case ToolbarAction.Print:
        this.reportsVisible.set(true);
        break;
      default:
        break;
    }
  }

  newRecord(): void {
    if (this.loading() || !this.readOnly() || !this.permissions().create) return;
    this.mode.set(RecordToolbarMode.Creating);
    this.form.reset({
      ...Ven209DefaultRecord,
      ID_CLIENTE: '',
      ID_LEGAL: '',
      FECHA_REGISTRO: this.localDate(),
      ESTADO: 'ACTIVO',
      CLASE: 'CLIENTES',
      TIPO_ID: 'NIT',
      PERSONA: 'JURIDICA',
      PERFIL_TRIBUTARIO: '',
      RT: '',
      CONTACTO: '',
      COMENTARIOS: '',
      ZONA: '',
      ID_ADC: '',
      STATUS: '',
      CUPO_CREDITO: 0,
      TIEMPO_ENTREGA: 0
    }, { emitEvent: false });
    this.direcciones.set([]);
    this.telefonos.set([]);
    this.emails.set([]);
    this.condiciones.set([]);
    this.contactoAdicional.set({ URL: '', CIIU: '' });
    this.enableFormControls(true);
    this.workspace.setDirty(this.applicationId, false);
  }

  editRecord(): void {
    if (this.loading() || !this.readOnly() || !this.permissions().edit || !this.currentRecord()) return;
    this.mode.set(RecordToolbarMode.Editing);
    this.enableFormControls(false);
    this.workspace.setDirty(this.applicationId, false);
  }

  async saveRecord(): Promise<void> {
    if (this.loading() || this.readOnly()) return;
    const raw = this.form.getRawValue();
    const validationMessage = this.business.validate(raw as unknown as Partial<Ven209ClienteRecord>, this.emails(), this.direcciones());
    if (validationMessage) {
      this.form.markAllAsTouched();
      this.notification.warning(validationMessage);
      return;
    }

    this.loading.set(true);
    try {
      const isNew = this.mode() === RecordToolbarMode.Creating;
      const payload = this.business.buildSavePayload(
        raw as unknown as Ven209ClienteRecord,
        this.direcciones(),
        this.telefonos(),
        this.emails(),
        this.condiciones(),
        this.contactoAdicional()
      );

      const response = await firstValueFrom(
        isNew ? this.service.create(payload) : this.service.update(payload)
      );
      this.business.decode(response);

      const savedRecord: Ven209ClienteRecord = {
        ...raw,
        ID_CLIENTE: String(raw.ID_CLIENTE ?? ''),
        ID_LEGAL: String(raw.ID_LEGAL ?? ''),
        RT: raw.RT ? (Array.isArray(raw.RT) ? raw.RT : [raw.RT]) : [],
        DIRECCIONES: this.direcciones(),
        TELEFONOS: this.telefonos(),
        ITM_EMAIL: this.emails(),
        CONDICIONES: this.condiciones(),
        ADIC_ACREEDORES: this.contactoAdicional()
      };

      const list = [...this.records()];
      let idx = this.currentIndex();
      if (isNew) {
        idx = list.length;
        list.push(savedRecord);
      } else if (idx >= 0 && idx < list.length) {
        list[idx] = savedRecord;
      }
      this.records.set(list);
      this.currentIndex.set(idx);
      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();
      this.workspace.setDirty(this.applicationId, false);
      this.notification.success('Cliente guardado correctamente.');
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  async cancelEdit(): Promise<void> {
    if (this.loading() || this.readOnly()) return;
    const dirty = this.workspace.getTab(this.applicationId)?.dirty ?? false;
    const confirm = await Swal.fire({
      title: 'Clientes',
      text: dirty ? '¿Desea cancelar sin guardar cambios?' : '¿Desea cancelar la operación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, cancelar'
    });
    if (!confirm.isConfirmed) return;

    this.mode.set(this.records().length ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
    this.disableFormControls();
    const current = this.currentRecord();
    if (current) {
      this.populateForm(current);
    } else {
      this.clearForm();
    }
    this.workspace.setDirty(this.applicationId, false);
  }

  async deleteRecord(): Promise<void> {
    const record = this.currentRecord();
    if (!record || this.loading() || !this.readOnly() || !this.permissions().delete) return;

    const confirm = await Swal.fire({
      title: '¿Eliminar Cliente?',
      text: `¿Desea eliminar el cliente ${record.ID_CLIENTE} - ${record.NOMBRE} ${record.APELLIDO}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#244d73',
      cancelButtonColor: '#8a99a8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.service.delete({ CLIENTES: { ID_CLIENTE: record.ID_CLIENTE } }));
      this.business.decode(response);
      this.notification.success('Cliente eliminado correctamente.');

      const remaining = this.records().filter(r => r !== record);
      this.records.set(remaining);
      if (remaining.length > 0) {
        this.selectRecordIndex(Math.min(this.currentIndex(), remaining.length - 1));
      } else {
        this.clearForm();
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  refresh(): void {
    if (this.loading() || !this.readOnly()) return;
    const current = this.currentRecord();
    void this.loadCatalogs().then(() => this.searchRecords(current?.ID_CLIENTE || ''));
  }

  async searchRecords(filter: string | XteinRecordFilterResult): Promise<void> {
    if (typeof filter !== 'string' && (this.loading() || !this.readOnly())) return;
    this.filterVisible.set(false);
    this.loading.set(true);
    try {
      const criteria = typeof filter === 'string'
        ? (filter ? [{ COLUMNA: 'ID_CLIENTE', CRITERIO: '=', VALOR: filter }] : this.lastCriteria)
        : filter.ESTRUCTURA;

      const list = this.business.decode<Ven209ClienteRecord>(
        await firstValueFrom(this.service.getRecords({ CLIENTES: criteria }))
      );
      this.lastCriteria = criteria;
      this.records.set(list);
      if (list.length > 0) {
        this.selectRecordIndex(0);
      } else {
        this.clearForm();
        this.notification.warning('No se encontraron registros de clientes.');
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading.set(false);
    }
  }

  selectRecordIndex(index: number): void {
    const list = this.records();
    if (index < 0 || index >= list.length) return;
    const record = list[index];
    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.disableFormControls();
    this.populateForm(record);
    this.workspace.setDirty(this.applicationId, false);
  }

  selectViewedRecord(record: unknown): void {
    if (this.loading() || !this.readOnly()) return;
    const rec = record as Ven209ClienteRecord;
    const idx = this.records().findIndex(r => r.ID_CLIENTE === rec.ID_CLIENTE);
    if (idx >= 0) {
      this.selectRecordIndex(idx);
    }
    this.viewVisible.set(false);
  }

  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    if (this.loading() || !this.readOnly()) return;
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

  private populateForm(record: Ven209ClienteRecord): void {
    const rawIdLegal = record.ID_LEGAL != null ? String(record.ID_LEGAL).trim() : '';
    const currentLegales = this.idLegales();
    const matchLegal = currentLegales.find(l => String(l.ID_LEGAL).trim() === rawIdLegal);
    let resolvedIdLegal: number | string = rawIdLegal;
    if (matchLegal?.ID_LEGAL != null) {
      resolvedIdLegal = matchLegal.ID_LEGAL;
    } else if (rawIdLegal) {
      const fallbackName = [record.NOMBRE, record.APELLIDO].filter(Boolean).join(' ').trim() || rawIdLegal;
      const syntheticId = isNaN(Number(rawIdLegal)) ? rawIdLegal : Number(rawIdLegal);
      const synthetic: Ven209Lookup = {
        ID_LEGAL: syntheticId,
        NOMBRE_COMPLETO: fallbackName
      };
      this.idLegales.set([...currentLegales, synthetic]);
      resolvedIdLegal = syntheticId;
    }

    const rawGrupo = record.ID_GRUPO != null ? String(record.ID_GRUPO).trim() : '';
    const currentGrupos = this.grupos();
    const matchGrupo = currentGrupos.find(g => String(g.ID_GRUPO).trim() === rawGrupo);
    let resolvedGrupo = rawGrupo;
    if (matchGrupo?.ID_GRUPO != null) {
      resolvedGrupo = matchGrupo.ID_GRUPO;
    } else if (rawGrupo) {
      const recAny = record as Record<string, unknown>;
      const fallbackName = recAny['NOMBRE_GRUPO']
        ? String(recAny['NOMBRE_GRUPO']).trim()
        : recAny['DESC_GRUPO']
          ? String(recAny['DESC_GRUPO']).trim()
          : rawGrupo;
      const synthetic: Ven209Lookup = {
        ID_GRUPO: rawGrupo,
        NOMBRE: fallbackName
      };
      this.grupos.set([...currentGrupos, synthetic]);
      resolvedGrupo = rawGrupo;
    }

    const rawTipoId = record.TIPO_ID != null ? String(record.TIPO_ID).trim().toUpperCase() : 'NIT';
    if (rawTipoId && !this.tiposId().includes(rawTipoId)) {
      this.tiposId.set([...this.tiposId(), rawTipoId]);
    }

    const rawClase = record.CLASE != null ? String(record.CLASE).trim().toUpperCase() : 'CLIENTES';
    if (rawClase && !this.clasesCliente().includes(rawClase)) {
      this.clasesCliente.set([...this.clasesCliente(), rawClase]);
    }

    const rawPersona = record.PERSONA != null ? String(record.PERSONA).trim().toUpperCase() : 'JURIDICA';
    if (rawPersona && !this.personas().includes(rawPersona)) {
      this.personas.set([...this.personas(), rawPersona]);
    }

    const rtVal = Array.isArray(record.RT)
      ? (record.RT[0]?.trim() || '')
      : (record.RT != null ? String(record.RT).trim() : '');

    this.form.reset({
      ...Ven209DefaultRecord,
      ID_CLIENTE: record.ID_CLIENTE ? String(record.ID_CLIENTE).trim() : '',
      ID_LEGAL: resolvedIdLegal,
      ESTADO: record.ESTADO ? String(record.ESTADO).trim().toUpperCase() : 'ACTIVO',
      FECHA_REGISTRO: record.FECHA_REGISTRO ? String(record.FECHA_REGISTRO).substring(0, 10) : '',
      NOMBRE: record.NOMBRE ? String(record.NOMBRE).trim() : '',
      NOMBRE2: record.NOMBRE2 ? String(record.NOMBRE2).trim() : '',
      APELLIDO: record.APELLIDO ? String(record.APELLIDO).trim() : '',
      APELLIDO2: record.APELLIDO2 ? String(record.APELLIDO2).trim() : '',
      TIPO_ID: rawTipoId,
      PERSONA: rawPersona,
      ID_GRUPO: resolvedGrupo,
      CLASE: rawClase,
      PERFIL_TRIBUTARIO: record.PERFIL_TRIBUTARIO ? String(record.PERFIL_TRIBUTARIO).trim() : '',
      RT: rtVal,
      CONTACTO: record.CONTACTO ? String(record.CONTACTO).trim() : '',
      COMENTARIOS: record.COMENTARIOS ? String(record.COMENTARIOS).trim() : '',
      ZONA: record.ZONA ? String(record.ZONA).trim() : '',
      ID_ADC: record.ID_ADC ? String(record.ID_ADC).trim() : '',
      STATUS: record.STATUS ? String(record.STATUS).trim() : '',
      CUPO_CREDITO: record.CUPO_CREDITO || 0,
      TIEMPO_ENTREGA: record.TIEMPO_ENTREGA || 0
    }, { emitEvent: false });

    this.direcciones.set(record.DIRECCIONES ?? []);
    this.telefonos.set(record.TELEFONOS ?? []);
    this.emails.set(record.ITM_EMAIL ?? []);
    this.condiciones.set(record.CONDICIONES ?? []);
    this.contactoAdicional.set(record.ADIC_ACREEDORES ?? { URL: '', CIIU: '' });
  }

  private clearForm(): void {
    this.currentIndex.set(-1);
    this.mode.set(RecordToolbarMode.Initial);
    this.form.reset({}, { emitEvent: false });
    this.disableFormControls();
    this.direcciones.set([]);
    this.telefonos.set([]);
    this.emails.set([]);
    this.condiciones.set([]);
    this.contactoAdicional.set({ URL: '', CIIU: '' });
  }

  currentReportFilter(): string {
    const record = this.currentRecord();
    return record ? `CLIENTES.ID_CLIENTE = '${record.ID_CLIENTE}'` : '';
  }

  private showError(error: unknown): void {
    this.notification.error(error instanceof Error ? error.message : 'No se pudieron cargar los datos de clientes.');
  }

  onIdLegalChanged(selectedId: number | string): void {
    if (this.readOnly()) return;
    const match = this.idLegales().find(l => String(l.ID_LEGAL) === String(selectedId));
    if (match) {
      this.form.patchValue({
        NOMBRE: match.NOMBRE ? String(match.NOMBRE) : (match.NOMBRE_COMPLETO ? String(match.NOMBRE_COMPLETO) : ''),
        NOMBRE2: match['NOMBRE2'] ? String(match['NOMBRE2']) : '',
        APELLIDO: match['APELLIDO'] ? String(match['APELLIDO']) : '',
        APELLIDO2: match['APELLIDO2'] ? String(match['APELLIDO2']) : '',
        TIPO_ID: match['TIPO_ID'] ? String(match['TIPO_ID']) : (match.TIPO ? String(match.TIPO) : 'NIT'),
        PERSONA: match.PERSONA ? String(match.PERSONA) : 'JURIDICA',
        CONTACTO: String(match.ID_LEGAL || '')
      });
    }
  }
}
