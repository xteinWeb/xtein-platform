import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { SessionService, SESSION_STORAGE_KEYS } from '@xtein/session';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('Login required on reopening', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  it('does not bypass login because an old token exists in localStorage', () => {
    localStorage.setItem(SESSION_STORAGE_KEYS.userId, 'test');
    localStorage.setItem(SESSION_STORAGE_KEYS.companyId, '00');
    localStorage.setItem(SESSION_STORAGE_KEYS.token, 'old-test-token');
    const allowed = TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(allowed).toBe(true);
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(false);
  });
  it('redirects a protected URL to login without a current session', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/home' } as RouterStateSnapshot));
    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/'], { queryParams: { returnUrl: '/home' } }));
  });
});
