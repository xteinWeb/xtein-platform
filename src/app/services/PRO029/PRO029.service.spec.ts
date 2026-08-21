import { TestBed } from '@angular/core/testing';

import { PRO029Service } from './PRO029.service';

describe('PRO029Service', () => {
  let service: PRO029Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO029Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
