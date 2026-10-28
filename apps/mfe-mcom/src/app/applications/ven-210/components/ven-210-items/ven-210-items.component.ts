import { XteinDataGridComponent, XteinGridToolbarComponent,
    XteinCheckboxComponent, XteinGridColumn, XteinGridToolbarAction } from '@xtein/ui';
import { formatNumber } from 'devextreme/localization';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';
import { XteinSelectComponent, XteinNumberComponent, XteinDateComponent, XteinNotificationService } from '@xtein/ui';
import { Ven210RemisionItem } from '../../models/ven-210.model';
import { Ven210Header, Ven210Lookup } from '../../models/ven-210-business.model';
import { Ven210BusinessService } from '../../services/ven-210-business.service';
import { baseQuantity } from '../../utils/ven-210-distribution';
import { validateOrderQuantity } from '../../utils/ven-210-order-load';
@Component({ selector: 'ven-210-items', standalone: true,
 imports: [XteinGridToolbarComponent, DxDropDownBoxModule, DxTemplateModule, XteinDataGridComponent, XteinCheckboxComponent, CommonModule, FormsModule, XteinDateComponent, XteinSelectComponent, XteinNumberComponent],
 templateUrl: './ven-210-items.component.html', styleUrl: './ven-210-items.component.scss',
 changeDetection: ChangeDetectionStrategy.OnPush })
