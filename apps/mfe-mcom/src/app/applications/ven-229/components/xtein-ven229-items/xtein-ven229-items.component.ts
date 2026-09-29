import {
  ChangeDetectionStrategy,
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
import { DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';
import { formatNumber } from 'devextreme/localization';
import {
  XteinDataGridComponent,
  XteinCheckboxComponent,
  XteinGridColumn,
  XteinGridToolbarAction,
  XteinSelectComponent,
  XteinNumberComponent,
  XteinDateComponent,
  XteinButtonComponent,
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
    XteinDataGridComponent,
    XteinCheckboxComponent,
    XteinSelectComponent,
    XteinNumberComponent,
    XteinDateComponent,
    XteinButtonComponent
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
  productDropdownOpened = false;

  readonly productDropDownOptions = {
    width: 720,
    height: 420,
    hideOnParentScroll: true
  };

  readonly productColumns: XteinGridColumn<Ven229Lookup, unknown>[] = [
    { dataField: 'PRODUCTO', caption: 'Producto', width: 140 },
    { dataField: 'NOMBRE', caption: 'Nombre', minWidth: 260 },
    { dataField: 'PRECIO', caption: 'Precio', width: 120, format: 'currency' },
    { dataField: 'CAN_INV', caption: 'Inventario', width: 100 }
  ];

  private readonly business = inject(Ven229BusinessService);
  private readonly notification = inject(XteinNotificationService);

  get minimumDeliveryDate(): string | null {
    return this.header.FECHA ? String(this.header.FECHA).slice(0, 10) : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordKey'] && !changes['recordKey'].firstChange) {
      this.cancel();
      this.selected.set([]);
    }
    if (changes['readOnly'] && this.readOnly) {
      this.cancel();
      this.selected.set([]);
    }
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
    row.VALOR_IVA = row.SUB_TOTAL * Number(row.PORC_IVA ?? (Number(row.POR_IVA || 0) / 100));
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
            FECHA_ENTREGA: this.header.FECHA || null,
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
    if (row && !row.PRESENTACION?.length) {
      void this.loadExistingOptions(row);
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
      }

      if (p.IVAS?.length === 1) {
        this.tax(p.IVAS[0].ID_TASA);
      }
      this.draft.set({ ...draft });
    } catch (error) {
      draft.PRODUCTO = '';
      this.notification.error(error instanceof Error ? error.message : 'Error consultando producto.');
    } finally {
      this.working.set(false);
    }
  }

  unit(value: unknown): void {
    const row = this.draft();
    if (!row) return;
    const unit = row.PRESENTACION?.find(p => (p.UDM_VENTA ?? p.UDM_COMPRA) === value);
    if (!unit) return;

    if (this.items.some(i => i.ITEM !== row.ITEM && i.PRODUCTO === row.PRODUCTO && i.UDM_VENTA === value)) {
      this.notification.warning('La unidad de venta está repetida.');
      row.UDM_VENTA = '';
      return;
    }

    Object.assign(row, {
      UDM_VENTA: String(value),
      UDM_EQUIV: unit.UDM_EQUIV,
      CANTIDAD_PRES: unit.CANTIDAD_PRES,
      CANTIDAD_EQUIV: unit.CANTIDAD_EQUIV
    });
    this.draft.set({ ...row });
  }

  tax(value: unknown): void {
    const row = this.draft();
    if (!row) return;
    const taxItem = row.IVAS?.find(t => t.ID_TASA === value);
    if (!taxItem) return;

    row.PORC_IVA = Number(taxItem.TASA ?? (Number(taxItem.PORCENTAJE || 0) / 100));
    row.POR_IVA = row.PORC_IVA * 100;
    this.onDraftQtyChange();
    this.draft.set({ ...row });
  }

  selectProductFromDropdown(data: Ven229Lookup): void {
    if (!data?.PRODUCTO) return;
    this.productDropdownOpened = false;
    void this.product(data.PRODUCTO);
  }

  productToolbarActions(): XteinGridToolbarAction[] {
    return [
      {
        id: 'refresh',
        icon: 'refresh',
        title: 'Refrescar productos',
        action: () => this.refreshProducts.emit()
      }
    ];
  }

  presentationOptions(): { UDM_VENTA: string }[] {
    const draft = this.draft();
    return (draft?.PRESENTACION || []).map(p => ({
      UDM_VENTA: String(p.UDM_VENTA ?? p.UDM_COMPRA ?? '')
    }));
  }

  taxOptions(): { ID_TASA: string; LABEL: string }[] {
    const draft = this.draft();
    return (draft?.IVAS || []).map(t => ({
      ID_TASA: String(t.ID_TASA || ''),
      LABEL: `${t.ID_TASA} (${t.TASA || t.PORCENTAJE || 0}%)`
    }));
  }

  selectedTaxId(): string {
    const draft = this.draft();
    if (!draft?.IVAS?.length) return '';
    return draft.IVAS[0]?.ID_TASA || '';
  }

  async commit(): Promise<void> {
    const row = this.draft();
    if (!row || this.working() || this.busy) return;

    if (!row.PRODUCTO) {
      this.notification.warning('Debe seleccionar un producto.');
      return;
    }
    if (!Number(row.CANTIDAD) || Number(row.CANTIDAD) <= 0) {
      this.notification.warning('La cantidad debe ser mayor a cero.');
      return;
    }

    this.working.set(true);
    try {
      const ok = await this.persist(row);
      if (ok) {
        this.draft.set(null);
        this.pending.emit(false);
      }
    } finally {
      this.working.set(false);
    }
  }

  private async loadExistingOptions(row: Ven229PedidoItem): Promise<void> {
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
      if (p) {
        row.PRESENTACION = (p.PRESENTACION as unknown as Ven229PresentacionItem[]) ?? [];
        row.IVAS = (p.IVAS as unknown as Ven229IvaItem[]) ?? [];
        this.draft.set({ ...row });
      }
    } catch {
      // Non-critical fallback
    }
  }
}
