import { TestBed } from '@angular/core/testing';

import { PRO009Service } from './s_PRO009.service';

describe('PRO009Service', () => {
  let service: PRO009Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO009Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
