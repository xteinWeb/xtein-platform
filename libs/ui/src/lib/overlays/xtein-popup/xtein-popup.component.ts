import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DxPopupModule } from 'devextreme-angular';
@Component({selector:'xtein-popup', standalone:true, imports:[DxPopupModule],
  templateUrl:'./xtein-popup.component.html', styleUrl:'./xtein-popup.component.scss'})
export class XteinPopupComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() width: string | number = 'min(900px, 95vw)';
  @Input() height: string | number = 'min(600px, 90dvh)';
  @Input() showCloseButton = true;
  @Input() hideOnOutsideClick = false;
  @Output() visibleChange = new EventEmitter<boolean>();
}
