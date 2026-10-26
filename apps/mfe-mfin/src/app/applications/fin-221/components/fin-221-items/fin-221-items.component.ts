import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  XteinButtonComponent,
  XteinCheckboxComponent,
  XteinNumberComponent,
  XteinSelectComponent,
  XteinNotificationService
} from '@xtein/ui';
import {
  Fin221ItemPlan,
  Fin221TasaOption,
  Fin221CondicionOption
} from '../../models/fin-221.model';
import {
  Fin221DefaultItem,
  Fin221SiNoOptions,
  Fin221TipoCiOptions
} from '../../constants/fin-221-ui.constants';
import { Fin221BusinessService } from '../../services/fin-221-business.service';

@Component({
  selector: 'fin-221-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinButtonComponent,
    XteinCheckboxComponent,
    XteinNumberComponent,
    XteinSelectComponent
  ],
  templateUrl: './fin-221-items.component.html',
  styleUrl: './fin-221-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Fin221ItemsComponent implements OnChanges {
  private readonly business = inject(Fin221BusinessService);
  private readonly notifications = inject(XteinNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly siNoOptions = Fin221SiNoOptions;
  readonly tipoCiOptions = Fin221TipoCiOptions;

  @Input() items: Fin221ItemPlan[] = [];
  @Input() tipoFrecuencia: 'Constante' | 'Variable' = 'Constante';
  @Input() numeroPagos = 1;
  @Input() readOnly = true;
  @Input() tasas: Fin221TasaOption[] = [];
  @Input() condiciones: Fin221CondicionOption[] = [];

  @Output() itemsChange = new EventEmitter<Fin221ItemPlan[]>();
  @Output() changed = new EventEmitter<void>();

  readonly selected = signal<number[]>([]);
  readonly draft = signal<Fin221ItemPlan | null>(null);
  readonly isNewRow = signal<boolean>(false);
  readonly editingItemIndex = signal<number | null>(null);
  readonly busy = signal<boolean>(false);

  // Available pagos list based on numeroPagos
  pagosList: { value: number; text: string }[] = [{ value: 1, text: '1' }];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['numeroPagos']) {
      this.updatePagosList();
    }
  }

  private updatePagosList(): void {
    const total = Math.max(1, Number(this.numeroPagos) || 1);
    const list: { value: number; text: string }[] = [];
    for (let i = 1; i <= total; i++) {
      list.push({ value: i, text: String(i) });
    }
    this.pagosList = list;
    this.cdr.markForCheck();
  }

  allItemsSelected(): boolean {
    return this.items.length > 0 && this.selected().length === this.items.length;
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selected.set(this.items.map(i => i.ITEM));
    } else {
      this.selected.set([]);
    }
  }

  toggleRow(itemIndex: number, checked: boolean): void {
    const current = this.selected();
    if (checked) {
      if (!current.includes(itemIndex)) {
        this.selected.set([...current, itemIndex]);
      }
    } else {
      this.selected.set(current.filter(id => id !== itemIndex));
    }
  }

  isRowSelected(itemIndex: number): boolean {
    return this.selected().includes(itemIndex);
  }

  beginAdd(): void {
    if (this.readOnly || this.draft()) return;

    const maxItem = this.items.reduce((max, cur) => Math.max(max, cur.ITEM || 0), 0);
    const newItem: Fin221ItemPlan = {
      ...(Fin221DefaultItem as Fin221ItemPlan),
      ITEM: maxItem + 1,
      PAGO: Math.min(maxItem + 1, this.numeroPagos || 1)
    };

    this.draft.set({ ...newItem });
    this.isNewRow.set(true);
    this.editingItemIndex.set(null);
    this.cdr.markForCheck();
  }

  beginEdit(item: Fin221ItemPlan, index: number): void {
    if (this.readOnly || this.draft()) return;

    this.draft.set({ ...item });
    this.isNewRow.set(false);
    this.editingItemIndex.set(index);
    this.cdr.markForCheck();
  }

  async onTasaChanged(idTasa: unknown): Promise<void> {
    const current = this.draft();
    if (!current) return;

    const tasaStr = String(idTasa ?? '');
    current.ID_TASA = tasaStr;
    const found = this.tasas.find(t => t.ID_TASA === tasaStr);
    if (found) {
      current.PORC_TASA = Number(found.PORCENTAJE) || 0;
    }

    if (tasaStr && tasaStr !== 'Manual') {
      this.busy.set(true);
      try {
        const factor = await this.business.calculateFactor(tasaStr, current.PAGO);
        current.FACTOR = factor;
      } finally {
        this.busy.set(false);
        this.cdr.markForCheck();
      }
    }
  }

  async onPagoChanged(pago: unknown): Promise<void> {
    const current = this.draft();
    if (!current) return;

    const pagoNum = Number(pago) || 1;
    current.PAGO = pagoNum;
    if (current.ID_TASA && current.ID_TASA !== 'Manual') {
      this.busy.set(true);
      try {
        const factor = await this.business.calculateFactor(current.ID_TASA, current.PAGO);
        current.FACTOR = factor;
      } finally {
        this.busy.set(false);
        this.cdr.markForCheck();
      }
    }
  }

  commit(): void {
    const current = this.draft();
    if (!current) return;

    if (this.isNewRow()) {
      const updated = [...this.items, { ...current }];
      this.itemsChange.emit(updated);
    } else {
      const index = this.editingItemIndex();
      if (index !== null && index >= 0 && index < this.items.length) {
        const updated = [...this.items];
        updated[index] = { ...current };
        this.itemsChange.emit(updated);
      }
    }

    this.draft.set(null);
    this.isNewRow.set(false);
    this.editingItemIndex.set(null);
    this.changed.emit();
    this.cdr.markForCheck();
  }

  cancel(): void {
    this.draft.set(null);
    this.isNewRow.set(false);
    this.editingItemIndex.set(null);
    this.cdr.markForCheck();
  }

  deleteSelected(): void {
    if (this.readOnly || this.selected().length === 0) return;

    Swal.fire({
      title: '¿Desea eliminar los ítems seleccionados?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        const toDelete = new Set(this.selected());
        const updated = this.items.filter(i => !toDelete.has(i.ITEM));
        this.itemsChange.emit(updated);
        this.selected.set([]);
        this.changed.emit();
        this.notifications.success('Ítems eliminados');
        this.cdr.markForCheck();
      }
    });
  }
}
