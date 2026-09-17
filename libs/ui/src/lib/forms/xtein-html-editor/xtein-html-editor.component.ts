import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxHtmlEditorModule } from 'devextreme-angular';
import type { ValueChangedEvent } from 'devextreme/ui/html_editor';
@Component({selector:'xtein-html-editor',standalone:true,imports:[DxHtmlEditorModule],
 templateUrl:'./xtein-html-editor.component.html',styleUrl:'./xtein-html-editor.component.scss',
 providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>XteinHtmlEditorComponent),multi:true}]})
export class XteinHtmlEditorComponent implements ControlValueAccessor {
 @Input() value = '';
 @Input() height: number|string = '100%';
 @Input() toolbarContainer: HTMLElement|undefined;
 @Input() toolbarItems: string[] = ['bold','italic','strike','bulletList','orderedList','link','separator','codeBlock','blockquote'];
 @Input() multiline = true;
 @Input() readOnly = false;
 @Input() disabled = false;
 @Output() valueChange = new EventEmitter<string>();
 formDisabled = false;
 private change: (value:string)=>void = ()=>{};
 touched: ()=>void = ()=>{};
 writeValue(value:string|null):void {this.value=value ?? '';}
 registerOnChange(callback:(value:string)=>void):void {this.change=callback;}
 registerOnTouched(callback:()=>void):void {this.touched=callback;}
 setDisabledState(value:boolean):void {this.formDisabled=value;}
 changed(event:ValueChangedEvent):void {
  if(this.value === event.value) return;
  this.value=event.value ?? '';this.change(this.value);this.valueChange.emit(this.value);
 }
}
