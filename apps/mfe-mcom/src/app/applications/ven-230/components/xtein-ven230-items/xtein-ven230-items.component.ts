import { XteinDataGridComponent, XteinCheckboxComponent, XteinGridColumn } from '@xtein/ui';
import { formatNumber } from 'devextreme/localization';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';
import { XteinSelectComponent, XteinNumberComponent, XteinDateComponent, XteinNotificationService } from '@xtein/ui';
import { Ven230PrefacturaItem } from '../../models/ven-230.model';
import { Ven230Header, Ven230Lookup } from '../../models/ven-230-business.model';
import { Ven230BusinessService } from '../../services/ven-230-business.service';
@Component({ selector: 'xtein-ven230-items', standalone: true,
 imports: [DxDropDownBoxModule, DxTemplateModule, XteinDataGridComponent, XteinCheckboxComponent, CommonModule, FormsModule, XteinDateComponent, XteinSelectComponent, XteinNumberComponent],
 templateUrl: './xtein-ven230-items.component.html', styleUrl: './xtein-ven230-items.component.scss',
 changeDetection: ChangeDetectionStrategy.OnPush })
export class XteinVen230ItemsComponent implements OnChanges {
 @Input() items: Ven230PrefacturaItem[] = [];
 @Input() recordKey = '';
 @Input() onlyStock = false;
 @Input() productsLoading = false;
 @Input() products: Ven230Lookup[] = [];
 @Input() header: Ven230Header = {};
 @Input() readOnly = true;
 @Input() ready = false;
 @Input() busy = false;
 @Input() conditionType = '';
 @Input() repeatItem = false;
 @Input() editPrice = false;
 @Input({required:true}) persist!: (row:Ven230PrefacturaItem)=>Promise<boolean>;
 @Input() moneyFormat='#,##0.00';
 @Input() quantityFormat='#,##0.00';
 money(value:number):string{return formatNumber(Number(value || 0),this.moneyFormat);}
 quantity(value:number):string{return formatNumber(Number(value || 0),this.quantityFormat);}
 readonly selected=signal<number[]>([]);
 @Output() removedMany=new EventEmitter<number[]>();
 toggle(item:number,checked:boolean):void{this.selected.update(rows=>checked?[...rows,item]:rows.filter(id=>id!==item));}
 allItemsSelected(): boolean { return this.items.length > 0 && this.items.every(item => this.selected().includes(item.ITEM)); }
 toggleAll(checked: boolean): void { this.selected.set(checked ? this.items.map(i => i.ITEM) : []); }
 deleteSelected(): void { if (this.selected().length) this.removedMany.emit(this.selected()); }
 onDraftQtyChange(): void {
   const row = this.draft();
   if (!row) return;
   row.SUB_TOTAL = Number(row.CANTIDAD || 0) * Number(row.VALOR_UNITARIO || 0);
   row.VALOR_IVA = row.SUB_TOTAL * Number(row.PORC_IVA ?? (Number(row.POR_IVA || 0) / 100));
   row.TOTAL = row.SUB_TOTAL + row.VALOR_IVA;
 }
 @Output() removed = new EventEmitter<number>();
 @Output() pending = new EventEmitter<boolean>();
 @Output() refreshProducts = new EventEmitter<void>();
 readonly productsVisible = signal(false);
 @Output() stockOnly = new EventEmitter<boolean>();
 readonly draft = signal<Ven230PrefacturaItem | null>(null);
 readonly working = signal(false);
 private readonly business = inject(Ven230BusinessService);
 private readonly notification = inject(XteinNotificationService);
 begin(row?: Ven230PrefacturaItem): void {
  if (this.readOnly || this.busy || this.working() || this.draft()) return;
  if (!row && !this.ready) return;
  this.draft.set(row ? structuredClone(row) : { ITEM: Math.max(0,...this.items.map(i=>i.ITEM))+1,
    ID_UN: '', ID_UN_ITEM: '', ID_DOCUMENTO: '', PREFIJO: '', CONSECUTIVO: 0, SUFIJO: '',
    ID_SOPORTE: '', NC_PREFIJO: '', NC_CONSECUTIVO: 0, NC_SUFIJO: '',
    CANTIDAD_AUTORIZADA: 0, CANTIDAD_PENDIENTE: 0, VALOR_COSTOS: 0, UDM_VENTA: '', FECHA_ENTREGA: null,
    PRODUCTO:'', ATRIBUTO:'SIN', CANTIDAD:0, VALOR_UNITARIO:0, VALOR_BASE:0,
    SUB_TOTAL:0, VALOR_DESCUENTO:0, VALOR_IVA:0, POR_IVA:0, TOTAL:0 });
  this.pending.emit(true);
  if(row && !row.PRESENTACION?.length) void this.loadExistingOptions(row);
 }
 cancel(): void { if (this.working()) return; this.draft.set(null); this.pending.emit(false); }
 async product(value: unknown): Promise<void> {
  const draft = this.draft(); if (!draft || this.working()) return;
  const code = String(value ?? '');
  if (!this.repeatItem && this.items.some(i=>i.ITEM!==draft.ITEM && i.PRODUCTO===code)) {
    this.notification.warning('Ya está registrado este producto.'); draft.PRODUCTO=''; return;
  }
  this.working.set(true);
  try {
    const rows = await this.business.action<Ven230Lookup>('stock', { PRODUCTO:code, PRESENTACION:'SI',
      MOVIMIENTO:'Prefactura', TIPO:'Prefactura', TIPO_CONDICION:this.conditionType,
      ID_CONDICION:this.header.ID_CONDICION, PLAZO:this.header.PLAZO,
      ID_CLIENTE:this.header.ID_CLIENTE, ID_UN_BODEGA:this.header.ID_UN_BODEGA });
    const p=rows[0]; if (!p) throw new Error('No se encontraron existencias del producto.');
    Object.assign(draft,{ PRODUCTO:code,NOMBRE_PRODUCTO:p.NOMBRE,REFERENCIA:p.REFERENCIA,
      VALOR_UNITARIO:Number(p.PRECIO ?? 0),VALOR_BASE:Number(p.VALOR_BASE ?? 0),
      PRESENTACION:p.PRESENTACION ?? [],IVAS:p.IVAS ?? [], GRAV_ORG:undefined, GRAVAMENES:undefined,
      PORC_IVA: 0, POR_IVA: 0, VALOR_IVA: 0, UDM_VENTA: '', UDM_EQUIV: '', CANTIDAD_PRES: 0, CANTIDAD_EQUIV: 0 });
    const unit = p.PRESENTACION?.[0];
    if (unit) { draft.UDM_VENTA=unit.UDM_VENTA; draft.UDM_EQUIV=unit.UDM_EQUIV;
      draft.CANTIDAD_PRES=unit.CANTIDAD_PRES;draft.CANTIDAD_EQUIV=unit.CANTIDAD_EQUIV; }
    if (p.IVAS?.length===1) this.tax(p.IVAS[0].ID_TASA);
    this.draft.set({...draft});
  } catch(error) { draft.PRODUCTO='';this.notification.error(error instanceof Error ? error.message : 'Error consultando producto.'); }
  finally { this.working.set(false); }
 }
 unit(value: unknown): void {
  const row=this.draft(); if(!row)return;
  const unit=row.PRESENTACION?.find(p=>(p.UDM_VENTA ?? p.UDM_COMPRA)===value);
  if(!unit)return;
  if(this.items.some(i=>i.ITEM!==row.ITEM && i.PRODUCTO===row.PRODUCTO && i.UDM_VENTA===value)) {
    this.notification.warning('La unidad de venta está repetida.');row.UDM_VENTA='';return;
  }
  Object.assign(row,{UDM_VENTA:String(value),UDM_EQUIV:unit.UDM_EQUIV,CANTIDAD_PRES:unit.CANTIDAD_PRES,
    CANTIDAD_EQUIV:unit.CANTIDAD_EQUIV,VALOR_UNITARIO:Number(unit.PRECIO ?? row.VALOR_UNITARIO)});
 }
 tax(value: unknown): void {
  const row=this.draft();const tax=row?.IVAS?.find(t=>t.ID_TASA===value);
  if(row && tax) Object.assign(row,{GRAVAMENES:tax,GRAV_ORG:tax,PORC_IVA:Number(tax.PORCENTAJE)/100,POR_IVA:Number(tax.PORCENTAJE)});
 }
 async commit(): Promise<void> {
  const row=this.draft(); if(!row || this.working() || this.busy)return;
  if(!row.PRODUCTO || !(row.CANTIDAD>0)) { this.notification.warning('Complete producto y cantidad.'); return; }
  const previous = this.items.find(item => item.ITEM === row.ITEM);
  if (row.FECHA_ENTREGA && row.FECHA_ENTREGA !== previous?.FECHA_ENTREGA && row.FECHA_ENTREGA.slice(0,10) < this.minimumDeliveryDate) {
    this.notification.warning('La fecha de entrega no puede ser anterior a hoy.'); return;
  }
  if((row.IVAS?.length ?? 0)>1 && !row.GRAV_ORG) {this.notification.warning('Seleccione el IVA del producto.');return;}
  this.working.set(true);
  try {
    await this.business.action('quantity',{ PREFACTURA:this.header, ITEMS:{...row,
      CANTIDAD_PREV:this.items.find(i=>i.ITEM===row.ITEM)?.CANTIDAD ?? 0},...this.business.identity });
    row.SUB_TOTAL=Number(row.CANTIDAD)*Number(row.VALOR_UNITARIO);
    row.CANTIDAD_REAL=Number(row.CANTIDAD_PRES ?? 1)*Number(row.CANTIDAD_EQUIV ?? 1)*row.CANTIDAD;
    row.VALOR_IVA=row.SUB_TOTAL*Number(row.PORC_IVA ?? Number(row.POR_IVA)/100);
    row.TOTAL=row.SUB_TOTAL+row.VALOR_IVA;
    if(await this.persist(structuredClone(row))){this.draft.set(null);this.pending.emit(false);}
  } catch(error) {this.notification.error(error instanceof Error ? error.message : 'Error validando cantidad.');}
  finally {this.working.set(false);}
 }

