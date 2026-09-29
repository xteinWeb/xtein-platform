import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DxSwitchModule } from 'devextreme-angular';
import { XteinLabelComponent } from '../xtein-label/xtein-label.component';

/**
 * Standard XTEIN switch/toggle control based on DevExtreme Switch.
 * Implements ControlValueAccessor for seamless reactive form integration.
 */
@Component({
  selector: 'xtein-switch',
  standalone: true,
  imports: [CommonModule, FormsModule, DxSwitchModule, XteinLabelComponent],
  templateUrl: './xtein-switch.component.html',
  styleUrls: ['./xtein-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => XteinSwitchComponent),
      multi: true
    }
  ]
})
export class XteinSwitchComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() switchedOnText = '';
  @Input() switchedOffText = '';
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() value = false;

  @Output() readonly valueChange = new EventEmitter<boolean>();

  private formDisabled = false;
  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  writeValue(val: unknown): void {
    this.value = Boolean(val);
    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: (val: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
    this.changeDetector.markForCheck();
  }

  handleValueChanged(event: { value?: boolean; event?: unknown }): void {
    const newValue = Boolean(event.value);
    this.value = newValue;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.changeDetector.markForCheck();
  }

  handleFocusOut(): void {
    this.onTouched();
  }
}
