import { EventEmitter } from '@angular/core';
import type { XteinGridColumn, XteinGridToolbarAction } from '@xtein/ui';
import Swal from 'sweetalert2';
import { Adm015AutorizacionRecord } from '../models/adm-015.model';
import { Adm015AvailableApplication, Adm015ApplicationChoice, Adm015PermissionField, Adm015AuthorizationDraft } from '../models/adm-015-application-permissions.model';
import { Adm015ListOperations, Adm015PermissionGroups, Adm015PermissionLegend, oppositePermission } from '../constants/adm-015-permissions.constants';

// The same state is used by the Angular view and tested without browser widgets.
export class Adm015ApplicationPermissionsState {
  autorizaciones: Adm015AutorizacionRecord[] = [];
  readOnly = true;
  busy = false;
  availableApps: Adm015AvailableApplication[] = [];
  draft: Adm015AuthorizationDraft | null = null;
  readonly autorizacionesChange = new EventEmitter<Adm015AutorizacionRecord[]>();
  readonly draftChange = new EventEmitter<Adm015AuthorizationDraft | null>();
  readonly refresh = new EventEmitter<void>();
  rows: Adm015AutorizacionRecord[] = [];
  columns: XteinGridColumn<Adm015AutorizacionRecord, string>[] = [];
  selected: string[] = [];
  listOpened = false;
  choices: Adm015ApplicationChoice[] = [];
  choiceKeys: string[] = [];
  selectableApps: Adm015AvailableApplication[] = [];
  toolbarActions: XteinGridToolbarAction[] = [];
  readonly lookupColumns: XteinGridColumn<Adm015AvailableApplication>[] = [
    { dataField: 'ID_APLICACION', caption: 'Aplicación' }, { dataField: 'NOMBRE', caption: 'Nombre' },
    { dataField: 'TIPO_SISTEMA', caption: 'Tipo de Aplicación' }
  ];
  readonly choiceColumns: XteinGridColumn<Adm015ApplicationChoice, string>[] = [
    { dataField: 'ID_APLICACION', caption: 'Aplicación', width: 105 },
    { dataField: 'NOMBRE', caption: 'Nombre', minWidth: 180 },
    { caption: 'Operaciones', alignment: 'center', columns: Adm015ListOperations.map(col => ({
      name: `choice-${col.field}`, dataField: col.field, caption: col.caption, width: 44,
      alignment: 'center', allowFiltering: false, allowSorting: false,
      headerCellTemplate: 'xteinGroup', cellTemplate: 'xteinGroup'
    })) }
  ];
  constructor(private readonly notification: { warning(message: string): void }) {}
  synchronizeInputs(): void {
    if (this.readOnly) { this.selected = []; this.listOpened = false; }
    this.selected = this.selected.filter(id => this.autorizaciones.some(row => row.ID_APLICACION === id));
    this.rebuild();
  }
  selectionChanged(keys: string[]): void {
    this.selected = keys.filter(id => this.autorizaciones.some(row => row.ID_APLICACION === id));
    this.updateToolbar();
  }
  private updateToolbar(): void {
    this.toolbarActions = this.readOnly ? [] : [
      { id: 'add', icon: 'plus', variant: 'primary', title: 'Agregar aplicación', disabled: this.busy || !!this.draft, action: () => this.begin() },
      { id: 'save', icon: 'check', variant: 'success', title: 'Aceptar aplicación', visible: !!this.draft, disabled: this.busy, action: () => this.commit() },
      { id: 'cancel', icon: 'undo', variant: 'cancel', title: 'Cancelar aplicación', visible: !!this.draft, disabled: this.busy, action: () => this.setDraft(null) },
      { id: 'delete', icon: 'trash', variant: 'danger', title: 'Eliminar aplicaciones seleccionadas', visible: this.selected.length > 0 && !this.draft, disabled: this.busy, action: () => { void this.removeSelected(); } },
      { id: 'refresh', icon: 'refresh', variant: 'secondary', title: 'Recargar autorizaciones', disabled: this.busy, action: () => this.refresh.emit() }
    ];
  }
  private rebuild(): void {
    const assigned = new Set(this.autorizaciones.map(row => row.ID_APLICACION));
    const seen = new Set<string>();
    this.selectableApps = this.availableApps.filter(app => {
      if (seen.has(app.ID_APLICACION)) return false;
      seen.add(app.ID_APLICACION);
      return !assigned.has(app.ID_APLICACION) || app.ID_APLICACION === this.draft?.originalApplicationId;
    });
    this.updateToolbar();
    this.rows = this.draft ? [this.draft, ...this.autorizaciones.filter(row => row.ID_APLICACION !== this.draft?.originalApplicationId)] : [...this.autorizaciones];
    const appColumns: XteinGridColumn<Adm015AutorizacionRecord, string>[] = [
      { dataField: 'ID_APLICACION', caption: 'Aplicación', width: 150, cellTemplate: 'xteinGroup' },
      { dataField: 'NOMBRE', caption: 'Nombre', minWidth: 260 }
    ];
    this.columns = [{ caption: Adm015PermissionLegend, alignment: 'center', columns: [
      { caption: 'Aplicaciones', alignment: 'center', columns: this.readOnly ? appColumns : [
        { caption: 'Marcar Todos', alignment: 'right', columns: appColumns }
      ] },
      ...Adm015PermissionGroups.map(group => ({
        caption: group.caption, alignment: 'center' as const, columns: group.columns.map(col => {
          const leaf: XteinGridColumn<Adm015AutorizacionRecord, string> = {
            dataField: col.field, caption: col.caption, alignment: 'center',
            width: col.field === 'A_APROBAR' ? 90 : col.field === 'CONFIGURAR' ? 50 : 40,
            allowFiltering: false, allowSorting: false, cellTemplate: 'xteinGroup'
          };
          return this.readOnly ? leaf : { name: `mark-${col.field}`, caption: col.title,
            alignment: 'center' as const, headerCellTemplate: 'xteinGroup', columns: [leaf] };
        })
      }))
    ] }];
  }
  private newRecord(app?: Adm015AvailableApplication): Adm015AutorizacionRecord {
    const record: Adm015AutorizacionRecord = {
      ITEM: Math.max(0, ...this.autorizaciones.map(row => row.ITEM || 0)) + 1,
      ID_UN: '', USUARIO: '', ID_APLICACION: app?.ID_APLICACION || '', NOMBRE: app?.NOMBRE || '',
      CREAR: false, MODIFICAR: false, ELIMINAR: false, BUSCAR: false, LISTAR: false,
      EXCLUSIVA: false, CONFIGURAR: false, S_NIVEL: false, S_CLAVE: '', S_APROBAR: false,
      A_NIVEL: false, A_CLAVE: '', isEdit: true
    };
    for (const group of Adm015PermissionGroups) for (const col of group.columns) record[col.field] = false;
    return record;
  }
  begin(): void {
    if (!this.readOnly && !this.busy && !this.draft) this.setDraft(this.newRecord());
  }
  beginEdit(row: Adm015AutorizacionRecord): void {
    if (!this.readOnly && !this.busy && !this.draft) this.setDraft({ ...row, originalApplicationId: row.ID_APLICACION, isEdit: true });
  }
  setDraft(value: Adm015AuthorizationDraft | null): void {
    if (this.readOnly || this.busy) return;
    this.draft = value; this.draftChange.emit(value); this.rebuild();
  }
  chooseApplication(id: unknown): void {
    if (!this.draft || this.readOnly || this.busy) return;
    const app = this.selectableApps.find(item => item.ID_APLICACION === id);
    if (app) this.setDraft({ ...this.draft, ID_APLICACION: app.ID_APLICACION, NOMBRE: app.NOMBRE });
  }
  commit(): void {
    if (this.readOnly || this.busy || !this.draft) return;
    if (!this.draft.ID_APLICACION || !this.availableApps.some(app => app.ID_APLICACION === this.draft?.ID_APLICACION)) {
      this.notification.warning('Seleccione una aplicación.'); return;
    }
    if (this.autorizaciones.some(row => row.ID_APLICACION === this.draft?.ID_APLICACION && row.ID_APLICACION !== this.draft?.originalApplicationId)) {
      this.notification.warning('La aplicación ya está asociada.'); return;
    }
    const { originalApplicationId, ...row } = this.draft;
    this.setDraft(null);
    this.publish([...this.autorizaciones.filter(item => item.ID_APLICACION !== originalApplicationId), row]);
  }
  private publish(rows: Adm015AutorizacionRecord[]): void {
    this.autorizaciones = [...rows].sort((a, b) => a.ID_APLICACION.localeCompare(b.ID_APLICACION));
    this.rebuild(); this.autorizacionesChange.emit(this.autorizaciones);
  }
  fieldFromHeader(name: string): Adm015PermissionField { return name.replace(/^(mark|choice)-/, '') as Adm015PermissionField; }
  columnChecked(field: Adm015PermissionField): boolean { return this.rows.length > 0 && this.rows.every(row => !!row[field]); }
  columnMixed(field: Adm015PermissionField): boolean { return this.rows.some(row => !!row[field]) && !this.columnChecked(field); }
  changePermission(row: Adm015AutorizacionRecord, field: Adm015PermissionField, value: boolean): void {
    if (this.readOnly || this.busy) return;
    const opposite = oppositePermission(field);
    if (value && opposite && row[opposite]) { this.warnConflict(); return; }
    const updated = { ...row, [field]: value, isEdit: true };
    if (row === this.draft) this.setDraft(updated);
    else this.publish(this.autorizaciones.map(item => item.ID_APLICACION === row.ID_APLICACION ? updated : item));
  }
  markAllColumn(field: Adm015PermissionField, value: boolean): void {
    if (this.readOnly || this.busy) return;
    const opposite = oppositePermission(field);
    if (value && opposite && this.rows.some(row => row[opposite])) { this.warnConflict(); return; }
    if (this.draft) this.setDraft({ ...this.draft, [field]: value });
    this.publish(this.autorizaciones.map(row => ({ ...row, [field]: value, isEdit: true })));
  }
  private warnConflict(): void {
    this.notification.warning('No se puede asociar un permiso y su aprobación sobre la misma acción.');
    this.autorizaciones = this.autorizaciones.map(row => ({ ...row }));
    if (this.draft) this.draft = { ...this.draft };
    this.rebuild();
  }
  async removeSelected(): Promise<void> {
    if (this.readOnly || this.busy || this.draft || !this.selected.length) return;
    const ids = new Set(this.selected); const source = this.autorizaciones;
    const result = await Swal.fire({ text: '¿Desea eliminar las aplicaciones seleccionadas?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'No' });
    if (!result.isConfirmed || this.readOnly || this.busy || this.autorizaciones !== source) return;
    this.selected = []; this.publish(this.autorizaciones.filter(row => !ids.has(row.ID_APLICACION)));
  }
  openList(opened: boolean): void {
    this.listOpened = opened && !this.readOnly && !this.busy && !this.draft;
    this.choiceKeys = [];
    this.choices = this.listOpened ? this.selectableApps.map(app => ({ ...app, CREAR: false, MODIFICAR: false, ELIMINAR: false, BUSCAR: false })) : [];
  }
  changeChoice(id: string, field: Adm015PermissionField, value: boolean): void {
    if (!this.readOnly && !this.busy) this.choices = this.choices.map(row => row.ID_APLICACION === id ? { ...row, [field]: value } : row);
  }
  markChoices(field: Adm015PermissionField, value: boolean): void {
    if (this.readOnly || this.busy) return;
    const keys = new Set(this.choiceKeys);
    this.choices = this.choices.map(row => keys.has(row.ID_APLICACION) ? { ...row, [field]: value } : row);
  }
  choicesChecked(field: string): boolean {
    const rows = this.choices.filter(row => this.choiceKeys.includes(row.ID_APLICACION));
    return rows.length > 0 && rows.every(row => !!row[field as keyof Adm015ApplicationChoice]);
  }
  acceptList(): void {
    if (this.readOnly || this.busy || this.draft) return;
    const assigned = new Set(this.autorizaciones.map(row => row.ID_APLICACION));
    let item = Math.max(0, ...this.autorizaciones.map(row => row.ITEM || 0));
    const added = this.choices.filter(row => this.choiceKeys.includes(row.ID_APLICACION) && !assigned.has(row.ID_APLICACION))
      .map(row => ({ ...this.newRecord(row), ITEM: ++item, CREAR: row.CREAR, MODIFICAR: row.MODIFICAR,
        ELIMINAR: row.ELIMINAR, BUSCAR: row.BUSCAR }));
    if (added.length) this.publish([...this.autorizaciones, ...added]);
    this.openList(false);
  }
}
