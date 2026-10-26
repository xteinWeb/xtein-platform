import { XteinButtonComponent, XteinCheckboxComponent } from '@xtein/ui';
import { formatNumber } from 'devextreme/localization';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { XteinNumberComponent, XteinNotificationService } from '@xtein/ui';
import { Ven213DevolucionItem } from '../../models/ven-213.model';
import { applyAmounts, taxTotal } from '../../utils/ven-213-amounts';
import { Ven213WithoutInventoryMessage } from '../../utils/ven-213-distribution';
import { validateReturnQuantity } from '../../utils/ven-213-source-load';

/**
 * Lines of the devolución: only the quantity to return can be lowered and lines removed; products cannot be
 * added and amounts are read-only (proportional to the source line).
 */
@Component({ selector: 'ven-213-items', standalone: true,
 imports: [XteinButtonComponent, XteinCheckboxComponent, CommonModule, FormsModule, XteinNumberComponent],
 templateUrl: './ven-213-items.component.html', styleUrl: './ven-213-items.component.scss',
 changeDetection: ChangeDetectionStrategy.OnPush })
export class Ven213ItemsComponent implements OnChanges {
 @Input() items: Ven213DevolucionItem[] = [];
 @Input() recordKey = '';
 @Input() readOnly = true;
 @Input() busy = false;
 @Input({required:true}) persist!: (row:Ven213DevolucionItem)=>Promise<boolean>;
 @Input() moneyFormat='#,##0.00';
 @Input() quantityFormat='#,##0.00';
 readonly withoutInventoryMessage = Ven213WithoutInventoryMessage;
 money(value:number):string{return formatNumber(Number(value || 0),this.moneyFormat);}
 quantity(value:unknown):string{return value === null || value === undefined ? '' : formatNumber(Number(value || 0),this.quantityFormat);}
 taxes(row:Ven213DevolucionItem):number{return taxTotal(row.GRAVAMENES_LISTA);}
 readonly selected=signal<number[]>([]);
 @Output() removedMany=new EventEmitter<number[]>();
 toggle(item:number,checked:boolean):void{this.selected.update(rows=>checked?[...rows,item]:rows.filter(id=>id!==item));}
 allItemsSelected(): boolean { return this.items.length > 0 && this.items.every(item => this.selected().includes(item.ITEM)); }
 toggleAll(checked: boolean): void { this.selected.set(checked ? this.items.map(i => i.ITEM) : []); }
 deleteSelected(): void { if (this.selected().length) this.removedMany.emit(this.selected()); }
 /** Preview of the draft amounts while the quantity changes. */
 onDraftQtyChange(): void {
   const row = this.draft();
   if (row) this.draft.set(applyAmounts({ ...row, CANTIDAD: Number(row.CANTIDAD || 0) }));
 }
 @Output() pending = new EventEmitter<boolean>();
 /** Opens the restock distribution of an item. */
 @Output() distribute = new EventEmitter<number>();
 readonly draft = signal<Ven213DevolucionItem | null>(null);
 readonly working = signal(false);
 private readonly notification = inject(XteinNotificationService);
 begin(row: Ven213DevolucionItem): void {
  if (this.readOnly || this.busy || this.working() || this.draft()) return;
  this.draft.set(structuredClone(row));
  this.pending.emit(true);
 }
 cancel(): void { if (this.working()) return; this.draft.set(null); this.pending.emit(false); }
 async commit(): Promise<void> {
  const row=this.draft(); if(!row || this.working() || this.busy)return;
  const message = validateReturnQuantity(row);
  if (message) { this.notification.warning(message); return; }
  this.working.set(true);
  try {
    if(await this.persist(structuredClone(row))){this.draft.set(null);this.pending.emit(false);}
  } catch(error) {this.notification.error(error instanceof Error ? error.message : 'Error aplicando el ítem.');}
  finally {this.working.set(false);}
 }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recordKey'] || (changes['readOnly'] && this.readOnly)) {
      this.selected.set([]);
      this.draft.set(null);
    } else if (changes['items']) {
      const keys = new Set(this.items.map(item => item.ITEM));
      this.selected.update(selected => selected.filter(key => keys.has(key)));
    }
  }
  /** Upper bound of the quantity editor. */
  maxQuantity(row: Ven213DevolucionItem): number | undefined {
    return row.CANTIDAD_MAX != null ? Number(row.CANTIDAD_MAX) : undefined;
  }
}
