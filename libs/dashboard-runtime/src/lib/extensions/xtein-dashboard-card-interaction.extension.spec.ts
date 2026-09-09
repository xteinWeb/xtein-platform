import { DashboardControl, ItemClickEventArgs } from 'devexpress-dashboard';
import { XteinDashboardCardInteractionExtension } from './xtein-dashboard-card-interaction.extension';

function setup() {
  const handlers = new Map<string, Function>();
  const viewer = { on: (name: string, callback: Function) => handlers.set(name, callback),
    off: (name: string) => handlers.delete(name), updateItemCaptionToolbar: vi.fn() };
  const control = { findExtension: () => viewer,
    dashboard: () => ({ parameters: () => [{ parameterVisible: () => false, name: () => '_concept' }] }),
    getDashboardState: () => JSON.stringify({ Parameters: { other: 'keep' }, Items: { grid: { MasterFilterValues: [['a']] } } }),
    setDashboardState: vi.fn(), reloadData: vi.fn() };
  const details = vi.fn();
  const extension = new XteinDashboardCardInteractionExtension(control as unknown as DashboardControl, details);
  extension.start();
  return { handlers, control, details, extension };
}

function card(value: string): ItemClickEventArgs {
  return { itemName: 'card', dashboardItem: { itemType: () => 'Card' },
    getAxisPoint: () => ({ getValue: () => value }), getDimensions: () => [{ dataMember: 'CONCEPT' }],
    requestUnderlyingData: vi.fn() } as unknown as ItemClickEventArgs;
}

describe('Dashboard KPI interaction', () => {
  it('updates the hidden parameter while preserving other parameters and item state', () => {
    const { handlers, control, extension } = setup();
    handlers.get('itemClick')!(card('Revenue'));
    expect(control.setDashboardState).toHaveBeenCalledWith({ Parameters: { other: 'keep', _concept: 'Revenue' },
      Items: { grid: { MasterFilterValues: [['a']] } } });
    expect(control.reloadData).toHaveBeenCalledOnce();
    extension.stop();
  });
  it('keeps the selected card isolated between dashboard controls', () => {
    const first = setup(); const second = setup();
    first.handlers.get('itemClick')!(card('First'));
    const args = { itemName: 'card', options: { actionItems: [] } };
    second.handlers.get('itemCaptionToolbarUpdated')!(args);
    expect(args.options.actionItems).toHaveLength(0);
    expect(second.control.setDashboardState).not.toHaveBeenCalled();
    first.extension.stop(); second.extension.stop();
  });
  it('unsubscribes all handlers when the dashboard is disposed', () => {
    const { handlers, extension } = setup();
    expect(handlers.size).toBe(3);
    extension.stop();
    expect(handlers.size).toBe(0);
  });
});
