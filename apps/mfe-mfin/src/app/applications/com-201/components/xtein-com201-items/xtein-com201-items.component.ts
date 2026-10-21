import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatNumber } from 'devextreme/localization';
import Swal from 'sweetalert2';
import {
  XteinButtonComponent,
  XteinDataGridComponent,
  XteinGridColumn,
  XteinGridRowEvent,
  XteinGridSelectionEvent,
  XteinGridToolbarAction,
  XteinInputComponent,
  XteinLabelComponent,
  XteinLookupComponent,
  XteinNotificationService,
  XteinNumberComponent,
  XteinSelectComponent
} from '@xtein/ui';
import {
  Com201EditRules,
  Com201Message,
  Com201MoneyFormat,
  Com201PageSizes,
  Com201ProductColumns,
  Com201ReadOnlyRule
} from '../../constants/com-201-ui.constants';
import { Com201ListaPrecios } from '../../models/com-201-record.model';
import { Com201Item } from '../../models/com-201-item.model';
import { Com201EditRule, Com201Lookup, Com201Producto } from '../../models/com-201-business.model';
import { Com201BusinessService } from '../../services/com-201-business.service';
import { Com201ItemsStore } from '../../services/com-201-items.store';
import { findDuplicate, itemIncomplete } from '../../utils/com-201-validation';

/**
 * Items of the price list: grid of the visible page, own paginator and search,
 * draft row editor and multiple deletion.
 */
