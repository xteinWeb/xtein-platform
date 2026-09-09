import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToolbarRuntimeService, RecordToolbarPermissionsService } from '@xtein/runtime';
import { createRecordToolbarState, DeniedRecordToolbarPermissions, RecordToolbarMode, RecordToolbarPermissions, ToolbarAction } from '@xtein/sdk';
import { XteinDashboardPageComponent } from '@xtein/ui';
import { DASHBOARD_TOOLBAR_CAPABILITIES } from './constants/dashboard-toolbar.constants';

@Component({
  selector: 'xtein-dashboard-application', standalone: true,
  imports: [XteinDashboardPageComponent],
  templateUrl: './dashboard-application.component.html',
  styleUrl: './dashboard-application.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinDashboardApplicationComponent implements OnChanges, OnDestroy {
  @Input() applicationId = '';
  @ViewChild(XteinDashboardPageComponent) private page?: XteinDashboardPageComponent;
  private readonly toolbar = inject(ToolbarRuntimeService);
  private readonly permissionsService = inject(RecordToolbarPermissionsService);
  private permissionsRequest?: Subscription;
  private commands?: Subscription;
  private registeredId = '';

  ngOnChanges(): void {
    this.release();
    if (!this.applicationId.trim()) return;
    this.registeredId = this.applicationId;
    this.publish(DeniedRecordToolbarPermissions);
    this.permissionsRequest = this.permissionsService.getPermissions(this.applicationId).subscribe({
      next: permissions => this.publish(permissions),
      error: () => this.publish(DeniedRecordToolbarPermissions)
    });
    this.commands = this.toolbar.commandsForApplication(this.applicationId).subscribe(command => {
      if (command.action === ToolbarAction.Refresh) this.page?.refresh();
    });
  }
  private publish(permissions: RecordToolbarPermissions): void {
    this.toolbar.setState(createRecordToolbarState({
      applicationId: this.applicationId, mode: RecordToolbarMode.Initial,
      permissions, currentIndex: 0, totalRecords: 0,
      capabilities: DASHBOARD_TOOLBAR_CAPABILITIES
    }));
  }
  ngOnDestroy(): void { this.release(); }
  private release(): void {
    this.commands?.unsubscribe();
    this.permissionsRequest?.unsubscribe();
    if (this.registeredId) this.toolbar.removeApplication(this.registeredId);
    this.registeredId = '';
  }
}
