import { WorkspaceRuntimeService } from './workspace-runtime.service';
import { ApplicationCatalogService } from '../applications/application-catalog.service';
import { ToolbarRuntimeService } from '../toolbar/services/toolbar-runtime.service';

describe('Shared dashboard application tabs', () => {
  it('keeps distinct codes independent and reactivates an existing code', () => {
    const resolveApplication = vi.fn((applicationId: string) => ({ applicationId,
      remoteName: 'mfe-dashboard', exposedModule: './ApplicationHost', remoteEntryUrl: '/remoteEntry.json' }));
    const toolbar = new ToolbarRuntimeService();
    const workspace = new WorkspaceRuntimeService({ resolveApplication } as unknown as ApplicationCatalogService, toolbar);
    workspace.openApplication({ applicationId: 'TEST-DASH-A', title: 'Dashboard A' });
    workspace.openApplication({ applicationId: 'TEST-DASH-B', title: 'Dashboard B' });
    expect(workspace.tabs()).toHaveLength(2);
    expect(workspace.activeApplicationId()).toBe('TEST-DASH-B');
    workspace.openApplication({ applicationId: 'TEST-DASH-A', title: 'Dashboard A' });
    expect(workspace.tabs()).toHaveLength(2);
    expect(workspace.activeApplicationId()).toBe('TEST-DASH-A');
    expect(resolveApplication).toHaveBeenCalledTimes(2);
    expect(workspace.tabs().map(tab => tab.exposedModule)).toEqual(['./ApplicationHost', './ApplicationHost']);
  });
});
