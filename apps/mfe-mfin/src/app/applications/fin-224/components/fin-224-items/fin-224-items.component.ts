import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  XteinGridToolbarComponent,
  XteinGridToolbarAction,
  XteinCheckboxComponent,
  XteinInputComponent,
  XteinSelectComponent,
  XteinNotificationService
} from '@xtein/ui';
import {
  Fin224ItemCondicion,
  Fin224ListaPrecioOption
} from '../../models/fin-224.model';
import { Fin224DefaultItem } from '../../constants/fin-224-ui.constants';

@Component({
  selector: 'fin-224-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinGridToolbarComponent,
    XteinCheckboxComponent,
    XteinInputComponent,
    XteinSelectComponent
  ],
  templateUrl: './fin-224-items.component.html',
  styleUrl: './fin-224-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Fin224ItemsComponent {
  private readonly notifications = inject(XteinNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() items: Fin224ItemCondicion[] = [];
  @Input() listasPrecios: Fin224ListaPrecioOption[] = [];
  @Input() readOnly = true;

  @Output() itemsChange = new EventEmitter<Fin224ItemCondicion[]>();
  @Output() changed = new EventEmitter<void>();

  readonly selected = signal<string[]>([]);
  readonly draft = signal<Fin224ItemCondicion | null>(null);
  readonly isNewRow = signal<boolean>(false);
  readonly editingIndex = signal<number | null>(null);
  readonly busy = signal<boolean>(false);

  readonly listaDropDownOptions = {
    width: 480,
    minWidth: 420
  };

  handleKeydownEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.commit();
  }

  allItemsSelected(): boolean {
    return this.items.length > 0 && this.selected().length === this.items.length;
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selected.set(this.items.map(i => i.ID_LISTA));
    } else {
      this.selected.set([]);
    }
  }

  toggleRow(idLista: string, checked: boolean): void {
    const current = this.selected();
    if (checked) {
      if (!current.includes(idLista)) {
        this.selected.set([...current, idLista]);
      }
    } else {
      this.selected.set(current.filter(id => id !== idLista));
    }
  }

  isRowSelected(idLista: string): boolean {
    return this.selected().includes(idLista);
  }

  beginAdd(): void {
    if (this.readOnly || this.draft()) return;

    const newItem: Fin224ItemCondicion = {
      ...(Fin224DefaultItem as Fin224ItemCondicion)
    };

    this.draft.set({ ...newItem });
    this.isNewRow.set(true);
    this.editingIndex.set(null);
    this.cdr.markForCheck();
  }

  beginEdit(item: Fin224ItemCondicion, index: number): void {
    if (this.readOnly || this.draft()) return;

    this.draft.set({ ...item });
    this.isNewRow.set(false);
    this.editingIndex.set(index);
    this.cdr.markForCheck();
  }

  onListaChanged(idLista: unknown): void {
    const current = this.draft();
    if (!current) return;

    const idStr = String(idLista ?? '');
    current.ID_LISTA = idStr;
    const found = this.listasPrecios.find(l => l.ID_LISTA === idStr);
    if (found) {
      current.DESCRIPCION = found.DESCRIPCION;
    }
    this.cdr.markForCheck();
  }

  commit(): void {
    const current = this.draft();
    if (!current || !current.ID_LISTA) {
      this.notifications.warning('Debe seleccionar una lista de precios.');
      return;
    }

    // Verify duplicate list in items
    const isNew = this.isNewRow();
    const editIdx = this.editingIndex();
    const alreadyExists = this.items.some((item, idx) =>
      item.ID_LISTA === current.ID_LISTA && (!isNew ? idx !== editIdx : true)
    );

    if (alreadyExists) {
      this.notifications.warning(`La lista "${current.ID_LISTA}" ya está agregada a esta condición.`);
      return;
    }

    if (isNew) {
      const updated = [...this.items, { ...current }];
      this.itemsChange.emit(updated);
    } else if (editIdx !== null && editIdx >= 0 && editIdx < this.items.length) {
      const updated = [...this.items];
      updated[editIdx] = { ...current };
      this.itemsChange.emit(updated);
    }

    this.draft.set(null);
    this.isNewRow.set(false);
    this.editingIndex.set(null);
    this.changed.emit();
    this.cdr.markForCheck();
  }

  cancel(): void {
    this.draft.set(null);
    this.isNewRow.set(false);
    this.editingIndex.set(null);
    this.cdr.markForCheck();
  }

  deleteSelected(): void {
    if (this.readOnly || this.selected().length === 0) return;

    Swal.fire({
      title: '¿Desea eliminar las listas seleccionadas?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        const toDelete = new Set(this.selected());
        const updated = this.items.filter(i => !toDelete.has(i.ID_LISTA));
        this.itemsChange.emit(updated);
        this.selected.set([]);
        this.changed.emit();
        this.notifications.success('Listas eliminadas');
        this.cdr.markForCheck();
      }
    });
  }

  editSelected(): void {
    if (this.readOnly || this.busy() || this.draft() || this.selected().length !== 1) return;
    const selectedId = this.selected()[0];
    const index = this.items.findIndex(i => i.ID_LISTA === selectedId);
    if (index >= 0) {
      this.beginEdit(this.items[index], index);
    }
  }

  get toolbarActions(): XteinGridToolbarAction[] {
    const isDraft = !!this.draft();
    const selCount = this.selected().length;
    return [
      {
        id: 'new-item',
        icon: 'plus',
        title: 'Agregar lista',
        variant: 'primary',
        disabled: this.readOnly || this.busy() || isDraft,
        action: () => this.beginAdd()
      },
      {
        id: 'edit-item',
        icon: 'edit',
        title: selCount === 1 ? 'Editar lista' : 'Seleccione una lista para editar',
        variant: 'secondary',
        visible: !isDraft,
        disabled: this.readOnly || this.busy() || selCount !== 1,
        action: () => this.editSelected()
      },
      {
        id: 'save-item',
        icon: 'check',
        title: 'Confirmar',
        variant: 'success',
        visible: isDraft,
        disabled: this.busy(),
        action: () => this.commit()
      },
      {
        id: 'cancel-item',
        icon: 'undo',
        title: 'Cancelar',
        variant: 'cancel',
        visible: isDraft,
        disabled: this.busy(),
        action: () => this.cancel()
      },
      {
        id: 'delete-item',
        icon: 'trash',
        title: 'Eliminar seleccionadas',
        variant: 'danger',
        visible: selCount > 0 && !isDraft && !this.readOnly,
        disabled: this.busy(),
        action: () => this.deleteSelected()
      }
    ];
  }
}
