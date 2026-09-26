import { Component, EventEmitter, Input, OnChanges, Output, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DxDropDownBoxModule, DxTemplateModule } from 'devextreme-angular';

/** Drop-down container for selections that have an explicit accept/cancel step. */
@Component({
  selector: 'xtein-drop-down-panel', standalone: true,
  imports: [DxDropDownBoxModule, DxTemplateModule, NgTemplateOutlet],
  template: `
    <dx-drop-down-box [opened]="opened" (openedChange)="changeOpened($event)"
      [disabled]="disabled" [readOnly]="readOnly" [placeholder]="placeholder"
      [inputAttr]="{ 'aria-label': ariaLabel || placeholder }"
      [dropDownOptions]="{ width: panelWidth, height: panelHeight, hideOnParentScroll: true }">
      <div *dxTemplate="let data of 'content'" class="xtein-drop-down-panel__content">
        <ng-container [ngTemplateOutlet]="contentTemplate" />
      </div>
    </dx-drop-down-box>`,
  styles: [`:host { display: block; min-width: 0; }
    .xtein-drop-down-panel__content { height: 100%; min-height: 0; display: flex; flex-direction: column; }`]
})
export class XteinDropDownPanelComponent implements OnChanges {
  @Input() opened = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() placeholder = '';
  @Input() ariaLabel = '';
  @Input() panelWidth: string | number = 'min(640px, 95vw)';
  @Input() panelHeight: string | number = 'min(440px, 75dvh)';
  @Input() contentTemplate: TemplateRef<unknown> | null = null;
  @Output() readonly openedChange = new EventEmitter<boolean>();
  ngOnChanges(): void {
    if ((this.disabled || this.readOnly) && this.opened) this.changeOpened(false);
  }
  changeOpened(value: boolean): void {
    this.opened = value && !this.disabled && !this.readOnly;
    this.openedChange.emit(this.opened);
  }
}
