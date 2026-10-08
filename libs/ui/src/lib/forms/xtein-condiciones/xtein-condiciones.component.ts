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
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridColumn, XteinGridToolbarAction } from '../../data/xtein-data-grid/models/xtein-data-grid.model';
import { XteinInputComponent } from '../xtein-input/xtein-input.component';
import { XteinLookupComponent } from '../xtein-lookup/xtein-lookup.component';
import { XteinNotificationService } from '../../feedback/xtein-notification/xtein-notification.service';
import { XteinCondicionesCatalogService } from './xtein-condiciones-catalog.service';
import { XteinCondicion, XteinCondicionItem } from './xtein-condiciones.model';

@Component({
  selector: 'xtein-condiciones',
  standalone: true,
  imports: [FormsModule, XteinDataGridComponent, XteinInputComponent, XteinLookupComponent],
  templateUrl: './xtein-condiciones.component.html',
  styleUrl: './xtein-condiciones.component.scss'
})
export class XteinCondicionesComponent implements OnChanges, OnInit {
  @Input() readOnly = false;
  @Input() condiciones: XteinCondicion[] = [];
  @Input() availableCondiciones: XteinCondicionItem[] = [];
  @Input() tipo = 'VENTAS';
  @Input() columns: XteinGridColumn<XteinCondicion, unknown>[] = [
    { dataField: 'ID_CONDICION', caption: 'Condición', width: 140, cellTemplate: 'xteinGroup' },
    { dataField: 'NOMBRE_CONDICION', caption: 'Nombre condición', minWidth: 220, cellTemplate: 'xteinGroup' }
  ];

  @Output() readonly condicionesChange = new EventEmitter<XteinCondicion[]>();
  @Output() readonly pendingChange = new EventEmitter<void>();
  @ViewChild(XteinDataGridComponent) private grid?: XteinDataGridComponent;

  private readonly destroy = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private catalogRequest?: Subscription;

  readonly lookupColumns = [
    { dataField: 'ID_CONDICION', caption: 'Condición', width: 120 },
    { dataField: 'DESCRIPCION', caption: 'Descripción' }
  ];

  conditionsList: XteinCondicionItem[] = [];
  errors: string[] = [];
  rows: XteinCondicion[] = [];
  selected: number[] = [];
  draft: XteinCondicion | null = null;
  private adding = false;
  toolbar: XteinGridToolbarAction[] = [];

  constructor(
    private readonly catalog: XteinCondicionesCatalogService,
    private readonly notification: XteinNotificationService
  ) {
    this.destroy.onDestroy(() => this.catalogRequest?.unsubscribe());
  }

