import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxCheckBoxModule } from 'devextreme-angular';
@Component({selector:'xtein-checkbox', standalone:true, imports:[DxCheckBoxModule],
  templateUrl:'./xtein-checkbox.component.html', styleUrl:'./xtein-checkbox.component.scss',
  changeDetection:ChangeDetectionStrategy.OnPush,
  providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>XteinCheckboxComponent),multi:true}]})
export class XteinCheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Output() checkedChange = new EventEmitter<boolean>();
  private formDisabled = false;
  private change: (value:boolean)=>void = ()=>{};
  touched: ()=>void = ()=>{};
  constructor(private readonly detector: ChangeDetectorRef) {}
  get isDisabled():boolean { return this.disabled || this.formDisabled; }
  writeValue(value:boolean|null):void {this.checked=!!value;this.detector.markForCheck();}
  registerOnChange(callback:(value:boolean)=>void):void {this.change=callback;}
  registerOnTouched(callback:()=>void):void {this.touched=callback;}
  setDisabledState(value:boolean):void {this.formDisabled=value;this.detector.markForCheck();}
  changed(value:boolean|null|undefined, userEvent:unknown):void {
    if (!userEvent || this.isDisabled || this.readOnly) return;
    this.checked=!!value;this.change(this.checked);this.checkedChange.emit(this.checked);
  }
}
