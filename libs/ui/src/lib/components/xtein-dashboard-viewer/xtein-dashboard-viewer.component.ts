import { ChangeDetectionStrategy, Component, Input, ViewChild, signal } from '@angular/core';
import { DxPopupModule, DxDataGridModule } from 'devextreme-angular';
import { DashboardControl, DashboardPanelExtension } from 'devexpress-dashboard';
import { XteinDashboardCardInteractionExtension } from '@xtein/dashboard-runtime';
import { XteinDashboardComponent } from '../xtein-dashboard/xtein-dashboard.component';

@Component({
  selector: 'xtein-dashboard-viewer', standalone: true,
  imports: [XteinDashboardComponent, DxPopupModule, DxDataGridModule],
  templateUrl: './xtein-dashboard-viewer.component.html',
  styleUrl: './xtein-dashboard-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinDashboardViewerComponent {
  @Input() dashboardId = '';
  @Input() dashboardType = '';
  @ViewChild(XteinDashboardComponent) private dashboard?: XteinDashboardComponent;
  readonly detailsVisible = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly error = signal('');

  ready(control: DashboardControl): void {
    (control.findExtension('dashboard-panel') as DashboardPanelExtension | undefined)?.visible(false);
    if (this.dashboardType.trim().toUpperCase() !== 'KPIPANEL') return;
    control.registerExtension(new XteinDashboardCardInteractionExtension(control, (rows, error) => {
      this.rows.set(rows); this.error.set(error); this.detailsVisible.set(true);
    }));
  }

  refresh(): void { this.dashboard?.refresh(); }
}
