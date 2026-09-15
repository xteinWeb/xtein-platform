import { DOCUMENT } from '@angular/common';
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { SessionTabsService } from './session-tabs.service';
import { SessionActivityService } from './session-activity.service';
import { SessionStorageService } from '../storage/session-storage.service';
import { XTEIN_SESSION_POLICY } from '../models/session-policy.model';
import { SessionContext } from '../contracts/session-context';

class TabChannel {
  static peers = new Set<TabChannel>();
  onmessage: ((event: { data: unknown }) => void) | null = null;
  private closed = false;
  constructor(readonly name: string) { TabChannel.peers.add(this); }
  postMessage(data: unknown): void {
    for (const peer of TabChannel.peers) {
      if (peer !== this && peer.name === this.name) setTimeout(() => {
        if (!peer.closed) peer.onmessage?.({ data: structuredClone(data) });
      }, 0);
    }
  }
  close(): void { this.closed = true; TabChannel.peers.delete(this); }
}

const credentials: SessionContext = { userId: 'test', userName: 'Test', companyId: '00', companyName: 'Test',
  email: '', associatedUnitId: '', token: 'test-token', sessionTimeoutSeconds: 0 };

describe('Live browser tabs sharing one session', () => {
  let tabs: { injector: EnvironmentInjector }[];
  function openTab() {
    const window = Object.assign(new EventTarget(), { BroadcastChannel: TabChannel });
    const document = Object.assign(new EventTarget(), { defaultView: window, visibilityState: 'visible' });
    const injector = createEnvironmentInjector([
      SessionService, SessionStorageService, SessionTabsService, SessionActivityService,
      { provide: DOCUMENT, useValue: document },
      { provide: XTEIN_SESSION_POLICY, useValue: { inactivityTimeoutSeconds: 5, useBackendTimeout: true } }
    ], TestBed.inject(EnvironmentInjector));
    const sessions = injector.get(SessionService);
    const sync = injector.get(SessionTabsService);
    injector.get(SessionActivityService);
    const ready = sync.initialize();
    const tab = { sessions, sync, ready, document, window, injector,
      close: () => { window.dispatchEvent(new Event('pagehide')); } };
    tabs.push(tab);
    TestBed.tick();
    return tab;
  }
  async function loginTab() {
    const tab = openTab();
    await vi.advanceTimersByTimeAsync(1500);
    await tab.ready;
    tab.sessions.startSession(credentials);
    TestBed.tick();
    return tab;
  }
  async function joinTab() {
    const tab = openTab();
    await vi.advanceTimersByTimeAsync(20);
    TestBed.tick();
    return tab;
  }
  beforeEach(() => { vi.useFakeTimers(); tabs = []; TestBed.configureTestingModule({}); });
  afterEach(() => {
    for (const tab of tabs) tab.injector.destroy();
    TabChannel.peers.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('adopts a live session before initialization completes without renewing inactivity', async () => {
    const first = await loginTab();
    const second = await joinTab();
    expect(second.sessions.current).toEqual(credentials);
    expect(second.sessions.sessionId()).toBe(first.sessions.sessionId());
    expect(second.sessions.lastActivityAt).toBe(first.sessions.lastActivityAt);
    await second.ready;
  });
  it('closing one tab keeps the others authenticated and able to share', async () => {
    const first = await loginTab();
    const second = await joinTab();
    first.close();
    await vi.advanceTimersByTimeAsync(20);
    expect(first.sessions.current).toBeNull();
    expect(second.sessions.current).not.toBeNull();
    const third = await joinTab();
    expect(third.sessions.current).toEqual(credentials);
  });
  it('requires login after every authenticated tab has closed', async () => {
    const first = await loginTab();
    const second = await joinTab();
    first.close(); second.close();
    const reopened = openTab();
    await vi.advanceTimersByTimeAsync(1500);
    await reopened.ready;
    expect(reopened.sessions.current).toBeNull();
  });
  it('broadcasts logout and rejects delayed snapshots of that session', async () => {
    const first = await loginTab();
    const second = await joinTab();
    const stale = first.sessions.sharedSnapshot;
    first.sessions.clearSession();
    await vi.advanceTimersByTimeAsync(20);
    expect(second.sessions.current).toBeNull();
    const channel = new TabChannel('xtein-session-v1');
    channel.postMessage({ type: 'login', snapshot: stale });
    await vi.advanceTimersByTimeAsync(20);
    expect(second.sessions.current).toBeNull();
    channel.close();
  });
  it('shares renewed tokens without extending the inactivity deadline', async () => {
    const first = await loginTab();
    const second = await joinTab();
    const before = second.sessions.lastActivityAt;
    first.sessions.updateToken('renewed-test-token');
    await vi.advanceTimersByTimeAsync(20);
    expect(second.sessions.current?.token).toBe('renewed-test-token');
    expect(second.sessions.lastActivityAt).toBe(before);
  });
  it('counts activity in either tab and expires both when activity stops', async () => {
    const first = await loginTab();
    const second = await joinTab();
    await vi.advanceTimersByTimeAsync(4000);
    second.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    await vi.advanceTimersByTimeAsync(2000);
    expect(first.sessions.current).not.toBeNull();
    expect(second.sessions.current).not.toBeNull();
    await vi.advanceTimersByTimeAsync(4100);
    expect(first.sessions.current).toBeNull();
    expect(second.sessions.current).toBeNull();
  });
  it('does not transfer an expired session when a suspended peer wakes', async () => {
    const first = await loginTab();
    vi.setSystemTime(Date.now() + 6000);
    const second = await joinTab();
    expect(first.sessions.current).toBeNull();
    expect(second.sessions.current).toBeNull();
  });
});
