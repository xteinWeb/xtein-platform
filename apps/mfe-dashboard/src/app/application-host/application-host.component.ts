import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { XteinDashboardApplicationComponent } from '../applications/dashboard/dashboard-application.component';

/** The database selects this remote; every original application code uses the same viewer. */
@Component({
  selector: 'xtein-dashboard-application-host', standalone: true,
  imports: [XteinDashboardApplicationComponent],
  templateUrl: './application-host.component.html',
  styleUrl: './application-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicationHostComponent {
  @Input() applicationId = '';
}
