import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { XteinButtonComponent } from '../../forms/xtein-button/xtein-button.component';

@Component({
  selector: 'xtein-dashboard-frame', standalone: true,
  imports: [XteinButtonComponent],
  templateUrl: './xtein-dashboard-frame.component.html',
  styleUrl: './xtein-dashboard-frame.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinDashboardFrameComponent {
  readonly fullscreen = signal(false);
  toggleFullscreen(): void { this.fullscreen.update(value => !value); }
}
