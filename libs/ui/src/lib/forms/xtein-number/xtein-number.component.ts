import {
  Component,
  forwardRef,
  Input
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  DxNumberBoxModule
} from 'devextreme-angular/ui/number-box';


/**
 * Standard XTEIN numeric input.
 *
 * DevExtreme is encapsulated inside this component so consuming
 * applications and higher-level XTEIN components do not depend
 * directly on DevExtreme controls.
 */
@Component({
  selector: 'xtein-number',

  standalone: true,

  imports: [
    DxNumberBoxModule
  ],

  templateUrl:
    './xtein-number.component.html',

  providers: [
    {
      provide:
        NG_VALUE_ACCESSOR,

      useExisting:
        forwardRef(
          () =>
            XteinNumberComponent
        ),

      multi:
        true
    }
  ]
})
export class XteinNumberComponent
  implements ControlValueAccessor {

  /**
   * HTML element identifier.
   */
  @Input()
  id = '';

  /**
   * Logical field name.
   */
  @Input()
  name = '';

  /**
   * Placeholder displayed when no value is entered.
   */
  @Input()
  placeholder = '';

  /**
   * Indicates whether the field is required.
   */
  @Input()
  required = false;

  /**
   * Accessible label for the numeric input.
   */
  @Input()
  ariaLabel = '';

  /**
   * Minimum accepted value.
   */
  @Input()
  min?: number;

  /**
   * Maximum accepted value.
   */
  @Input()
  max?: number;

  /**
   * Increment used by the spin buttons.
   */
  @Input()
  step = 1;

  /**
   * Determines whether spin buttons are displayed.
   */
  @Input()
  showSpinButtons = true;

  /**
   * Current numeric value.
   *
   * Null represents an empty numeric field and must be preserved
   * because an empty value is not equivalent to zero.
   */
  value:
    number | null =
      null;

  /**
   * Indicates whether the control is disabled.
   */
  disabled =
    false;

  /**
   * Angular Forms change callback.
   */
  private onChange:
    (
      value:
        number | null
    ) => void =
      () => {};

  /**
   * Angular Forms touched callback.
   */
  private onTouched:
    () => void =
      () => {};

  /**
   * Writes a value from Angular Forms into the component.
   *
   * @param value Numeric form value.
   */
  writeValue(
    value:
      number | null | undefined
  ): void {

    this.value =
      value ?? null;
  }

  /**
   * Registers the Angular Forms change callback.
   *
   * @param fn Change callback.
   */
  registerOnChange(
    fn:
      (
        value:
          number | null
      ) => void
  ): void {

    this.onChange =
      fn;
  }

  /**
   * Registers the Angular Forms touched callback.
   *
   * @param fn Touched callback.
   */
  registerOnTouched(
    fn:
      () => void
  ): void {

    this.onTouched =
      fn;
  }

  /**
   * Synchronizes the disabled state from Angular Forms.
   *
   * @param isDisabled Disabled state.
   */
  setDisabledState(
    isDisabled:
      boolean
  ): void {

    this.disabled =
      isDisabled;
  }

  /**
   * Handles DevExtreme value changes.
   *
   * DevExtreme can return null when the numeric editor is cleared.
   *
   * @param event DevExtreme value change event.
   */
  onValueChanged(
    event: {
      value?:
        number | null;
    }
  ): void {

    const newValue =
      event.value ??
      null;

    this.value =
      newValue;

    this.onChange(
      newValue
    );
  }

  /**
   * Marks the control as touched.
   */
  onFocusOut(): void {

    this.onTouched();
  }
}