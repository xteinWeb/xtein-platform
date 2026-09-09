import { Injectable } from '@angular/core';
import { DashboardControl } from 'devexpress-dashboard';
import { XTEIN_DASHBOARD_ICONS } from '../constants/xtein-dashboard-icons.constants';

@Injectable({ providedIn: 'root' })
export class XteinDashboardIconsService {
  private readonly registered = new WeakSet<DashboardControl>();

  register(control: DashboardControl): void {
    if (this.registered.has(control)) return;
    // This delegates to ResourceManager in the control's DevExpress bundle.
    // Registering through the instance also supports separately bundled remotes.
    for (const svg of XTEIN_DASHBOARD_ICONS) control.registerIcon(svg);
    this.registered.add(control);
  }
}