export class Ven210ItemsComponent implements OnChanges {
 @Input() items: Ven210RemisionItem[] = [];
 @Input() recordKey = '';
 @Input() productsLoading = false;
 @Input() products: Ven210Lookup[] = [];
 @Input() header: Ven210Header = {};
 @Input() readOnly = true;
 @Input() ready = false;
 @Input() busy = false;
 @Input() conditionType = '';
 @Input() repeatItem = false;
 @Input() editPrice = false;
 /** Items come from an order: no new products, quantity may only go down to CANTIDAD_MAX. */
 @Input() orderLocked = false;
 @Input({required:true}) persist!: (row:Ven210RemisionItem)=>Promise<boolean>;
 @Input() moneyFormat='#,##0.00';
 @Input() quantityFormat='#,##0.00';
 get savedRecord(): boolean { return !!this.recordKey && this.recordKey !== 'new'; }
 money(value:number):string{return formatNumber(Number(value || 0),this.moneyFormat);}
 quantity(value:number):string{return formatNumber(Number(value || 0),this.quantityFormat);}
 readonly selected=signal<number[]>([]);
 @Output() removedMany=new EventEmitter<number[]>();
 toggle(item:number,checked:boolean):void{this.selected.update(rows=>checked?[...rows,item]:rows.filter(id=>id!==item));}
 allItemsSelected(): boolean { return this.items.length > 0 && this.items.every(item => this.selected().includes(item.ITEM)); }
 toggleAll(checked: boolean): void { this.selected.set(checked ? this.items.map(i => i.ITEM) : []); }
 deleteSelected(): void { if (this.selected().length) this.removedMany.emit(this.selected()); }
 editSelected(): void {
   if (this.readOnly || this.busy || this.working() || this.draft() || this.selected().length !== 1) return;
   const target = this.items.find(i => i.ITEM === this.selected()[0]);
   if (target) {
     this.begin(target);
   }
 }
 get toolbarActions(): XteinGridToolbarAction[] {
   const isDraft = !!this.draft();
   const selCount = this.selected().length;
   return [
     {
       id: 'new-item',
       icon: 'plus',
       title: 'Nuevo ítem',
       variant: 'primary',
       disabled: this.readOnly || !this.ready || this.busy || isDraft || this.orderLocked,
       action: () => this.begin()
     },
     {
       id: 'edit-item',
       icon: 'edit',
       title: selCount === 1 ? 'Editar ítem' : 'Seleccione un ítem para editar',
       variant: 'secondary',
       visible: !isDraft,
       disabled: this.readOnly || this.busy || selCount !== 1,
       action: () => this.editSelected()
     },
     {
       id: 'save-item',
       icon: 'check',
       title: 'Guardar ítem',
       variant: 'success',
       visible: isDraft,
       disabled: this.working() || this.busy,
       action: () => { void this.commit(); }
     },
     {
       id: 'cancel-item',
       icon: 'undo',
       title: 'Cancelar',
       variant: 'cancel',
       visible: isDraft,
       disabled: this.working() || this.busy,
       action: () => this.cancel()
     },
     {
       id: 'delete-item',
       icon: 'trash',
       title: 'Eliminar seleccionados',
       variant: 'danger',
       visible: selCount > 0 && !isDraft && !this.readOnly,
       disabled: this.busy,
       action: () => this.deleteSelected()
     }
   ];
 }
 onDraftQtyChange(): void {
   const row = this.draft();
   if (!row) return;
   row.SUB_TOTAL = Number(row.CANTIDAD || 0) * Number(row.VALOR_UNITARIO || 0);
   row.TOTAL = row.SUB_TOTAL;
 }
 @Output() removed = new EventEmitter<number>();
 @Output() pending = new EventEmitter<boolean>();
 @Output() refreshProducts = new EventEmitter<void>();
 /** Opens the warehouse distribution of an item. */
 @Output() distribute = new EventEmitter<number>();
 readonly productsVisible = signal(false);
 readonly draft = signal<Ven210RemisionItem | null>(null);
 readonly working = signal(false);
 private readonly business = inject(Ven210BusinessService);
 private readonly notification = inject(XteinNotificationService);
 begin(row?: Ven210RemisionItem): void {
  if (this.readOnly || this.busy || this.working() || this.draft()) return;
  if (!row && (!this.ready || this.orderLocked)) return;
  this.draft.set(row ? structuredClone(row) : { ITEM: Math.max(0,...this.items.map(i=>i.ITEM))+1,
    ID_UN: '', ID_UN_ITEM: '', ID_DOCUMENTO: '', PREFIJO: '', CONSECUTIVO: 0, SUFIJO: '',
    ID_SOPORTE: '', NC_PREFIJO: '', NC_CONSECUTIVO: 0, NC_SUFIJO: '', ITEM_PED: null,
    CANTIDAD_AUTORIZADA: 0, CANTIDAD_PENDIENTE: 0, VALOR_COSTOS: 0, UDM_VENTA: '', FECHA_ENTREGA: null,
    PRODUCTO:'', ATRIBUTO:'SIN', CANTIDAD:0, VALOR_UNITARIO:0, VALOR_BASE:0,
    SUB_TOTAL:0, VALOR_DESCUENTO:0, TOTAL:0, BODEGAS: [], SIN_REPARTO: true });
  this.pending.emit(true);
  if(row && !row.PRESENTACION?.length && !this.orderLocked) void this.loadExistingOptions(row);
 }
 cancel(): void { if (this.working()) return; this.draft.set(null); this.pending.emit(false); }
 private stockRequest(code: string) {
  return { PRODUCTO:code, PRESENTACION:'SI', MOVIMIENTO:'Remision', TIPO:'Remision', TIPO_CONDICION:this.conditionType,
    ID_CONDICION:this.header.ID_CONDICION, PLAZO:this.header.PLAZO, ID_CLIENTE:this.header.ID_CLIENTE, ID_UN_ITEM:this.header.ID_UN_ITEM };
 }
 async product(value: unknown): Promise<void> {
  const draft = this.draft(); if (!draft || this.working() || this.orderLocked) return;
  const code = String(value ?? '');
  if (!this.repeatItem && this.items.some(i=>i.ITEM!==draft.ITEM && i.PRODUCTO===code)) {
    this.notification.warning('Ya está registrado este producto.'); draft.PRODUCTO=''; return;
  }
  this.working.set(true);
  try {
    const rows = await this.business.action<Ven210Lookup>('stock', this.stockRequest(code));
    const p=rows[0]; if (!p) throw new Error('No se encontraron existencias del producto.');
    Object.assign(draft,{ PRODUCTO:code,NOMBRE_PRODUCTO:p.NOMBRE,REFERENCIA:p.REFERENCIA,
      VALOR_UNITARIO:Number(p.PRECIO ?? 0),VALOR_BASE:Number(p.VALOR_BASE ?? 0),
      PRESENTACION:p.PRESENTACION ?? [], UDM_VENTA: '', UDM_EQUIV: '', CANTIDAD_PRES: 0, CANTIDAD_EQUIV: 0,
      BODEGAS: [], SIN_REPARTO: true });
    const unit = p.PRESENTACION?.[0];
    if (unit) { draft.UDM_VENTA=unit.UDM_VENTA; draft.UDM_EQUIV=unit.UDM_EQUIV;
      draft.CANTIDAD_PRES=unit.CANTIDAD_PRES;draft.CANTIDAD_EQUIV=unit.CANTIDAD_EQUIV; }
    this.draft.set({...draft});
  } catch(error) { draft.PRODUCTO='';this.notification.error(error instanceof Error ? error.message : 'Error consultando producto.'); }
  finally { this.working.set(false); }
 }
 unit(value: unknown): void {
  const row=this.draft(); if(!row || this.orderLocked)return;
  const unit=row.PRESENTACION?.find(p=>(p.UDM_VENTA ?? p.UDM_COMPRA)===value);
  if(!unit)return;
  if(this.items.some(i=>i.ITEM!==row.ITEM && i.PRODUCTO===row.PRODUCTO && i.UDM_VENTA===value)) {
    this.notification.warning('La unidad de venta está repetida.');row.UDM_VENTA='';return;
  }
  Object.assign(row,{UDM_VENTA:String(value),UDM_EQUIV:unit.UDM_EQUIV,CANTIDAD_PRES:unit.CANTIDAD_PRES,
    CANTIDAD_EQUIV:unit.CANTIDAD_EQUIV,VALOR_UNITARIO:Number(unit.PRECIO ?? row.VALOR_UNITARIO)});
 }
 async commit(): Promise<void> {
  const row=this.draft(); if(!row || this.working() || this.busy)return;
  if(!row.PRODUCTO || !(row.CANTIDAD>0)) { this.notification.warning('Complete producto y cantidad.'); return; }
  const orderMessage = validateOrderQuantity(row);
  if (orderMessage) { this.notification.warning(orderMessage); return; }
  const previous = this.items.find(item => item.ITEM === row.ITEM);
  if (row.FECHA_ENTREGA && row.FECHA_ENTREGA !== previous?.FECHA_ENTREGA && row.FECHA_ENTREGA.slice(0,10) < this.minimumDeliveryDate) {
    this.notification.warning('La fecha de entrega no puede ser anterior a hoy.'); return;
  }
  this.working.set(true);
  try {
    row.SUB_TOTAL=Number(row.CANTIDAD)*Number(row.VALOR_UNITARIO);
    row.CANTIDAD_REAL=baseQuantity(row,row.CANTIDAD);
    row.TOTAL=row.SUB_TOTAL;
    if(await this.persist(structuredClone(row))){this.draft.set(null);this.pending.emit(false);}
  } catch(error) {this.notification.error(error instanceof Error ? error.message : 'Error aplicando el ítem.');}
  finally {this.working.set(false);}
 }

