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
  XteinButtonComponent,
  XteinNotificationService
} from '@xtein/ui';
import { Ven212FacturaItem, Ven212PresentacionItem, Ven212IvaItem } from '../../models/ven-212.model';
import { Ven212Header, Ven212Lookup } from '../../models/ven-212-business.model';
import { Ven212BusinessService } from '../../services/ven-212-business.service';

@Component({
  selector: 'xtein-ven212-items',
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
    XteinButtonComponent
  ],
  templateUrl: './xtein-ven212-items.component.html',
  styleUrl: './xtein-ven212-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinVen212ItemsComponent implements OnChanges {
  @Input() items: Ven212FacturaItem[] = [];
  @Input() recordKey = '';
  @Input() onlyStock = false;
  @Input() productsLoading = false;
  @Input() products: Ven212Lookup[] = [];
  @Input() header: Ven212Header = {};
  @Input() readOnly = true;
  @Input() ready = false;
  @Input() busy = false;
  @Input() conditionType = '';
  @Input() repeatItem = false;
  @Input() editPrice = false;
  @Input({ required: true }) persist!: (row: Ven212FacturaItem) => Promise<boolean>;
  @Input() moneyFormat = '#,##0.00';
  @Input() quantityFormat = '#,##0.00';

  @Output() removed = new EventEmitter<number>();
  @Output() removedMany = new EventEmitter<number[]>();
  @Output() pending = new EventEmitter<boolean>();
  @Output() refreshProducts = new EventEmitter<void>();
  @Output() stockOnly = new EventEmitter<boolean>();

  readonly selected = signal<number[]>([]);
  readonly draft = signal<Ven212FacturaItem | null>(null);
  readonly working = signal(false);
  readonly productsVisible = signal(false);
  productDropdownOpened = false;

  readonly productDropDownOptions = {
    width: 720,
    height: 420,
    hideOnParentScroll: true
  };

  readonly productColumns: XteinGridColumn<Ven212Lookup, unknown>[] = [
    { dataField: 'PRODUCTO', caption: 'Producto', width: 140 },
    { dataField: 'NOMBRE', caption: 'Nombre', minWidth: 260 },
    { dataField: 'PRECIO', caption: 'Precio', width: 120, format: 'currency' },
    { dataField: 'CAN_INV', caption: 'Inventario', width: 100 }
  ];

  private readonly business = inject(Ven212BusinessService);
  private readonly notification = inject(XteinNotificationService);

  get minimumDate(): string | null {
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

  begin(row?: Ven212FacturaItem): void {
    if (this.readOnly || this.busy || this.working() || this.draft()) return;
    if (!row && !this.ready) return;

    this.draft.set(
      row
        ? structuredClone(row)
        : {
            ITEM: this.items.reduce((max, item) => Math.max(max, item.ITEM), 0) + 1,
            PRODUCTO: '',
            NOMBRE_PRODUCTO: '',
            CANTIDAD: 1,
            VALOR_UNITARIO: 0,
            VALOR_DESCUENTO: 0,
            VALOR_IVA: 0,
            POR_IVA: 0,
            PORC_IVA: 0,
            SUB_TOTAL: 0,
            TOTAL: 0,
            FECHA: this.minimumDate
          }
    );

    const currentDraft = this.draft();
    if (currentDraft && !row) {
      this.productDropdownOpened = true;
    }

    if (row && (!row.PRESENTACION?.length || !row.IVAS?.length)) {
      void this.loadExistingOptions(row);
    }

    this.pending.emit(true);
  }

  cancel(): void {
    this.draft.set(null);
    this.productDropdownOpened = false;
    this.pending.emit(false);
  }

  async remove(item: number): Promise<void> {
    if (this.readOnly || this.busy || this.working() || this.draft()) return;
    this.removed.emit(item);
  }

  async product(code: string): Promise<void> {
    const draft = this.draft();
    if (!draft || !code) return;

    if (!this.repeatItem && this.items.some(i => i.ITEM !== draft.ITEM && i.PRODUCTO === code)) {
      this.notification.warning('El producto ya se encuentra en la factura.');
      return;
    }

    this.working.set(true);
    try {
      const rows = await this.business.action<Ven212Lookup>('stock', {
        PRODUCTO: code,
        PRESENTACION: 'SI',
        MOVIMIENTO: 'FACTURA',
        TIPO: 'FACTURA',
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
        PRESENTACION: (p.PRESENTACION as unknown as Ven212PresentacionItem[]) ?? [],
        IVAS: (p.IVAS as unknown as Ven212IvaItem[]) ?? [],
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

  selectProductFromDropdown(data: Ven212Lookup): void {
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

  private async loadExistingOptions(row: Ven212FacturaItem): Promise<void> {
    try {
      const rows = await this.business.action<Ven212Lookup>('stock', {
        PRODUCTO: row.PRODUCTO,
        PRESENTACION: 'SI',
        MOVIMIENTO: 'FACTURA',
        TIPO: 'FACTURA',
        TIPO_CONDICION: this.conditionType,
        ID_CONDICION: this.header.ID_CONDICION,
        PLAZO: this.header.PLAZO,
        ID_CLIENTE: this.header.ID_CLIENTE,
        ID_UN_BODEGA: this.header.ID_UN_BODEGA
      });
      const p = rows[0];
      if (p) {
        row.PRESENTACION = (p.PRESENTACION as unknown as Ven212PresentacionItem[]) ?? [];
        row.IVAS = (p.IVAS as unknown as Ven212IvaItem[]) ?? [];
        this.draft.set({ ...row });
      }
    } catch {
      // Non-critical fallback
    }
  }
}
