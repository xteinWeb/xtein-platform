import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridToolbarAction } from '../../data/xtein-data-grid/models/xtein-data-grid.model';
import { XteinInputComponent } from '../xtein-input/xtein-input.component';
import { XteinLookupComponent } from '../xtein-lookup/xtein-lookup.component';
import { XteinNotificationService } from '../../feedback/xtein-notification/xtein-notification.service';
import { XteinTelefonosCatalogService } from './xtein-telefonos-catalog.service';
import { XteinTelefono, XteinTelefonoTipo, telefonoTipos } from './xtein-telefonos.model';

@Component({
  selector: 'xtein-telefonos',
  standalone: true,
  imports: [FormsModule, XteinDataGridComponent, XteinInputComponent, XteinLookupComponent],
  templateUrl: './xtein-telefonos.component.html',
  styleUrl: './xtein-telefonos.component.scss'
})
export class XteinTelefonosComponent implements OnChanges, OnInit {
  @Input() readOnly = false;
  @Input() telefonos: XteinTelefono[] = [];
  @Output() readonly telefonosChange = new EventEmitter<XteinTelefono[]>();
  @Output() readonly pendingChange = new EventEmitter<void>();
  @ViewChild(XteinDataGridComponent) private grid?: XteinDataGridComponent;

  private readonly destroy = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private catalogRequest?: Subscription;

  readonly columns = [
    { dataField: 'ID_TELEFONO', caption: 'Id telefono', width: 80 },
    { dataField: 'TIPO_TELEFONO', caption: 'Tipo telefono', minWidth: 160, cellTemplate: 'xteinGroup' },
    { dataField: 'TELEFONO', caption: 'Teléfono', minWidth: 170, cellTemplate: 'xteinGroup' },
    { dataField: 'EXTENSION', caption: 'Extensión', minWidth: 120, cellTemplate: 'xteinGroup' }
  ];
  readonly typeColumns = [{ dataField: 'TIPO', caption: 'Tipo' }];

  types: XteinTelefonoTipo[] = [];
  errors: string[] = [];
  rows: XteinTelefono[] = [];
  selected: number[] = [];
  draft: XteinTelefono | null = null;
  private adding = false;
  toolbar: XteinGridToolbarAction[] = [];

  constructor(
    private readonly catalog: XteinTelefonosCatalogService,
    private readonly notification: XteinNotificationService
  ) {
    this.destroy.onDestroy(() => this.catalogRequest?.unsubscribe());
  }

