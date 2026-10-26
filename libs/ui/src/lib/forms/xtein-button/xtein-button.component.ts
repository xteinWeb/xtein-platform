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
  icon = '';

  @Input()
  ariaLabel = '';

  @Input()
  pressed: boolean | null = null;

  /**
   * DevExtreme toma un nombre sin espacios como ícono propio (dx-icon-<nombre>); los íconos de la fuente
   * XTEIN (icon-*) necesitan un espacio para que los pinte como clase CSS de fuente.
   * Se mapean 'trash' y 'delete' automáticamente a ' icon-eliminar-sl' de la fuente corporativa XTEIN.
   */
  get dxIcon(): string {
    if (this.icon === 'trash' || this.icon === 'delete') {
      return ' icon-eliminar-sl';
    }
    return /^icon-[\w-]+$/.test(this.icon) ? ' ' + this.icon : this.icon;
  }

  get elementAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (this.ariaLabel) attributes['aria-label'] = this.ariaLabel;
    if (this.pressed !== null) attributes['aria-pressed'] = String(this.pressed);
    return attributes;
  }

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

  @Input('stylingMode')
  customStylingMode?:
    'contained' |
    'outlined' |
    'text';

  @Output()
  readonly clicked =
    new EventEmitter<void>();

  @Output()
  readonly onClick =
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

    if (this.customStylingMode) {
      return this.customStylingMode;
    }

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
    this.onClick.emit();
  }
}
