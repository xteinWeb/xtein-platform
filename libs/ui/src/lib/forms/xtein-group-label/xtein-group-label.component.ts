import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Standard XTEIN group title label component.
 *
 * Provides the unified legacy-aligned typography and color
 * for form section captions and fieldset legends.
 */
@Component({
  selector: 'xtein-group-label',
  standalone: true,
  template: `
    <span class="xtein-group-label" [class.xtein-group-label--required]="required">
      @if (label) {
        {{ label }}
      } @else {
        <ng-content></ng-content>
      }
      @if (required) {
        <span class="xtein-group-label__required" aria-hidden="true">*</span>
      }
    </span>
  `,
  styleUrls: ['./xtein-group-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'xtein-group-label-host'
  }
})
export class XteinGroupLabelComponent {
  @Input() label = '';
  @Input() required = false;
}
