import { DashboardControl, DashboardPanelExtension, IExtension } from 'devexpress-dashboard';
import { ToolboxExtension } from 'devexpress-dashboard/designer';

/** Legacy delegates dashboard creation and selection to the MAD application. */
export class XteinDashboardDesignerPolicyExtension implements IExtension {
  readonly name = 'xtein-designer-policy';
  constructor(private readonly control: DashboardControl) {}
  start(): void {
    (this.control.findExtension('dashboard-panel') as DashboardPanelExtension | undefined)?.visible(false);
    if (this.control.option('workingMode') === 'ViewerOnly') return;
    const toolbox = this.control.findExtension('toolbox') as ToolboxExtension | undefined;
    for (const name of ['create-dashboard', 'open-dashboard', 'dashboard-title-editor', 'dashboard-currency-editor', 'dashboard-color-scheme-editor']) {
      toolbox?.removeMenuItem(name);
    }
    this.control.unregisterExtension('createDashboard');
    this.control.unregisterExtension('dxdde-data-source-wizard');
    this.control.option('automaticUpdatesEnabled', false);
  }
  stop(): void {}
}