@Component({
  selector: 'xtein-com201-items',
  standalone: true,
  imports: [
    FormsModule,
    XteinDataGridComponent,
    XteinButtonComponent,
    XteinInputComponent,
    XteinLabelComponent,
    XteinLookupComponent,
    XteinNumberComponent,
    XteinSelectComponent
  ],
  templateUrl: './xtein-com201-items.component.html',
  styleUrl: './xtein-com201-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinCom201ItemsComponent implements OnChanges {
  @Input({ required: true }) header!: Com201ListaPrecios;
  @Input() editable = false;
  @Input() busy = false;
  @Input() products: Com201Producto[] = [];

  @Output() pending = new EventEmitter<boolean>();
  @Output() changed = new EventEmitter<void>();

  readonly store = inject(Com201ItemsStore);
  private readonly business = inject(Com201BusinessService);
  private readonly notification = inject(XteinNotificationService);

  readonly draft = signal<Com201Item | null>(null);
  readonly working = signal(false);
  readonly attributes = signal<Com201Lookup[]>([]);
  readonly units = signal<Com201Lookup[]>([]);
  readonly pageSizes = Com201PageSizes.map(size => ({ text: String(size), value: size }));
  readonly productColumns = Com201ProductColumns;
  readonly selectedVisibleKeys = computed(() => this.store.visible().filter(row => this.store.selectedKeys().has(row.ITEM)).map(row => row.ITEM));
  searchText = '';
  private previous: Com201Item | null = null;
  private columnKey = '';
  private cachedColumns: XteinGridColumn<Com201Item, number>[] = [];

  constructor() {
    // Keep the search box aligned with the applied search (reset, navigation, materialize).
    effect(() => {
      this.searchText = this.store.search();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editable'] && !this.editable) this.closeEditor();
  }

  /** Rules by ACTUALIZACION; TIPO = COSTOS makes PRECIO_BASE the editable price (legacy COM201.component.ts:706-712). */
  get rule(): Com201EditRule {
    const rule = Com201EditRules[this.header?.ACTUALIZACION] ?? Com201ReadOnlyRule;
    return this.header?.TIPO === 'COSTOS' && rule.select ? { ...rule, precioBase: true, precio: false } : rule;
  }

  get byAttribute(): boolean {
    return this.header?.APLICACION_PRECIO === 'Atributo';
  }

  get costs(): boolean {
    return this.header?.TIPO === 'COSTOS';
  }

  /** Grid bar (add, delete) only in edition with Manual or Generada (legacy COM201.component.html:596). */
  get gridBarVisible(): boolean {
    return this.editable && this.rule.select;
  }

  get columns(): XteinGridColumn<Com201Item, number>[] {
    const key = JSON.stringify([this.costs, this.byAttribute]);
    if (key === this.columnKey) return this.cachedColumns;
    this.columnKey = key;
    const money = { dataType: 'number' as const, format: Com201MoneyFormat, alignment: 'right' as const, width: 130 };
    return (this.cachedColumns = [
      { dataField: 'PRODUCTO', caption: 'Producto', width: 140 },
      { dataField: 'NOMBRE', caption: 'Nombre' },
      { dataField: 'ATRIBUTO', caption: 'Atributo', width: 110, visible: this.byAttribute },
      { dataField: 'UDM_PRES', caption: this.costs ? 'UN Equi' : 'UM. Pres', width: 110 },
      { dataField: 'PRECIO_BASE', caption: 'Precio Base', ...money },
      { dataField: 'PRECIO', caption: 'Precio lista', ...money },
      { dataField: 'PRECIO_IVA', caption: 'Precio Iva', ...money }
    ]);
  }

  toolbarActions(): XteinGridToolbarAction[] {
    if (!this.gridBarVisible) return [];
    const locked = this.busy || this.working() || !!this.draft();
    return [
      { id: 'add', icon: 'plus', title: 'Agregar producto', variant: 'primary', visible: this.rule.add, disabled: locked, action: () => this.begin() },
      { id: 'delete', icon: 'trash', title: 'Eliminar seleccionados', variant: 'danger', visible: this.rule.remove,
        disabled: locked || this.store.selectedKeys().size === 0, action: () => void this.deleteSelected() }
    ];
  }

  money(value: unknown): string {
    return formatNumber(Number(value || 0), Com201MoneyFormat);
  }

  onSelection(event: XteinGridSelectionEvent<Com201Item, number>): void {
    if (!this.gridBarVisible) return;
    this.store.select(event.currentSelectedRowKeys ?? [], event.currentDeselectedRowKeys ?? []);
  }

  onRowClick(event: XteinGridRowEvent<Com201Item, number>): void {
    const target = event.event?.target as HTMLElement | undefined;
    if (event.rowType !== 'data' || target?.closest('.dx-command-select')) return;
    const rule = this.rule;
    if (this.editable && (rule.product || rule.precioBase || rule.precio)) this.begin(event.data);
  }

  begin(row?: Com201Item): void {
    if (!this.editable || this.busy || this.working() || this.draft()) return;
    if (!row && !this.rule.add) return;
    this.previous = row ? { ...row } : null;
    this.attributes.set([]);
    this.units.set([]);
    this.draft.set(row ? { ...row } : this.store.addNew());
    this.pending.emit(true);
    if (row && this.rule.product && row.PRODUCTO) void this.loadOptions(row.PRODUCTO, false);
  }

  cancel(): void {
    if (this.working()) return;
    this.closeEditor();
    this.pending.emit(false);
  }

  /** Closes the editor without emitting (used when the parent leaves the edition). */
  closeEditor(): void {
    this.draft.set(null);
    this.previous = null;
  }

  /** Product chosen in the draft: NOMBRE / ID_GRUPO from memory, then attributes and units (legacy COM201.component.ts:746-757). */
  async product(value: unknown): Promise<void> {
    const row = this.draft();
    const code = String(value ?? '');
    if (!row || !code || code === row.PRODUCTO) return;
    const product = this.products.find(item => item.PRODUCTO === code);
    this.draft.set({ ...row, PRODUCTO: code, NOMBRE: product?.NOMBRE ?? '', ID_GRUPO: product?.ID_GRUPO ?? row.ID_GRUPO, UDM_PRES: '' });
    await this.loadOptions(code, true);
  }

  attribute(value: unknown): void {
    const row = this.draft();
    if (row) this.draft.set({ ...row, ATRIBUTO: String(value ?? '') });
  }

  unit(value: unknown): void {
    const row = this.draft();
    if (row) this.draft.set({ ...row, UDM_PRES: String(value ?? '') });
  }

  /** `calcular precio` when the value is confirmed (legacy setCellPrecioBase / setCellPrecio). */
  async price(field: 'PRECIO_BASE' | 'PRECIO', value: number | null): Promise<void> {
    const row = this.draft();
    const amount = Number(value ?? 0);
    // The editor also reports values written by the component itself; only a new value is recalculated.
    if (!row || amount === Number(row[field] ?? 0)) return;
    const typed = { ...row, [field]: amount };
    this.draft.set(typed);
    this.working.set(true);
    try {
      const result = await this.business.calculatePrice(this.header, field, amount, typed);
      if (this.draft()?.ITEM !== typed.ITEM) return;
      this.draft.set(field === 'PRECIO_BASE'
        ? { ...typed, PRECIO: Number(result.PRECIO ?? typed.PRECIO), PRECIO_IVA: Number(result.PRECIO_IVA ?? typed.PRECIO_IVA) }
        : { ...typed, PRECIO_BASE: Number(result.PRECIO_BASE ?? typed.PRECIO_BASE), PRECIO_IVA: Number(result.PRECIO_IVA ?? typed.PRECIO_IVA) });
    } catch (error) {
      this.notification.error(this.business.errorMessage(error));
    } finally {
      this.working.set(false);
    }
  }

  /** Applies the draft to the complete list (completeness, bug 1 and bug 4). */
  commit(): void {
    const row = this.draft();
    if (!row || this.working() || this.busy) return;
    if (itemIncomplete(row)) {
      this.notification.warning(Com201Message.itemIncomplete);
      return;
    }
    const previous = this.previous;
    const keyChanged = !previous || previous.PRODUCTO !== row.PRODUCTO || previous.UDM_PRES !== row.UDM_PRES
      || (this.byAttribute && previous.ATRIBUTO !== row.ATRIBUTO);
    if (keyChanged && findDuplicate(this.store.full() ?? [], row, this.byAttribute)) {
      this.notification.warning(Com201Message.itemRepeated);
      return;
    }
    this.store.upsert(row, keyChanged);
    this.closeEditor();
    this.pending.emit(false);
    this.changed.emit();
    if (!previous) void this.run(this.store.setPage(this.store.pageCount() - 1));
  }

  async deleteSelected(): Promise<void> {
    const keys = this.store.selectedKeys();
    if (!keys.size || this.draft() || this.busy) return;
    const answer = await Swal.fire({
      text: Com201Message.deleteItemsConfirm(keys.size),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    });
    if (!answer.isConfirmed) return;
    this.store.remove(keys);
    this.changed.emit();
  }

  applySearch(): void {
    if (this.draft()) return;
    void this.run(this.store.setSearch(this.searchText ?? ''));
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySearch();
  }

  goTo(index: number): void {
    if (this.draft() || index === this.store.pageIndex()) return;
    void this.run(this.store.setPage(index));
  }

  changePageSize(value: unknown): void {
    const size = Number(value);
    if (!size || size === this.store.pageSize()) return;
    void this.run(this.store.setPageSize(size));
  }

  unitValueExpr(): string {
    return this.costs ? 'UDM_EQUIV' : 'UDM_PRES';
  }

  private async loadOptions(code: string, assign: boolean): Promise<void> {
    this.working.set(true);
    try {
      const [attributes, units] = await Promise.all([
        this.business.catalog('attributes', { PRODUCTO: code }),
        this.business.catalog('units', { PRODUCTO: code })
      ]);
      const row = this.draft();
      if (!row || row.PRODUCTO !== code) return;
      const unitRows = this.costs ? units.slice(0, 1) : units;
      this.attributes.set(attributes);
      this.units.set(unitRows);
      if (!assign) return;
      const patch: Partial<Com201Item> = {};
      if (attributes.length === 1) patch.ATRIBUTO = String(attributes[0].VALOR ?? '');
      if (this.costs && unitRows[0]) patch.UDM_PRES = String(unitRows[0].UDM_EQUIV ?? '');
      else if (unitRows.length === 1) patch.UDM_PRES = String(unitRows[0].UDM_PRES ?? '');
      this.draft.set({ ...row, ...patch });
    } catch (error) {
      this.notification.error(this.business.errorMessage(error));
    } finally {
      this.working.set(false);
    }
  }

  private async run(task: Promise<void>): Promise<void> {
    try {
      await task;
    } catch (error) {
      this.notification.error(this.business.errorMessage(error));
    }
  }
}
