import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
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
import { Subscription } from 'rxjs';
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
  XteinSwitchComponent,
  XteinRadioGroupComponent,
  XteinButtonComponent,
  XteinPopupComponent,
  XteinPasswordComponent,
  XteinRecordViewComponent,
  XteinRecordFilterComponent,
  XteinRecordReportsComponent,
  XteinNotificationService,
  XteinRecordFilterResult,
  XteinRecordViewColumn
} from '@xtein/ui';

import {
  Adm015Application,
  Adm015ToolbarCapabilities
} from './constants/adm-015.constants';
import {
  Adm015Estados,
  Adm015ExpirarOptions,
  Adm015Intervalos,
  Adm015RecordViewColumns,
  Adm015DefaultRecord
} from './constants/adm-015-ui.constants';
import {
  Adm015UsuarioRecord,
  Adm015AutorizacionRecord,
  Adm015PermisoEspecialRecord,
  Adm015UNAsociadaRecord,
  Adm015ConexionRecord,
  Adm015SettingAplicacionRecord
} from './models/adm-015.model';
import { Adm015Service } from './services/adm-015.service';
import { Adm015BusinessService } from './services/adm-015-business.service';

import { XteinAdm015AplicacionesComponent } from './components/xtein-adm015-aplicaciones/xtein-adm015-aplicaciones.component';
import { XteinAdm015PermisosEspecialesComponent } from './components/xtein-adm015-permisos-especiales/xtein-adm015-permisos-especiales.component';
import { XteinAdm015UnAsociadasComponent } from './components/xtein-adm015-un-asociadas/xtein-adm015-un-asociadas.component';
import { XteinAdm015ConexionesComponent } from './components/xtein-adm015-conexiones/xtein-adm015-conexiones.component';
import { XteinAdm015ConfiguracionesComponent } from './components/xtein-adm015-configuraciones/xtein-adm015-configuraciones.component';

