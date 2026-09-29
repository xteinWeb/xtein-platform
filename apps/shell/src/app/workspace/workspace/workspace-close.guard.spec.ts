import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceTab } from '@xtein/sdk';
import Swal from 'sweetalert2';
import { WorkspaceCloseGuard } from './workspace-close.guard';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('WorkspaceCloseGuard', () => {
  let tab: WorkspaceTab | undefined;
  let closeApplication: ReturnType<typeof vi.fn>;
  let guard: WorkspaceCloseGuard;
  beforeEach(() => {
    vi.clearAllMocks();
    tab = { applicationId: 'ADM-015', title: 'Usuarios', closable: true, dirty: true } as WorkspaceTab;
    closeApplication = vi.fn(() => true);
    guard = new WorkspaceCloseGuard({ getTab: () => tab, closeApplication });
  });
  it('closes a clean tab without a dialog', async () => {
    tab!.dirty = false;
    expect(await guard.close('ADM-015')).toBe(true);
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(closeApplication).toHaveBeenCalledWith('ADM-015');
  });
  it('keeps pending changes when the user cancels or presses Escape', async () => {
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    expect(await guard.close('ADM-015')).toBe(false);
    expect(closeApplication).not.toHaveBeenCalled();
    expect(tab!.dirty).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ focusCancel: true, focusConfirm: false, allowOutsideClick: false }));
  });
  it('only forces a close after explicit discard confirmation', async () => {
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    expect(await guard.close('ADM-015')).toBe(true);
    expect(closeApplication).toHaveBeenCalledWith('ADM-015', true);
  });
  it('does not open duplicate dialogs on repeated clicks', async () => {
    let resolve!: (value: never) => void;
    vi.mocked(Swal.fire).mockReturnValue(new Promise(r => resolve = r));
    const first = guard.close('ADM-015');
    expect(await guard.close('ADM-015')).toBe(false);
    expect(Swal.fire).toHaveBeenCalledTimes(1);
    resolve({ isConfirmed: true } as never);
    await first;
    expect(closeApplication).toHaveBeenCalledTimes(1);
  });
  it('does not discard a replaced tab or new changes after the prompt opened', async () => {
    vi.mocked(Swal.fire).mockImplementation(async () => {
      tab = { ...tab! };
      return { isConfirmed: true } as never;
    });
    expect(await guard.close('ADM-015')).toBe(false);
    expect(closeApplication).not.toHaveBeenCalled();
  });
  it('ignores missing and nonclosable tabs', async () => {
    tab!.closable = false;
    expect(await guard.close('ADM-015')).toBe(false);
    tab = undefined;
    expect(await guard.close('ADM-015')).toBe(false);
    expect(Swal.fire).not.toHaveBeenCalled();
  });
  it('allows another attempt after cancelling', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never).mockResolvedValueOnce({ isConfirmed: true } as never);
    await guard.close('ADM-015');
    expect(await guard.close('ADM-015')).toBe(true);
  });
});
