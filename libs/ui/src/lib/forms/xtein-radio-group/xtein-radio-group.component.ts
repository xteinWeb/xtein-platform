import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  forwardRef, Input, Output
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxRadioGroupModule } from 'devextreme-angular';
import { XteinLabelComponent } from '../xtein-label/xtein-label.component';

/** Radio selection using the shared XTEIN theme and Angular forms contract. */
@Component({
  selector: 'xtein-radio-group',
  standalone: true,
  imports: [DxRadioGroupModule, XteinLabelComponent],
  templateUrl: './xtein-radio-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.id]': 'null', class: 'd-block' },
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => XteinRadioGroupComponent),
    multi: true
  }]
})
export class XteinRadioGroupComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() displayExpr = '';
  @Input() valueExpr = 'this';
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() value: unknown = null;
  @Input() set items(value: readonly unknown[]) {
    this.options = [...value];
  }
  @Output() readonly valueChange = new EventEmitter<unknown>();

  options: unknown[] = [];
  private formDisabled = false;
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  get isDisabled(): boolean { return this.disabled || this.formDisabled; }

  writeValue(value: unknown): void {
    this.value = value;
    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    this.formDisabled = disabled;
    this.changeDetector.markForCheck();
  }

  handleValueChanged(event: { value?: unknown; event?: unknown }): void {
    this.value = event.value;
    // Programmatic writes must not mark the parent form dirty.
    if (event.event && !this.isDisabled && !this.readOnly) {
      this.onChange(this.value);
      this.valueChange.emit(this.value);
    }
    this.changeDetector.markForCheck();
  }

  handleFocusOut(): void { this.onTouched(); }
}
