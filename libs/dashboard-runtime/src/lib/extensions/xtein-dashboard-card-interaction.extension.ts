import { DashboardControl, IExtension, ItemClickEventArgs, ItemCaptionToolbarUpdatedEventArgs, ItemWidgetEventArgs, ViewerApiExtension } from 'devexpress-dashboard';
import { DashboardState } from 'devexpress-dashboard/model';
import { PrimitiveType } from 'devexpress-dashboard/data';

/** Each control owns its selection, widget and event handlers. */
export class XteinDashboardCardInteractionExtension implements IExtension {
  readonly name = 'xtein-card-interaction';
  private viewer?: ViewerApiExtension;
  private selected?: ItemClickEventArgs;
  private chart?: { option(name: string, value: unknown): unknown };
  private active = false;

  constructor(private readonly control: DashboardControl,
    private readonly details?: (rows: Record<string, PrimitiveType>[], error: string) => void) {}

  start(): void {
    this.active = true;
    this.viewer = this.control.findExtension('viewer-api') as ViewerApiExtension | undefined;
    this.viewer?.on('itemClick', this.click);
    this.viewer?.on('itemCaptionToolbarUpdated', this.caption);
    this.viewer?.on('itemWidgetCreated', this.widget);
  }
  stop(): void {
    this.active = false;
    this.viewer?.off('itemClick', this.click);
    this.viewer?.off('itemCaptionToolbarUpdated', this.caption);
    this.viewer?.off('itemWidgetCreated', this.widget);
    this.selected = undefined;
    this.chart = undefined;
  }
  private readonly widget = (args: ItemWidgetEventArgs): void => {
    if (args.dashboardItem.itemType() !== 'Chart') return;
    const widget = args.getWidget();
    if ('option' in widget) this.chart = widget;
  };
  private readonly click = (args: ItemClickEventArgs): void => {
    if (args.dashboardItem.itemType() !== 'Card') return;
    const previous = this.selected?.itemName;
    this.selected = args;
    if (previous) this.viewer?.updateItemCaptionToolbar(previous);
    this.viewer?.updateItemCaptionToolbar(args.itemName);
    const point = args.getAxisPoint('Default');
    const dimension = args.getDimensions()[0];
    if (!point || !dimension) return;
    const value = point.getValue();
    if (this.details) this.chart?.option('title', { text: String(value ?? ''), horizontalAlignment: 'center' });
    const name = `_${dimension.dataMember}`.toLowerCase();
    const parameter = this.control.dashboard()?.parameters().find(p => !p.parameterVisible() && p.name().toLowerCase() === name);
    if (!parameter) return;
    const state = JSON.parse(this.control.getDashboardState()) as DashboardState;
    state.Parameters = { ...state.Parameters, [parameter.name()]: value };
    this.control.setDashboardState(state);
    this.control.reloadData();
  };
  private readonly caption = (args: ItemCaptionToolbarUpdatedEventArgs): void => {
    if (!this.details || this.selected?.itemName !== args.itemName) return;
    const selected = this.selected;
    args.options.actionItems.push({ type: 'button', icon: 'iconInfo', hint: 'Ver detalles', click: () => {
      selected.requestUnderlyingData(data => {
        if (!this.active || this.selected !== selected) return;
        const error = data.getRequestDataError();
        if (error) { this.details?.([], error); return; }
        const members = data.getDataMembers();
        const rows = Array.from({ length: data.getRowCount() }, (_, index) =>
          Object.fromEntries(members.map(member => [member, data.getRowValue(index, member)])));
        this.details?.(rows, error || '');
      }, []);
    } });
  };
}
