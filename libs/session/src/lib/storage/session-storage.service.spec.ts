import { SessionStorageService } from './session-storage.service';
import { SESSION_STORAGE_KEYS } from './session-storage-keys';
import { SessionContext } from '../contracts/session-context';

describe('Nonpersistent session credentials', () => {
  it('discards old persistent credentials so reopening requires login', () => {
    localStorage.setItem(SESSION_STORAGE_KEYS.userId, 'test');
    localStorage.setItem(SESSION_STORAGE_KEYS.companyId, '00');
    localStorage.setItem(SESSION_STORAGE_KEYS.token, 'old-test-token');
    localStorage.setItem('unrelated-setting', 'keep');
    const storage = new SessionStorageService(document);
    expect(storage.load()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEYS.token)).toBeNull();
    expect(localStorage.getItem('unrelated-setting')).toBe('keep');
    localStorage.removeItem('unrelated-setting');
  });
  it('does not restore a session in a new document or write its token to browser storage', () => {
    const storage = new SessionStorageService(document);
    storage.save({ userId: 'test', companyId: '00', token: 'test-token' } as SessionContext);
    expect(storage.load()?.token).toBe('test-token');
    expect(localStorage.getItem(SESSION_STORAGE_KEYS.token)).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.token)).toBeNull();
    expect(new SessionStorageService(document).load()).toBeNull();
  });
});
