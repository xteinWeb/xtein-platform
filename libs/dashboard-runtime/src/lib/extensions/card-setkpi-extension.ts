import { DashboardControl, ItemCaptionToolbarUpdatedEventArgs, ViewerApiExtension } from 'devexpress-dashboard';
import { CardItem, registerCustomProperty } from 'devexpress-dashboard/model';
import { XteinDashboardEditorRequest } from '../models/xtein-dashboard-editor.model';
import { SaveDashboardExtension } from 'devexpress-dashboard/designer';

// The spelling is part of the persisted Legacy dashboard format.
registerCustomProperty({ ownerType: CardItem, propertyName: 'aplicationCode', defaultValue: '', valueType: 'string' });

export class CardSetKpiExtension {
  readonly name = 'CardSetKpiExtension';
  constructor(private readonly control: DashboardControl, private readonly edit: (request: XteinDashboardEditorRequest) => void) {}
  private readonly caption = (args: ItemCaptionToolbarUpdatedEventArgs): void => {
    const item = args.dashboardItem;
    if (!(item instanceof CardItem) || this.control.option('workingMode') === 'ViewerOnly') return;
    args.options.actionItems.push({ type: 'button', icon: 'iconKpiSettings', hint: 'Configurar KPI asociado',
      click: () => this.edit({ kind: 'kpi', item, save: async () => {
        const extension = this.control.findExtension('saveDashboard') as SaveDashboardExtension | undefined;
        if (!extension) throw new Error('El guardado de dashboards no está disponible.');
        await Promise.resolve(extension.saveDashboard());
      } }) });
  };
  start(): void { (this.control.findExtension('viewer-api') as ViewerApiExtension)?.on('itemCaptionToolbarUpdated', this.caption); }
  stop(): void { (this.control.findExtension('viewer-api') as ViewerApiExtension)?.off('itemCaptionToolbarUpdated', this.caption); }
}