  ngOnInit(): void {
    this.reloadCatalogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['telefonos'] || (changes['readOnly'] && this.readOnly)) {
      this.draft = null;
      this.selected = [];
    }
    let max = Math.max(0, ...this.telefonos.map(row => row.ID_TELEFONO || 0));
    this.telefonos = this.telefonos.map(row => ({
      ...row,
      ID_TELEFONO: row.ID_TELEFONO || ++max
    }));
    this.rebuild();
  }

  reloadCatalogs(): void {
    this.catalogRequest?.unsubscribe();
    this.errors = this.errors.filter(error => error !== 'tipos');
    this.catalogRequest = this.catalog.types().subscribe({
      next: rows => {
        this.types = rows.filter(row => !!row.TIPO);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errors = [...this.errors, 'tipos'];
        this.cdr.markForCheck();
      }
    });
  }

  select(keys: unknown[]): void {
    const selected = (keys as number[]).filter(key => this.telefonos.some(row => row.ID_TELEFONO === key));
    if (selected.length === this.selected.length && selected.every(key => this.selected.includes(key))) {
      return;
    }
    this.selected = selected;
    this.rebuild();
  }

  private rebuild(): void {
    this.rows = this.draft
      ? [
          { ...this.draft, TIPO_TELEFONO: telefonoTipos(this.draft.TIPO_TELEFONO) },
          ...this.telefonos.filter(row => row.ID_TELEFONO !== this.draft!.ID_TELEFONO)
        ]
      : [...this.telefonos];

    this.toolbar = this.readOnly
      ? []
      : [
          {
            id: 'add-tel',
            icon: 'plus',
            title: 'Nuevo teléfono',
            variant: 'primary',
            disabled: !!this.draft,
            action: () => this.add()
          },
          {
            id: 'edit-tel',
            icon: 'edit',
            title: this.selected.length === 1 ? 'Editar teléfono' : 'Seleccione un teléfono para editar',
            variant: 'secondary',
            visible: !this.draft,
            disabled: this.selected.length !== 1,
            action: () => this.edit(this.telefonos.find(row => row.ID_TELEFONO === this.selected[0])!)
          },
          {
            id: 'save-tel',
            icon: 'check',
            title: 'Guardar teléfono',
            variant: 'success',
            visible: !!this.draft,
            action: () => {
              this.commit();
            }
          },
          {
            id: 'cancel-tel',
            icon: 'undo',
            title: 'Cancelar',
            variant: 'cancel',
            visible: !!this.draft,
            action: () => this.cancel()
          },
          {
            id: 'delete-tel',
            icon: 'trash',
            title: 'Eliminar teléfonos',
            variant: 'danger',
            visible: !!this.selected.length && !this.draft,
            action: () => {
              void this.remove();
            }
          }
        ];
  }

  add(): void {
    if (this.readOnly || this.draft) return;
    this.adding = true;
    this.draft = {
      ID_TELEFONO: Math.max(0, ...this.telefonos.map(row => row.ID_TELEFONO || 0)) + 1,
      TIPO_TELEFONO: [],
      TELEFONO: '',
      EXTENSION: ''
    };
    this.rebuild();
    this.grid?.resetView();
    this.pendingChange.emit();
  }

  edit(row: XteinTelefono): void {
    if (this.readOnly || this.draft || !row) return;
    this.adding = false;
    this.draft = { ...row, TIPO_TELEFONO: telefonoTipos(row.TIPO_TELEFONO) };
    this.rebuild();
  }

  /**
   * Called by the host before saving its record. Invalid drafts prevent that save.
   */
  commit(): boolean {
    if (!this.draft) return true;
    if (this.readOnly) return false;

    const types = telefonoTipos(this.draft.TIPO_TELEFONO);
    const message = !types.length
      ? 'Falta seleccionar el tipo de teléfono.'
      : !this.draft.TELEFONO?.trim()
        ? 'Falta asignar un número de teléfono.'
        : '';

    if (message) {
      this.notification.warning(message);
      return false;
    }

    const row: XteinTelefono = {
      ...this.draft,
      TIPO_TELEFONO: types,
      TELEFONO: this.draft.TELEFONO!.trim(),
      EXTENSION: this.draft.EXTENSION?.trim() || '',
      isEdit: true
    };

    this.telefonos = this.adding
      ? [...this.telefonos, row]
      : this.telefonos.map(item => (item.ID_TELEFONO === row.ID_TELEFONO ? row : item));

    this.draft = null;
    this.rebuild();
    this.telefonosChange.emit(this.telefonos);
    return true;
  }

  cancel(): void {
    this.draft = null;
    this.rebuild();
  }

  async remove(): Promise<void> {
    if (this.readOnly || this.draft || !this.selected.length) return;
    const selected = [...this.selected];
    const source = this.telefonos;
    const result = await Swal.fire({
      title: '¿Eliminar teléfonos?',
      text: '¿Desea eliminar los teléfonos seleccionados?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });
    if (!result.isConfirmed || this.readOnly || this.draft || this.telefonos !== source) return;
    this.telefonos = this.telefonos.filter(row => !selected.includes(row.ID_TELEFONO!));
    this.selected = [];
    this.rebuild();
    this.telefonosChange.emit(this.telefonos);
  }

  display(row: XteinTelefono, field: string): string {
    if (field === 'TIPO_TELEFONO') return telefonoTipos(row.TIPO_TELEFONO).join(', ');
    return String(row[field as keyof XteinTelefono] ?? '');
  }
}
