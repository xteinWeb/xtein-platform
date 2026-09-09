import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { Subscription, defer } from 'rxjs';
import { XteinDashboardDataService, XteinDashboardDefinition } from '@xtein/dashboard-runtime';
import { XteinDashboardViewerComponent } from '../xtein-dashboard-viewer/xtein-dashboard-viewer.component';
import { XteinDashboardFrameComponent } from '../xtein-dashboard-frame/xtein-dashboard-frame.component';

@Component({
  selector: 'xtein-dashboard-page', standalone: true,
  imports: [XteinDashboardViewerComponent, XteinDashboardFrameComponent],
  templateUrl: './xtein-dashboard-page.component.html',
  styleUrl: './xtein-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XteinDashboardPageComponent implements OnChanges, OnDestroy {
  @Input() applicationId = '';
  private readonly data = inject(XteinDashboardDataService);
  private request?: Subscription;
  readonly definition = signal<XteinDashboardDefinition | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);

  ngOnChanges(): void { this.load(); }
  ngOnDestroy(): void { this.request?.unsubscribe(); }
  // Reload the definition and recreate the viewer, including its layout and KPI state.
  refresh(): void { this.load(); }

  private load(): void {
    this.request?.unsubscribe();
    this.definition.set(null);
    this.error.set('');
    this.loading.set(false);
    if (!this.applicationId.trim()) return;
    this.loading.set(true);
    this.request = defer(() => this.data.load(this.applicationId)).subscribe({
      next: definition => { this.definition.set(definition); this.loading.set(false); },
      error: () => { this.error.set('No fue posible cargar el dashboard. Intente refrescar.'); this.loading.set(false); }
    });
  }
}
