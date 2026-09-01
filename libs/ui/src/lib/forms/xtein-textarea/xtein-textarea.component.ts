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
  DxTextAreaModule
} from 'devextreme-angular/ui/text-area';


/**
 * Standard XTEIN multiline text input.
 *
 * DevExtreme is encapsulated inside this component so applications
 * and higher-level XTEIN components do not depend directly on
 * DevExtreme controls.
 */
@Component({
  selector: 'xtein-textarea',

  standalone: true,

  imports: [
    DxTextAreaModule
  ],

  templateUrl:
    './xtein-textarea.component.html',

  providers: [
    {
      provide:
        NG_VALUE_ACCESSOR,

      useExisting:
        forwardRef(
          () =>
            XteinTextareaComponent
        ),

      multi:
        true
    }
  ]
})
export class XteinTextareaComponent
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
   * Placeholder displayed when the control is empty.
   */
  @Input()
  placeholder = '';

  /**
   * Accessible label associated with the control.
   */
  @Input()
  ariaLabel = '';

  /**
   * Indicates whether the field is required.
   */
  @Input()
  required = false;

  /**
   * Maximum number of characters accepted.
   *
   * Undefined means that no explicit character limit is applied.
   */
  @Input()
  maxLength:
    number | undefined =
      undefined;

  /**
   * Control height expressed in pixels.
   */
  @Input()
  height = 120;

  /**
   * Minimum control height expressed in pixels.
   */
  @Input()
  minHeight?: number;

  /**
   * Maximum control height expressed in pixels.
   */
  @Input()
  maxHeight?: number;

  /**
   * Determines whether the editor automatically changes
   * its height according to its content.
   */
  @Input()
  autoResizeEnabled = false;

  /**
   * Current text value.
   */
  value = '';

  /**
   * Indicates whether the control is disabled.
   */
  disabled = false;

  /**
   * Angular Forms change callback.
   */
  private onChange:
    (
      value: string
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
   * Null and undefined values are represented visually
   * as an empty text area.
   *
   * @param value Text value.
   */
  writeValue(
    value:
      string | null | undefined
  ): void {

    this.value =
      value ?? '';
  }


  /**
   * Registers the Angular Forms change callback.
   *
   * @param fn Change callback.
   */
  registerOnChange(
    fn:
      (
        value: string
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
   * @param event DevExtreme value change event.
   */
  onValueChanged(
    event: {
      value?:
        string | null;
    }
  ): void {

    const newValue =
      event.value ?? '';

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