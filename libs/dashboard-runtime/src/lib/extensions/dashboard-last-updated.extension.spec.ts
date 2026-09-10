import { DashboardControl, DashboardTitleToolbarUpdatedEventArgs } from 'devexpress-dashboard';
import { describe, expect, it } from 'vitest';
import { DashboardLastUpdatedExtension } from './dashboard-last-updated.extension';

describe('Viewer data timestamp', () => {
  it('adds the timestamp on the left and removes its listener when disposed', () => {
    const handlers = new Map<string, Function>();
    const api = { on: (name: string, fn: Function) => handlers.set(name, fn), off: (name: string) => handlers.delete(name) };
    const control = { findExtension: () => api } as unknown as DashboardControl;
    const extension = new DashboardLastUpdatedExtension(control, '09/09/2026 14:05:07');
    extension.start();
    const args = { options: { navigationItems: [], contentItems: [], actionItems: [] } } as unknown as DashboardTitleToolbarUpdatedEventArgs;
    handlers.get('dashboardTitleToolbarUpdated')!(args);
    expect(args.options.navigationItems[0].text).toBe('Ultima Actualización: 09/09/2026 14:05:07');
    expect(args.options.contentItems).toEqual([]);
    extension.stop();
    expect(handlers.size).toBe(0);
  });
});
