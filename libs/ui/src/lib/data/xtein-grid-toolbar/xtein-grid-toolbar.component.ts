import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XteinGridToolbarAction } from '../xtein-data-grid/models/xtein-data-grid.model';

@Component({
  selector: 'xtein-grid-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xtein-grid-toolbar.component.html',
  styleUrls: ['./xtein-grid-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinGridToolbarComponent {
  @Input() actions: XteinGridToolbarAction[] = [];
  @Input() visible = true;
  @Output() actionClick = new EventEmitter<XteinGridToolbarAction>();

  handleClick(btn: XteinGridToolbarAction): void {
    if (btn.disabled) return;
    btn.action?.();
    this.actionClick.emit(btn);
  }
}
