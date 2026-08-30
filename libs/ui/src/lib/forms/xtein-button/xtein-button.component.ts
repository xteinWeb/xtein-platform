import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  DxButtonModule
} from 'devextreme-angular';

import type {
  ClickEvent
} from 'devextreme/ui/button';

/**
 * Defines the standard XTEIN button variants.
 */
export type XteinButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'link';

/**
 * Standard XTEIN button based on DevExtreme Button.
 *
 * Visual appearance is provided exclusively by the global
 * XTEIN theme.
 */
@Component({
  selector: 'xtein-button',
  standalone: true,

  imports: [
    DxButtonModule
  ],

  templateUrl:
    './xtein-button.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    class: 'd-block'
  }
})
export class XteinButtonComponent {

  @Input()
  text = '';

  @Input()
  variant:
    XteinButtonVariant =
      'primary';

  @Input()
  disabled = false;

  @Input()
  submit = false;

  @Input()
  width:
    string | number =
      '100%';

  @Output()
  readonly clicked =
    new EventEmitter<void>();

  /**
   * DevExtreme button type corresponding to the XTEIN variant.
   */
  get buttonType():
    'normal' |
    'default' |
    'success' |
    'danger' {

    switch (this.variant) {

      case 'success':
        return 'success';

      case 'danger':
        return 'danger';

      case 'primary':
        return 'default';

      case 'secondary':
      case 'link':
      default:
        return 'normal';
    }
  }

  /**
   * DevExtreme styling mode corresponding to the XTEIN variant.
   */
  get stylingMode():
    'contained' |
    'outlined' |
    'text' {

    switch (this.variant) {

      case 'secondary':
        return 'outlined';

      case 'link':
        return 'text';

      default:
        return 'contained';
    }
  }

  handleClick(
    event: ClickEvent
  ): void {

    if (this.disabled) {
      return;
    }

    if (!this.submit) {
      event.event?.preventDefault();
    }

    this.clicked.emit();
  }
}