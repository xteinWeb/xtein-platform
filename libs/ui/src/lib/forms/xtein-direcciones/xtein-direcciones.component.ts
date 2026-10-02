import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridToolbarAction } from '../../data/xtein-data-grid/models/xtein-data-grid.model';
import { XteinInputComponent } from '../xtein-input/xtein-input.component';
import { XteinSelectComponent } from '../xtein-select/xtein-select.component';
import { XteinLookupComponent } from '../xtein-lookup/xtein-lookup.component';
import { XteinNotificationService } from '../../feedback/xtein-notification/xtein-notification.service';
import { XteinDireccionesCatalogService } from './xtein-direcciones-catalog.service';
import { direccionTipos, XteinDireccion, XteinDireccionPostal, XteinDireccionTipo, XteinDireccionUbicacion } from './xtein-direcciones.model';

@Component({
  selector: 'xtein-direcciones', standalone: true,
  imports: [FormsModule, XteinDataGridComponent, XteinInputComponent, XteinSelectComponent, XteinLookupComponent],
  templateUrl: './xtein-direcciones.component.html', styleUrl: './xtein-direcciones.component.scss'
})
export class XteinDireccionesComponent implements OnChanges, OnInit {
  @Input() readOnly = false;
  @Input() direcciones: XteinDireccion[] = [];
  @Output() readonly direccionesChange = new EventEmitter<XteinDireccion[]>();
  @Output() readonly pendingChange = new EventEmitter<void>();
  @ViewChild(XteinDataGridComponent) private grid?: XteinDataGridComponent;
  private readonly destroy = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly requests = new Map<string, Subscription>();
  readonly columns = [
    { dataField: 'ID_DIRECCION', caption: 'Id. Dir', width: 70 },
    { dataField: 'TIPO_DIRECCION', caption: 'Tipo dirección', minWidth: 160, cellTemplate: 'xteinGroup' },
    { dataField: 'DOMICILIO', caption: 'Dirección/Domicilio', minWidth: 170, cellTemplate: 'xteinGroup' },
    { dataField: 'ID_UBICACION', caption: 'Ciudad/Municipio', minWidth: 160, cellTemplate: 'xteinGroup' },
    { dataField: 'BARRIO', caption: 'Barrio', minWidth: 130, cellTemplate: 'xteinGroup' },
    { dataField: 'DEPENDIENTE', caption: 'Zona', minWidth: 130, cellTemplate: 'xteinGroup' },
    { dataField: 'REFERENCIA', caption: 'Referencia', minWidth: 130, cellTemplate: 'xteinGroup' },
    { dataField: 'CODIGO_POSTAL', caption: 'Código postal', minWidth: 130, cellTemplate: 'xteinGroup' }
  ];
  readonly typeColumns = [{ dataField: 'TIPO', caption: 'Tipo' }];
  readonly popupOptions = { width: 400 };
  readonly locationSearch = ['ID_UBICACION', 'NOMBRE'];
  readonly postalSearch = ['CODIGO_POSTAL', 'DETALLE'];
  types: XteinDireccionTipo[] = [];
  cities: XteinDireccionUbicacion[] = [];
  neighborhoods: XteinDireccionUbicacion[] = [];
  zones: XteinDireccionUbicacion[] = [];
  postalCodes: XteinDireccionPostal[] = [];
  errors: string[] = [];
  rows: XteinDireccion[] = [];
  selected: number[] = [];
  draft: XteinDireccion | null = null;
  private adding = false;
  toolbar: XteinGridToolbarAction[] = [];

