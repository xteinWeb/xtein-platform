import { Component, Input, forwardRef, ChangeDetectorRef, OnChanges, AfterViewInit, ViewChild, DestroyRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxDropDownBoxComponent, DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';
import type { ValueChangedEvent } from 'devextreme/ui/drop_down_box';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridColumn } from '../../data/xtein-data-grid/models/xtein-data-grid.model';
@Component({selector:'xtein-lookup',standalone:true,
 imports:[DxDropDownBoxModule,DxTemplateModule,XteinDataGridComponent],
 templateUrl:'./xtein-lookup.component.html',styleUrl:'./xtein-lookup.component.scss',
 host:{'[attr.id]':'null'},
 providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>XteinLookupComponent),multi:true}]})
export class XteinLookupComponent<T extends object = Record<string,unknown>> implements ControlValueAccessor, OnChanges, AfterViewInit {
 @Input() autoFocus = false;
 @Input() selectionMode: 'single' | 'multiple' = 'single';
 @ViewChild(DxDropDownBoxComponent) private editor?: DxDropDownBoxComponent;
 private readonly destroyRef = inject(DestroyRef);
 ngAfterViewInit(): void {
  if (this.autoFocus) queueMicrotask(() => this.focus());
 }
 focus(): void {
  if (!this.destroyRef.destroyed && !this.isDisabled && !this.readOnly) this.editor?.instance.focus();
 }
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
 @Input() dropDownWidth: string | number = 'min(600px, 95vw)';
 @Input() dropDownHeight: string | number = 'min(320px, 65dvh)';
 get dropDownOptions(): { width: string | number; height: string | number; hideOnParentScroll: boolean } {
  return { width: this.dropDownWidth, height: this.dropDownHeight, hideOnParentScroll: true };
 }
 value: unknown = null;
 opened = false;
 private formDisabled = false;
 private change: (value:unknown)=>void = ()=>{};
 touched: ()=>void = ()=>{};
 constructor(private readonly detector:ChangeDetectorRef) {}
 get isDisabled():boolean {return this.disabled || this.formDisabled;}
 selectedKeys: unknown[] = [];
 private setValue(value:unknown):void {
  this.value=this.selectionMode === 'multiple' ? (Array.isArray(value) ? [...value] : value == null || value === '' ? [] : [value]) : value;
  this.selectedKeys=this.selectionMode === 'multiple' ? [...this.value as unknown[]] : value == null || value === '' ? [] : [value];
 }
 selectMultiple(keys:unknown[]):void {
  if(this.selectionMode !== 'multiple' || this.isDisabled || this.readOnly)return;
  if(keys.length === this.selectedKeys.length && keys.every(key=>this.selectedKeys.includes(key)))return;
  this.setValue(keys);this.change(this.value);this.touched();
 }
 ngOnChanges():void {if(this.isDisabled || this.readOnly)this.opened=false;}
 writeValue(value:unknown):void {this.setValue(value);this.detector.markForCheck();}
 registerOnChange(callback:(value:unknown)=>void):void {this.change=callback;}
 registerOnTouched(callback:()=>void):void {this.touched=callback;}
 setDisabledState(value:boolean):void {this.formDisabled=value;if(value)this.opened=false;this.detector.markForCheck();}
 choose(row:T):void {
  if(this.isDisabled || this.readOnly || this.selectionMode === 'multiple')return;
  const value=(row as Record<string,unknown>)[this.valueExpr];
  if(value == null)return;
  if(value !== this.value){this.setValue(value);this.change(value);}
  this.opened=false;this.touched();
 }
 changed(event:ValueChangedEvent):void {
  if(event.event && (event.value == null || (Array.isArray(event.value) && !event.value.length)) && !this.isDisabled && !this.readOnly){this.setValue(null);this.change(this.value);this.touched();}
 }
}
