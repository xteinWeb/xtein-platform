import { DashboardControl, DashboardTitleToolbarUpdatedEventArgs, ViewerApiExtension } from 'devexpress-dashboard';
import { Dashboard, registerCustomProperty } from 'devexpress-dashboard/model';

registerCustomProperty({ ownerType: Dashboard, propertyName: 'DashboardDescription', defaultValue: '', valueType: 'string' });

export class DashboardDescriptionExtension {
  readonly name = 'DashboardDescription';
  constructor(private readonly control: DashboardControl) {}
  private modeSubscription?: { dispose(): void };
  private readonly update = (args: DashboardTitleToolbarUpdatedEventArgs): void => {
    const description = args.dashboard.customProperties.getValue('DashboardDescription');
    if (description) args.options.actionItems.push({ type: 'button', icon: 'iconDescription', tooltip: String(description) });
    if (this.control.option('workingMode') === 'ViewerOnly') return;
    args.options.actionItems.push({ type: 'button',
      icon: this.control.isDesignMode() ? 'xtein-dashboard-viewer' : 'dashboard-designer',
      hint: this.control.isDesignMode() ? 'Ver' : 'Editar', click: () => {
      if (this.control.isDesignMode()) this.control.switchToViewer();
      else this.control.switchToDesigner();
    } });
  };
  start(): void {
    const viewer = this.control.findExtension('viewer-api') as ViewerApiExtension | undefined;
    viewer?.on('dashboardTitleToolbarUpdated', this.update);
    this.modeSubscription = this.control.isDesignMode.subscribe(() => viewer?.updateDashboardTitleToolbar());
  }
  stop(): void {
    this.modeSubscription?.dispose();
    this.modeSubscription = undefined;
    (this.control.findExtension('viewer-api') as ViewerApiExtension)?.off('dashboardTitleToolbarUpdated', this.update);
  }
}
