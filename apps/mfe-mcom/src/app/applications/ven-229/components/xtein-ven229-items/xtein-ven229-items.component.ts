import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxDropDownBoxModule, DxTemplateModule, DxSelectBoxModule, DxPopupModule } from 'devextreme-angular';
import { formatNumber } from 'devextreme/localization';
import {
  XteinDataGridComponent,
  XteinCheckboxComponent,
  XteinGridColumn,
  XteinGridToolbarAction,
  XteinSelectComponent,
  XteinNumberComponent,
  XteinDateComponent,
  XteinNotificationService
} from '@xtein/ui';
import { Ven229PedidoItem, Ven229PresentacionItem, Ven229IvaItem } from '../../models/ven-229.model';
import { Ven229Header, Ven229Lookup } from '../../models/ven-229-business.model';
import { Ven229BusinessService } from '../../services/ven-229-business.service';

@Component({
  selector: 'xtein-ven229-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxDropDownBoxModule,
    DxTemplateModule,
    DxSelectBoxModule,
    DxPopupModule,
    XteinDataGridComponent,
    XteinCheckboxComponent,
    XteinNumberComponent,
    XteinDateComponent
  ],
  templateUrl: './xtein-ven229-items.component.html',
  styleUrl: './xtein-ven229-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinVen229ItemsComponent implements OnChanges {
  @Input() items: Ven229PedidoItem[] = [];
  @Input() recordKey = '';
  @Input() onlyStock = false;
  @Input() productsLoading = false;
  @Input() products: Ven229Lookup[] = [];
  @Input() header: Ven229Header = {};
  @Input() readOnly = true;
  @Input() ready = false;
  @Input() busy = false;
  @Input() conditionType = '';
  @Input() repeatItem = false;
  @Input() editPrice = false;
  @Input({ required: true }) persist!: (row: Ven229PedidoItem) => Promise<boolean>;
  @Input() moneyFormat = '#,##0.00';
  @Input() quantityFormat = '#,##0.00';

  @Output() removed = new EventEmitter<number>();
  @Output() removedMany = new EventEmitter<number[]>();
  @Output() pending = new EventEmitter<boolean>();
  @Output() refreshProducts = new EventEmitter<void>();
  @Output() stockOnly = new EventEmitter<boolean>();

  readonly selected = signal<number[]>([]);
  readonly draft = signal<Ven229PedidoItem | null>(null);
  readonly working = signal(false);
  readonly productsVisible = signal(false);
  readonly taxModalVisible = signal(false);
  readonly taxList = signal<Ven229IvaItem[]>([]);
  productDropdownOpened = false;

  readonly productDropDownOptions = {
    width: 'min(750px, 95vw)',
    height: 'min(420px, 70dvh)',
    hideOnParentScroll: true
  };

  private productColumnKey = '';
  private cachedProductColumns: XteinGridColumn<Ven229Lookup>[] = [];
  get productColumns(): XteinGridColumn<Ven229Lookup>[] {
    const key = JSON.stringify([this.moneyFormat, this.quantityFormat, this.onlyStock]);
    if (key === this.productColumnKey) return this.cachedProductColumns;
    this.productColumnKey = key;
    return this.cachedProductColumns = [
      { dataField: 'PRODUCTO', caption: 'Producto', width: 130 },
      { dataField: 'NOMBRE', caption: 'Nombre' },
      { dataField: 'PRECIO', caption: 'Precio', dataType: 'number', format: this.moneyFormat, alignment: 'right', width: 140 },
      { dataField: 'CAN_INV', caption: 'Inventario', dataType: 'number', format: this.quantityFormat, visible: this.onlyStock, alignment: 'right', width: 120 }
    ];
  }

  private readonly business = inject(Ven229BusinessService);
  private readonly notification = inject(XteinNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  get minimumDeliveryDate(): string {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordKey'] || (changes['readOnly'] && this.readOnly)) {
      this.selected.set([]);
      this.draft.set(null);
      this.productDropdownOpened = false;
    } else if (changes['items']) {
      const keys = new Set(this.items.map(item => item.ITEM));
      this.selected.update(selected => selected.filter(key => keys.has(key)));
    }
    this.cdr.markForCheck();
  }

  money(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.moneyFormat);
  }

  quantity(value: number | string | null | undefined): string {
    return formatNumber(Number(value || 0), this.quantityFormat);
  }

  toggle(item: number, checked: boolean): void {
    this.selected.update(rows => (checked ? [...rows, item] : rows.filter(id => id !== item)));
  }

  allItemsSelected(): boolean {
    return this.items.length > 0 && this.items.every(item => this.selected().includes(item.ITEM));
  }

  toggleAll(checked: boolean): void {
    this.selected.set(checked ? this.items.map(i => i.ITEM) : []);
  }

  deleteSelected(): void {
    if (this.selected().length) {
      this.removedMany.emit(this.selected());
    }
  }

  onDraftQtyChange(): void {
    const row = this.draft();
    if (!row) return;
    row.SUB_TOTAL = Number(row.CANTIDAD || 0) * Number(row.VALOR_UNITARIO || 0);
    const rate = Number(row.PORC_IVA ?? (Number(row.POR_IVA || 0) / 100));
    const effectiveRate = rate > 1 ? rate / 100 : rate;
    row.VALOR_IVA = row.SUB_TOTAL * effectiveRate;
    row.TOTAL = row.SUB_TOTAL + row.VALOR_IVA;
  }

  begin(row?: Ven229PedidoItem): void {
    if (this.readOnly || this.busy || this.working() || this.draft()) return;
    if (!row && !this.ready) return;

    this.draft.set(
      row
        ? structuredClone(row)
        : {
            ITEM: Math.max(0, ...this.items.map(i => i.ITEM)) + 1,
            ID_UN: '',
            ID_UN_ITEM: '',
            ID_DOCUMENTO: '',
            PREFIJO: '',
            CONSECUTIVO: 0,
            SUFIJO: '',
            ID_SOPORTE: '',
            NC_PREFIJO: '',
            NC_CONSECUTIVO: 0,
            NC_SUFIJO: '',
            CANTIDAD_AUTORIZADA: 0,
            CANTIDAD_PENDIENTE: 0,
            VALOR_COSTOS: 0,
            UDM_VENTA: '',
            FECHA_ENTREGA: this.minimumDeliveryDate,
            PRODUCTO: '',
            ATRIBUTO: 'SIN',
            CANTIDAD: 0,
            VALOR_UNITARIO: 0,
            VALOR_BASE: 0,
            SUB_TOTAL: 0,
            VALOR_DESCUENTO: 0,
            VALOR_IVA: 0,
            POR_IVA: 0,
            TOTAL: 0,
            ESTADO: 'REGISTRADO'
          }
    );
    this.pending.emit(true);
    if (!this.products.length && !this.productsLoading) {
      this.refreshProducts.emit();
    }
    if (row && !row.PRESENTACION?.length) {
      void this.loadExistingOptions(row);
    }
    this.cdr.markForCheck();
  }

  onProductDropDownOpened(): void {
    if (!this.products.length && !this.productsLoading) {
      this.refreshProducts.emit();
    }
  }

  cancel(): void {
    if (this.working()) return;
    this.draft.set(null);
    this.pending.emit(false);
  }

  async product(value: unknown): Promise<void> {
    const draft = this.draft();
    if (!draft || this.working()) return;
    const code = String(value ?? '').trim().toUpperCase();

    if (!this.repeatItem && this.items.some(i => i.ITEM !== draft.ITEM && i.PRODUCTO === code)) {
      this.notification.warning('Ya está registrado este producto.');
      draft.PRODUCTO = '';
      return;
    }

    this.working.set(true);
    try {
      const rows = await this.business.action<Ven229Lookup>('stock', {
        PRODUCTO: code,
        PRESENTACION: 'SI',
        MOVIMIENTO: 'Pedido',
        TIPO: 'Pedido',
        TIPO_CONDICION: this.conditionType,
        ID_CONDICION: this.header.ID_CONDICION,
        PLAZO: this.header.PLAZO,
        ID_CLIENTE: this.header.ID_CLIENTE,
        ID_UN_BODEGA: this.header.ID_UN_BODEGA
      });

      const p = rows[0];
      if (!p) throw new Error('No se encontraron existencias del producto.');

      Object.assign(draft, {
        PRODUCTO: code,
        NOMBRE_PRODUCTO: p.NOMBRE,
        REFERENCIA: p.REFERENCIA,
        VALOR_UNITARIO: Number(p.PRECIO ?? 0),
        VALOR_BASE: Number(p.VALOR_BASE ?? 0),
        PRESENTACION: (p.PRESENTACION as unknown as Ven229PresentacionItem[]) ?? [],
        IVAS: (p.IVAS as unknown as Ven229IvaItem[]) ?? [],
        GRAV_ORG: undefined,
        GRAVAMENES: undefined,
        PORC_IVA: 0,
        POR_IVA: 0,
        VALOR_IVA: 0,
        UDM_VENTA: '',
        UDM_EQUIV: '',
        CANTIDAD_PRES: 0,
        CANTIDAD_EQUIV: 0
      });

      const unit = p.PRESENTACION?.[0];
      if (unit) {
        draft.UDM_VENTA = String(unit.UDM_VENTA || '');
        draft.UDM_EQUIV = String(unit.UDM_EQUIV || '');
        draft.CANTIDAD_PRES = Number(unit.CANTIDAD_PRES || 0);
        draft.CANTIDAD_EQUIV = Number(unit.CANTIDAD_EQUIV || 0);
        draft.VALOR_UNITARIO = Number(unit.PRECIO ?? draft.VALOR_UNITARIO);
      }

      const ivas = (p.IVAS as unknown as Ven229IvaItem[]) ?? [];
      draft.IVAS = ivas;

      if (ivas.length > 1) {
        this.taxList.set(ivas);
        const defaultIva = ivas.find(t => t.ID_TASA === 'IV-GEN') || ivas[0];
        this.tax(defaultIva);
        this.taxModalVisible.set(true);
      } else if (ivas.length === 1) {
        this.tax(ivas[0]);
      } else {
        draft.GRAVAMENES = undefined;
        draft.GRAV_ORG = undefined;
        draft.POR_IVA = 0;
        draft.PORC_IVA = 0;
        draft.VALOR_IVA = 0;
        this.onDraftQtyChange();
      }

      if (!draft.FECHA_ENTREGA) {
        draft.FECHA_ENTREGA = this.minimumDeliveryDate;
      }
      this.draft.set({ ...draft });
      this.cdr.markForCheck();
    } catch (error) {
      draft.PRODUCTO = '';
      this.notification.error(error instanceof Error ? error.message : 'Error consultando producto.');
    } finally {
      this.working.set(false);
    }
  }

  presentationItems(): (Ven229PresentacionItem & { INDEX: number })[] {
    const draft = this.draft();
    return ((draft?.PRESENTACION as Ven229PresentacionItem[]) ?? []).map((p, idx) => ({
      ...p,
      INDEX: idx
    }));
  }

  selectedPresentationIndex(): number {
    const draft = this.draft();
    if (!draft) return 0;
    const list = (draft.PRESENTACION as Ven229PresentacionItem[]) ?? [];
    const idx = list.findIndex(p =>
      (p.UDM_VENTA === draft.UDM_VENTA || p.UDM_COMPRA === draft.UDM_VENTA) &&
      (Number(p.PRECIO) === Number(draft.VALOR_UNITARIO))
    );
    return idx >= 0 ? idx : 0;
  }

  onUnitSelectionChanged(event: { selectedItem?: unknown }): void {
    const selected = event.selectedItem as (Ven229PresentacionItem & { INDEX: number }) | undefined;
    if (!selected) return;
    const draft = this.draft();
    if (!draft) return;

    draft.UDM_VENTA = String(selected.UDM_VENTA || selected.UDM_COMPRA || '');
    draft.UDM_EQUIV = String(selected.UDM_EQUIV || '');
    draft.CANTIDAD_PRES = Number(selected.CANTIDAD_PRES ?? 1);
    draft.CANTIDAD_EQUIV = Number(selected.CANTIDAD_EQUIV ?? 1);
    draft.VALOR_UNITARIO = Number(selected.PRECIO ?? draft.VALOR_UNITARIO);
    draft.CANTIDAD_REAL = Number(draft.CANTIDAD_PRES) * Number(draft.CANTIDAD_EQUIV) * Number(draft.CANTIDAD || 0);

    this.onDraftQtyChange();
    this.draft.set({ ...draft });
    this.cdr.markForCheck();
  }

  openTaxModal(): void {
    const ivas = this.draft()?.IVAS ?? [];
    if (ivas.length > 0) {
      this.taxList.set(ivas);
      this.taxModalVisible.set(true);
      this.cdr.markForCheck();
    }
  }

  selectTax(item: Ven229IvaItem): void {
    this.tax(item);
    this.taxModalVisible.set(false);
    this.cdr.markForCheck();
  }

  isSelectedTax(item: Ven229IvaItem): boolean {
    const cur = this.draft()?.GRAV_ORG as Ven229IvaItem | undefined;
    return cur?.ID_TASA === item.ID_TASA;
  }

  tax(value: unknown): void {
    const row = this.draft();
    if (!row) return;
    const taxItem: Ven229IvaItem | undefined =
      typeof value === 'object' && value && 'ID_TASA' in value
        ? (value as Ven229IvaItem)
        : row.IVAS?.find(t => t.ID_TASA === value);
    if (taxItem) {
      const porc = Number(taxItem.PORCENTAJE ?? 0);
      Object.assign(row, {
        GRAVAMENES: taxItem,
        GRAV_ORG: taxItem,
        PORC_IVA: porc / 100,
        POR_IVA: porc
      });
      this.onDraftQtyChange();
      this.draft.set({ ...row });
      this.cdr.markForCheck();
    }
  }

  selectProductFromDropdown(data: Ven229Lookup): void {
    if (!data?.PRODUCTO || this.working() || this.busy) return;
    this.productDropdownOpened = false;
    void this.product(data.PRODUCTO);
  }

  onProductValueChanged(event: { value?: unknown }): void {
    const val = String(event.value ?? '').trim().toUpperCase();
    const current = this.draft()?.PRODUCTO ? String(this.draft()?.PRODUCTO).trim().toUpperCase() : '';
    if (val && val !== current && !this.working() && !this.busy) {
      void this.product(val);
    }
  }

  productToolbarActions(): XteinGridToolbarAction[] {
    return [
      {
        id: 'refresh',
        icon: 'refresh',
        title: 'Refrescar productos',
        variant: 'secondary',
        disabled: this.productsLoading || this.working(),
        action: () => this.refreshProducts.emit()
      }
    ];
  }

  async commit(): Promise<void> {
    const row = this.draft();
    if (!row || this.working() || this.busy) return;

    if (!row.PRODUCTO || !(Number(row.CANTIDAD) > 0)) {
      this.notification.warning('Complete producto y cantidad.');
      return;
    }
    if (!row.FECHA_ENTREGA || !String(row.FECHA_ENTREGA).trim()) {
      this.notification.warning('La fecha de entrega es obligatoria.');
      return;
    }
    const previous = this.items.find(item => item.ITEM === row.ITEM);
    if (row.FECHA_ENTREGA && row.FECHA_ENTREGA !== previous?.FECHA_ENTREGA && String(row.FECHA_ENTREGA).slice(0, 10) < this.minimumDeliveryDate) {
      this.notification.warning('La fecha de entrega no puede ser anterior a hoy.');
      return;
    }
    if ((row.IVAS?.length ?? 0) > 1 && !row.GRAV_ORG) {
      this.notification.warning('Seleccione el IVA del producto.');
      return;
    }

    this.working.set(true);
    try {
      await this.business.action('quantity', {
        PEDIDO: this.header,
        ITEMS: {
          ...row,
          CANTIDAD_PREV: this.items.find(i => i.ITEM === row.ITEM)?.CANTIDAD ?? 0
        },
        ...this.business.identity
      });

      row.SUB_TOTAL = Number(row.CANTIDAD) * Number(row.VALOR_UNITARIO);
      row.CANTIDAD_REAL = Number(row.CANTIDAD_PRES ?? 1) * Number(row.CANTIDAD_EQUIV ?? 1) * Number(row.CANTIDAD);
      const rate = Number(row.PORC_IVA ?? (Number(row.POR_IVA || 0) / 100));
      const effectiveRate = rate > 1 ? rate / 100 : rate;
      row.VALOR_IVA = row.SUB_TOTAL * effectiveRate;
      row.TOTAL = row.SUB_TOTAL + row.VALOR_IVA;

      if (await this.persist(structuredClone(row))) {
        this.draft.set(null);
        this.pending.emit(false);
      }
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'Error validando cantidad.');
    } finally {
      this.working.set(false);
    }
  }

  private async loadExistingOptions(row: Ven229PedidoItem): Promise<void> {
    this.working.set(true);
    try {
      const rows = await this.business.action<Ven229Lookup>('stock', {
        PRODUCTO: row.PRODUCTO,
        PRESENTACION: 'SI',
        MOVIMIENTO: 'Pedido',
        TIPO: 'Pedido',
        TIPO_CONDICION: this.conditionType,
        ID_CONDICION: this.header.ID_CONDICION,
        PLAZO: this.header.PLAZO,
        ID_CLIENTE: this.header.ID_CLIENTE,
        ID_UN_BODEGA: this.header.ID_UN_BODEGA
      });
      const p = rows[0];
      if (p && this.draft()?.ITEM === row.ITEM) {
        this.draft.update(current =>
          current
            ? {
                ...current,
                PRESENTACION: (p.PRESENTACION as unknown as Ven229PresentacionItem[]) ?? [],
                IVAS: (p.IVAS as unknown as Ven229IvaItem[]) ?? []
              }
            : null
        );
      }
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'Error cargando presentaciones.');
    } finally {
      this.working.set(false);
    }
  }
}
