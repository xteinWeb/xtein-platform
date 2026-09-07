import { createRecordToolbarState } from '../../public-api';
import { RecordToolbarMode } from '../contracts/toolbar/record-toolbar-mode';
import { DeniedRecordToolbarPermissions } from '../contracts/toolbar/record-toolbar-permissions';
import { ToolbarAction } from '../contracts/toolbar/toolbar-action';

describe('Record toolbar navigation', () => {
  const options = {
    applicationId: 'MAD-001', mode: RecordToolbarMode.Browsing,
    permissions: { ...DeniedRecordToolbarPermissions, search: true, print: true },
    currentIndex: 0, totalRecords: 3
  };

  it('allows direct navigation at the first record while Previous is disabled', () => {
    const state = createRecordToolbarState(options);
    expect(state.actions[ToolbarAction.GoTo]?.enabled).toBe(true);
    expect(state.actions[ToolbarAction.Previous]?.enabled).toBe(false);
    expect(state.actions[ToolbarAction.Next]?.enabled).toBe(true);
  });

  it('hides direct navigation without records or while editing', () => {
    expect(createRecordToolbarState({ ...options, totalRecords: 0 }).actions[ToolbarAction.GoTo]?.enabled).toBe(false);
    for (const mode of [RecordToolbarMode.Creating, RecordToolbarMode.Editing, RecordToolbarMode.Copying]) {
      expect(createRecordToolbarState({ ...options, mode }).actions[ToolbarAction.GoTo]).toBeUndefined();
    }
  });

  it('respects capabilities and search/print permissions', () => {
    const state = createRecordToolbarState({ ...options,
      capabilities: { navigation: false }, permissions: DeniedRecordToolbarPermissions });
    expect(state.actions[ToolbarAction.GoTo]?.visible).toBe(false);
    expect(state.actions[ToolbarAction.Search]?.visible).toBe(false);
    expect(state.actions[ToolbarAction.View]?.visible).toBe(false);
    expect(state.actions[ToolbarAction.Print]?.visible).toBe(false);
  });

  it('disables every visible action while a request is pending', () => {
    const state = createRecordToolbarState({ ...options, busy: true });
    expect(state.actions[ToolbarAction.GoTo]?.visible).toBe(true);
    expect(Object.values(state.actions).every(action => !action.enabled)).toBe(true);
  });
});
