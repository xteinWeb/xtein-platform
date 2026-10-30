import { XteinLabelComponent } from '../xtein-label/xtein-label.component';
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
  DxTextBoxModule
} from 'devextreme-angular';

import type {
  ValueChangedEvent
} from 'devextreme/ui/text_box';

/**
 * Standard XTEIN password input based on DevExtreme TextBox.
 *
 * An eye button inside the field shows or hides the typed
 * password, so the user can check it before submitting.
 *
 * Visual appearance is provided exclusively by the global
 * XTEIN theme.
 */
@Component({
  selector: 'xtein-password',
  standalone: true,

  imports: [XteinLabelComponent,
    DxTextBoxModule
  ],

  templateUrl:
    './xtein-password.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    '[attr.id]': 'null',
    class: 'd-block w-100'
  },

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting:
        forwardRef(() => XteinPasswordComponent),
      multi: true
    }
  ]
})
export class XteinPasswordComponent
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
  name = '';

  @Input()
  autocomplete =
    'current-password';

  @Input()
  maxLength = 128;

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

  value = '';

  /**
   * Whether the password is shown as plain text.
   */
  passwordVisible = false;

  /**
   * Options of the eye button. Rebuilt on each toggle so
   * DevExtreme refreshes its icon and accessible label.
   */
  toggleButtonOptions =
    this.buildToggleButtonOptions();

  private formDisabled = false;

  private onChange:
    (value: string) => void =
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
      Record<string, string> = {
        autocomplete:
          this.autocomplete
      };

    if (this.id) {
      attributes['id'] =
        this.id;
    }

    if (this.name) {
      attributes['name'] =
        this.name;
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
    value: string | null | undefined
  ): void {

    this.value =
      value ?? '';

    this.changeDetector
      .markForCheck();
  }

  registerOnChange(
    callback: (value: string) => void
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

    const nextValue =
      typeof event.value === 'string'
        ? event.value
        : '';

    this.value =
      nextValue;

    this.onChange(
      nextValue
    );
  }

  handleFocusOut(): void {

    this.onTouched();
    this.blurred.emit();
  }

  private togglePasswordVisibility():
    void {

    this.passwordVisible =
      !this.passwordVisible;

    this.toggleButtonOptions =
      this.buildToggleButtonOptions();

    this.changeDetector
      .markForCheck();
  }

  private buildToggleButtonOptions():
    Record<string, unknown> {

    return {
      icon:
        this.passwordVisible
          ? 'eyeclose'
          : 'eyeopen',
      stylingMode:
        'text',
      focusStateEnabled:
        false,
      hint:
        this.passwordVisible
          ? 'Ocultar contraseña'
          : 'Mostrar contraseña',
      elementAttr: {
        'aria-label':
          this.passwordVisible
            ? 'Ocultar contraseña'
            : 'Mostrar contraseña'
      },
      onClick: () =>
        this.togglePasswordVisibility()
    };
  }
}