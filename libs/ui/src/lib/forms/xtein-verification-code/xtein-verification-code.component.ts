import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

/**
 * Standard XTEIN six-digit verification-code control.
 *
 * The component provides focus movement, paste handling,
 * numeric filtering, and Angular Forms integration.
 */
@Component({
  selector: 'xtein-verification-code',
  standalone: true,

  templateUrl:
    './xtein-verification-code.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    class: 'd-block w-100'
  },

  providers: [
    {
      provide:
        NG_VALUE_ACCESSOR,

      useExisting:
        forwardRef(
          () =>
            XteinVerificationCodeComponent
        ),

      multi: true
    }
  ]
})
export class XteinVerificationCodeComponent
  implements ControlValueAccessor, AfterViewInit {

  private static readonly codeLength =
    6;

  @ViewChildren('digitInput')
  private digitInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  /**
   * Accessible description for the code control.
   */
  @Input()
  ariaLabel =
    'Código de verificación';

  /**
   * Indicates whether the first digit receives
   * focus when the control is created.
   */
  @Input()
  autoFocus = false;

  /**
   * Allows explicit disabling outside Angular Forms.
   */
  @Input()
  disabled = false;

  /**
   * Individual verification-code digits.
   */
  readonly digits: string[] =
    Array.from(
      {
        length:
          XteinVerificationCodeComponent
            .codeLength
      },
      () => ''
    );

  private formDisabled =
    false;

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

  /**
   * Indicates whether the control is disabled.
   */
  get isDisabled(): boolean {
    return (
      this.disabled ||
      this.formDisabled
    );
  }

  ngAfterViewInit(): void {

    if (
      this.autoFocus
    ) {

      queueMicrotask(
        () => this.focusDigit(0)
      );
    }
  }

  /**
   * Writes a form value into the six digit fields.
   */
  writeValue(
    value: string | null | undefined
  ): void {

    const normalizedValue =
      (value ?? '')
        .replace(/\D/g, '')
        .slice(
          0,
          XteinVerificationCodeComponent
            .codeLength
        );

    for (
      let index = 0;
      index <
      XteinVerificationCodeComponent
        .codeLength;
      index += 1
    ) {

      this.digits[index] =
        normalizedValue[index] ?? '';
    }

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

  /**
   * Handles a digit input.
   */
  handleInput(
    event: Event,
    index: number
  ): void {

    const input =
      event.target as HTMLInputElement;

    const numericValue =
      input.value
        .replace(/\D/g, '');

    const digit =
      numericValue
        .slice(-1);

    this.digits[index] =
      digit;

    input.value =
      digit;

    this.emitValue();

    if (
      digit &&
      index <
      XteinVerificationCodeComponent
        .codeLength - 1
    ) {

      this.focusDigit(
        index + 1
      );
    }
  }

  /**
   * Supports deleting backward and keyboard navigation.
   */
  handleKeyDown(
    event: KeyboardEvent,
    index: number
  ): void {

    if (
      event.key === 'Backspace' &&
      !this.digits[index] &&
      index > 0
    ) {

      this.focusDigit(
        index - 1
      );

      return;
    }

    if (
      event.key === 'ArrowLeft' &&
      index > 0
    ) {

      event.preventDefault();

      this.focusDigit(
        index - 1
      );

      return;
    }

    if (
      event.key === 'ArrowRight' &&
      index <
      XteinVerificationCodeComponent
        .codeLength - 1
    ) {

      event.preventDefault();

      this.focusDigit(
        index + 1
      );
    }
  }

  /**
   * Allows pasting the complete six-digit code.
   */
  handlePaste(
    event: ClipboardEvent,
    startIndex: number
  ): void {

    event.preventDefault();

    const value =
      event.clipboardData
        ?.getData('text')
        .replace(/\D/g, '') ??
      '';

    if (!value) {
      return;
    }

    const availableDigits =
      value.slice(
        0,
        XteinVerificationCodeComponent
          .codeLength - startIndex
      );

    for (
      let offset = 0;
      offset <
      availableDigits.length;
      offset += 1
    ) {

      this.digits[
        startIndex + offset
      ] =
        availableDigits[offset];
    }

    this.emitValue();

    this.changeDetector
      .markForCheck();

    const nextIndex =
      Math.min(
        startIndex +
          availableDigits.length,
        XteinVerificationCodeComponent
          .codeLength - 1
      );

    queueMicrotask(
      () =>
        this.focusDigit(
          nextIndex
        )
    );
  }

  /**
   * Marks the control as touched.
   */
  handleBlur(): void {
    this.onTouched();
  }

  /**
   * Emits the complete code to Angular Forms.
   */
  private emitValue(): void {

    this.onChange(
      this.digits.join('')
    );
  }

  /**
   * Gives focus to a specific digit.
   */
  private focusDigit(
    index: number
  ): void {

    const element =
      this.digitInputs
        .get(index)
        ?.nativeElement;

    element?.focus();
    element?.select();
  }
}