import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  DxTextBoxComponent,
  DxTextBoxModule
} from 'devextreme-angular';

import type {
  ValueChangedEvent
} from 'devextreme/ui/text_box';

/**
 * Standard XTEIN text input based on DevExtreme TextBox.
 *
 * Visual appearance is provided exclusively by the global
 * XTEIN theme.
 */
@Component({
  selector: 'xtein-input',
  standalone: true,

  imports: [
    DxTextBoxModule
  ],

  templateUrl:
    './xtein-input.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    class: 'd-block w-100'
  },

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting:
        forwardRef(() => XteinInputComponent),
      multi: true
    }
  ]
})
export class XteinInputComponent
  implements ControlValueAccessor, AfterViewInit {

  /**
   * Internal DevExtreme TextBox instance.
   */
  @ViewChild(DxTextBoxComponent)
  private editor?: DxTextBoxComponent;

  /**
   * Identifier applied to the native input.
   */
  @Input()
  id = '';

  /**
   * Optional visible field label.
   */
  @Input()
  label = '';

  /**
   * Accessible label used when no visible label exists.
   */
  @Input()
  ariaLabel = '';

  /**
   * Placeholder displayed when the control is empty.
   */
  @Input()
  placeholder = '';

  /**
   * Native input name.
   */
  @Input()
  name = '';

  /**
   * Browser autocomplete behavior.
   */
  @Input()
  autocomplete = 'off';

  /**
   * Indicates whether the input must receive focus
   * automatically after it is rendered.
   */
  @Input()
  autoFocus = false;

  /**
   * Maximum accepted number of characters.
   */
  @Input()
  maxLength?: number;

  /**
   * Indicates whether the field is required.
   */
  @Input()
  required = false;

  /**
   * Indicates whether the field is read-only.
   */
  @Input()
  readOnly = false;

  /**
   * Allows explicit disabling outside Angular Forms.
   */
  @Input()
  disabled = false;

  /**
   * Indicates whether the control is invalid.
   */
  @Input()
  invalid = false;

  /**
   * Optional validation message.
   */
  @Input()
  errorMessage = '';

  /**
   * Fired when the editor loses focus.
   */
  @Output()
  readonly blurred =
    new EventEmitter<void>();

  /**
   * Current control value.
   */
  value = '';

  /**
   * Disabled state provided by Angular Forms.
   */
  private formDisabled = false;

  /**
   * Angular Forms value change callback.
   */
  private onChange:
    (value: string) => void =
      () => undefined;

  /**
   * Angular Forms touched callback.
   */
  private onTouched:
    () => void =
      () => undefined;

  constructor(
    private readonly changeDetector:
      ChangeDetectorRef
  ) {
  }

  /**
   * Applies initial focus when requested.
   */
  ngAfterViewInit(): void {

    if (!this.autoFocus) {
      return;
    }

    queueMicrotask(
      () => this.focus()
    );
  }

  /**
   * Gives focus to the internal DevExtreme editor.
   *
   * This method can also be used programmatically by
   * consuming applications.
   */
  focus(): void {
    this.editor?.instance.focus();
  }

  /**
   * Indicates whether the control is currently disabled.
   */
  get isDisabled(): boolean {
    return (
      this.disabled ||
      this.formDisabled
    );
  }

  /**
   * Native attributes passed to the DevExtreme editor.
   */
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

  /**
   * Writes a value from Angular Forms.
   *
   * @param value Form value.
   */
  writeValue(
    value: string | null | undefined
  ): void {

    this.value =
      value ?? '';

    this.changeDetector
      .markForCheck();
  }

  /**
   * Registers the Angular Forms change callback.
   *
   * @param callback Change callback.
   */
  registerOnChange(
    callback: (value: string) => void
  ): void {

    this.onChange =
      callback;
  }

  /**
   * Registers the Angular Forms touched callback.
   *
   * @param callback Touched callback.
   */
  registerOnTouched(
    callback: () => void
  ): void {

    this.onTouched =
      callback;
  }

  /**
   * Updates the disabled state provided by Angular Forms.
   *
   * @param isDisabled Disabled state.
   */
  setDisabledState(
    isDisabled: boolean
  ): void {

    this.formDisabled =
      isDisabled;

    this.changeDetector
      .markForCheck();
  }

  /**
   * Handles DevExtreme value changes.
   *
   * @param event Value change event.
   */
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

  /**
   * Handles focus loss.
   */
  handleFocusOut(): void {

    this.onTouched();
    this.blurred.emit();
  }
}