import { Component, Input, forwardRef, ChangeDetectorRef, OnChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';
import type { ValueChangedEvent } from 'devextreme/ui/drop_down_box';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridColumn } from '../../data/xtein-data-grid/models/xtein-data-grid.model';
@Component({selector:'xtein-lookup',standalone:true,
 imports:[DxDropDownBoxModule,DxTemplateModule,XteinDataGridComponent],
 templateUrl:'./xtein-lookup.component.html',styleUrl:'./xtein-lookup.component.scss',
 host:{'[attr.id]':'null'},
 providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>XteinLookupComponent),multi:true}]})
export class XteinLookupComponent<T extends object = Record<string,unknown>> implements ControlValueAccessor, OnChanges {
 @Input() id = '';
 @Input() ariaLabel = '';
 @Input() placeholder = 'Seleccionar…';
 @Input() searchPlaceholder = 'Buscar…';
 @Input() items: T[] = [];
 @Input() valueExpr = '';
 @Input() displayExpr = '';
 @Input() columns: XteinGridColumn<T,unknown>[] = [];
 @Input() readOnly = false;
 @Input() disabled = false;
 @Input() required = false;
 @Input() showClearButton = false;
 readonly dropDownOptions = {width:'min(680px, 95vw)',height:'min(380px, 65dvh)',hideOnParentScroll:true};
 value: unknown = null;
 opened = false;
 private formDisabled = false;
 private change: (value:unknown)=>void = ()=>{};
 touched: ()=>void = ()=>{};
 constructor(private readonly detector:ChangeDetectorRef) {}
 get isDisabled():boolean {return this.disabled || this.formDisabled;}
 selectedKeys: unknown[] = [];
 private setValue(value:unknown):void {this.value=value;this.selectedKeys=value == null || value === '' ? [] : [value];}
 ngOnChanges():void {if(this.isDisabled || this.readOnly)this.opened=false;}
 writeValue(value:unknown):void {this.setValue(value);this.detector.markForCheck();}
 registerOnChange(callback:(value:unknown)=>void):void {this.change=callback;}
 registerOnTouched(callback:()=>void):void {this.touched=callback;}
 setDisabledState(value:boolean):void {this.formDisabled=value;if(value)this.opened=false;this.detector.markForCheck();}
 choose(row:T):void {
  if(this.isDisabled || this.readOnly)return;
  const value=(row as Record<string,unknown>)[this.valueExpr];
  if(value == null)return;
  if(value !== this.value){this.setValue(value);this.change(value);}
  this.opened=false;this.touched();
 }
 changed(event:ValueChangedEvent):void {
  if(event.event && event.value == null && !this.isDisabled && !this.readOnly){this.setValue(null);this.change(null);this.touched();}
 }
}
