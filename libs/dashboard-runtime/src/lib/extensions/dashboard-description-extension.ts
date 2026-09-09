import { DashboardControl, DashboardTitleToolbarUpdatedEventArgs, ViewerApiExtension } from 'devexpress-dashboard';
import { Dashboard, registerCustomProperty } from 'devexpress-dashboard/model';

registerCustomProperty({ ownerType: Dashboard, propertyName: 'DashboardDescription', defaultValue: '', valueType: 'string' });

export class DashboardDescriptionExtension {
  readonly name = 'DashboardDescription';
  constructor(private readonly control: DashboardControl) {}
  private readonly update = (args: DashboardTitleToolbarUpdatedEventArgs): void => {
    const description = args.dashboard.customProperties.getValue('DashboardDescription');
    if (description) args.options.actionItems.push({ type: 'button', icon: 'iconDescription', tooltip: String(description) });
    if (this.control.option('workingMode') === 'ViewerOnly') return;
    args.options.actionItems.push({ type: 'button', text: 'Diseño / visor', click: () => {
      if (this.control.isDesignMode()) this.control.switchToViewer();
      else this.control.switchToDesigner();
    } });
  };
  start(): void { (this.control.findExtension('viewer-api') as ViewerApiExtension)?.on('dashboardTitleToolbarUpdated', this.update); }
  stop(): void { (this.control.findExtension('viewer-api') as ViewerApiExtension)?.off('dashboardTitleToolbarUpdated', this.update); }
}
