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
  XteinGridToolbarComponent,
  XteinNumberComponent,
  XteinSelectComponent
} from '@xtein/ui';
import { Pro039ItemProductColumns } from '../../constants/pro-039-ui.constants';
import { Pro039Lookup } from '../../models/pro-039-business.model';
import { Pro039ConsumptionProduct, Pro039MovementItem, Pro039Presentation } from '../../models/pro-039.model';

/** Materiales de una línea del consumo: producto o componente del juego (o sin línea: consumos anteriores). */
export interface Pro039ItemsGroup {
  key: number;
  product: Pro039ConsumptionProduct | null;
  rows: Pro039MovementItem[];
}

/**
 * Materiales del consumo agrupados por producto: los de su matriz y los adicionales que se le agregan
 * a mano desde la lista de productos de la bodega de origen (cada material pertenece a un producto).
 */
@Component({
  selector: 'pro-039-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxDropDownBoxModule,
    DxTemplateModule,
    XteinDataGridComponent,
    XteinCheckboxComponent,
    XteinGridToolbarComponent,
    XteinNumberComponent,
    XteinSelectComponent
  ],
  templateUrl: './pro-039-items.component.html',
  styleUrl: './pro-039-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Pro039ItemsComponent implements OnChanges {
  @Input() items: Pro039MovementItem[] = [];
  /** Líneas del consumo (producto o componente de un juego): un grupo de materiales por cada una. */
  @Input() consumptionProducts: Pro039ConsumptionProduct[] = [];
  /** Materiales que se pueden agregar a mano (bodega de origen). */
  @Input() products: Pro039Lookup[] = [];
  @Input() productsLoading = false;
  @Input() recordKey = '';
  @Input() readOnly = true;
  /** Hay bodega de origen y destino: se pueden agregar materiales. */
  @Input() ready = false;
  @Input() busy = false;
  @Input() quantityFormat = '#,##0.00';
  /** Lote del encabezado: solo para los consumos anteriores, sin productos del consumo. */
  @Input() lot = 1;
  /** Especificación MODIFICAR UM PRES: permite cambiar la presentación aunque ya tenga una (como COM-203). */
  @Input() presentationEditable = false;

  @Output() quantityChanged = new EventEmitter<{ item: number; quantity: number }>();
  @Output() presentationChanged = new EventEmitter<{ item: number; presentation: Pro039Presentation | null }>();
  /** Material agregado a mano a una línea del consumo (ITEM de la línea). */
  @Output() productAdded = new EventEmitter<{ material: string; line: number }>();
  @Output() removedMany = new EventEmitter<number[]>();
  @Output() refreshProducts = new EventEmitter<void>();

  readonly selected = signal<number[]>([]);
  /** Línea del consumo a la que se le está agregando un material (fila nueva abierta en su grupo). */
  readonly adding = signal<number | null>(null);
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
      this.adding.set(null);
      this.productDropdownOpened = false;
    } else if (changes['items']) {
      const keys = new Set(this.items.map(item => item.ITEM));
      this.selected.update(selected => selected.filter(key => keys.has(key)));
    }
  }

  quantity(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.quantityFormat);
  }

  /**
   * Un grupo por producto del consumo, en su orden, con sus materiales. Los materiales sin producto
   * (consumos grabados antes de los varios productos) van en un grupo aparte al final.
   */
  groups(): Pro039ItemsGroup[] {
    const known = new Set(this.consumptionProducts.map(p => p.ITEM));
    const groups: Pro039ItemsGroup[] = this.consumptionProducts.map(product => ({
      key: product.ITEM,
      product,
      rows: this.items.filter(row => row.ITEM_PRODUCTO === product.ITEM)
    }));
    const orphans = this.items.filter(row => row.ITEM_PRODUCTO == null || !known.has(row.ITEM_PRODUCTO));
    if (orphans.length) groups.push({ key: 0, product: null, rows: orphans });
    return groups;
  }

  /** Título del grupo: producto y, si es un componente de un juego, el componente. */
  groupTitle(group: Pro039ItemsGroup): string {
    const p = group.product;
    if (!p) return 'Sin producto asignado';
    const product = p.PRODUCTO + (p.NOMBRE ? ' - ' + p.NOMBRE : '');
    if (!p.COMPONENTE) return p.ES_JUEGO ? `${product} · Todo el juego` : product;
    return `${product} › ${p.COMPONENTE}${p.NOMBRE_COMPONENTE ? ' - ' + p.NOMBRE_COMPONENTE : ''}`;
  }

  /** Cantidad de la línea a la que pertenece el material (el lote del encabezado en los consumos anteriores). */
  lotOf(row: Pro039MovementItem): number {
    const lot = Number(this.consumptionProducts.find(p => p.ITEM === row.ITEM_PRODUCTO)?.CANTIDAD_LOTE);
    return lot > 0 ? lot : this.lot;
  }

  /** Unidad de presentación (como "UM Pres." de COM-203). */
  presentation(row: Pro039MovementItem): string {
    return row.UDM_PRESENTACION || row.UDM_PRES || row.UDM || '';
  }

  /**
   * "UM Pres." se elige de la lista, como en la salida de COM-203: cuando el producto tiene varias presentaciones
   * y aún no tiene una, o siempre que la especificación MODIFICAR UM PRES lo permita.
   */
  canChoosePresentation(row: Pro039MovementItem): boolean {
    const options = row.PRESENTACIONES?.length ?? 0;
    return !this.readOnly && !this.busy && options > 0 && ((options > 1 && !row.UDM_PRES) || this.presentationEditable);
  }

  onPresentation(row: Pro039MovementItem, unit: string | null): void {
    if ((unit ?? '') === (row.UDM_PRES ?? '')) return;
    const presentation = row.PRESENTACIONES?.find(p => p.UDM_COMPRA === unit) ?? null;
    this.presentationChanged.emit({ item: row.ITEM, presentation });
  }

  /** Unidad equivalente y su factor (como "UM Equiv" de COM-203): "Ud ≡ 1". */
  equivalentUnit(row: Pro039MovementItem): string {
    return `${row.UDM_EQUIV || row.UDM || ''} ≡ ${formatNumber(Number(row.CANTIDAD_EQUIV || 0), '#,##0.####')}`;
  }

  /** Cantidad convertida que descuenta el kárdex (CANTIDAD_REAL): cantidad x presentación x equivalencia. */
  equivalentQuantity(row: Pro039MovementItem): number {
    return Number(row.CANTIDAD || 0) * Number(row.CANTIDAD_PRES ?? 1) * Number(row.CANTIDAD_EQUIV ?? 1);
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

  /**
   * Barra estándar de la grilla (xtein-grid-toolbar de @xtein/ui, convención de la migración Legacy - Xtein One).
   * Agregar material va en el + de cada producto o componente; aquí queda eliminar los seleccionados.
   */
  get toolbarActions(): XteinGridToolbarAction[] {
    const count = this.selected().length;
    return [
      {
        id: 'delete-item',
        icon: 'trash',
        text: count > 0 ? `${count} seleccionado(s)` : undefined,
        title: 'Eliminar materiales seleccionados',
        variant: 'danger',
        visible: count > 0 && this.adding() === null && !this.readOnly,
        disabled: this.busy,
        action: () => this.deleteSelected()
      }
    ];
  }

  deleteSelected(): void {
    if (this.selected().length === 0) return;
    this.removedMany.emit([...this.selected()]);
  }

  beginAdd(line: number): void {
    if (!this.canAdd || !line) return;
    this.selected.set([]);
    this.adding.set(line);
    // La lista se abre sola al aparecer la fila nueva
    setTimeout(() => this.productDropdownOpened = true);
  }

  cancelAdd(): void {
    this.productDropdownOpened = false;
    this.adding.set(null);
  }

  selectProductFromDropdown(data: Pro039Lookup): void {
    const material = String(data?.PRODUCTO ?? '');
    const line = this.adding();
    if (!material || !line || this.busy) return;
    this.cancelAdd();
    this.productAdded.emit({ material, line });
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
