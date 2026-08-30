import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  DxSelectBoxModule
} from 'devextreme-angular';

import type {
  ValueChangedEvent
} from 'devextreme/ui/select_box';

/**
 * Standard XTEIN select control based on DevExtreme SelectBox.
 *
 * Visual appearance is provided exclusively by the global
 * XTEIN theme.
 */
@Component({
  selector: 'xtein-select',
  standalone: true,

  imports: [
    DxSelectBoxModule
  ],

  templateUrl:
    './xtein-select.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    class: 'd-block w-100'
  },

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting:
        forwardRef(() => XteinSelectComponent),
      multi: true
    }
  ]
})
export class XteinSelectComponent
  implements ControlValueAccessor {

  @Input()
  id = '';

  @Input()
  label = '';

  @Input()
  ariaLabel = '';

  @Input()
  placeholder = '';

  @Input()
  items: unknown[] = [];

  @Input()
  displayExpr = '';

  @Input()
  valueExpr = '';

  @Input()
  searchEnabled = false;

  @Input()
  showClearButton = false;

  @Input()
  noDataText = 'Sin datos';

  @Input()
  required = false;

  @Input()
  readOnly = false;

  @Input()
  disabled = false;

  @Input()
  invalid = false;

  @Input()
  errorMessage = '';

  @Output()
  readonly blurred =
    new EventEmitter<void>();

  value: unknown = null;

  private formDisabled = false;

  private onChange:
    (value: unknown) => void =
      () => undefined;

  private onTouched:
    () => void =
      () => undefined;

  constructor(
    private readonly changeDetector:
      ChangeDetectorRef
  ) {
  }

  get isDisabled(): boolean {
    return (
      this.disabled ||
      this.formDisabled
    );
  }

  get inputAttributes():
    Record<string, string> {

    const attributes:
      Record<string, string> = {};

    if (this.id) {
      attributes['id'] =
        this.id;
    }

    if (this.ariaLabel) {
      attributes['aria-label'] =
        this.ariaLabel;
    }

    if (this.required) {
      attributes['aria-required'] =
        'true';
    }

    if (this.invalid) {
      attributes['aria-invalid'] =
        'true';
    }

    return attributes;
  }

  writeValue(
    value: unknown
  ): void {

    this.value =
      value ?? null;

    this.changeDetector
      .markForCheck();
  }

  registerOnChange(
    callback: (value: unknown) => void
  ): void {

    this.onChange =
      callback;
  }

  registerOnTouched(
    callback: () => void
  ): void {

    this.onTouched =
      callback;
  }

  setDisabledState(
    isDisabled: boolean
  ): void {

    this.formDisabled =
      isDisabled;

    this.changeDetector
      .markForCheck();
  }

  handleValueChanged(
    event: ValueChangedEvent
  ): void {

    this.value =
      event.value ?? null;

    this.onChange(
      this.value
    );
  }

  handleFocusOut(): void {

    this.onTouched();
    this.blurred.emit();
  }
}