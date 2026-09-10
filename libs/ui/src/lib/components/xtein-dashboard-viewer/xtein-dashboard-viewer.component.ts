import { ChangeDetectionStrategy, Component, Input, ViewChild, signal } from '@angular/core';
import { DxPopupModule, DxDataGridModule } from 'devextreme-angular';
import { DashboardControl } from 'devexpress-dashboard';
import { DashboardLastUpdatedExtension, XteinDashboardCardInteractionExtension } from '@xtein/dashboard-runtime';
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
  @Input() lastUpdated?: string;
  @ViewChild(XteinDashboardComponent) private dashboard?: XteinDashboardComponent;
  readonly detailsVisible = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly error = signal('');

  ready(control: DashboardControl): void {
    // Hiding this panel leaves its reserved surface width. Removing it releases
    // that space; dashboard selection is already handled by the workspace tabs.
    control.unregisterExtension('dashboard-panel');
    if (this.lastUpdated) control.registerExtension(new DashboardLastUpdatedExtension(control, this.lastUpdated));
    if (this.dashboardType.trim().toUpperCase() !== 'KPIPANEL') return;
    control.registerExtension(new XteinDashboardCardInteractionExtension(control, (rows, error) => {
      this.rows.set(rows); this.error.set(error); this.detailsVisible.set(true);
    }));
  }

  refresh(): void { this.dashboard?.refresh(); }
}
