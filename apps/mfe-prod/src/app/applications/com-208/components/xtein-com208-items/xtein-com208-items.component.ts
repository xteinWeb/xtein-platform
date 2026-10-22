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
  XteinCheckboxComponent,
  XteinDataGridComponent,
  XteinGridToolbarAction,
  XteinNumberComponent
} from '@xtein/ui';
import { Com208ItemProductColumns } from '../../constants/com-208-ui.constants';
import { Com208Lookup } from '../../models/com-208-business.model';
import { Com208MovementItem } from '../../models/com-208.model';

/**
 * Materiales del consumo: los de la matriz (no se eliminan; se dejan en 0 si no se usan)
 * y los adicionales agregados desde la lista de productos de la bodega de origen.
 */
@Component({
  selector: 'xtein-com208-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxDropDownBoxModule,
    DxTemplateModule,
    XteinDataGridComponent,
    XteinCheckboxComponent,
    XteinNumberComponent
  ],
  templateUrl: './xtein-com208-items.component.html',
  styleUrl: './xtein-com208-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCom208ItemsComponent implements OnChanges {
  @Input() items: Com208MovementItem[] = [];
  @Input() products: Com208Lookup[] = [];
  @Input() productsLoading = false;
  @Input() recordKey = '';
  @Input() readOnly = true;
  /** Hay bodega de origen y destino: se pueden agregar materiales. */
  @Input() ready = false;
  @Input() busy = false;
  @Input() moneyFormat = '#,##0.00';
  @Input() quantityFormat = '#,##0.00';

  @Output() quantityChanged = new EventEmitter<{ item: number; quantity: number }>();
  @Output() productAdded = new EventEmitter<string>();
  @Output() removedMany = new EventEmitter<number[]>();
  @Output() refreshProducts = new EventEmitter<void>();

  readonly selected = signal<number[]>([]);
  readonly productColumns = Com208ItemProductColumns;
  productDropdownOpened = false;

  readonly productDropDownOptions = {
    width: 'min(750px, 95vw)',
    height: 'min(420px, 70dvh)',
    hideOnParentScroll: true
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordKey'] || (changes['readOnly'] && this.readOnly)) {
      this.selected.set([]);
      this.productDropdownOpened = false;
    } else if (changes['items']) {
      const keys = new Set(this.items.filter(item => !item.ES_MATRIZ).map(item => item.ITEM));
      this.selected.update(selected => selected.filter(key => keys.has(key)));
    }
  }

  money(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.moneyFormat);
  }

  quantity(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.quantityFormat);
  }

  onQuantity(row: Com208MovementItem, value: number | null): void {
    const quantity = Number(value ?? 0);
    if (quantity < 0) return;
    if (quantity === Number(row.CANTIDAD)) return;
    this.quantityChanged.emit({ item: row.ITEM, quantity });
  }

  /** Solo los adicionales se pueden seleccionar para eliminar. */
  toggle(row: Com208MovementItem, checked: boolean): void {
    if (row.ES_MATRIZ) return;
    this.selected.update(list => checked ? [...new Set([...list, row.ITEM])] : list.filter(key => key !== row.ITEM));
  }

  deleteSelected(): void {
    if (this.selected().length === 0) return;
    this.removedMany.emit([...this.selected()]);
  }

  selectProductFromDropdown(data: Com208Lookup): void {
    const product = String(data?.PRODUCTO ?? '');
    if (!product || this.busy) return;
    this.productDropdownOpened = false;
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
}