@Component({
  selector: 'app-adm-015',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    XteinInputComponent,
    XteinLabelComponent,
    XteinSelectComponent,
    XteinNumberComponent,
    XteinSwitchComponent,
    XteinRadioGroupComponent,
    XteinButtonComponent,
    XteinPopupComponent,
    XteinPasswordComponent,
    XteinRecordViewComponent,
    XteinRecordFilterComponent,
    XteinRecordReportsComponent,
    XteinAdm015AplicacionesComponent,
    XteinAdm015PermisosEspecialesComponent,
    XteinAdm015UnAsociadasComponent,
    XteinAdm015ConexionesComponent,
    XteinAdm015ConfiguracionesComponent
  ],
  providers: [
    Adm015Service,
    Adm015BusinessService
  ],
  templateUrl: './adm-015.component.html',
  styleUrls: ['./adm-015.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Adm015Component implements OnInit, OnDestroy {
  readonly applicationId = Adm015Application.Id;
  readonly applicationTitle = Adm015Application.Title;
  readonly tableBase = Adm015Application.Table;

  // UI Constants
  readonly estados = Adm015Estados;
  readonly expirarOptions = Adm015ExpirarOptions;
  readonly intervalos = Adm015Intervalos;
  readonly viewColumns: XteinRecordViewColumn[] = [...Adm015RecordViewColumns];

  // Active state signals
  readonly loading = signal<boolean>(false);
  readonly permissions = signal<RecordToolbarPermissions>(DeniedRecordToolbarPermissions);
  readonly mode = signal<RecordToolbarMode>(RecordToolbarMode.Initial);
  readonly records = signal<Adm015UsuarioRecord[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly activeTab = signal<'contrasenas' | 'aplicaciones' | 'permisos' | 'un' | 'conexiones' | 'configuraciones'>('contrasenas');

  // Overlays
  readonly filterVisible = signal<boolean>(false);
  readonly viewVisible = signal<boolean>(false);
  readonly reportsVisible = signal<boolean>(false);
  readonly passwordModalVisible = signal<boolean>(false);

  // Child data signals
  readonly autorizaciones = signal<Adm015AutorizacionRecord[]>([]);
  readonly permisosEspeciales = signal<Adm015PermisoEspecialRecord[]>([]);
  readonly unAsociadas = signal<Adm015UNAsociadaRecord[]>([]);
  readonly conexiones = signal<Adm015ConexionRecord[]>([]);
  readonly settings = signal<Adm015SettingAplicacionRecord[]>([]);

  // Catalogs
  readonly roles = signal<{ ID_ROL: string; DESCRIPCION: string }[]>([]);
  readonly availableApps = signal<{ ID_APLICACION: string; NOMBRE: string }[]>([]);
  readonly availableUNs = signal<{ ID_UN: string; NOMBRE: string }[]>([]);
  readonly availableConexiones = signal<{ ID_CONEXION: string; NOMBRE?: string }[]>([]);

  // Computed state
  readonly readOnly = computed(() => {
    const current = this.mode();
    return current === RecordToolbarMode.Initial || current === RecordToolbarMode.Browsing;
  });

  readonly isEditing = computed(() => this.mode() === RecordToolbarMode.Editing);
  readonly isNew = computed(() => this.currentIndex() === -1 && this.mode() === RecordToolbarMode.Editing);

  readonly currentRecord = computed(() => {
    const idx = this.currentIndex();
    const list = this.records();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  readonly queryFilter = computed(() =>
    this.records()[0]?.QFILTRO || this.records().map(r => `(USUARIO='${r.USUARIO}')`).join(' OR ')
  );

  // Main Reactive Form
  readonly form = new FormGroup({
    USUARIO: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    NOMBRE: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    ID_ROL: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    ESTADO: new FormControl<string>('ACTIVO', { nonNullable: true, validators: [Validators.required] }),
    EMAIL: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    CAMBIAR_CLAVE: new FormControl<boolean>(true, { nonNullable: true }),
    EXPIRARstr: new FormControl<string>('No Expirar', { nonNullable: true }),
    TIEMPO_INTERVALO: new FormControl<number>(0, { nonNullable: true }),
    INTERVALO: new FormControl<number>(0, { nonNullable: true })
  });

  // Password Modal Form
  readonly passwordForm = new FormGroup({
    NUEVA_CLAVE: new FormControl<string>('', [Validators.required, Validators.minLength(6)]),
    CONFIRMAR_CLAVE: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  });

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly service: Adm015Service,
    readonly business: Adm015BusinessService,
    private readonly toolbar: ToolbarRuntimeService,
    private readonly permissionsService: RecordToolbarPermissionsService,
    private readonly workspace: WorkspaceRuntimeService,
    private readonly notification: XteinNotificationService
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
        this.passwordModalVisible.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.disableFormControls();

    // Mark dirty on changes
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        if (!this.readOnly()) {
          this.workspace.setDirty(this.applicationId, true);
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
      busy: this.loading(),
      applicationId: this.applicationId,
      mode: this.mode(),
      permissions: this.permissions(),
      capabilities: Adm015ToolbarCapabilities,
      currentIndex: this.currentIndex(),
      totalRecords: this.records().length
    });
    untracked(() => this.toolbar.setState(state));
  }

  private async handleToolbarCommand(command: ToolbarCommand): Promise<void> {
    if (this.loading()) return;
    switch (command.action) {
      case ToolbarAction.New:
        this.onNew();
        break;
      case ToolbarAction.Edit:
        this.onEdit();
        break;
      case ToolbarAction.Delete:
        await this.onDelete();
        break;
      case ToolbarAction.Save:
        await this.onSave();
        break;
      case ToolbarAction.Cancel:
        await this.onUndo();
        break;
      case ToolbarAction.Search:
        this.filterVisible.set(true);
        break;
      case ToolbarAction.Refresh:
        await this.onRefresh();
        break;
      case ToolbarAction.First:
        this.navigate(0);
        break;
      case ToolbarAction.Previous:
        this.navigate(this.currentIndex() - 1);
        break;
      case ToolbarAction.Next:
        this.navigate(this.currentIndex() + 1);
        break;
      case ToolbarAction.Last:
        this.navigate(this.records().length - 1);
        break;
      case ToolbarAction.View:
        this.viewVisible.set(true);
        break;
      case ToolbarAction.Print:
        this.reportsVisible.set(true);
        break;
      case ToolbarAction.Configure:
        this.openPasswordModal();
        break;
      case ToolbarAction.GoTo:
        if (typeof command.payload === 'number' && Number.isInteger(command.payload)) {
          this.navigate(command.payload - 1);
        }
        break;
      default:
        break;
    }
  }

  // ================= CRUD Operations =================

  private onNew(): void {
    this.mode.set(RecordToolbarMode.Editing);
    this.currentIndex.set(-1);

    this.form.reset({
      ...Adm015DefaultRecord
    });
    this.enableFormControls();

    // Clear child lists for new user
    this.autorizaciones.set([]);
    this.permisosEspeciales.set([]);
    this.unAsociadas.set([]);
    this.conexiones.set([]);
    this.settings.set([]);

    this.activeTab.set('contrasenas');
    this.workspace.setDirty(this.applicationId, true);
  }

  private onEdit(): void {
    if (!this.currentRecord()) return;
    this.mode.set(RecordToolbarMode.Editing);
    this.enableFormControls();
    // Username cannot be edited once created
    this.form.controls.USUARIO.disable();
    this.workspace.setDirty(this.applicationId, true);
  }

  private async onUndo(): Promise<void> {
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
      this.mode.set(this.records().length > 0 ? RecordToolbarMode.Browsing : RecordToolbarMode.Initial);
      this.disableFormControls();
      this.workspace.setDirty(this.applicationId, false);

      const idx = this.currentIndex();
      if (idx >= 0 && idx < this.records().length) {
        this.loadRecordData(this.records()[idx]);
      } else {
        this.form.reset({ ...Adm015DefaultRecord });
      }
    }
  }

  private async onSave(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notification.warning('Complete todos los campos obligatorios del formulario.');
      return;
    }

    const val = this.form.getRawValue();
    const isNewRecord = this.isNew();

    // Validation: Expiration requires interval days
    if (val.EXPIRARstr === 'Expirar cada' && (!val.TIEMPO_INTERVALO || val.TIEMPO_INTERVALO <= 0)) {
      this.notification.warning('Debe especificar un tiempo de intervalo mayor a 0 para la expiración.');
      return;
    }

    // Check unique username for new records
    if (isNewRecord) {
      const exists = await this.business.checkUserExists(val.USUARIO, 'new');
      if (exists) {
        this.notification.error(`El usuario "${val.USUARIO}" ya existe en el sistema.`);
        return;
      }
    }

    const usuarioRecord: Adm015UsuarioRecord = {
      USUARIO: val.USUARIO.trim().toUpperCase(),
      NOMBRE: val.NOMBRE.trim(),
      ID_ROL: val.ID_ROL,
      ESTADO: val.ESTADO,
      EMAIL: val.EMAIL.trim(),
      EXPIRAR: val.EXPIRARstr === 'Expirar cada',
      EXPIRARstr: val.EXPIRARstr,
      TIEMPO_INTERVALO: val.TIEMPO_INTERVALO || 0,
      INTERVALO: val.INTERVALO || 0,
      CAMBIAR_CLAVE: val.CAMBIAR_CLAVE
    };

    const payload = {
      USUARIOS: usuarioRecord,
      AUTORIZACIONES: this.autorizaciones(),
      PERMISOS_ESPECIALES: this.permisosEspeciales(),
      UN_ASOCIADAS: this.unAsociadas(),
      CONEXIONES: this.conexiones(),
      SETTINGS: this.settings()
    };

    try {
      await this.business.saveUser(isNewRecord ? 'new' : 'update', payload);
      this.notification.success('Usuario guardado exitosamente.');
      this.workspace.setDirty(this.applicationId, false);
      this.mode.set(RecordToolbarMode.Browsing);
      this.disableFormControls();

      // Refresh records to navigate to saved user
      const users = await this.business.queryUsers(`USUARIO='${usuarioRecord.USUARIO}'`);
      if (users.length > 0) {
        this.records.set(users);
        this.navigate(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el usuario.';
      this.notification.error(msg);
    }
  }

  private async onDelete(): Promise<void> {
    const current = this.currentRecord();
    if (!current) return;

    const result = await Swal.fire({
      html: `¿Está seguro de eliminar el usuario <b>${current.USUARIO} - ${current.NOMBRE}</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#0F4C81',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.business.deleteUser(current.USUARIO);
        this.notification.success('Usuario eliminado exitosamente.');

        const updated = this.records().filter(r => r.USUARIO !== current.USUARIO);
        this.records.set(updated);

        if (updated.length > 0) {
          const nextIdx = Math.min(this.currentIndex(), updated.length - 1);
          this.navigate(nextIdx);
        } else {
          this.currentIndex.set(-1);
          this.mode.set(RecordToolbarMode.Initial);
          this.form.reset({ ...Adm015DefaultRecord });
          this.disableFormControls();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar el usuario.';
        this.notification.error(msg);
      }
    }
  }

  private async onRefresh(): Promise<void> {
    const current = this.currentRecord();
    if (!current) return;
    await this.loadChildData(current.USUARIO, current.ID_ROL);
    this.notification.success('Datos actualizados.');
  }

  // ================= Navigation =================

  navigate(index: number): void {
    const list = this.records();
    if (index < 0 || index >= list.length) return;

    this.currentIndex.set(index);
    this.mode.set(RecordToolbarMode.Browsing);
    this.disableFormControls();
    this.workspace.setDirty(this.applicationId, false);

    const record = list[index];
    this.loadRecordData(record);
  }

  private loadRecordData(record: Adm015UsuarioRecord): void {
    this.form.patchValue({
      USUARIO: record.USUARIO,
      NOMBRE: record.NOMBRE,
      ID_ROL: record.ID_ROL,
      ESTADO: record.ESTADO,
      EMAIL: record.EMAIL,
      CAMBIAR_CLAVE: Boolean(record.CAMBIAR_CLAVE),
      EXPIRARstr: record.EXPIRAR ? 'Expirar cada' : 'No Expirar',
      TIEMPO_INTERVALO: record.TIEMPO_INTERVALO || 0,
      INTERVALO: record.INTERVALO || 0
    });

    this.loadChildData(record.USUARIO, record.ID_ROL);
  }

  private async loadChildData(usuario: string, rol: string): Promise<void> {
    try {
      const [auths, perm, un, conn, sett] = await Promise.all([
        this.business.loadAutorizaciones(usuario, rol),
        this.business.loadPermisosEspeciales(usuario),
        this.business.loadUNAsociadas(usuario),
        this.business.loadConexiones(usuario),
        this.business.loadSettings(usuario)
      ]);

      this.autorizaciones.set(auths);
      this.permisosEspeciales.set(perm);
      this.unAsociadas.set(un);
      this.conexiones.set(conn);
      this.settings.set(sett);
    } catch {
      // Non-critical child loads
    }
  }

  // ================= Filter & View Handlers =================

  async onFilterApplied(result: XteinRecordFilterResult): Promise<void> {
    this.filterVisible.set(false);
    try {
      const users = await this.business.queryUsers(result?.ESTRUCTURA ?? []);
      if (users.length > 0) {
        this.records.set(users);
        this.navigate(0);
        this.notification.success(`Se encontraron ${users.length} usuario(s).`);
      } else {
        this.notification.warning('No se encontraron registros con el criterio especificado.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en la búsqueda.';
      this.notification.error(msg);
    }
  }

  onRecordSelectedFromView(record: unknown): void {
    this.viewVisible.set(false);
    const rec = record as Adm015UsuarioRecord;
    const idx = this.records().findIndex(r => r.USUARIO === rec?.USUARIO);
    if (idx >= 0) {
      this.navigate(idx);
    }
  }

  // ================= Catalogs =================

  private async loadCatalogs(): Promise<void> {
    try {
      const [rolesData, appsData, unData, connData] = await Promise.all([
        this.business.catalog('roles'),
        this.business.catalog('aplicaciones', { TIPO: 'APLICACION', ESTADO: 'ACTIVO' }),
        this.business.catalog('unidadesNegocios'),
        this.business.catalog('conexiones')
      ]);

      this.roles.set(rolesData as { ID_ROL: string; DESCRIPCION: string }[]);
      this.availableApps.set(appsData as { ID_APLICACION: string; NOMBRE: string }[]);
      this.availableUNs.set(unData as { ID_UN: string; NOMBRE: string }[]);
      this.availableConexiones.set(connData as { ID_CONEXION: string; NOMBRE?: string }[]);
    } catch {
      // Catalogs fallback
    }
  }

  async copyPermissionsFromRole(): Promise<void> {
    const rol = this.form.controls.ID_ROL.value;
    if (!rol) {
      this.notification.warning('Seleccione un Rol para copiar sus autorizaciones predeterminadas.');
      return;
    }

    try {
      const auths = await this.business.loadAutorizaciones('', rol, 'new');
      this.autorizaciones.set(auths.map(a => ({ ...a, isEdit: true })));
      this.notification.success('Autorizaciones copiadas desde el Rol.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al copiar autorizaciones.';
      this.notification.error(msg);
    }
  }

  // ================= Password Modal =================

  openPasswordModal(): void {
    const usuario = this.form.controls.USUARIO.value || this.currentRecord()?.USUARIO;
    if (!usuario) {
      this.notification.warning('Debe consultar o seleccionar un usuario primero.');
      return;
    }
    this.passwordForm.reset();
    this.passwordModalVisible.set(true);
  }

  closePasswordModal(): void {
    this.passwordModalVisible.set(false);
  }

  async submitChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.notification.warning('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const { NUEVA_CLAVE, CONFIRMAR_CLAVE } = this.passwordForm.getRawValue();
    if (NUEVA_CLAVE !== CONFIRMAR_CLAVE) {
      this.notification.error('Las contraseñas no coinciden.');
      return;
    }

    const usuario = this.form.controls.USUARIO.value || this.currentRecord()?.USUARIO || '';
    if (!usuario) {
      this.notification.warning('No hay un usuario seleccionado.');
      return;
    }

    try {
      await this.business.changePassword({
        USUARIO: usuario,
        PASSWORD: NUEVA_CLAVE || '',
        TIPO: 'USUARIO'
      });

      this.notification.success('Contraseña actualizada exitosamente.');
      this.closePasswordModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar la contraseña.';
      this.notification.error(msg);
    }
  }

  // ================= Helpers =================

  private disableFormControls(): void {
    this.form.disable({ emitEvent: false });
  }

  private enableFormControls(): void {
    this.form.enable({ emitEvent: false });
  }
}
