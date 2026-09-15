import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { SessionActivityService } from './session-activity.service';
import { XTEIN_SESSION_POLICY } from '../models/session-policy.model';
import { SessionContext } from '../contracts/session-context';

const session: SessionContext = { userId: 'test', userName: 'Test', companyId: '00', companyName: 'Test',
  email: '', associatedUnitId: '', token: 'test-token', sessionTimeoutSeconds: 0 };

describe('Session inactivity', () => {
  let sessions: SessionService;
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [
      { provide: XTEIN_SESSION_POLICY, useValue: { inactivityTimeoutSeconds: 5, useBackendTimeout: true } }
    ] });
    sessions = TestBed.inject(SessionService);
    TestBed.inject(SessionActivityService);
    sessions.startSession(session);
    TestBed.tick();
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });

  it('expires without activity using the configured timeout', () => {
    vi.advanceTimersByTime(5000);
    expect(sessions.current).toBeNull();
  });
  it('does not treat a refreshed API token as user activity', () => {
    vi.advanceTimersByTime(3000);
    sessions.updateToken('renewed-test-token');
    TestBed.tick();
    vi.advanceTimersByTime(2000);
    expect(sessions.current).toBeNull();
  });
  it('extends the timeout on user keyboard activity', () => {
    vi.advanceTimersByTime(3000);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    vi.advanceTimersByTime(3000);
    expect(sessions.current).not.toBeNull();
    vi.advanceTimersByTime(2000);
    expect(sessions.current).toBeNull();
  });
  it('expires before accepting activity after browser suspension', () => {
    vi.setSystemTime(Date.now() + 6000);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(sessions.current).toBeNull();
  });
  it('uses a positive timeout provided by login', () => {
    sessions.startSession({ ...session, sessionTimeoutSeconds: 2 });
    TestBed.tick();
    vi.advanceTimersByTime(2000);
    expect(sessions.current).toBeNull();
  });
  it('does not restore credentials from a late response after logout', () => {
    sessions.clearSession();
    sessions.updateToken('late-response');
    expect(sessions.current).toBeNull();
  });
  it('can enforce the environment timeout instead of the backend value', () => {
    TestBed.inject(XTEIN_SESSION_POLICY).useBackendTimeout = false;
    sessions.startSession({ ...session, sessionTimeoutSeconds: 2 });
    TestBed.tick();
    vi.advanceTimersByTime(3000);
    expect(sessions.current).not.toBeNull();
    vi.advanceTimersByTime(2000);
    expect(sessions.current).toBeNull();
  });
});
