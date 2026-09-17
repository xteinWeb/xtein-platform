import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
@Component({selector:'xtein-label',standalone:true,templateUrl:'./xtein-label.component.html',
  styleUrl:'./xtein-label.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class XteinLabelComponent {
  @Input() for = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() invalid = false;
}