  constructor(private readonly catalog: XteinDireccionesCatalogService, private readonly notification: XteinNotificationService) {
    this.destroy.onDestroy(() => this.requests.forEach(request => request.unsubscribe()));
  }
  ngOnInit(): void { this.reloadCatalogs(); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['direcciones'] || (changes['readOnly'] && this.readOnly)) {
      this.draft = null;
      this.selected = [];
      this.clearDependents();
    }
    let max = Math.max(0, ...this.direcciones.map(row => row.ID_DIRECCION || 0));
    this.direcciones = this.direcciones.map(row => ({ ...row, ID_DIRECCION: row.ID_DIRECCION || ++max }));
    this.rebuild();
  }
  private load<T>(key: string, source: Observable<T[]>, apply: (rows: T[]) => void): void {
    this.requests.get(key)?.unsubscribe();
    this.errors = this.errors.filter(error => error !== key);
    this.requests.set(key, source.subscribe({
      next: rows => { apply(rows); this.cdr.markForCheck(); },
      error: () => { this.errors = [...this.errors, key]; this.cdr.markForCheck(); }
    }));
  }
  reloadCatalogs(): void {
    this.load('tipos', this.catalog.types(), rows => this.types = rows.filter(row => !!row.TIPO));
    this.load('ciudades', this.catalog.locations('Ciudad'), rows => this.cities = rows.filter(row => !!row.ID_UBICACION));
    this.loadDependents();
  }
  refreshList(field: string): void {
    if (field === 'ID_UBICACION') {
      this.load('ciudades', this.catalog.locations('Ciudad'), rows => this.cities = rows.filter(row => !!row.ID_UBICACION));
    } else if (field === 'DEPENDIENTE') {
      this.loadZones();
    } else if (this.draft?.ID_UBICACION) {
      if (field === 'BARRIO') this.load('barrios', this.catalog.locations('Barrio', this.draft.ID_UBICACION), rows => this.neighborhoods = rows);
      if (field === 'CODIGO_POSTAL') this.load('códigos postales', this.catalog.postalCodes(this.draft.ID_UBICACION), rows => this.postalCodes = rows);
    }
  }
  private clearDependents(): void {
    for (const key of ['barrios', 'zonas', 'códigos postales']) {
      this.requests.get(key)?.unsubscribe();
      this.errors = this.errors.filter(error => error !== key);
    }
    this.neighborhoods = []; this.zones = []; this.postalCodes = [];
  }
  private loadDependents(): void {
    this.clearDependents();
    if (!this.draft?.ID_UBICACION) return;
    this.load('barrios', this.catalog.locations('Barrio', this.draft.ID_UBICACION), rows => this.neighborhoods = rows);
    this.load('códigos postales', this.catalog.postalCodes(this.draft.ID_UBICACION), rows => this.postalCodes = rows);
    if (this.draft.BARRIO) this.loadZones();
  }
  private loadZones(): void {
    this.requests.get('zonas')?.unsubscribe(); this.zones = [];
    if (this.draft?.ID_UBICACION && this.draft.BARRIO) {
      this.load('zonas', this.catalog.locations('Dependiente', this.draft.ID_UBICACION, this.draft.BARRIO), rows => this.zones = rows);
    }
  }
  changeCity(value: string | null): void {
    if (!this.draft || this.readOnly || (value || '') === (this.draft.ID_UBICACION || '')) return;
    Object.assign(this.draft, { ID_UBICACION: value || '', NOMBRE_UBICACION: this.cities.find(row => row.ID_UBICACION === value)?.NOMBRE || '', BARRIO: '', NOMBRE_BARRIO: '', DEPENDIENTE: '', CODIGO_POSTAL: '' });
    this.loadDependents(); this.pendingChange.emit();
  }
  changeNeighborhood(value: string | null): void {
    if (!this.draft || this.readOnly || (value || '') === (this.draft.BARRIO || '')) return;
    Object.assign(this.draft, { BARRIO: value || '', NOMBRE_BARRIO: this.neighborhoods.find(row => row.ID_UBICACION === value)?.NOMBRE || '', DEPENDIENTE: '' });
    this.loadZones(); this.pendingChange.emit();
  }
  select(keys: unknown[]): void {
    const selected = (keys as number[]).filter(key => this.direcciones.some(row => row.ID_DIRECCION === key));
    if (selected.length === this.selected.length && selected.every(key => this.selected.includes(key))) return;
    this.selected = selected; this.rebuild();
  }
  private rebuild(): void {
    // Keep the editor model separate: mutating a dataSource row makes DevExtreme
    // recreate its cell template and closes a multiple-selection popup mid-edit.
    this.rows = this.draft ? [{ ...this.draft, TIPO_DIRECCION: direccionTipos(this.draft.TIPO_DIRECCION) }, ...this.direcciones.filter(row => row.ID_DIRECCION !== this.draft!.ID_DIRECCION)] : [...this.direcciones];
    this.toolbar = this.readOnly ? [] : [
      { id: 'add-dir', icon: 'plus', title: 'Nueva dirección', variant: 'primary', disabled: !!this.draft, action: () => this.add() },
      { id: 'edit-dir', icon: 'edit', title: this.selected.length === 1 ? 'Editar dirección' : 'Seleccione una dirección para editar', variant: 'secondary', visible: !this.draft, disabled: this.selected.length !== 1, action: () => this.edit(this.direcciones.find(row => row.ID_DIRECCION === this.selected[0])!) },
      { id: 'save-dir', icon: 'check', title: 'Guardar dirección', variant: 'success', visible: !!this.draft, action: () => { this.commit(); } },
      { id: 'cancel-dir', icon: 'undo', title: 'Cancelar', variant: 'cancel', visible: !!this.draft, action: () => this.cancel() },
      { id: 'delete-dir', icon: 'trash', title: 'Eliminar direcciones', variant: 'danger', visible: !!this.selected.length && !this.draft, action: () => { void this.remove(); } }
    ];
  }
  add(): void {
    if (this.readOnly || this.draft) return;
    this.adding = true;
    this.draft = { ID_DIRECCION: Math.max(0, ...this.direcciones.map(row => row.ID_DIRECCION || 0)) + 1, TIPO_DIRECCION: [], DOMICILIO: '', ID_UBICACION: '', NOMBRE_UBICACION: '', BARRIO: '', DEPENDIENTE: '', REFERENCIA: '', CODIGO_POSTAL: '' };
    this.clearDependents(); this.rebuild(); this.grid?.resetView(); this.pendingChange.emit();
  }
  edit(row: XteinDireccion): void {
    if (this.readOnly || this.draft || !row) return;
    this.adding = false;
    this.draft = { ...row, TIPO_DIRECCION: direccionTipos(row.TIPO_DIRECCION) };
    this.loadDependents(); this.rebuild();
  }
  /** Called by the host before saving its record. Invalid drafts prevent that save. */
  commit(): boolean {
    if (!this.draft) return true;
    if (this.readOnly) return false;
    const types = direccionTipos(this.draft.TIPO_DIRECCION);
    const message = !types.length ? 'Seleccione el tipo de dirección.' : !this.draft.DOMICILIO?.trim() ? 'Ingrese la dirección o domicilio.' : !this.draft.ID_UBICACION ? 'Seleccione la ciudad o municipio.' : '';
    if (message) { this.notification.warning(message); return false; }
    const row = { ...this.draft, TIPO_DIRECCION: types, DOMICILIO: this.draft.DOMICILIO!.trim() };
    this.direcciones = this.adding ? [...this.direcciones, row] : this.direcciones.map(item => item.ID_DIRECCION === row.ID_DIRECCION ? row : item);
    this.draft = null; this.clearDependents(); this.rebuild(); this.direccionesChange.emit(this.direcciones);
    return true;
  }
  cancel(): void { this.draft = null; this.clearDependents(); this.rebuild(); }
  async remove(): Promise<void> {
    if (this.readOnly || this.draft || !this.selected.length) return;
    const selected = [...this.selected];
    const source = this.direcciones;
    const result = await Swal.fire({ title: '¿Eliminar direcciones?', text: '¿Desea eliminar las direcciones seleccionadas?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'No' });
    if (!result.isConfirmed || this.readOnly || this.draft || this.direcciones !== source) return;
    this.direcciones = this.direcciones.filter(row => !selected.includes(row.ID_DIRECCION!));
    this.selected = []; this.rebuild(); this.direccionesChange.emit(this.direcciones);
  }
  display(row: XteinDireccion, field: string): string {
    if (field === 'TIPO_DIRECCION') return direccionTipos(row.TIPO_DIRECCION).join(', ');
    if (field === 'ID_UBICACION') return [row.ID_UBICACION, row.NOMBRE_UBICACION].filter(Boolean).join('; ');
    return String(row[field as keyof XteinDireccion] ?? '');
  }
}