  ngOnInit(): void {
    this.reloadCatalogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableCondiciones'] && this.availableCondiciones.length > 0) {
      this.conditionsList = this.availableCondiciones;
    }
    if (changes['condiciones'] || (changes['readOnly'] && this.readOnly)) {
      this.draft = null;
      this.selected = [];
    }
    let max = Math.max(0, ...this.condiciones.map(row => row.ITEM || 0));
    this.condiciones = this.condiciones.map(row => ({
      ...row,
      ITEM: row.ITEM || ++max,
      NOMBRE_CONDICION: row.NOMBRE_CONDICION || row.DESCRIPCION || '',
      DESCRIPCION: row.DESCRIPCION || row.NOMBRE_CONDICION || ''
    }));
    this.rebuild();
  }

  reloadCatalogs(): void {
    if (this.availableCondiciones.length > 0) {
      this.conditionsList = this.availableCondiciones;
      this.cdr.markForCheck();
      return;
    }
    this.catalogRequest?.unsubscribe();
    this.errors = this.errors.filter(error => error !== 'condiciones');
    this.catalogRequest = this.catalog.conditions(this.tipo).subscribe({
      next: rows => {
        this.conditionsList = rows.filter(row => !!row.ID_CONDICION);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errors = [...this.errors, 'condiciones'];
        this.cdr.markForCheck();
      }
    });
  }

  select(keys: unknown[]): void {
    const selected = (keys as number[]).filter(key => this.condiciones.some(row => row.ITEM === key));
    if (selected.length === this.selected.length && selected.every(key => this.selected.includes(key))) {
      return;
    }
    this.selected = selected;
    this.rebuild();
  }

  private rebuild(): void {
    this.rows = this.draft
      ? [
          { ...this.draft },
          ...this.condiciones.filter(row => row.ITEM !== this.draft!.ITEM)
        ]
      : [...this.condiciones];

    this.toolbar = this.readOnly
      ? []
      : [
          {
            id: 'add-cond',
            icon: 'plus',
            title: 'Nueva condición',
            variant: 'primary',
            disabled: !!this.draft,
            action: () => this.add()
          },
          {
            id: 'edit-cond',
            icon: 'edit',
            title: this.selected.length === 1 ? 'Editar condición' : 'Seleccione una condición para editar',
            variant: 'secondary',
            visible: !this.draft,
            disabled: this.selected.length !== 1,
            action: () => this.edit(this.condiciones.find(row => row.ITEM === this.selected[0])!)
          },
          {
            id: 'save-cond',
            icon: 'check',
            title: 'Guardar condición',
            variant: 'success',
            visible: !!this.draft,
            action: () => {
              this.commit();
            }
          },
          {
            id: 'cancel-cond',
            icon: 'undo',
            title: 'Cancelar',
            variant: 'cancel',
            visible: !!this.draft,
            action: () => this.cancel()
          },
          {
            id: 'delete-cond',
            icon: 'trash',
            title: 'Eliminar condiciones',
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
    const max = Math.max(0, ...this.condiciones.map(row => row.ITEM || 0));
    this.draft = {
      ITEM: max + 1,
      ID_CONDICION: '',
      NOMBRE_CONDICION: '',
      DESCRIPCION: '',
      PLAZO: undefined,
      DIAS_ENTREGA: undefined
    };
    this.rebuild();
    this.grid?.resetView();
    this.pendingChange.emit();
  }

  edit(row: XteinCondicion): void {
    if (this.readOnly || this.draft || !row) return;
    this.adding = false;
    this.draft = {
      ...row,
      NOMBRE_CONDICION: row.NOMBRE_CONDICION || row.DESCRIPCION || '',
      DESCRIPCION: row.DESCRIPCION || row.NOMBRE_CONDICION || ''
    };
    this.rebuild();
  }

  onSelectCondition(value: string): void {
    if (!this.draft) return;
    this.draft.ID_CONDICION = value || '';
    const found = this.conditionsList.find(c => c.ID_CONDICION === value);
    if (found) {
      this.draft.NOMBRE_CONDICION = found.DESCRIPCION;
      this.draft.DESCRIPCION = found.DESCRIPCION;
      if (found.PLAZO !== undefined && this.draft.PLAZO === undefined) this.draft.PLAZO = Number(found.PLAZO);
      if (found.DIAS_ENTREGA !== undefined && this.draft.DIAS_ENTREGA === undefined) this.draft.DIAS_ENTREGA = Number(found.DIAS_ENTREGA);
    }
    this.pendingChange.emit();
  }

  commit(): boolean {
    if (!this.draft) return true;
    if (this.readOnly) return false;

    if (!this.draft.ID_CONDICION?.trim()) {
      this.notification.warning('Falta seleccionar la condición.');
      return false;
    }

    const duplicate = this.adding
      ? this.condiciones.some(c => c.ID_CONDICION === this.draft!.ID_CONDICION)
      : this.condiciones.some(c => c.ID_CONDICION === this.draft!.ID_CONDICION && c.ITEM !== this.draft!.ITEM);

    if (duplicate) {
      this.notification.warning('La condición seleccionada ya existe.');
      return false;
    }

    const row: XteinCondicion = {
      ...this.draft,
      ID_CONDICION: this.draft.ID_CONDICION.trim(),
      NOMBRE_CONDICION: (this.draft.NOMBRE_CONDICION || this.draft.DESCRIPCION || '').trim(),
      DESCRIPCION: (this.draft.DESCRIPCION || this.draft.NOMBRE_CONDICION || '').trim(),
      isEdit: true
    };

    this.condiciones = this.adding
      ? [...this.condiciones, row]
      : this.condiciones.map(item => (item.ITEM === row.ITEM ? row : item));

    this.draft = null;
    this.rebuild();
    this.condicionesChange.emit(this.condiciones);
    return true;
  }

  cancel(): void {
    this.draft = null;
    this.rebuild();
  }

  async remove(): Promise<void> {
    if (this.readOnly || this.draft || !this.selected.length) return;
    const selected = [...this.selected];
    const source = this.condiciones;
    const result = await Swal.fire({
      title: '¿Eliminar condiciones?',
      text:
        selected.length === 1
          ? '¿Desea eliminar la condición seleccionada?'
          : `¿Desea eliminar las ${selected.length} condiciones seleccionadas?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });
    if (!result.isConfirmed || this.readOnly || this.draft || this.condiciones !== source) return;
    this.condiciones = this.condiciones.filter(row => !selected.includes(row.ITEM!));
    this.selected = [];
    this.rebuild();
    this.condicionesChange.emit(this.condiciones);
  }

  display(row: XteinCondicion, field: string): string {
    if (field === 'NOMBRE_CONDICION' || field === 'DESCRIPCION') {
      return String(row.NOMBRE_CONDICION || row.DESCRIPCION || '');
    }
    return String(row[field as keyof XteinCondicion] ?? '');
  }
}
