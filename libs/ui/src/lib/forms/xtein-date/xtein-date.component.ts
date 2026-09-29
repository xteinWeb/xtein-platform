import { XteinLabelComponent } from '../xtein-label/xtein-label.component';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxDateBoxModule } from 'devextreme-angular';
import type { ValueChangedEvent } from 'devextreme/ui/date_box';

@Component({
  host: {'[attr.id]': 'null'},
  selector: 'xtein-date', standalone: true, imports: [XteinLabelComponent,DxDateBoxModule],
  templateUrl: './xtein-date.component.html', styleUrl: './xtein-date.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => XteinDateComponent), multi: true }]
})
export class XteinDateComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() name = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() min: string | null = null;
  @Input() max: string | null = null;
  value: string | null = null;
  private formDisabled = false;
  private onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};
  constructor(private readonly detector: ChangeDetectorRef) {}
  get isDisabled(): boolean { return this.disabled || this.formDisabled; }
  get inputAttributes(): Record<string, string> {
    return { id: this.id, name: this.name, 'aria-label': this.label || this.name, 'aria-required': String(this.required) };
  }
  writeValue(value: string | null): void { this.value = value || null; this.detector.markForCheck(); }
  registerOnChange(callback: (value: string | null) => void): void { this.onChange = callback; }
  registerOnTouched(callback: () => void): void { this.onTouched = callback; }
  setDisabledState(disabled: boolean): void { this.formDisabled = disabled; this.detector.markForCheck(); }
  changed(event: ValueChangedEvent): void {
    const value = event.value;
    this.value = value instanceof Date
      ? [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-')
      : value ? String(value).slice(0, 10) : null;
    this.onChange(this.value);
  }
}
