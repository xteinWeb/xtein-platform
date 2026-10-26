import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';
import { formatNumber } from 'devextreme/localization';
import {
  XteinGridToolbarComponent,
  XteinCheckboxComponent,
  XteinDataGridComponent,
  XteinGridToolbarAction,
  XteinNumberComponent
} from '@xtein/ui';
import { Pro039ItemProductColumns } from '../../constants/pro-039-ui.constants';
import { Pro039Lookup } from '../../models/pro-039-business.model';
import { Pro039MovementItem } from '../../models/pro-039.model';

/**
 * Materiales del consumo: los de la matriz
 * y los adicionales agregados desde la lista de productos de la bodega de origen.
 */
@Component({
  selector: 'pro-039-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxDropDownBoxModule,
    DxTemplateModule,
    XteinGridToolbarComponent,
    XteinDataGridComponent,
    XteinCheckboxComponent,
    XteinNumberComponent
  ],
  templateUrl: './pro-039-items.component.html',
  styleUrl: './pro-039-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Pro039ItemsComponent implements OnChanges {
  @Input() items: Pro039MovementItem[] = [];
  @Input() products: Pro039Lookup[] = [];
  @Input() productsLoading = false;
  @Input() recordKey = '';
  @Input() readOnly = true;
  /** Hay bodega de origen y destino: se pueden agregar materiales. */
  @Input() ready = false;
  @Input() busy = false;
  @Input() quantityFormat = '#,##0.00';
  /** Cantidad del lote del consumo: Total = consumo unitario de la matriz x lote. */
  @Input() lot = 1;

  @Output() quantityChanged = new EventEmitter<{ item: number; quantity: number }>();
  @Output() productAdded = new EventEmitter<string>();
  @Output() removedMany = new EventEmitter<number[]>();
  @Output() refreshProducts = new EventEmitter<void>();

  readonly selected = signal<number[]>([]);
  /** Fila nueva abierta en la grilla para elegir el material. */
  readonly adding = signal(false);
  readonly productColumns = Pro039ItemProductColumns;
  productDropdownOpened = false;

  readonly productDropDownOptions = {
    width: 'min(750px, 95vw)',
    height: 'min(420px, 70dvh)',
    hideOnParentScroll: true
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordKey'] || (changes['readOnly'] && this.readOnly)) {
      this.selected.set([]);
      this.adding.set(false);
      this.productDropdownOpened = false;
    } else if (changes['items']) {
      const keys = new Set(this.items.map(item => item.ITEM));
      this.selected.update(selected => selected.filter(key => keys.has(key)));
    }
  }

  quantity(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.quantityFormat);
  }

  onQuantity(row: Pro039MovementItem, value: number | null): void {
    const quantity = Number(value ?? 0);
    if (quantity < 0) return;
    if (quantity === Number(row.CANTIDAD)) return;
    this.quantityChanged.emit({ item: row.ITEM, quantity });
  }

  /** Se puede seleccionar cualquier material (de la matriz o adicional) para eliminarlo. */
  toggle(row: Pro039MovementItem, checked: boolean): void {
    this.selected.update(list => checked ? [...new Set([...list, row.ITEM])] : list.filter(key => key !== row.ITEM));
  }

  deleteSelected(): void {
    if (this.selected().length === 0) return;
    this.removedMany.emit([...this.selected()]);
  }

  beginAdd(): void {
    if (!this.canAdd) return;
    this.selected.set([]);
    this.adding.set(true);
    // La lista se abre sola al aparecer la fila nueva
    setTimeout(() => this.productDropdownOpened = true);
  }

  cancelAdd(): void {
    this.productDropdownOpened = false;
    this.adding.set(false);
  }

  selectProductFromDropdown(data: Pro039Lookup): void {
    const product = String(data?.PRODUCTO ?? '');
    if (!product || this.busy) return;
    this.cancelAdd();
    this.productAdded.emit(product);
  }

  productToolbarActions(): XteinGridToolbarAction[] {
    return [
      {
        id: 'refresh',
        icon: 'refresh',
        title: 'Refrescar productos',
        variant: 'secondary',
        disabled: this.productsLoading,
        action: () => this.refreshProducts.emit()
      }
    ];
  }

  get canAdd(): boolean {
    return !this.readOnly && this.ready && !this.busy;
  }
  get toolbarActions(): XteinGridToolbarAction[] {
    const isAdding = this.adding();
    const selCount = this.selected().length;
    return [
      {
        id: 'new-item',
        icon: 'plus',
        title: 'Agregar material',
        variant: 'primary',
        disabled: !this.canAdd || isAdding,
        action: () => this.beginAdd()
      },
      {
        id: 'cancel-item',
        icon: 'undo',
        title: 'Cancelar',
        variant: 'cancel',
        visible: isAdding,
        disabled: this.busy,
        action: () => this.cancelAdd()
      },
      {
        id: 'delete-item',
        icon: 'trash',
        title: 'Eliminar seleccionados',
        variant: 'danger',
        visible: selCount > 0 && !isAdding && !this.readOnly,
        disabled: this.busy,
        action: () => this.deleteSelected()
      }
    ];
  }
}
