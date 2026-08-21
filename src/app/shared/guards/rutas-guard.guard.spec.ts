import { TestBed } from '@angular/core/testing';

import { RutasGuardGuard } from './rutas-guard.guard';

describe('RutasGuardGuard', () => {
  let guard: RutasGuardGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(RutasGuardGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
