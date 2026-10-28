import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatNumber } from 'devextreme/localization';
import { XteinButtonComponent, XteinNotificationService, XteinNumberComponent, XteinPopupComponent, XteinSelectComponent } from '@xtein/ui';
import { Ven213Header, Ven213Lookup } from '../../models/ven-213-business.model';
import { Ven213DevolucionItem, Ven213ItemBodega } from '../../models/ven-213.model';
import { Ven213BusinessService } from '../../services/ven-213-business.service';
import { distributionTotal, productLabel, validateItemDistribution } from '../../utils/ven-213-distribution';

/**
 * Restock distribution popup of one item: proposed from the source document, editable to the permitted
 * warehouses, Σ = quantity to return, without stock validation (it is an entry).
 */
@Component({
  selector: 'ven-213-bodegas', standalone: true,
  imports: [FormsModule, XteinPopupComponent, XteinButtonComponent, XteinNumberComponent, XteinSelectComponent],
  templateUrl: './ven-213-bodegas.component.html',
  styleUrl: './ven-213-bodegas.component.scss'
})
export class Ven213BodegasComponent implements OnChanges {
  @Input() visible = false;
  @Input() item: Ven213DevolucionItem | null = null;
  @Input() header: Ven213Header = {};
  @Input() readOnly = true;
  @Input() quantityFormat = '#,##0.00';
  @Input() moneyFormat = '#,##0.00';
  @Output() applied = new EventEmitter<Ven213ItemBodega[]>();
  @Output() cancelled = new EventEmitter<void>();
  private readonly business = inject(Ven213BusinessService);
  private readonly notification = inject(XteinNotificationService);
  readonly rows = signal<Ven213ItemBodega[]>([]);
  readonly warehouses = signal<Ven213Lookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  private request = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (!(changes['visible'] || changes['item']) || !this.visible || !this.item) return;
    const item = this.item;
    this.error.set('');
    this.rows.set(structuredClone(item.BODEGAS ?? []).map(row => ({ ...row, ITEM: item.ITEM })));
    if (!this.readOnly) void this.loadWarehouses(item);
  }

  get title(): string {
    return this.item ? `Reparto de reingreso · ${productLabel(this.item)}` : 'Reparto de reingreso';
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

  money(value: unknown): string {
    const number = Number(value);
    return value !== undefined && value !== null && Number.isFinite(number) ? formatNumber(number, this.moneyFormat) : '—';
  }

  readonly warehouseOptions = computed<Ven213Lookup[]>(() => this.warehouses().map(row => ({ ...row,
    LABEL: [row.ID_UN_BODEGA, row.DESCRIPCION].filter(Boolean).join(' · ') })));

  selectWarehouse(row: Ven213ItemBodega, value: unknown): void {
    const warehouse = this.warehouses().find(w => w.ID_UN_BODEGA === value);
    row.ID_UN_BODEGA = String(value ?? '');
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
      DESCRIPCION: row.DESCRIPCION }));
    const message = validateItemDistribution(item, rows);
    if (message) { this.notification.warning(message); return; }
    this.applied.emit(rows);
  }

  close(): void {
    if (this.loading()) return;
    this.cancelled.emit();
  }

  /** Permitted warehouses (BODEGAS DEVOLUCION); the proposed rows keep their warehouse even when it is not listed. */
  private async loadWarehouses(item: Ven213DevolucionItem): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    this.warehouses.set([]);
    try {
      const rows = await this.business.action<Ven213Lookup>('warehouses', { PRODUCTO: item.PRODUCTO,
        ATRIBUTO: item.ATRIBUTO || 'SIN', ID_UN_ITEM: this.header.ID_UN_ITEM, USUARIO: this.business.identity.USUARIO });
      if (request !== this.request) return;
      const warehouses = rows.map(row => ({ ...row, ID_UN_BODEGA: String(row.ID_UN_BODEGA ?? ''),
        DESCRIPCION: String(row.DESCRIPCION ?? row.ID_UN_BODEGA ?? '') }));
      const listed = new Set(warehouses.map(w => w.ID_UN_BODEGA));
      const proposed = this.rows().filter(row => row.ID_UN_BODEGA && !listed.has(row.ID_UN_BODEGA))
        .map(row => ({ ID_UN_BODEGA: row.ID_UN_BODEGA, DESCRIPCION: String(row.DESCRIPCION || row.ID_UN_BODEGA) }));
      this.warehouses.set([...warehouses, ...proposed]);
      this.rows.update(current => current.map(row => {
        const warehouse = warehouses.find(w => w.ID_UN_BODEGA === row.ID_UN_BODEGA);
        return warehouse ? { ...row, DESCRIPCION: warehouse.DESCRIPCION } : row;
      }));
      if (!warehouses.length && !proposed.length) this.error.set('No hay bodegas permitidas para reingresar el producto en la unidad de negocio.');
    } catch (error) {
      if (request === this.request) this.error.set(error instanceof Error ? error.message : 'No se pudieron consultar las bodegas.');
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
}