 private async loadExistingOptions(row:Ven230PrefacturaItem):Promise<void>{
   this.working.set(true);
   try{
     const product=(await this.business.action<Ven230Lookup>('stock',{PRODUCTO:row.PRODUCTO,PRESENTACION:'SI',MOVIMIENTO:'Prefactura',TIPO:'Prefactura',
       TIPO_CONDICION:this.conditionType,ID_CONDICION:this.header.ID_CONDICION,PLAZO:this.header.PLAZO,
       ID_CLIENTE:this.header.ID_CLIENTE,ID_UN_BODEGA:this.header.ID_UN_BODEGA}))[0];
     if(product && this.draft()?.ITEM===row.ITEM)this.draft.update(current=>current?{...current,PRESENTACION:product.PRESENTACION ?? [],IVAS:product.IVAS ?? []}:null);
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
  private cachedProductColumns: XteinGridColumn<Ven230Lookup>[] = [];
  get productColumns(): XteinGridColumn<Ven230Lookup>[] {
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
  taxOptions(): Ven230Lookup[] {
    return (this.draft()?.IVAS ?? []).map(tax => ({...tax,
      LABEL: [tax.ID_TASA, tax.DESCRIPCION, String(tax.PORCENTAJE ?? 0)+'%', this.money(Number(tax.VALOR_BASE ?? 0))].filter(Boolean).join(' · ')}));
  }
  selectedTaxId(): unknown {
    const tax = this.draft()?.GRAV_ORG;
    return tax && typeof tax === 'object' && 'ID_TASA' in tax ? tax.ID_TASA : null;
  }
  presentationOptions(): Ven230Lookup[] {
    return (this.draft()?.PRESENTACION ?? []).map(unit => ({...unit, UDM_VENTA: unit.UDM_VENTA ?? unit.UDM_COMPRA,
      LABEL: [unit.UDM_VENTA ?? unit.UDM_COMPRA, String(unit.CANTIDAD_PRES ?? ''), 'Equiv: '+String(unit.CANTIDAD_EQUIV ?? '')+' '+String(unit.UDM_EQUIV ?? ''), this.money(Number(unit.PRECIO ?? 0))].join(' · ')}));
  }
  selectProductFromDropdown(row: Ven230Lookup): void {
    if (!row.PRODUCTO || this.working() || this.busy) return;
    this.productDropdownOpened = false;
    void this.product(row.PRODUCTO);
  }
  closeProductSearch(): void {
    this.productDropdownOpened = false;
  }
}