 private async loadExistingOptions(row:Ven210RemisionItem):Promise<void>{
   this.working.set(true);
   try{
     const product=(await this.business.action<Ven210Lookup>('stock',this.stockRequest(row.PRODUCTO)))[0];
     if(product && this.draft()?.ITEM===row.ITEM)this.draft.update(current=>current?{...current,PRESENTACION:product.PRESENTACION ?? []}:null);
   }catch(error){this.notification.error(error instanceof Error?error.message:'Error cargando presentaciones.');}
   finally{this.working.set(false);}
 }

  productDropdownOpened = false;
  readonly productDropDownOptions = {
    width: 'min(750px, 95vw)',
    height: 'min(420px, 70dvh)',
    hideOnParentScroll: true,
  };

  private productColumnKey = '';
  private cachedProductColumns: XteinGridColumn<Ven210Lookup>[] = [];
  get productColumns(): XteinGridColumn<Ven210Lookup>[] {
    const key = JSON.stringify([this.moneyFormat, this.quantityFormat]);
    if (key === this.productColumnKey) return this.cachedProductColumns;
    this.productColumnKey = key;
    return this.cachedProductColumns = [
      { dataField: 'PRODUCTO', caption: 'Producto', width: 130 },
      { dataField: 'NOMBRE', caption: 'Nombre' },
      { dataField: 'PRECIO', caption: 'Precio', dataType: 'number', format: this.moneyFormat, alignment: 'right', width: 140 }
    ];
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
  }
  get minimumDeliveryDate(): string {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
  }
  /** Upper bound of the quantity editor (only for items loaded from an order). */
  maxQuantity(row: Ven210RemisionItem): number | undefined {
    return row.ITEM_PED != null && row.CANTIDAD_MAX != null ? Number(row.CANTIDAD_MAX) : undefined;
  }
  presentationOptions(): Ven210Lookup[] {
    return (this.draft()?.PRESENTACION ?? []).map(unit => ({...unit, UDM_VENTA: unit.UDM_VENTA ?? unit.UDM_COMPRA,
      LABEL: [unit.UDM_VENTA ?? unit.UDM_COMPRA, String(unit.CANTIDAD_PRES ?? ''), 'Equiv: '+String(unit.CANTIDAD_EQUIV ?? '')+' '+String(unit.UDM_EQUIV ?? ''), this.money(Number(unit.PRECIO ?? 0))].join(' · ')}));
  }
  selectProductFromDropdown(row: Ven210Lookup): void {
    if (!row.PRODUCTO || this.working() || this.busy) return;
    this.productDropdownOpened = false;
    void this.product(row.PRODUCTO);
  }
  closeProductSearch(): void {
    this.productDropdownOpened = false;
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
}
