import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatNumber } from 'devextreme/localization';
import { XteinButtonComponent, XteinNotificationService, XteinNumberComponent, XteinPopupComponent, XteinSelectComponent } from '@xtein/ui';
import { Ven210Header, Ven210Lookup } from '../../models/ven-210-business.model';
import { Ven210ItemBodega, Ven210RemisionItem } from '../../models/ven-210.model';
import { Ven210BusinessService } from '../../services/ven-210-business.service';
import { baseQuantity, distributionTotal, productLabel, validateItemDistribution } from '../../utils/ven-210-distribution';

/** Document keys of the remisión being edited (its own stock is added back by EXISTENCIAS BODEGAS). */
export interface Ven210DocumentKeys {
  ID_DOCUMENTO: string; PREFIJO: string; CONSECUTIVO: number; SUFIJO: string;
}

/**
 * Warehouse distribution popup of one item: quantities in the item presentation,
 * stock and equivalent in base unit.
 */
@Component({
  selector: 'xtein-ven210-bodegas', standalone: true,
  imports: [FormsModule, XteinPopupComponent, XteinButtonComponent, XteinNumberComponent, XteinSelectComponent],
  templateUrl: './xtein-ven210-bodegas.component.html',
  styleUrl: './xtein-ven210-bodegas.component.scss'
})
export class XteinVen210BodegasComponent implements OnChanges {
  @Input() visible = false;
  @Input() item: Ven210RemisionItem | null = null;
  @Input() header: Ven210Header = {};
  @Input() documentKeys: Ven210DocumentKeys | null = null;
  @Input() readOnly = true;
  @Input() quantityFormat = '#,##0.00';
  @Output() applied = new EventEmitter<Ven210ItemBodega[]>();
  @Output() cancelled = new EventEmitter<void>();
  private readonly business = inject(Ven210BusinessService);
  private readonly notification = inject(XteinNotificationService);
  readonly rows = signal<Ven210ItemBodega[]>([]);
  readonly warehouses = signal<Ven210Lookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  private request = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (!(changes['visible'] || changes['item']) || !this.visible || !this.item) return;
    const item = this.item;
    this.error.set('');
    this.rows.set(structuredClone(item.BODEGAS ?? []).map(row => ({ ...row, ITEM: item.ITEM })));
    void this.loadWarehouseStock(this.item);
  }

  get title(): string {
    return this.item ? `Reparto por bodega · ${productLabel(this.item)}` : 'Reparto por bodega';
  }

  get unitLabel(): string {
    return String(this.item?.UDM_VENTA ?? '');
  }

  get total(): number {
    return distributionTotal(this.rows());
  }

  get pendingQuantity(): number {
    return Number(this.item?.CANTIDAD ?? 0) - this.total;
  }

  quantity(value: unknown): string {
    const number = Number(value);
    return Number.isFinite(number) ? formatNumber(number, this.quantityFormat) : '—';
  }

  base(row: Ven210ItemBodega): number {
    return this.item ? baseQuantity(this.item, row.CANTIDAD) : NaN;
  }

  readonly warehouseOptions = computed<Ven210Lookup[]>(() => this.warehouses().map(row => ({ ...row,
    LABEL: [row.ID_UN_BODEGA, row.DESCRIPCION, `Exist.: ${this.quantity(row.EXISTENCIA)} ${row.UDM ?? ''}`.trim()].filter(Boolean).join(' · ') })));

  stockUnit(row: Ven210ItemBodega): string {
    return String(this.warehouses().find(w => w.ID_UN_BODEGA === row.ID_UN_BODEGA)?.UDM ?? this.item?.UDM_EQUIV ?? '');
  }

  selectWarehouse(row: Ven210ItemBodega, value: unknown): void {
    const warehouse = this.warehouses().find(w => w.ID_UN_BODEGA === value);
    row.ID_UN_BODEGA = String(value ?? '');
    row.EXISTENCIA = warehouse ? Number(warehouse.EXISTENCIA ?? 0) : undefined;
    row.DESCRIPCION = warehouse?.DESCRIPCION ?? '';
  }

  addRow(): void {
    if (this.readOnly || !this.item) return;
    const pending = this.pendingQuantity;
    const itemNumber = this.item.ITEM;
    this.rows.update(rows => [...rows, { ITEM: itemNumber, ID_UN_BODEGA: '', CANTIDAD: pending > 0 ? pending : 0 }]);
  }

  removeRow(index: number): void {
    if (this.readOnly) return;
    this.rows.update(rows => rows.filter((_, position) => position !== index));
  }

  apply(): void {
    const item = this.item;
    if (this.readOnly || !item || this.loading()) return;
    const rows = this.rows().map(row => ({ ITEM: item.ITEM, ID_UN_BODEGA: row.ID_UN_BODEGA, CANTIDAD: Number(row.CANTIDAD),
      CANTIDAD_REAL: baseQuantity(item, row.CANTIDAD), EXISTENCIA: row.EXISTENCIA, DESCRIPCION: row.DESCRIPCION }));
    const message = validateItemDistribution(item, rows);
    if (message) { this.notification.warning(message); return; }
    this.applied.emit(rows);
  }

  close(): void {
    if (this.loading()) return;
    this.cancelled.emit();
  }

  private async loadWarehouseStock(item: Ven210RemisionItem): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    this.warehouses.set([]);
    try {
      const rows = await this.business.action<Ven210Lookup>('warehouseStock', { PRODUCTO: item.PRODUCTO,
        ID_UN_ITEM: this.header.ID_UN_ITEM, ...(this.documentKeys ?? {}) });
      if (request !== this.request) return;
      const warehouses = rows.map(row => ({ ...row, ID_UN_BODEGA: String(row.ID_UN_BODEGA ?? ''),
        DESCRIPCION: String(row.DESCRIPCION ?? row.ID_UN_BODEGA ?? ''), EXISTENCIA: Number(row.EXISTENCIA ?? 0) }));
      this.warehouses.set(warehouses);
      this.rows.update(current => current.map(row => {
        const warehouse = warehouses.find(w => w.ID_UN_BODEGA === row.ID_UN_BODEGA);
        return warehouse ? { ...row, EXISTENCIA: warehouse.EXISTENCIA, DESCRIPCION: warehouse.DESCRIPCION } : row;
      }));
      if (!warehouses.length && !this.readOnly) this.error.set('El producto no tiene existencias en las bodegas de la unidad de negocio.');
    } catch (error) {
      if (request === this.request) this.error.set(error instanceof Error ? error.message : 'No se pudieron consultar las existencias.');
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
}
