import * as ko from 'knockout';
import { DashboardControl, DashboardTitleToolbarUpdatedEventArgs } from 'devexpress-dashboard';
import { DashboardDescriptionExtension } from './dashboard-description-extension';

describe('Dashboard mode action', () => {
  function setup(mode = 'Viewer') {
    const handlers = new Map<string, Function>();
    const viewer = {
      on: (name: string, handler: Function) => handlers.set(name, handler),
      off: (name: string) => handlers.delete(name),
      updateDashboardTitleToolbar: vi.fn()
    };
    const control = {
      findExtension: () => viewer,
      option: () => mode,
      isDesignMode: ko.observable(mode === 'Designer'),
      switchToDesigner: vi.fn(), switchToViewer: vi.fn()
    };
    const extension = new DashboardDescriptionExtension(control as unknown as DashboardControl);
    extension.start();
    const caption = () => {
      const args = { dashboard: { customProperties: { getValue: () => '' } },
        options: { actionItems: [] } } as unknown as DashboardTitleToolbarUpdatedEventArgs;
      handlers.get('dashboardTitleToolbarUpdated')!(args);
      return args.options.actionItems;
    };
    return { extension, control, viewer, caption, handlers };
  }

  it('offers editing in viewer mode and viewing in designer mode', () => {
    const { extension, control, viewer, caption } = setup();
    const edit = caption()[0];
    expect(edit.icon).toBe('dashboard-designer');
    expect(edit.hint).toBe('Editar');
    edit.click!(document.createElement('button'));
    expect(control.switchToDesigner).toHaveBeenCalledOnce();
    control.isDesignMode(true);
    expect(viewer.updateDashboardTitleToolbar).toHaveBeenCalledOnce();
    const view = caption()[0];
    expect(view.icon).toBe('xtein-dashboard-viewer');
    expect(view.hint).toBe('Ver');
    view.click!(document.createElement('button'));
    expect(control.switchToViewer).toHaveBeenCalledOnce();
    extension.stop();
    control.isDesignMode(false);
    expect(viewer.updateDashboardTitleToolbar).toHaveBeenCalledOnce();
  });

  it('does not offer editing in ViewerOnly mode', () => {
    const { caption, extension, handlers } = setup('ViewerOnly');
    expect(caption()).toHaveLength(0);
    extension.stop();
    expect(handlers.size).toBe(0);
  });
});
